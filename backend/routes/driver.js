const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const Order = require("../models/Order");
const User  = require("../models/User");

// @desc  Get all registered drivers (for restaurant owner to pick from)
// @route GET /api/driver/list
router.get("/list", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const drivers = await User.find({ role: "delivery_driver", isActive: true })
      .select("name phone avatar")
      .sort({ name: 1 });
    res.json({ success: true, drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Notify a specific driver about a ready order
// @route POST /api/driver/notify/:orderId
router.post("/notify/:orderId", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ success: false, message: "driverId is required" });

    const [order, driver] = await Promise.all([
      Order.findById(req.params.orderId)
        .populate("restaurant", "name address")
        .populate("customer", "name"),
      User.findById(driverId).select("name phone notifications"),
    ]);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
    if (order.status !== "ready_for_pickup") {
      return res.status(400).json({ success: false, message: "Order is not ready for pickup yet" });
    }

    // Add driver to notifiedDrivers if not already there
    if (!order.notifiedDrivers.map(String).includes(String(driverId))) {
      order.notifiedDrivers.push(driverId);
      await order.save();
    }

    // Persist notification in driver's User document
    const notifMessage = `📦 Delivery request: Order #${order.orderNumber} from ${order.restaurant?.name} — $${order.deliveryFee?.toFixed(2)} delivery fee`;
    driver.notifications.push({
      message: notifMessage,
      type: "order",
      isRead: false,
      orderId: order._id,
    });
    await driver.save();
    const savedNotif = driver.notifications[driver.notifications.length - 1];

    // Also push real-time via socket
    const { emitNotification } = require("../utils/socket");
    emitNotification(driverId, {
      type: "delivery_request",
      _id:           savedNotif._id,
      orderId:       order._id,
      orderNumber:   order.orderNumber,
      restaurantName: order.restaurant?.name,
      restaurantAddress: order.restaurant?.address,
      customerName:  order.customer?.name,
      items:         order.items?.length,
      total:         order.total,
      deliveryFee:   order.deliveryFee,
      message:       notifMessage,
      timestamp:     new Date(),
    });

    res.json({ success: true, message: `Notification sent to ${driver.name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Get available orders for this driver (only orders they've been notified about)
// @route GET /api/driver/available
router.get("/available", protect, authorize("delivery_driver", "admin"), async (req, res) => {
  try {
    const orders = await Order.find({
      status: "ready_for_pickup",
      driver: null,
      notifiedDrivers: req.user.id,   // ← only orders restaurant notified THIS driver about
    })
      .sort({ createdAt: 1 })
      .populate("restaurant", "name address phone logo")
      .populate("customer", "name phone");
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Accept a delivery (assigns driver + sets out_for_delivery)
// @route PUT /api/driver/accept/:orderId
router.put("/accept/:orderId", protect, authorize("delivery_driver", "admin"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.status !== "ready_for_pickup") {
      return res.status(400).json({ success: false, message: "Order is no longer available" });
    }
    if (order.driver) {
      return res.status(400).json({ success: false, message: "Order already taken by another driver" });
    }

    order.driver = req.user.id;
    order.status = "out_for_delivery";
    order.statusHistory.push({
      status: "out_for_delivery",
      message: "Your order is on the way! 🚗",
      updatedBy: req.user.id,
    });
    await order.save();

    const { emitOrderUpdate } = require("../utils/socket");
    emitOrderUpdate(order, "Your order is on the way! 🚗");

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Get driver's active deliveries
// @route GET /api/driver/my-deliveries
router.get("/my-deliveries", protect, authorize("delivery_driver", "admin"), async (req, res) => {
  try {
    const orders = await Order.find({ driver: req.user.id, status: "out_for_delivery" })
      .populate("restaurant", "name address phone")
      .populate("customer", "name phone");
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Get driver's delivery history
// @route GET /api/driver/history
router.get("/history", protect, authorize("delivery_driver", "admin"), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const query = { driver: req.user.id, status: "delivered", hiddenBy: { $nin: [req.user.id] } };
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("restaurant", "name")
      .populate("customer", "name");
    res.json({ success: true, total, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Mark order as delivered
// @route PUT /api/driver/deliver/:orderId
router.put("/deliver/:orderId", protect, authorize("delivery_driver", "admin"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("customer", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not your delivery" });
    }

    order.status = "delivered";
    order.actualDeliveryTime = new Date();
    if (order.paymentMethod === "cash_on_delivery") order.paymentStatus = "paid";
    order.statusHistory.push({
      status: "delivered",
      message: "Your order has been delivered. Enjoy your meal! 😋",
      updatedBy: req.user.id,
    });
    await order.save();

    const { emitOrderUpdate } = require("../utils/socket");
    emitOrderUpdate(order, "Your order has been delivered. Enjoy your meal! 😋");

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Driver stats
// @route GET /api/driver/stats
router.get("/stats", protect, authorize("delivery_driver", "admin"), async (req, res) => {
  try {
    const [totalDeliveries, todayDeliveries] = await Promise.all([
      Order.countDocuments({ driver: req.user.id, status: "delivered" }),
      Order.countDocuments({
        driver: req.user.id, status: "delivered",
        updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    const earningsData = await Order.aggregate([
      { $match: { driver: req.user._id, status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$deliveryFee" }, today: { $sum: { $cond: [{ $gte: ["$updatedAt", new Date(new Date().setHours(0, 0, 0, 0))] }, "$deliveryFee", 0] } } } },
    ]);

    const earnings = earningsData[0] || { total: 0, today: 0 };

    res.json({ success: true, stats: { totalDeliveries, todayDeliveries, totalEarnings: earnings.total, todayEarnings: earnings.today } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Hide a delivered order from driver's history view (soft delete)
// @route DELETE /api/driver/history/:orderId
// @desc  Hide a delivered order from driver's history view (soft delete)
// @route POST /api/driver/history/:orderId/hide
router.post("/history/:orderId/hide", protect, authorize("delivery_driver", "admin"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const driverId    = String(req.user._id);
    const orderDriver = order.driver ? String(order.driver) : null;

    if (orderDriver !== driverId) {
      return res.status(403).json({ success: false, message: "This order is not assigned to you" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ success: false, message: "Only delivered orders can be removed from history" });
    }

    if (!order.hiddenBy.map(String).includes(driverId)) {
      order.hiddenBy.push(req.user._id);
      await order.save();
    }

    res.json({ success: true, message: "Order removed from your history" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
