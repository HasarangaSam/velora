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
