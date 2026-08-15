const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/auth");
const Table       = require("../models/Table");
const Restaurant  = require("../models/Restaurant");
const Order       = require("../models/Order");
const QRCode      = require("qrcode");
const { getIO, emitOrderUpdate, emitTableUpdate, emitTableRemoved } = require("../utils/socket");

const verifyOwner = async (restaurantId, userId) => {
  const r = await Restaurant.findById(restaurantId).lean();
  if (!r) throw { status: 404, message: "Restaurant not found" };
  if (r.owner.toString() !== userId.toString()) throw { status: 403, message: "Not authorized" };
  return r;
};

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery"];

const enrichTable = async (table) => {
  if (!table) return null;
  const activeCount = await Order.countDocuments({ tableId: table._id, status: { $in: ACTIVE_STATUSES } });
  const remaining = Math.max(0, (table.capacity || 0) - activeCount);
  const isFull = remaining === 0 && activeCount > 0;
  return {
    ...table,
    remainingSeats: remaining,
    activeOrders: activeCount,
    status: isFull ? "occupied" : "available",
  };
};

router.get("/:restaurantId/available", async (req, res) => {
  try {
    const tables = await Table.find({
      restaurant: req.params.restaurantId,
      isActive: true,
    }).sort({ number: 1 }).lean();
    const enriched = await Promise.all(tables.map(enrichTable));
    const available = enriched.filter(t => t.remainingSeats > 0);
    res.json({ success: true, tables: available });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Public endpoint for QR code landing page — must come before /:restaurantId
router.get("/public/:restaurantId/:tableNumber", async (req, res) => {
  try {
    const { restaurantId, tableNumber } = req.params;
    const table = await Table.findOne({ restaurant: restaurantId, number: Number(tableNumber), isActive: true }).lean();
    if (!table) return res.status(404).json({ success: false, message: "Table not found" });
    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });
    const enriched = await enrichTable(table);
    const activeOrders = await Order.find({ tableId: table._id, status: { $nin: ["delivered", "cancelled"] } })
      .populate("customer", "name email")
      .lean();
    const customers = activeOrders.map(o => ({ name: o.customer?.name, email: o.customer?.email, orderId: o._id, status: o.status }));
    res.json({ success: true, table: enriched, restaurant, customers });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get("/:restaurantId", protect, async (req, res) => {
  try {
    const tables = await Table.find({ restaurant: req.params.restaurantId, isActive: true })
      .sort({ number: 1 }).lean();
    const enriched = await Promise.all(tables.map(enrichTable));
    res.json({ success: true, tables: enriched });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get("/:restaurantId/qr/:tableId", protect, async (req, res) => {
  try {
    const table = await Table.findOne({ _id: req.params.tableId, restaurant: req.params.restaurantId }).lean();
    if (!table) return res.status(404).json({ success: false, message: "Table not found" });
    const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const qrUrl = `${frontendUrl}/t/${req.params.restaurantId}/${table.number}`;
    const qrImage = await QRCode.toDataURL(qrUrl, { width: 400, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
    res.json({ success: true, qrImage, url: qrUrl, tableNumber: table.number, restaurantId: req.params.restaurantId });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/:restaurantId", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    await verifyOwner(req.params.restaurantId, req.user._id);
    const { number, capacity, location } = req.body;
    const existing = await Table.findOne({ restaurant: req.params.restaurantId, number, isActive: true });
    if (existing) return res.status(400).json({ success: false, message: `Table ${number} already exists` });
    const table = await Table.create({ restaurant: req.params.restaurantId, number, capacity, location });
    const created = await enrichTable(await Table.findById(table._id).lean());
    try { emitTableUpdate(created); } catch {}
    res.status(201).json({ success: true, table: created });
  } catch (e) { res.status(e.status || 500).json({ success: false, message: e.message }); }
});

router.put("/:tableId", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const table = await Table.findById(req.params.tableId);
    if (!table) return res.status(404).json({ success: false, message: "Table not found" });
    if (req.user.role !== "admin") await verifyOwner(table.restaurant, req.user.id);
    const allowed = ["number", "capacity", "location"];
    allowed.forEach(k => { if (req.body[k] !== undefined) table[k] = req.body[k]; });
    await table.save();
    const updated = await enrichTable(await Table.findById(table._id).lean());
    try { getIO().to(`restaurant_${table.restaurant}`).emit("table_update", updated); } catch {}
    res.json({ success: true, table: updated });
  } catch (e) { res.status(e.status || 500).json({ success: false, message: e.message }); }
});

router.delete("/:tableId", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const table = await Table.findById(req.params.tableId);
    if (!table) return res.status(404).json({ success: false, message: "Table not found" });
    if (req.user.role !== "admin") await verifyOwner(table.restaurant, req.user._id);
    const restaurantId = table.restaurant;
    await Table.findByIdAndDelete(table._id);
    try { emitTableRemoved(restaurantId, table._id); } catch {}
    res.json({ success: true, message: "Table deleted" });
  } catch (e) { res.status(e.status || 500).json({ success: false, message: e.message }); }
});

module.exports = router;
