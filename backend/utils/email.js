const nodemailer = require("nodemailer");

/* ─────────────────────────────────────────────────────────
   GMAIL SMTP SETUP NOTES:
   1. Enable 2-Factor Authentication on your Google account
   2. Go to: Google Account → Security → App Passwords
   3. Create an App Password (select "Mail" + "Other device")
   4. Use THAT 16-char password in EMAIL_PASS (not your real pw)
   5. EMAIL_PORT=587 uses STARTTLS (most common)
      EMAIL_PORT=465 uses SSL (set secure:true in that case)
───────────────────────────────────────────────────────── */

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.warn(
      "⚠️  [Email] Not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env\n" +
      "   Emails will be logged to console instead of sent."
    );
    return null;
  }

  const port = Number(EMAIL_PORT) || 587;
  const isSSL = port === 465;

  _transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port,
    secure: isSSL,           // true for 465, false for 587
    requireTLS: !isSSL,      // force STARTTLS on 587
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  // Verify connection on first use
  _transporter.verify((err) => {
    if (err) {
      console.error("❌ [Email] SMTP connection failed:", err.message);
      console.error("   Check EMAIL_HOST, EMAIL_USER, EMAIL_PASS in your .env");
      console.error("   For Gmail: make sure you're using an App Password, not your real password");
      _transporter = null; // reset so it retries next call
    } else {
      console.log("✅ [Email] SMTP connection verified —", EMAIL_HOST);
    }
  });

  return _transporter;
}

/* ─────────────────────────────────────────
   Core send — falls back to console log
───────────────────────────────────────── */
async function sendMail(options) {
  const transporter = getTransporter();

  if (!transporter) {
    // Dev fallback: log to console so you can see what would be sent
    console.log("\n📧 ══════════════════════════════════════════");
    console.log("   [Email NOT sent — SMTP not configured]");
    console.log("   To:     ", options.to);
    console.log("   Subject:", options.subject);
    if (options._devLog) console.log("   Info:  ", options._devLog);
    console.log("══════════════════════════════════════════\n");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Food Hub" <${process.env.EMAIL_USER}>`,
      ...options,
    });
    console.log(`✅ [Email sent] To: ${options.to} | ID: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ [Email failed] To: ${options.to} | Error: ${err.message}`);
    throw err; // re-throw so callers can handle
  }
}

