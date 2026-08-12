const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const {
  register, login, googleAuth,
  getMe, updateProfile, changePassword,
  forgotPassword, resetPassword, testEmail,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, deleteAllNotifications,
} = require("../controllers/authController");

// Public
router.post("/register",             register);
router.post("/login",                login);
router.post("/google",               googleAuth);   // ← Google OAuth
router.post("/forgot-password",      forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.post("/test-email",           testEmail);    // dev only

// Protected
router.get("/me",              protect, getMe);
router.put("/profile",         protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Notifications — specific routes before :id wildcard
router.get("/notifications",           protect, getNotifications);
router.put("/notifications/read-all",  protect, markAllNotificationsRead);
router.put("/notifications/:id/read",  protect, markNotificationRead);
router.delete("/notifications/all",    protect, deleteAllNotifications);
router.delete("/notifications/:id",    protect, deleteNotification);

module.exports = router;
