const express    = require("express");
const router     = express.Router();
const { protect, authorize } = require("../middleware/auth");
const MenuItem   = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");

router.get("/:restaurantId", async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { restaurant: req.params.restaurantId };
    if (category && category !== "all") query.category = { $regex: category, $options: "i" };
    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
    const items = await MenuItem.find(query).sort({ sortOrder: 1, category: 1, name: 1 }).lean();
    res.json({ success: true, items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/:restaurantId", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });
    if (req.user.role !== "admin" && restaurant.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    const item = await MenuItem.create({ ...req.body, restaurant: req.params.restaurantId });
    res.status(201).json({ success: true, item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/item/:id", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    if (req.user.role !== "admin") {
      const restaurant = await Restaurant.findById(item.restaurant);
      if (!restaurant || restaurant.owner.toString() !== req.user.id)
        return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    res.json({ success: true, item: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/item/:id", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    if (req.user.role !== "admin") {
      const restaurant = await Restaurant.findById(item.restaurant);
      if (!restaurant || restaurant.owner.toString() !== req.user.id)
        return res.status(403).json({ success: false, message: "Not authorized" });
    }
    await item.deleteOne();
    res.json({ success: true, message: "Item deleted" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/item/:id/toggle", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    if (req.user.role !== "admin") {
      const restaurant = await Restaurant.findById(item.restaurant);
      if (!restaurant || restaurant.owner.toString() !== req.user.id)
        return res.status(403).json({ success: false, message: "Not authorized" });
    }
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json({ success: true, item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