/* ─────────────────────────────────────────
   HTML wrapper
───────────────────────────────────────── */
function wrapEmail({ title, preheader = "", body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#f97316 0%,#ef4444 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🍔</div>
            <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;">Food Hub</h1>
            <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">${title}</p>
          </td>
        </tr>
        <tr><td style="padding:40px;">${body}</td></tr>
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Food Hub. All rights reserved.</p>
            <p style="color:#d1d5db;font-size:11px;margin:4px 0 0;">If you didn't request this, you can safely ignore it.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ═════════════════════════════════════════
   1. Password Reset Email
═════════════════════════════════════════ */
const sendPasswordResetEmail = async (user, resetUrl) => {
  const body = `
    <h2 style="color:#1f2937;margin:0 0 8px;font-size:22px;font-weight:800;">Reset your password 🔐</h2>
    <p style="color:#6b7280;margin:0 0 28px;font-size:15px;line-height:1.6;">
      Hi <strong>${user.name}</strong>, we received a request to reset your Food Hub password.
      Click the button below — this link expires in <strong>15 minutes</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="${resetUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;font-weight:800;font-size:16px;padding:16px 48px;border-radius:12px;text-decoration:none;">
          Reset Password
        </a>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:12px;padding:16px;margin-bottom:24px;border-left:4px solid #ef4444;">
      <tr><td>
        <p style="margin:0;color:#991b1b;font-size:13px;font-weight:600;">⏰ This link expires in 15 minutes.</p>
        <p style="margin:6px 0 0;color:#b91c1c;font-size:13px;">After that you'll need to request a new one.</p>
      </td></tr>
    </table>

    <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;">If the button doesn't work, paste this URL into your browser:</p>
    <p style="font-size:12px;margin:0 0 24px;word-break:break-all;">
      <a href="${resetUrl}" style="color:#f97316;">${resetUrl}</a>
    </p>

    <p style="color:#9ca3af;font-size:13px;margin:0;line-height:1.6;">
      If you didn't request a password reset, ignore this email — your password won't change.
    </p>`;

  await sendMail({
    to: user.email,
    subject: "🔐 Reset your Food Hub password",
    html: wrapEmail({
      title: "Password Reset Request",
      preheader: `Hi ${user.name}, your password reset link expires in 15 minutes.`,
      body,
    }),
    _devLog: `Reset URL: ${resetUrl}`,
  });
};

/* ═════════════════════════════════════════
   2. Welcome Email
═════════════════════════════════════════ */
const sendWelcomeEmail = async (user) => {
  const roleMsg = {
    customer: "Browse hundreds of restaurants and get food delivered to your door.",
    restaurant_owner: "Your restaurant is under review. Once approved, you can start receiving orders.",
    delivery_driver: "Check your driver dashboard to start accepting deliveries.",
  };

  const body = `
    <h2 style="color:#1f2937;margin:0 0 8px;font-size:22px;font-weight:800;">Welcome, ${user.name}! 🎉</h2>
    <p style="color:#6b7280;margin:0 0 24px;font-size:15px;line-height:1.6;">
      You've successfully joined Food Hub.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border-radius:12px;padding:20px;margin-bottom:28px;border-left:4px solid #f97316;">
      <tr><td>
        <p style="margin:0;color:#9a3412;font-size:14px;line-height:1.6;">
          ${roleMsg[user.role] || roleMsg.customer}
        </p>
      </td></tr>
    </table>`;

  await sendMail({
    to: user.email,
    subject: `🎉 Welcome to Food Hub, ${user.name}!`,
    html: wrapEmail({ title: "Welcome aboard!", preheader: `Hi ${user.name}, your account is ready.`, body }),
  });
};

/* ═════════════════════════════════════════
   3. Order Confirmation
═════════════════════════════════════════ */
const sendOrderConfirmationEmail = async (user, order) => {
  const itemRows = order.items
    .map((i) => `<tr><td style="padding:6px 0;color:#374151;font-size:14px;">${i.name} × ${i.quantity}</td><td style="padding:6px 0;text-align:right;font-weight:600;font-size:14px;">$${i.subtotal.toFixed(2)}</td></tr>`)
    .join("");

  const body = `
    <h2 style="color:#1f2937;margin:0 0 8px;font-size:22px;font-weight:800;">Hi ${user.name}! 👋</h2>
    <p style="color:#6b7280;margin:0 0 24px;font-size:15px;">
      Your order <strong>#${order.orderNumber}</strong> is confirmed and the restaurant is getting started!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr><td>
        <h3 style="color:#1f2937;margin:0 0 12px;font-size:15px;">🧾 Order Summary</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${itemRows}
          <tr><td colspan="2"><hr style="border:none;border-top:1px solid #e5e7eb;margin:10px 0;"/></td></tr>
          <tr>
            <td style="color:#1f2937;font-weight:700;">Total</td>
            <td style="color:#f97316;font-weight:800;font-size:17px;text-align:right;">$${order.total.toFixed(2)}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:12px;padding:16px;">
      <tr><td><p style="margin:0;color:#92400e;font-size:14px;">⏱️ <strong>Estimated delivery:</strong> 30–45 minutes</p></td></tr>
    </table>`;

  await sendMail({
    to: user.email,
    subject: `✅ Order Confirmed #${order.orderNumber} — Food Hub`,
    html: wrapEmail({ title: "Your order is confirmed!", preheader: `Order #${order.orderNumber} received.`, body }),
  });
};

/* ═════════════════════════════════════════
   4. Order Status Update
═════════════════════════════════════════ */
const sendOrderStatusEmail = async (user, order, statusMessage) => {
  const CFG = {
    confirmed:        { emoji: "✅", color: "#10b981" },
    preparing:        { emoji: "🍳", color: "#f59e0b" },
    ready_for_pickup: { emoji: "📦", color: "#3b82f6" },
    out_for_delivery: { emoji: "🚗", color: "#8b5cf6" },
    delivered:        { emoji: "😋", color: "#10b981" },
    cancelled:        { emoji: "❌", color: "#ef4444" },
  };
  const cfg = CFG[order.status] || { emoji: "📦", color: "#6b7280" };

  const body = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">${cfg.emoji}</div>
      <h2 style="color:#1f2937;margin:0 0 8px;font-size:20px;font-weight:800;">Order #${order.orderNumber}</h2>
      <p style="color:#6b7280;margin:0;font-size:15px;">${statusMessage}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;">
      <tr>
        <td style="color:#6b7280;font-size:13px;">Total</td>
        <td style="color:#f97316;font-weight:800;font-size:15px;text-align:right;">$${order.total?.toFixed(2)}</td>
      </tr>
    </table>`;

  await sendMail({
    to: user.email,
    subject: `${cfg.emoji} Order #${order.orderNumber} Update — Food Hub`,
    html: wrapEmail({ title: "Order Update", preheader: statusMessage, body }),
  });
};

/* ═════════════════════════════════════════
   Test helper — call from /api/auth/test-email
═════════════════════════════════════════ */
const sendTestEmail = async (toEmail) => {
  const body = `
    <h2 style="color:#1f2937;margin:0 0 8px;font-size:22px;font-weight:800;">Test email ✅</h2>
    <p style="color:#6b7280;margin:0;font-size:15px;line-height:1.6;">
      If you're reading this, your Food Hub email configuration is working correctly!
    </p>`;

  await sendMail({
    to: toEmail,
    subject: "✅ Food Hub — Email test successful",
    html: wrapEmail({ title: "Email test", preheader: "Your SMTP config is working.", body }),
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendTestEmail,
};
