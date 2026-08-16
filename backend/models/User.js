const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema({
  label:     { type: String, default: "Home" },
  street:    String,
  city:      String,
  state:     String,
  zipCode:   String,
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional for Google-authenticated users (they have no password)
    password:  { type: String, minlength: 6, default: null },
    googleId:  { type: String, default: null, index: true }, // Google sub identifier
    phone:     { type: String, trim: true },
    role: {
      type: String,
      enum: ["customer","restaurant_owner","delivery_driver","admin"],
      default: "customer",
    },
    avatar:          { type: String,  default: "" },
    addresses:       [addressSchema],
    isActive:        { type: Boolean, default: true },
    isOnline:        { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    fcmToken:        { type: String,  default: "" },
    notifications: [
      {
        message:   String,
        type:      { type: String, enum: ["order","promo","system","delivery_request"], default: "order" },
        isRead:    { type: Boolean, default: false },
        orderId:   { type: String,  default: null },
        createdAt: { type: Date,    default: Date.now },
      },
    ],
    resetPasswordToken:  String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1, role: 1 });

// Hash password before saving (only if set and changed)
userSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false; // Google-only users have no password
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
