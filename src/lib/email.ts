import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || process.env.AUTH_EMAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.AUTH_EMAIL_PASSWORD;

  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
  });
}

const FROM_EMAIL =
  process.env.SMTP_FROM || `"Velora Fashion" <${process.env.SMTP_USER || "noreply@velora.lk"}>`;

export async function sendVerificationOtpEmail({
  to,
  name,
  otp,
}: {
  to: string;
  name?: string;
  otp: string;
}) {
  const greeting = name ? `Hi ${name},` : "Hello,";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your Velora Account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #0f172a; padding: 28px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">
        VELORA
      </h1>
      <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">Modern Fashion & Apparel</p>
    </div>

    <div style="padding: 32px 28px;">
      <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 700;">Verify Your Email Address</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        ${greeting}<br/>
        Thank you for joining Velora! To complete your registration and activate your account, please enter the following 6-digit verification code:
      </p>

      <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 0.25em; color: #2563eb;">
          ${otp}
        </span>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">
        This code is valid for <strong>15 minutes</strong>. If you did not create an account on Velora, you can safely ignore this email.
      </p>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} Velora. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `${otp} is your Velora verification code`,
      html,
      text: `Your Velora verification code is: ${otp}. It expires in 15 minutes.`,
    });
    console.log(`[EMAIL] Verification OTP sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.warn(`[EMAIL WARNING] Failed to send verification email via SMTP to ${to}:`, error);
    console.log(`[EMAIL FALLBACK] OTP for ${to} is: >>> ${otp} <<<`);
    // Return success: true so in development or offline mode the user can still proceed with logged OTP
    return { success: true, fallbackOtp: otp };
  }
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  otp,
}: {
  to: string;
  name?: string;
  resetUrl: string;
  otp: string;
}) {
  const greeting = name ? `Hi ${name},` : "Hello,";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your Velora Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #0f172a; padding: 28px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">
        VELORA
      </h1>
      <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">Password Reset Request</p>
    </div>

    <div style="padding: 32px 28px;">
      <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 700;">Reset Your Password</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        ${greeting}<br/>
        We received a request to reset the password for your Velora account. Click the button below to choose a new password:
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Reset Password
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">
        Alternatively, enter this 6-digit security code on the reset page:
      </p>

      <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 24px;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 700; letter-spacing: 0.2em; color: #0f172a;">
          ${otp}
        </span>
      </div>

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-bottom: 24px;">
        This link and code will expire in <strong>15 minutes</strong>. If you did not request a password reset, you can safely disregard this email—your account remains secure.
      </p>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} Velora. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Reset your Velora password`,
      html,
      text: `Reset your Velora password here: ${resetUrl} or use code: ${otp}`,
    });
    console.log(`[EMAIL] Password reset email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.warn(`[EMAIL WARNING] Failed to send password reset email to ${to}:`, error);
    console.log(`[EMAIL FALLBACK] Password reset URL: ${resetUrl} (Code: ${otp})`);
    return { success: true, fallbackUrl: resetUrl, fallbackOtp: otp };
  }
}

export async function sendOrderStatusEmail({
  to,
  name,
  orderNumber,
  status,
}: {
  to: string;
  name?: string | null;
  orderNumber: string;
  status: string;
}) {
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hello,";
  const safeStatus = escapeHtml(status.toLowerCase().replaceAll("_", " "));
  const safeOrderNumber = escapeHtml(orderNumber);
  const subject = `Order ${safeOrderNumber} is ${status.toLowerCase().replaceAll("_", " ")}`;
  const text = `${greeting}\n\nYour Velora order ${orderNumber} is now ${status.toLowerCase().replaceAll("_", " ")}. You can view the latest details in My Orders.`;
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;padding:32px 16px"><div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:30px"><p style="font-size:12px;letter-spacing:3px;font-weight:bold;color:#2563eb">VELORA</p><h1 style="font-size:22px">An update on your order</h1><p style="font-size:15px;line-height:1.7;color:#475569">${greeting}<br/>Your order <strong>${safeOrderNumber}</strong> is now <strong>${safeStatus}</strong>.</p><p style="font-size:13px;line-height:1.6;color:#64748b">You can sign in to your Velora account to view the latest order details.</p></div></body></html>`;

  try {
    await getTransporter().sendMail({ from: FROM_EMAIL, to, subject, text, html });
    console.log(`[EMAIL] Order status email sent to ${to} (${orderNumber}: ${status})`);
    return { success: true };
  } catch (error) {
    console.warn(`[EMAIL WARNING] Failed to send order status email to ${to}:`, error);
    return { success: false };
  }
}

