const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");

// @desc  Create Stripe payment intent
// @route POST /api/payments/create-intent
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = "usd", orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency,
      metadata: { orderId, userId: req.user.id },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Confirm payment and update order
// @route POST /api/payments/confirm
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        paymentIntentId,
      });

      res.json({ success: true, message: "Payment confirmed" });
    } else {
      res.status(400).json({ success: false, message: "Payment not completed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Stripe webhook handler
// @route POST /api/payments/webhook
const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const { orderId } = pi.metadata;
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        paymentIntentId: pi.id,
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object;
    const { orderId } = pi.metadata;
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { paymentStatus: "failed" });
    }
  }

  res.json({ received: true });
};

// @desc  Refund payment
// @route POST /api/payments/refund
const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order || !order.paymentIntentId) {
      return res.status(404).json({ success: false, message: "No payment found for this order" });
    }

    const refund = await stripe.refunds.create({ payment_intent: order.paymentIntentId });

    await Order.findByIdAndUpdate(orderId, { paymentStatus: "refunded" });

    res.json({ success: true, refund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPaymentIntent, confirmPayment, handleWebhook, refundPayment };
