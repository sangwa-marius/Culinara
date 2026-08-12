const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
  name: String,
  price: Number,
  quantity: { type: Number, required: true, min: 1 },
  customizations: [{ title: String, selected: String, price: Number }],
  subtotal: Number,
});

const statusUpdateSchema = new mongoose.Schema({
  status: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    customer:    { type: mongoose.Schema.Types.ObjectId, ref: "User",       required: true },
    restaurant:  { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    driver:      { type: mongoose.Schema.Types.ObjectId, ref: "User",       default: null },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ["pending","confirmed","preparing","ready_for_pickup","out_for_delivery","delivered","cancelled"],
      default: "pending",
    },
    statusHistory: [statusUpdateSchema],
    deliveryAddress: { street: String, city: String, state: String, zipCode: String },
    paymentMethod:   { type: String, enum: ["card","mobile_money","cash_on_delivery"], required: true },
    paymentStatus:   { type: String, enum: ["pending","paid","failed","refunded"], default: "pending" },
    paymentIntentId: { type: String, default: "" },
    orderType:   { type: String, enum: ["delivery","dine_in"], default: "delivery" },
    tableId:     { type: mongoose.Schema.Types.ObjectId, ref: "Table", default: null },
    tableNumber: { type: Number, default: null },
    subtotal:  { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount:  { type: Number, default: 0 },
    tax:       { type: Number, default: 0 },
    total:     { type: Number, required: true },
    notes:     { type: String, default: "" },
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime:    { type: Date },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    hiddenBy:        [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    notifiedDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
orderSchema.index({ customer: 1,   createdAt: -1 });            // customer history
orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 }); // restaurant dashboard
orderSchema.index({ driver: 1,     status: 1, createdAt: -1 }); // driver dashboard
orderSchema.index({ createdAt: -1 });                            // admin recent orders
orderSchema.index({ status: 1,     createdAt: -1 });             // pending pickup list
orderSchema.index({ restaurant: 1, rating: 1 });                 // rating recalculation

// Auto-generate order number
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `FH-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);