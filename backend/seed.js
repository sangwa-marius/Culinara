require("dotenv").config();
const mongoose = require("mongoose");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Dynamic requires after connect
  const User       = require("./models/User");
  const Restaurant = require("./models/Restaurant");
  const MenuItem   = require("./models/MenuItem");
  const Table      = require("./models/Table");

  // Clear
  await Promise.all([User.deleteMany(), Restaurant.deleteMany(), MenuItem.deleteMany(), Table.deleteMany()]);
  console.log("Cleared existing data");

  // Users
  const [admin, owner, customer, driver] = await User.create([
    { name: "Admin User",      email: "admin@culinara.com",    password: "admin1234",    role: "admin",            isEmailVerified: true, isActive: true },
    { name: "Restaurant Owner",email: "owner@culinara.com",    password: "owner1234",    role: "restaurant_owner", isEmailVerified: true, isActive: true },
    { name: "John Customer",   email: "customer@culinara.com", password: "customer1234", role: "customer",         isEmailVerified: true, isActive: true },
    { name: "Alex Driver",     email: "driver@culinara.com",   password: "driver1234",   role: "delivery_driver",  isEmailVerified: true, isActive: true },
  ]);
  console.log("Users created");

  // Restaurant
  const restaurant = await Restaurant.create({
    owner:       owner._id,
    name:        "Chengxi Fine Dining",
    description: "Authentic Sichuan cuisine crafted with passion and precision.",
    cuisine:     ["Chinese","Sichuan","Asian"],
    address:     { street: "12 KG 7 Ave", city: "Kigali", state: "Kigali", zipCode: "00000" },
    phone:       "+250 788 000 000",
    email:       "chengxi@culinara.com",
    deliveryFee: 2.50,
    estimatedDeliveryTime: "25-35 min",
    minimumOrder: 10,
    rating:      4.8,
    totalRatings: 142,
    isOpen:      true,
    isApproved:  true,
    subscription:"pro",
  });
  console.log("Restaurant created");

  // Menu items
  const ITEMS = [
    { name: "Kung Pao Chicken",      category: "Mains",    price: 18.50, description: "Wok-tossed chicken with peanuts and Sichuan peppers", isSpicy: true },
    { name: "Twice Cooked Pork",     category: "Mains",    price: 16.00, description: "Sliced pork belly with leeks and doubanjiang sauce", isSpicy: true },
    { name: "Mapo Tofu",             category: "Mains",    price: 14.50, description: "Silken tofu in spicy bean sauce", isVegetarian: true, isSpicy: true },
    { name: "Spring Asparagus Salad",category: "Starters", price: 9.50,  description: "Fresh asparagus with sesame dressing", isVegetarian: true, isGlutenFree: true },
    { name: "Xiaolong Bao",          category: "Starters", price: 12.00, description: "Steamed soup dumplings, 8 pieces" },
    { name: "Edamame",               category: "Starters", price: 6.00,  description: "Lightly salted edamame", isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: "Mango Pudding",         category: "Desserts", price: 7.50,  description: "Silky mango pudding with fresh fruit", isVegetarian: true },
    { name: "Sesame Balls",          category: "Desserts", price: 6.50,  description: "Crispy rice balls filled with red bean paste" },
    { name: "Jasmine Green Tea",     category: "Drinks",   price: 4.00,  description: "Premium loose-leaf jasmine tea", isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: "Chrysanthemum Tea",     category: "Drinks",   price: 4.50,  description: "Delicate floral tea, iced or hot", isVegetarian: true, isVegan: true },
    { name: "Lychee Juice",          category: "Drinks",   price: 5.00,  description: "Fresh lychee juice", isVegetarian: true, isVegan: true, isGlutenFree: true },
    { name: "Sichuan Fish Soup",     category: "Specials", price: 22.00, description: "Chef's signature spicy fish broth with tofu", isSpicy: true, isGlutenFree: true },
  ];

  await MenuItem.create(ITEMS.map((item, i) => ({
    ...item,
    restaurant: restaurant._id,
    isAvailable: true,
    sortOrder: i,
  })));
  console.log("Menu items created");

  // Tables
  const TABLES = Array.from({ length: 12 }, (_, i) => ({
    restaurant: restaurant._id,
    number: i + 1,
    capacity: [2,2,4,4,4,6,4,2,4,4,6,8][i],
    location: i < 6 ? "Main Floor" : i < 9 ? "Terrace" : "VIP Room",
    status: i === 1 ? "occupied" : i === 4 ? "reserved" : "available",
  }));
  await Table.create(TABLES);
  console.log("Tables created");

  console.log("\n✅ Seed complete!");
  console.log("─────────────────────────────");
  console.log("👑 admin@culinara.com    / admin1234");
  console.log("🏪 owner@culinara.com    / owner1234");
  console.log("👤 customer@culinara.com / customer1234");
  console.log("🚗 driver@culinara.com   / driver1234");
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });