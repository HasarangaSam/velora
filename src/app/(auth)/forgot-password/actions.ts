"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/redis";
import { sendPasswordResetEmail } from "@/lib/email";
import { headers } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcrypt";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export type ForgotPasswordState = {
  success: boolean;
  message: string;
  email?: string; // forwarded to reset-password page
};

export type ResetPasswordState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

// ─────────────────────────────────────────────────────────────────────────────
// requestPasswordReset – step 1: validate email, generate token, send email
// ─────────────────────────────────────────────────────────────────────────────

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "anonymous";

    // Rate-limit: max 3 reset requests per IP per 15 minutes
    const { success: rateOk } = await checkRateLimit(`forgot-pwd:${ip}`, 3, 900);
    if (!rateOk) {
      return {
        success: false,
        message: "Too many reset requests. Please wait 15 minutes before trying again.",
      };
    }

    const emailRaw = formData.get("email");
    const emailParsed = z.string().trim().email().max(255).safeParse(emailRaw);
    if (!emailParsed.success) {
      return { success: false, message: "Please enter a valid email address." };
    }

    const email = emailParsed.data.toLowerCase();

    // We always return the SAME generic success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, password: true },
    });

    if (user && user.password) {
      // Invalidate old tokens
      await prisma.passwordResetToken.deleteMany({ where: { email } });

      // Generate a secure opaque token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { email, token, expiresAt },
      });

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";

      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail({
        to: email,
        name: user.name ?? undefined,
        resetUrl,
        otp: token.slice(0, 6).toUpperCase(), // friendly short code shown in email
      });
    }

    // Always report success – prevents email enumeration
    return {
      success: true,
      email,
      message:
        "If an account exists for that email, you'll receive a reset link within a few minutes.",
    };
  } catch (error) {
    console.error("Forgot password error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resetPassword – step 2: validate token + new password, update DB
// ─────────────────────────────────────────────────────────────────────────────

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is missing."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(100, "Password must be under 100 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "anonymous";

    const { success: rateOk } = await checkRateLimit(`reset-pwd:${ip}`, 5, 300);
    if (!rateOk) {
      return { success: false, message: "Too many attempts. Please wait a few minutes." };
    }

    const raw = {
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const result = resetPasswordSchema.safeParse(raw);
    if (!result.success) {
      return {
        success: false,
        message: "Please correct the errors in the form.",
        errors: result.error.flatten().fieldErrors,
      };
    }

    const { token, password } = result.data;

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record) {
      return {
        success: false,
        message: "Invalid or expired reset link. Please request a new one.",
      };
    }

    if (new Date() > record.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: record.id } });
      return {
        success: false,
        message: "This reset link has expired. Please request a new one.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password + bump sessionVersion to invalidate all active sessions
    await prisma.user.update({
      where: { email: record.email },
      data: {
        password: hashedPassword,
        sessionVersion: { increment: 1 },
      },
    });

    // Consume the token
    await prisma.passwordResetToken.delete({ where: { id: record.id } });

    return {
      success: true,
      message: "Password reset successfully! You can now sign in with your new password.",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, message: "Password reset failed. Please try again." };
  }
}