export type OrderConfirmationDetails = {
  to: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; size: string; colour: string; price: number; quantity: number }>;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  shippingAddress: string[];
};

export async function sendOrderConfirmationEmail(order: OrderConfirmationDetails) {
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
  const money = (amount: number) => `LKR ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const rowsHtml = order.items.map((item) => `<tr><td style="padding:12px 0;border-bottom:1px solid #e2e8f0"><strong>${escapeHtml(item.name)}</strong><br/><span style="color:#64748b;font-size:12px">${escapeHtml(item.size)} · ${escapeHtml(item.colour)} · Qty ${item.quantity}</span></td><td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap">${money(item.price * item.quantity)}</td></tr>`).join("");
  const summaryHtml = [
    ["Subtotal", order.subtotal],
    ["Discount", -order.discount],
    ["Shipping", order.shippingCost],
  ].map(([label, amount]) => `<tr><td style="padding:5px 0;color:#64748b">${label}</td><td style="padding:5px 0;text-align:right">${money(Number(amount))}</td></tr>`).join("");
  const addressHtml = order.shippingAddress.filter(Boolean).map(escapeHtml).join("<br/>");
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;padding:32px 16px"><div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:30px"><p style="font-size:12px;letter-spacing:3px;font-weight:bold;color:#2563eb">VELORA</p><h1 style="font-size:24px;margin-bottom:8px">Your order is confirmed</h1><p style="font-size:14px;line-height:1.7;color:#475569">Hi ${escapeHtml(order.customerName)},<br/>We’ve received your payment for order <strong>${safeOrderNumber}</strong>. Here’s your receipt and order summary.</p><h2 style="font-size:15px;margin-top:28px">Items</h2><table style="width:100%;border-collapse:collapse;font-size:13px">${rowsHtml}</table><table style="width:100%;margin-top:14px;border-collapse:collapse;font-size:13px">${summaryHtml}<tr><td style="padding-top:12px;border-top:1px solid #cbd5e1;font-weight:bold">Paid total</td><td style="padding-top:12px;border-top:1px solid #cbd5e1;text-align:right;font-weight:bold">${money(order.total)}</td></tr></table><h2 style="font-size:15px;margin:28px 0 8px">Delivering to</h2><p style="font-size:13px;line-height:1.7;color:#475569;margin:0">${addressHtml}</p><p style="font-size:12px;line-height:1.6;color:#94a3b8;margin-top:28px">Thank you for shopping with Velora.</p></div></body></html>`;
  const textItems = order.items.map((item) => `${item.name} (${item.size}, ${item.colour}) × ${item.quantity} — ${money(item.price * item.quantity)}`).join("\n");
  const text = `Hi ${order.customerName},\n\nYour payment for order ${order.orderNumber} was successful.\n\n${textItems}\n\nSubtotal: ${money(order.subtotal)}\nDiscount: -${money(order.discount)}\nShipping: ${money(order.shippingCost)}\nPaid total: ${money(order.total)}\n\nDelivering to:\n${order.shippingAddress.filter(Boolean).join("\n")}\n\nThank you for shopping with Velora.`;

  try {
    await getTransporter().sendMail({ from: FROM_EMAIL, to: order.to, subject: `Payment received — order ${safeOrderNumber}`, text, html });
    console.log(`[EMAIL] Order confirmation sent to ${order.to} (${order.orderNumber})`);
    return { success: true };
  } catch (error) {
    console.warn(`[EMAIL WARNING] Failed to send order confirmation to ${order.to}:`, error);
    return { success: false };
  }
}
