const mongoose = require("mongoose");

const menuCollectionSchema = new mongoose.Schema({
  restaurant:  { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  season:      { type: String, enum: ["Spring","Summer","Autumn","Winter","Custom"], default: "Custom" },
  status:      { type: String, enum: ["active","draft","archived"], default: "draft" },
  coverImage:  { type: String, default: "" },
  items:       [{ type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" }],
  sortOrder:   { type: Number, default: 0 },
}, { timestamps: true });

menuCollectionSchema.index({ restaurant: 1, status: 1 });

module.exports = mongoose.model("MenuCollection", menuCollectionSchema);