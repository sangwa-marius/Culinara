const mongoose = require("mongoose");
const customizationOptionSchema = new mongoose.Schema({ name: String, price: { type: Number, default: 0 } });
const customizationGroupSchema  = new mongoose.Schema({ title: String, required: { type: Boolean, default: false }, options: [customizationOptionSchema] });
const menuItemSchema = new mongoose.Schema({
  restaurant:    { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: "" },
  price:         { type: Number, required: true, min: 0 },
  category:      { type: String, required: true },
  image:         { type: String, default: "" },
  customizations:[customizationGroupSchema],
  isAvailable:   { type: Boolean, default: true },
  isVegetarian:  { type: Boolean, default: false },
  isVegan:       { type: Boolean, default: false },
  isGlutenFree:  { type: Boolean, default: false },
  isSpicy:       { type: Boolean, default: false },
  calories:      { type: Number },
  preparationTime:{ type: Number, default: 15 },
  discountedPrice:{ type: Number },
  discount:      { type: Number, default: 0 },
  sortOrder:     { type: Number, default: 0 },
}, { timestamps: true });
menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });
module.exports = mongoose.model("MenuItem", menuItemSchema);
