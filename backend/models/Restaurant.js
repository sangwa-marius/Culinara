const mongoose = require("mongoose");
const restaurantSchema = new mongoose.Schema({
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  cuisine:     [String],
  logo:        { type: String, default: "" },
  coverImage:  { type: String, default: "" },
  address:     { street: String, city: String, state: String, zipCode: String },
  phone:       { type: String, default: "" },
  email:       { type: String, default: "" },
  openingHours:{ type: mongoose.Schema.Types.Mixed, default: {} },
  deliveryFee: { type: Number, default: 0 },
  estimatedDeliveryTime: { type: String, default: "30-45 min" },
  minimumOrder:{ type: Number, default: 0 },
  rating:      { type: Number, default: 0 },
  totalRatings:{ type: Number, default: 0 },
  isOpen:      { type: Boolean, default: true },
  isActive:    { type: Boolean, default: true },
  isApproved:  { type: Boolean, default: false },
  tags:        [String],
  subscription:{ type: String, enum: ["basic","pro","enterprise"], default: "basic" },
}, { timestamps: true });
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ rating: -1 });
restaurantSchema.index({ isApproved: 1, isActive: 1 });
module.exports = mongoose.model("Restaurant", restaurantSchema);