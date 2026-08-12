const express          = require("express");
const router           = express.Router();
const { protect, authorize } = require("../middleware/auth");
const MenuCollection   = require("../models/MenuCollection");
const Restaurant       = require("../models/Restaurant");
const MenuItem         = require("../models/MenuItem");

// Verify the user owns this restaurant
const verifyOwner = async (restaurantId, userId, role) => {
  if (role === "admin") return true;
  const r = await Restaurant.findOne({ _id: restaurantId, owner: userId }).lean();
  if (!r) throw new Error("Not authorized");
  return true;
};

// GET all collections for a restaurant
router.get("/:restaurantId", protect, async (req, res) => {
  try {
    const collections = await MenuCollection.find({ restaurant: req.params.restaurantId })
      .populate("items", "name price category image isAvailable")
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    res.json({ success: true, collections });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create a collection
router.post("/:restaurantId", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    await verifyOwner(req.params.restaurantId, req.user._id, req.user.role);
    const { name, description, season, status, coverImage, items } = req.body;
    const col = await MenuCollection.create({
      restaurant: req.params.restaurantId,
      name, description, season, status, coverImage,
      items: items || [],
    });
    await col.populate("items", "name price category image isAvailable");
    res.status(201).json({ success: true, collection: col });
  } catch (e) { res.status(e.status || 500).json({ success: false, message: e.message }); }
});

// PUT update a collection
router.put("/:id", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const col = await MenuCollection.findById(req.params.id);
    if (!col) return res.status(404).json({ success: false, message: "Collection not found" });
    await verifyOwner(col.restaurant, req.user._id, req.user.role);
    const fields = ["name", "description", "season", "status", "coverImage", "items", "sortOrder"];
    fields.forEach(f => { if (req.body[f] !== undefined) col[f] = req.body[f]; });
    await col.save();
    await col.populate("items", "name price category image isAvailable");
    res.json({ success: true, collection: col });
  } catch (e) { res.status(e.status || 500).json({ success: false, message: e.message }); }
});

// DELETE a collection
router.delete("/:id", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const col = await MenuCollection.findById(req.params.id);
    if (!col) return res.status(404).json({ success: false, message: "Collection not found" });
    await verifyOwner(col.restaurant, req.user._id, req.user.role);
    await col.deleteOne();
    res.json({ success: true, message: "Collection deleted" });
  } catch (e) { res.status(e.status || 500).json({ success: false, message: e.message }); }
});

module.exports = router;