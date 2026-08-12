const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const { createPaymentIntent, confirmPayment, handleWebhook, refundPayment } = require("../controllers/paymentController");

router.post("/create-intent", protect, createPaymentIntent);
router.post("/confirm",  protect, confirmPayment);
router.post("/webhook",  express.raw({ type: "application/json" }), handleWebhook);
router.post("/refund",   protect, refundPayment);

module.exports = router;
