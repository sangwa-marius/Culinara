const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  placeOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getRestaurantOrders,
  cancelOrder,
  confirmDelivery,
  rateOrder,
  getAllOrdersAdmin,
  hideOrder,
} = require("../controllers/orderController");

router.post("/", protect, placeOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/admin/all", protect, authorize("admin"), getAllOrdersAdmin);
router.get("/restaurant/:restaurantId", protect, authorize("restaurant_owner", "admin"), getRestaurantOrders);
router.get("/:id", protect, getOrder);
router.put("/:id/status", protect, authorize("restaurant_owner", "delivery_driver", "admin"), updateOrderStatus);
router.put("/:id/cancel", protect, cancelOrder);
router.put("/:id/confirm-delivery", protect, confirmDelivery);
router.put("/:id/rate", protect, rateOrder);
router.delete("/:id/hide", protect, hideOrder);

module.exports = router;
