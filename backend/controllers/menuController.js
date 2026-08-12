const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");

// @desc  Get menu items for a restaurant
// @route GET /api/menu/:restaurantId
const getMenuItems = async (req, res) => {
  try {
    const { category, search, isAvailable, isVegetarian, isVegan } = req.query;
    const query = { restaurant: req.params.restaurantId };

    if (category) query.category = category;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === "true";
    if (isVegetarian === "true") query.isVegetarian = true;
    if (isVegan === "true") query.isVegan = true;

    // Regex search across name, description, category — no text index required
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { description: regex },
        { category: regex },
      ];
    }

    const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create menu item
// @route POST /api/menu/:restaurantId
const createMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });

    if (restaurant.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const item = await MenuItem.create({ ...req.body, restaurant: req.params.restaurantId });

    // Update restaurant categories
    if (!restaurant.categories.includes(req.body.category)) {
      await Restaurant.findByIdAndUpdate(req.params.restaurantId, {
        $addToSet: { categories: req.body.category },
      });
    }

    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update menu item
// @route PUT /api/menu/item/:id
const updateMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    let item = await MenuItem.findById(req.params.id);

    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    if (restaurant && item.restaurant.toString() !== restaurant._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete menu item
// @route DELETE /api/menu/item/:id
const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (restaurant && item.restaurant.toString() !== restaurant._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await item.deleteOne();
    res.json({ success: true, message: "Menu item removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Toggle item availability
// @route PUT /api/menu/item/:id/toggle
const toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability };
