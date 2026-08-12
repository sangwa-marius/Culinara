const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User   = require("../models/User");
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTestEmail,
} = require("../utils/email");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

const userPayload = (user) => ({
  id:        user._id,
  name:      user.name,
  email:     user.email,
  role:      user.role,
  phone:     user.phone,
  avatar:    user.avatar,
  addresses: user.addresses,
});

// @desc  Register
// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "Name, email and password are required" });

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Email already registered" });

    const allowedRoles = ["customer", "restaurant_owner", "delivery_driver"];
    const userRole = allowedRoles.includes(role) ? role : "customer";

    const user = await User.create({ name, email, password, phone, role: userRole });
    sendWelcomeEmail(user).catch((e) => console.error("Welcome email failed:", e.message));

    res.status(201).json({ success: true, token: generateToken(user._id), user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Login
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const user = await User.findOne({ email });

    // Handle users who registered via Google and have no password
    if (user && !user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In. Please sign in with Google.",
      });
    }

    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    if (!user.isActive)
      return res.status(401).json({ success: false, message: "Account has been deactivated. Contact support." });

    res.json({ success: true, token: generateToken(user._id), user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Google OAuth — verify ID token and sign in / register
// @route POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential)
      return res.status(400).json({ success: false, message: "Google credential is required" });

    if (!process.env.GOOGLE_CLIENT_ID)
      return res.status(500).json({ success: false, message: "Google OAuth is not configured on this server" });

    // Verify the ID token with Google
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken:  credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ success: false, message: "Invalid Google token. Please try again." });
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ success: false, message: "Your Google email is not verified." });
    }

    // Look up by googleId first (fastest), then fall back to email
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        // Existing email account — link Google to it
        user.googleId        = googleId;
        user.isEmailVerified = true;
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
      } else {
        // Brand-new user — create account
        const allowedRoles = ["customer", "restaurant_owner", "delivery_driver"];
        const userRole = allowedRoles.includes(role) ? role : "customer";

        user = await User.create({
          name,
          email,
          googleId,
          avatar:          picture || "",
          isEmailVerified: true,
          role:            userRole,
          // No password — Google is the auth provider
        });

        sendWelcomeEmail(user).catch(() => {});
      }
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account has been deactivated. Contact support." });
    }

    const isNew = !user.createdAt || (Date.now() - new Date(user.createdAt).getTime()) < 5000;

    res.json({
      success: true,
      isNew,
      token: generateToken(user._id),
      user:  userPayload(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get current user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update profile
// @route PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, addresses } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, avatar, addresses },
      { new: true, runValidators: true }
    ).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Change password
// @route PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Both fields are required" });

    const user = await User.findById(req.user.id);

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In and does not have a password.",
      });
    }

    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ success: false, message: "Current password is incorrect" });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Forgot password
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.json({ success: true, message: "If an account with that email exists, a reset link has been sent." });
    }

    if (!user.password) {
      return res.json({ success: true, message: "If an account with that email exists, a reset link has been sent." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken  = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail(user, resetUrl);
    } catch (emailErr) {
      user.resetPasswordToken  = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: "Failed to send reset email. Please try again." });
    }

    res.json({ success: true, message: "If an account with that email exists, a reset link has been sent." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Reset password with token
// @route PUT /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: "Password is required" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ success: false, message: "Reset link is invalid or has expired" });

    user.password            = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful. You can now log in.",
      token:   generateToken(user._id),
      user:    userPayload(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Notification controllers (unchanged) ──────────────────────────────────────

const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notifications");
    res.json({ success: true, notifications: [...user.notifications].reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user.id, "notifications._id": req.params.id },
      { $set: { "notifications.$.isRead": true } }
    );
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $pull: { notifications: { _id: req.params.id } } });
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $set: { notifications: [] } });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $set: { "notifications.$[].isRead": true } });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const testEmail = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ success: false, message: "Not available in production" });
  }
  try {
    const to = req.body.email || req.user?.email || process.env.EMAIL_USER;
    if (!to) return res.status(400).json({ success: false, message: "Provide an email address in request body" });
    await sendTestEmail(to);
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  register, login, googleAuth,
  getMe, updateProfile, changePassword,
  forgotPassword, resetPassword, testEmail,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, deleteAllNotifications,
};
