const Order      = require("../models/Order");
const Table      = require("../models/Table");
const Restaurant = require("../models/Restaurant");
const User       = require("../models/User");
const { emitOrderUpdate, emitNotification, emitTableUpdate, emitNewOrder } = require("../utils/socket");
const { enrichTable } = require("../utils/tableHelpers");
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require("../utils/email");

const STATUS_MESSAGES = {
  pending:          "Your order has been placed and is awaiting confirmation.",
  confirmed:        "Great news! Your order has been confirmed by the restaurant.",
  preparing:        "The restaurant is now preparing your delicious meal! 🍳",
  ready_for_pickup: "Your order is ready for pickup by the driver.",
  out_for_delivery: "Your order is on the way! Your driver is heading to you. 🚗",
  delivered:        "Your order has been delivered. Enjoy your meal! 😋",
  cancelled:        "Your order has been cancelled.",
};

const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function isRestaurantOpen(restaurant) {
  if (!restaurant) return false;
  if (restaurant.isOpen === false) return false;
  const hours = restaurant.openingHours || {};
  const today = DAYS[new Date().getDay()];
  const todayHours = hours[today];
  if (!todayHours || todayHours.isClosed) return false;
  const [openH, openM] = (todayHours.open || "00:00").split(":").map(Number);
  const [closeH, closeM] = (todayHours.close || "23:59").split(":").map(Number);
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;
  return current >= open && current < close;
}

