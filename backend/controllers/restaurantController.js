const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");

// @desc  Get all approved restaurants (with search & filter)
// @route GET /api/restaurants
const getRestaurants = async (req, res) => {
  try {
    const { search, cuisine, isOpen, sort, page = 1, limit = 12 } = req.query;

    const query = { isApproved: true, isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (cuisine) {
      query.cuisine = { $in: cuisine.split(",") };
    }

    if (isOpen !== undefined) {
      query.isOpen = isOpen === "true";
    }

    let sortQuery = {};
    if (sort === "rating") sortQuery = { rating: -1 };
    else if (sort === "deliveryFee") sortQuery = { deliveryFee: 1 };
    else if (sort === "newest") sortQuery = { createdAt: -1 };
    else sortQuery = { rating: -1 };

    const skip = (page - 1) * limit;
    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit))
      .populate("owner", "name email");

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      restaurants,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single restaurant
// @route GET /api/restaurants/:id
const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate("owner", "name email phone");
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });

    const menuItems = await MenuItem.find({ restaurant: restaurant._id, isAvailable: true });
    const categorized = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ success: true, restaurant, menu: categorized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create restaurant (restaurant owner)
// @route POST /api/restaurants
const createRestaurant = async (req, res) => {
  try {
    const existing = await Restaurant.findOne({ owner: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: "You already have a restaurant registered" });
    }

    const restaurant = await Restaurant.create({ ...req.body, owner: req.user.id });
    res.status(201).json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update restaurant
// @route PUT /api/restaurants/:id
const updateRestaurant = async (req, res) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });

    if (restaurant.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get owner's restaurant
// @route GET /api/restaurants/my-restaurant
const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) return res.status(404).json({ success: false, message: "No restaurant found" });
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get all restaurants for admin
// @route GET /api/restaurants/admin/all
const getAllRestaurantsAdmin = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate("owner", "name email phone");
    res.json({ success: true, restaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Approve/reject restaurant (admin)
// @route PUT /api/restaurants/:id/approve
const approveRestaurant = async (req, res) => {
  try {
    const { isApproved } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    );
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, getMyRestaurant, getAllRestaurantsAdmin, approveRestaurant };
