"use server";

import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sendVerificationOtpEmail } from "@/lib/email";
import { strongPasswordSchema } from "@/lib/validation/password";
import {
  consumeSensitiveRateLimit,
  getTrustedClientIp,
  hashAuthValue,
  safeDigestEqual,
} from "@/lib/auth/security";
import { headers } from "next/headers";
import crypto from "crypto";

export type RegisterActionState = {
  success: boolean;
  message: string;
  email?: string; // passed to verify-email page
  errors?: Record<string, string[]>;
};

export type VerifyOtpActionState = {
  success: boolean;
  message: string;
};

const MAX_VERIFICATION_CODE_ATTEMPTS = 5;

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be under 100 characters."),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(255, "Email is too long."),
  password: strongPasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

function generateOtp(): string {
  // Cryptographically secure 6-digit OTP
  return String(crypto.randomInt(100000, 999999));
}

export async function registerUser(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  try {
    const headerList = await headers();
    const ip = getTrustedClientIp(headerList);
    if (ip && !(await consumeSensitiveRateLimit("register-ip", ip, 5, 900))) {
      return {
        success: false,
        message: "Too many registration attempts. Please try again later.",
      };
    }

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    const result = registerSchema.safeParse({ name, email, password, confirmPassword });

    if (!result.success) {
      return {
        success: false,
        message: "Please correct the errors in the form.",
        errors: result.error.flatten().fieldErrors,
      };
    }

    const normalizedEmail = result.data.email.toLowerCase();
    if (!(await consumeSensitiveRateLimit("register-email", normalizedEmail, 5, 900))) {
      return {
        success: false,
        message: "Too many registration attempts for this email. Please try again later.",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return {
          success: false,
          message: "An account with this email already exists.",
          errors: { email: ["This email is already registered."] },
        };
      }
      // User exists but not verified — resend OTP
      await sendNewOtp(normalizedEmail, result.data.name);
      return {
        success: true,
        email: normalizedEmail,
        message: "A new verification code has been sent to your email.",
      };
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 12);

    await prisma.user.create({
      data: {
        name: result.data.name,
        email: normalizedEmail,
        password: hashedPassword,
        // emailVerified intentionally left null until OTP confirmed
      },
    });

    await sendNewOtp(normalizedEmail, result.data.name);

    return {
      success: true,
      email: normalizedEmail,
      message: "Account created! Please check your email for a verification code.",
    };
  } catch (error) {
    console.error("Register action error:", error);
    return {
      success: false,
      message: "Unable to create your account at this moment. Please try again.",
    };
  }
}

async function sendNewOtp(email: string, name?: string) {
  // Invalidate old codes for this email + type
  await prisma.verificationCode.deleteMany({
    where: { email, type: "REGISTER_OTP" },
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.verificationCode.create({
    data: {
      email,
      code: hashAuthValue(`${email}:${otp}`, "verification-code:REGISTER_OTP"),
      type: "REGISTER_OTP",
      expiresAt,
    },
  });

  await sendVerificationOtpEmail({ to: email, name, otp });
}

export async function verifyRegistrationOtp(
  _prevState: VerifyOtpActionState,
  formData: FormData,
): Promise<VerifyOtpActionState> {
  try {
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const code = formData.get("code")?.toString().trim();

    if (!email || email.length > 255 || !code || !/^\d{6}$/.test(code)) {
      return { success: false, message: "Email and verification code are required." };
    }

    const headerList = await headers();
    const ip = getTrustedClientIp(headerList);

    // Rate limit OTP attempts per IP
    if (ip && !(await consumeSensitiveRateLimit("verify-otp-ip", ip, 10, 300))) {
      return { success: false, message: "Too many attempts. Please wait a moment." };
    }

    const record = await prisma.verificationCode.findFirst({
      where: { email, type: "REGISTER_OTP" },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return { success: false, message: "No verification code found. Please register again." };
    }

    if (new Date() > record.expiresAt) {
      await prisma.verificationCode.delete({ where: { id: record.id } });
      return { success: false, message: "Verification code has expired. Please request a new one." };
    }

    if (record.attempts >= MAX_VERIFICATION_CODE_ATTEMPTS) {
      await prisma.verificationCode.deleteMany({ where: { id: record.id } });
      return { success: false, message: "Too many incorrect attempts. Please request a new code." };
    }

    const codeDigest = hashAuthValue(`${email}:${code}`, "verification-code:REGISTER_OTP");
    if (!safeDigestEqual(record.code, codeDigest)) {
      const attemptUpdate = await prisma.verificationCode.updateMany({
        where: { id: record.id, attempts: { lt: MAX_VERIFICATION_CODE_ATTEMPTS } },
        data: { attempts: { increment: 1 } },
      });
      if (record.attempts + 1 >= MAX_VERIFICATION_CODE_ATTEMPTS || attemptUpdate.count === 0) {
        await prisma.verificationCode.deleteMany({
          where: { id: record.id, attempts: { gte: MAX_VERIFICATION_CODE_ATTEMPTS } },
        });
      }
      return { success: false, message: "Incorrect verification code. Please try again." };
    }

    const verified = await prisma.$transaction(async (tx) => {
      const consumed = await tx.verificationCode.deleteMany({
        where: {
          id: record.id,
          code: codeDigest,
          attempts: { lt: MAX_VERIFICATION_CODE_ATTEMPTS },
          expiresAt: { gt: new Date() },
        },
      });
      if (consumed.count !== 1) return false;

      const result = await tx.user.updateMany({
        where: { email, emailVerified: null },
        data: { emailVerified: new Date() },
      });
      return result.count === 1;
    });

    if (!verified) {
      return { success: false, message: "This code is invalid or has already been used. Request a new code." };
    }

    return { success: true, message: "Email verified successfully! You can now sign in." };
  } catch (error) {
    console.error("Verify OTP error:", error);
    return { success: false, message: "Verification failed. Please try again." };
  }
}

export async function resendRegistrationOtp(
  _prevState: VerifyOtpActionState,
  formData: FormData,
): Promise<VerifyOtpActionState> {
  try {
    const email = formData.get("email")?.toString().trim().toLowerCase();
    if (!email || email.length > 255) {
      return { success: false, message: "Email is required." };
    }

    const headerList = await headers();
    const ip = getTrustedClientIp(headerList);

    if (ip && !(await consumeSensitiveRateLimit("resend-otp-ip", ip, 3, 300))) {
      return { success: false, message: "Too many resend attempts. Please wait a few minutes." };
    }

    if (!(await consumeSensitiveRateLimit("resend-otp-email", email, 3, 900))) {
      return { success: false, message: "Too many resend attempts. Please wait a few minutes." };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, emailVerified: true },
    });

    if (!user) {
      return { success: false, message: "No account found with this email." };
    }

    if (user.emailVerified) {
      return { success: false, message: "This account is already verified." };
    }

    await sendNewOtp(email, user.name ?? undefined);
    return { success: true, message: "A new verification code has been sent." };
  } catch (error) {
    console.error("Resend OTP error:", error);
    return { success: false, message: "Failed to resend code. Please try again." };
  }
}
