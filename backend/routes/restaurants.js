const express    = require("express");
const router     = express.Router();
const { protect, authorize } = require("../middleware/auth");
const Restaurant = require("../models/Restaurant");
const User       = require("../models/User");

router.get("/", async (req, res) => {
  try {
    const { search, cuisine, isOpen, sort = "rating", page = 1, limit = 12 } = req.query;
    const query = { isApproved: true, isActive: true };
    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { cuisine: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
    if (cuisine) query.cuisine = { $in: cuisine.split(",").map(c => new RegExp(c.trim(), "i")) };
    if (isOpen === "true") query.isOpen = true;
    const sortMap = { rating: { rating: -1 }, deliveryFee: { deliveryFee: 1 }, newest: { createdAt: -1 } };
    const skip = (Number(page) - 1) * Number(limit);
    const [total, restaurants] = await Promise.all([
      Restaurant.countDocuments(query),
      Restaurant.find(query).sort(sortMap[sort] || { rating: -1 }).skip(skip).limit(Number(limit)).lean(),
    ]);
    res.json({ success: true, total, restaurants });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get("/my-restaurant", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id }).lean();
    res.json({ success: true, restaurant });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate("owner", "name email").sort({ createdAt: -1 }).lean();
    res.json({ success: true, restaurants });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).lean();
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });
    res.json({ success: true, restaurant });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const existing = await Restaurant.findOne({ owner: req.user.id });
    if (existing && req.user.role !== "admin") return res.status(400).json({ success: false, message: "You already have a restaurant" });
    const restaurant = await Restaurant.create({ ...req.body, owner: req.user.id });
    restaurant.markModified("openingHours");
    await restaurant.save();
    res.status(201).json({ success: true, restaurant });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/:id", protect, authorize("restaurant_owner", "admin"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: "Not found" });
    if (req.user.role !== "admin" && restaurant.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });
    const fields = ["name","description","cuisine","logo","coverImage","address","phone","email","openingHours","deliveryFee","estimatedDeliveryTime","minimumOrder","isOpen","tags","subscription"];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        restaurant[f] = req.body[f];
        // explicitly mark Mixed fields as modified so Mongoose saves them
        if (f === "openingHours") restaurant.markModified("openingHours");
      }
    });
    await restaurant.save();
    res.json({ success: true, restaurant });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/:id/approve", protect, authorize("admin"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, { isApproved: req.body.isApproved }, { new: true }).lean();
    res.json({ success: true, restaurant });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;