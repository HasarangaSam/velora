"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { headers } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { strongPasswordSchema } from "@/lib/validation/password";
import {
  consumeSensitiveRateLimit,
  getTrustedClientIp,
  hashAuthValue,
} from "@/lib/auth/security";

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
    const ip = getTrustedClientIp(headerList);

    // Rate-limit: max 3 reset requests per IP per 15 minutes
    if (ip && !(await consumeSensitiveRateLimit("forgot-password-ip", ip, 3, 900))) {
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

    // Limit reset email volume by account as well as trusted client IP.
    if (!(await consumeSensitiveRateLimit("forgot-password-email", email, 3, 900))) {
      return {
        success: true,
        email,
        message: "If an account exists for that email, you'll receive a reset link within a few minutes.",
      };
    }

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
      const tokenDigest = hashAuthValue(token, "password-reset-token");

      await prisma.passwordResetToken.create({
        data: { email, token: tokenDigest, expiresAt },
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
    console.error("Forgot password request failed.", error instanceof Error ? error.name : "Unknown error");
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
    password: strongPasswordSchema,
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
    const ip = getTrustedClientIp(headerList);

    if (ip && !(await consumeSensitiveRateLimit("reset-password-ip", ip, 5, 300))) {
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
    const tokenDigest = hashAuthValue(token, "password-reset-token");

    if (!(await consumeSensitiveRateLimit("reset-password-token", tokenDigest, 5, 900))) {
      return { success: false, message: "Too many attempts. Please request a new reset link." };
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token: tokenDigest } });

    if (!record) {
      return {
        success: false,
        message: "Invalid or expired reset link. Please request a new one.",
      };
    }

    if (new Date() > record.expiresAt) {
      await prisma.passwordResetToken.deleteMany({ where: { id: record.id, token: tokenDigest } });
      return {
        success: false,
        message: "This reset link has expired. Please request a new one.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Claim the live token and update the password atomically. Concurrent
    // submissions can consume the same token only once.
    const resetSucceeded = await prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.deleteMany({
        where: {
          id: record.id,
          token: tokenDigest,
          expiresAt: { gt: new Date() },
        },
      });
      if (consumed.count !== 1) return false;

      const updatedUser = await tx.user.updateMany({
        where: { email: record.email },
        data: {
          password: hashedPassword,
          sessionVersion: { increment: 1 },
        },
      });
      if (updatedUser.count !== 1) throw new Error("RESET_USER_NOT_FOUND");
      return true;
    });

    if (!resetSucceeded) {
      return { success: false, message: "This reset link is invalid, expired, or already used. Request a new one." };
    }

    return {
      success: true,
      message: "Password reset successfully! You can now sign in with your new password.",
    };
  } catch (error) {
    console.error("Password reset failed.", error instanceof Error ? error.name : "Unknown error");
    return { success: false, message: "Password reset failed. Please try again." };
  }
}