// @desc  Place a new order
// @route POST /api/orders
const placeOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod, notes } = req.body;

    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });

    if (req.user.role === "restaurant_owner" && restaurant.owner.toString() === req.user.id) {
      return res.status(403).json({ success: false, message: "You cannot place an order at your own restaurant" });
    }

    if (!isRestaurantOpen(restaurant)) {
      return res.status(403).json({ success: false, message: "This restaurant is currently closed. Please try again during opening hours." });
    }

    const subtotal = items.reduce((sum, item) => {
      const customizationCost = (item.customizations || []).reduce((s, c) => s + (c.price || 0), 0);
      return sum + (item.price + customizationCost) * item.quantity;
    }, 0);

    const tax   = parseFloat((subtotal * 0.1).toFixed(2));
    const total = parseFloat((subtotal + restaurant.deliveryFee + tax).toFixed(2));

    const { orderType = "delivery", tableId } = req.body;

    // For dine-in orders, verify the table is available
    let tableNumber = null;
    if (orderType === "dine_in" && tableId) {
      const table = await Table.findById(tableId);
      if (!table) return res.status(404).json({ success: false, message: "Table not found" });
      const activeCount = await Order.countDocuments({ tableId: table._id, status: { $in: ["pending","confirmed","preparing","ready_for_pickup","out_for_delivery"] } });
      const remaining = (table.capacity || 0) - activeCount;
      if (remaining <= 0) return res.status(400).json({ success: false, message: "This table is currently full" });
      tableNumber = table.number;
    }

    const order = await Order.create({
      customer:   req.user.id,
      restaurant: restaurantId,
      items: items.map((item) => ({
        ...item,
        subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
      })),
      deliveryAddress: orderType === "delivery" ? deliveryAddress : null,
      paymentMethod,
      notes,
      subtotal,
      deliveryFee:           orderType === "delivery" ? restaurant.deliveryFee : 0,
      tax,
      total:                 orderType === "delivery" ? total : parseFloat((subtotal + tax).toFixed(2)),
      orderType,
      tableId:               orderType === "dine_in" ? tableId : null,
      tableNumber,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
      statusHistory: [{ status: "pending", message: STATUS_MESSAGES["pending"], updatedBy: req.user.id }],
    });

    // Mark table as occupied for dine-in orders
    if (orderType === "dine_in" && tableId) {
      const updatedTable = await enrichTable(await Table.findById(tableId));
      if (updatedTable) emitTableUpdate(updatedTable);
    }

    await order.populate("customer",   "name email");
    await order.populate("restaurant", "name");

    emitOrderUpdate(order, "New order received!");
    emitNewOrder(order);

    const ownerNotification = {
      type: "order",
      message: `New order #${order.orderNumber} received!`,
      orderId: order._id,
      restaurantId: restaurantId,
      customerName: order.customer?.name || "A customer",
      total: order.total,
      orderType: order.orderType,
      tableNumber: order.tableNumber,
    };
    emitNotification(restaurant.owner.toString(), ownerNotification);
    User.findByIdAndUpdate(restaurant.owner, {
      $push: { notifications: { ...ownerNotification, read: false, createdAt: new Date() } },
    }).catch(() => {});

    sendOrderConfirmationEmail(req.user, order).catch(() => {});

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get customer orders
// @route GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { customer: req.user.id, hiddenBy: { $nin: [req.user.id] } };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    // Run count + find in parallel — halves the round-trip time
    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("restaurant", "name logo")
        .populate("driver",     "name phone")
        .lean(),
    ]);

    res.json({ success: true, total, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single order
// @route GET /api/orders/:id
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer",   "name email phone")
      .populate("restaurant", "name logo phone address")
      .populate("driver",     "name phone avatar")
      .lean();

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const isCustomer = order.customer._id.toString() === req.user.id;
    const isAdmin    = req.user.role === "admin";
    const isDriver   = order.driver && order.driver._id.toString() === req.user.id;
    const isNotifiedDriver = req.user.role === "delivery_driver" && order.notifiedDrivers && order.notifiedDrivers.some(id => id.toString() === req.user.id);

    let ownerAuthorized = false;
    if (req.user.role === "restaurant_owner") {
      const ownedRestaurant = await Restaurant.findOne({ owner: req.user.id }).select("_id").lean();
      ownerAuthorized = ownedRestaurant && ownedRestaurant._id.toString() === order.restaurant._id.toString();
    }

    if (!isCustomer && !ownerAuthorized && !isDriver && !isAdmin && !isNotifiedDriver) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update order status
// @route PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate("customer", "name email");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (status === "out_for_delivery" && !order.driver) {
      return res.status(400).json({ success: false, message: "Please assign a driver before marking as out for delivery" });
    }

    const message = STATUS_MESSAGES[status] || `Order status updated to ${status}`;

    order.status = status;
    order.statusHistory.push({ status, message, updatedBy: req.user.id });
    if (status === "delivered") {
      order.actualDeliveryTime = new Date();
      if (order.paymentMethod === "cash_on_delivery") order.paymentStatus = "paid";
      // Release the table when order is delivered/served
      if (order.orderType === "dine_in" && order.tableId) {
        const updatedTable = await enrichTable(await Table.findById(order.tableId));
        if (updatedTable) emitTableUpdate(updatedTable);
      }
    }

    await order.save();

    emitOrderUpdate(order, message);
    emitNotification(order.customer._id.toString(), { type: "order", message, orderId: order._id });

    sendOrderStatusEmail(order.customer, order, message).catch(() => {});

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get restaurant orders
// @route GET /api/orders/restaurant/:restaurantId
const getRestaurantOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { restaurant: req.params.restaurantId, hiddenBy: { $nin: [req.user.id] } };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("customer", "name phone avatar")
        .populate("driver",   "name phone")
        .lean(),
    ]);

    res.json({ success: true, total, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Cancel order
// @route PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("customer", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const isCustomer = order.customer._id.toString() === req.user.id;
    const isAdmin    = req.user.role === "admin";
    let   isOwner    = false;
    if (req.user.role === "restaurant_owner") {
      const ownedRestaurant = await Restaurant.findOne({ owner: req.user.id }).select("_id").lean();
      isOwner = ownedRestaurant && ownedRestaurant._id.toString() === order.restaurant.toString();
    }

    if (!isCustomer && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this order" });
    }
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ success: false, message: "Cannot cancel order at this stage" });
    }

    const cancelMsg = STATUS_MESSAGES["cancelled"];
    order.status = "cancelled";
    order.statusHistory.push({ status: "cancelled", message: cancelMsg, updatedBy: req.user.id });
    await order.save();

    emitOrderUpdate(order, cancelMsg);
    emitNotification(order.customer._id.toString(), { type: "order", message: cancelMsg, orderId: order._id });

    if (order.orderType === "dine_in" && order.tableId) {
      const updatedTable = await enrichTable(await Table.findById(order.tableId));
      if (updatedTable) emitTableUpdate(updatedTable);
    }

    sendOrderStatusEmail(order.customer, order, cancelMsg).catch(() => {});

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Customer confirms they received the order
// @route PUT /api/orders/:id/confirm-delivery
const confirmDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("customer", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only the customer can confirm delivery" });
    }
    if (order.status !== "out_for_delivery") {
      return res.status(400).json({ success: false, message: `Cannot confirm delivery — order is currently "${order.status}"` });
    }

    const message = "Order confirmed as delivered by customer. Enjoy your meal! 😋";
    order.status             = "delivered";
    order.actualDeliveryTime = new Date();
    order.statusHistory.push({ status: "delivered", message, updatedBy: req.user.id });
    if (order.paymentMethod === "cash_on_delivery") order.paymentStatus = "paid";
    await order.save();

    emitOrderUpdate(order, message);
    emitNotification(order.customer._id.toString(), { type: "order", message: `Order #${order.orderNumber} marked as delivered. Thank you!`, orderId: order._id });

    if (order.driver) {
      emitNotification(order.driver.toString(), {
        type: "order", orderId: order._id,
        message: `Delivery confirmed by customer for order #${order.orderNumber}. Payment: ${order.paymentMethod === "cash_on_delivery" ? "collect cash" : "already paid"}.`,
      });
      User.findByIdAndUpdate(order.driver, {
        $push: { notifications: { message: `Customer confirmed delivery for order #${order.orderNumber}.`, type: "order", orderId: order._id.toString() } },
      }).catch(() => {});
    }

    sendOrderStatusEmail(order.customer, order, message).catch(() => {});

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Rate order
// @route PUT /api/orders/:id/rate
const rateOrder = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.customer.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Not authorized" });
    if (order.status !== "delivered") return res.status(400).json({ success: false, message: "Can only rate delivered orders" });
    if (order.rating) return res.status(400).json({ success: false, message: "You have already rated this order" });

    order.rating = rating;
    order.review = review;
    await order.save();

    // Use $avg aggregation — much faster than loading all orders into memory
    const [aggResult] = await Order.aggregate([
      { $match: { restaurant: order.restaurant, rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    if (aggResult) {
      await Restaurant.findByIdAndUpdate(order.restaurant, {
        rating:       parseFloat(aggResult.avg.toFixed(1)),
        totalRatings: aggResult.count,
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get all orders (admin)
// @route GET /api/orders/admin/all
const getAllOrdersAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip  = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("customer",   "name email")
        .populate("restaurant", "name")
        .populate("driver",     "name")
        .lean(),
    ]);

    res.json({ success: true, total, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Hide order from current user's view (soft delete)
// @route DELETE /api/orders/:id/hide
const hideOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const userId = req.user.id;
    const isCustomer = order.customer.toString() === userId;
    const isAdmin    = req.user.role === "admin";
    let   isOwner    = false;
    if (req.user.role === "restaurant_owner") {
      const ownedRestaurant = await Restaurant.findOne({ owner: req.user.id }).select("_id").lean();
      isOwner = ownedRestaurant && ownedRestaurant._id.toString() === order.restaurant.toString();
    }

    if (!isCustomer && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (!order.hiddenBy.map(String).includes(userId)) {
      order.hiddenBy.push(userId);
      await order.save();
    }

    res.json({ success: true, message: "Order removed from your view" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { hideOrder, placeOrder, getMyOrders, getOrder, updateOrderStatus, getRestaurantOrders, cancelOrder, confirmDelivery, rateOrder, getAllOrdersAdmin };