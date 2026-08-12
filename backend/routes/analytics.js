const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/auth");
const Order      = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const MenuItem   = require("../models/MenuItem");

// @route GET /api/analytics/restaurant
router.get("/restaurant", protect, authorize("restaurant_owner","admin"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id }).lean();
    if (!restaurant) return res.status(404).json({ success: false, message: "No restaurant" });

    const rid = restaurant._id;
    const now = new Date();
    const weekAgo = new Date(now - 7*24*60*60*1000);

    const [totalRevenue, totalOrders, weekOrders, topDishes, ordersByStatus] = await Promise.all([
      // Total revenue
      Order.aggregate([
        { $match: { restaurant: rid, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" }, avg: { $avg: "$total" } } },
      ]),
      // Total orders
      Order.countDocuments({ restaurant: rid }),
      // This week orders with daily breakdown
      Order.aggregate([
        { $match: { restaurant: rid, createdAt: { $gte: weekAgo } } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$total" },
        }},
        { $sort: { _id: 1 } },
      ]),
      // Top dishes by order count
      Order.aggregate([
        { $match: { restaurant: rid, status: "delivered" } },
        { $unwind: "$items" },
        { $group: { _id: "$items.name", count: { $sum: "$items.quantity" }, revenue: { $sum: "$items.subtotal" } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      // Orders by status
      Order.aggregate([
        { $match: { restaurant: rid } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      analytics: {
        totalRevenue:  totalRevenue[0]?.total || 0,
        avgOrderValue: totalRevenue[0]?.avg   || 0,
        totalOrders,
        weekOrders,
        topDishes,
        ordersByStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
