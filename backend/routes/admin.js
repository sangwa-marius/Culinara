const express  = require("express");
const router   = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { emitNotification }   = require("../utils/socket");
const User       = require("../models/User");
const Order      = require("../models/Order");
const Restaurant = require("../models/Restaurant");

// @desc  Get all users
router.get("/users", protect, authorize("admin"), async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = role ? { role } : {};
    const skip  = (page - 1) * limit;

    // Parallel count + find
    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query).select("-password -notifications -resetPasswordToken -resetPasswordExpire")
        .skip(skip).limit(Number(limit)).lean(),
    ]);

    res.json({ success: true, total, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Toggle user active status
router.put("/users/:id/toggle", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -notifications");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Public platform stats (home page counters)
router.get("/public-stats", async (req, res) => {
  try {
    const [totalRestaurants, totalCustomers, totalOrders] = await Promise.all([
      Restaurant.countDocuments({ isApproved: true, isActive: true }),
      User.countDocuments({ role: "customer" }),
      Order.countDocuments({ status: "delivered" }),
    ]);
    res.json({ success: true, stats: { totalRestaurants, totalCustomers, totalOrders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Dashboard stats
router.get("/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Run everything in parallel — one round-trip to MongoDB
    const [totalUsers, totalRestaurants, totalOrders, revenueData, recentOrders] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments({ isApproved: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.find({ createdAt: { $gte: thirtyMinutesAgo } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("customer",   "name")
        .populate("restaurant", "name")
        .lean(),
    ]);

    const revenue = revenueData.length > 0 ? revenueData[0].total : 0;

    res.json({
      success: true,
      stats: { totalUsers, totalRestaurants, totalOrders, revenue, recentOrders },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc  Send notification to users
// @route POST /api/admin/notifications/send
router.post("/notifications/send", protect, authorize("admin"), async (req, res) => {
  try {
    const { target = "all", message, type = "system" } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const notifType = ["order","promo","system"].includes(type) ? type : "system";

    const roleMap = {
      customers:         "customer",
      restaurant_owners: "restaurant_owner",
      delivery_drivers:  "delivery_driver",
    };

    let query;
    if (target === "all") {
      query = {};
    } else if (roleMap[target]) {
      query = { role: roleMap[target] };
    } else {
      query = { _id: target };
    }

    const notifDoc = { message: message.trim(), type: notifType, isRead: false };

    // Persist to DB + fetch affected IDs in parallel
    const [result, affectedUsers] = await Promise.all([
      User.updateMany(query, { $push: { notifications: notifDoc } }),
      User.find(query).select("_id").lean(),
    ]);

    // Emit real-time
    affectedUsers.forEach((u) =>
      emitNotification(u._id.toString(), { ...notifDoc, _id: `rt_${Date.now()}` })
    );

    res.json({
      success: true,
      message: `Notification sent to ${result.modifiedCount} user(s)`,
      count:   result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
