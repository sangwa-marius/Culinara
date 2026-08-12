const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  number:     { type: Number, required: true },
  capacity:   { type: Number, default: 4 },
  location:   { type: String, default: "Main Floor" },
  status:     { type: String, enum: ["available","occupied","reserved","cleaning"], default: "available" },
  qrCode:     { type: String, default: "" },
  currentOrder:{ type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

tableSchema.index({ restaurant: 1, number: 1 }, { unique: true });
tableSchema.index({ restaurant: 1, status: 1 });

module.exports = mongoose.model("Table", tableSchema);
