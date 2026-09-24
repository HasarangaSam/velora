"use server";

import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { z } from "zod";
import { sendVerificationOtpEmail } from "@/lib/email";

export type ProfileActionState = {
  success: boolean;
  message: string;
  verificationEmail?: string;
  errors?: Record<string, string[]>;
};

const emptyState: ProfileActionState = { success: false, message: "" };

export async function updateMyProfile(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const user = await requireUser();
    const result = z.object({
      name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
    }).safeParse({ name: formData.get("name") });

    if (!result.success) {
      return { ...emptyState, message: "Please correct your name.", errors: result.error.flatten().fieldErrors };
    }

    await prisma.user.update({ where: { id: user.id }, data: { name: result.data.name } });
    revalidatePath("/account");
    revalidatePath("/account/profile");

    return { success: true, message: "Your profile has been updated." };
  } catch (error) {
    console.error("Update profile error:", error);
    return { ...emptyState, message: "Unable to update your profile." };
  }
}

export async function changeMyEmail(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const user = await requireUser();
    const result = z.object({
      currentEmail: z.string().trim().email(),
      newEmail: z.string().trim().email("Enter a valid email address.").max(255).transform((email) => email.toLowerCase()),
      password: z.string().optional(),
    }).safeParse({
      currentEmail: formData.get("currentEmail"),
      newEmail: formData.get("newEmail"),
      password: formData.get("password") || undefined,
    });

    if (!result.success) {
      return { ...emptyState, message: "Please enter a valid new email address.", errors: result.error.flatten().fieldErrors };
    }

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, password: true, name: true },
    });
    if (!existing || existing.email.toLowerCase() !== result.data.currentEmail.toLowerCase()) {
      return { ...emptyState, message: "Your current email does not match your account." };
    }
    if (result.data.newEmail === existing.email.toLowerCase()) {
      return { ...emptyState, message: "Enter an email address different from your current one." };
    }
    if (existing.password && (!result.data.password || !(await bcrypt.compare(result.data.password, existing.password)))) {
      return { ...emptyState, message: "Your current password is incorrect." };
    }
    const emailInUse = await prisma.user.findUnique({ where: { email: result.data.newEmail }, select: { id: true } });
    if (emailInUse) return { ...emptyState, message: "That email address is already in use." };

    const otp = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: result.data.newEmail,
          emailVerified: null,
          sessionVersion: { increment: 1 },
        },
      });
      await tx.verificationCode.deleteMany({
        where: { OR: [{ email: existing.email }, { email: result.data.newEmail }], type: "REGISTER_OTP" },
      });
      await tx.passwordResetToken.deleteMany({ where: { OR: [{ email: existing.email }, { email: result.data.newEmail }] } });
      await tx.verificationCode.create({
        data: { email: result.data.newEmail, code: otp, type: "REGISTER_OTP", expiresAt },
      });
    }, { isolationLevel: "Serializable" });

    await sendVerificationOtpEmail({ to: result.data.newEmail, name: existing.name ?? undefined, otp });
    revalidatePath("/account");
    revalidatePath("/account/profile");
    return {
      success: true,
      message: "A verification code was sent to your new email. Verify it before signing in again.",
      verificationEmail: result.data.newEmail,
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { ...emptyState, message: "That email address is already in use." };
    }
    console.error("Change email error:", error);
    return { ...emptyState, message: "Unable to update your email address." };
  }
}

export async function changeMyPassword(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const user = await requireUser();
    const result = z.object({
      currentPassword: z.string().min(1, "Enter your current password."),
      newPassword: z.string().min(8, "Use at least 8 characters.").max(100),
      confirmPassword: z.string().min(1, "Confirm your new password."),
    }).refine((value) => value.newPassword === value.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match.",
    }).safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!result.success) {
      return { ...emptyState, message: "Please check the password fields.", errors: result.error.flatten().fieldErrors };
    }

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!existing?.password || !(await bcrypt.compare(result.data.currentPassword, existing.password))) {
      return { ...emptyState, message: "Your current password is incorrect." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(result.data.newPassword, 12),
        sessionVersion: { increment: 1 },
      },
    });

    revalidatePath("/account/profile");
    return { success: true, message: "Password updated. Sign in again with your new password." };
  } catch (error) {
    console.error("Change password error:", error);
    return { ...emptyState, message: "Unable to update your password." };
  }
}

export async function deleteMyAccount(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const user = await requireUser();
    const result = z.object({
      email: z.string().trim().email(),
      password: z.string().optional(),
      confirmation: z.string().refine((value) => value === "DELETE", "Type DELETE to confirm account closure."),
    }).safeParse({
      email: formData.get("email"),
      password: formData.get("password") || undefined,
      confirmation: formData.get("confirmation"),
    });

    if (!result.success) {
      return { ...emptyState, message: "Please confirm your email and type DELETE.", errors: result.error.flatten().fieldErrors };
    }

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, password: true, role: true },
    });

    if (!existing || existing.email.toLowerCase() !== result.data.email.toLowerCase()) {
      return { ...emptyState, message: "The email address does not match your account." };
    }

    if (existing.password && (!result.data.password || !(await bcrypt.compare(result.data.password, existing.password)))) {
      return { ...emptyState, message: "Your password is incorrect." };
    }

    await prisma.$transaction(async (tx) => {
      const orderCount = await tx.order.count({ where: { userId: user.id } });
      if (orderCount > 0) throw new Error("ACCOUNT_HAS_ORDERS");
      if (existing.role === "ADMIN") {
        const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) throw new Error("LAST_ADMIN");
      }
      await tx.verificationCode.deleteMany({ where: { email: existing.email } });
      await tx.passwordResetToken.deleteMany({ where: { email: existing.email } });
      await tx.user.delete({ where: { id: user.id } });
    }, { isolationLevel: "Serializable" });

    revalidatePath("/account");
    return { success: true, message: "Your account has been closed." };
  } catch (error) {
    if (error instanceof Error && error.message === "ACCOUNT_HAS_ORDERS") {
      return { ...emptyState, message: "Accounts with order history cannot be closed here. Contact support for help with your account data." };
    }
    if (error instanceof Error && error.message === "LAST_ADMIN") {
      return { ...emptyState, message: "The last administrator cannot close their account." };
    }
    console.error("Delete account error:", error);
    return { ...emptyState, message: "Unable to close your account." };
  }
}
