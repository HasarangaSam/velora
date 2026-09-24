"use server";

import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendVerificationOtpEmail } from "@/lib/email";
import { UserRole } from "@/generated/prisma/enums";

export type AdminUserActionState = {
  success: boolean;
  message: string;
  userId?: string;
  verificationEmail?: string;
  errors?: Record<string, string[]>;
};

const emptyState: AdminUserActionState = { success: false, message: "" };

const baseUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().trim().email("Enter a valid email address.").max(255).transform((email) => email.toLowerCase()),
  role: z.enum(["USER", "ADMIN"]),
});

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function saveAdminUser(
  userId: string | null,
  _previous: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  try {
    const admin = await requireAdmin();
    const parsed = baseUserSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
    });

    if (!parsed.success) {
      return { ...emptyState, message: "Please correct the account details.", errors: parsed.error.flatten().fieldErrors };
    }

    if (!userId) {
      const createResult = z.object({ password: z.string().min(8, "Use at least 8 characters.").max(100) })
        .safeParse({ password: formData.get("password") });

      if (!createResult.success) {
        return { ...emptyState, message: "Please set a temporary password.", errors: createResult.error.flatten().fieldErrors };
      }

      const created = await prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password: await bcrypt.hash(createResult.data.password, 12),
          emailVerified: new Date(),
          role: parsed.data.role as UserRole,
        },
        select: { id: true },
      });

      revalidatePath("/admin/users");
      revalidatePath("/admin");
      return { success: true, message: "User account created.", userId: created.id };
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!existing) return { ...emptyState, message: "User account not found." };
    if (admin.id === userId && parsed.data.role !== existing.role) {
      return { ...emptyState, message: "You cannot change your own admin role." };
    }

    const emailChanged = existing.email !== parsed.data.email;
    const roleChanged = existing.role !== parsed.data.role;
    const newOtp = emailChanged ? String(randomInt(100000, 1000000)) : null;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      if (existing.role === "ADMIN" && parsed.data.role === "USER") {
        const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) throw new Error("LAST_ADMIN");
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          role: parsed.data.role as UserRole,
          ...(emailChanged ? { emailVerified: null } : {}),
          ...(emailChanged || roleChanged ? { sessionVersion: { increment: 1 } } : {}),
        },
      });

      if (emailChanged && newOtp) {
        await tx.verificationCode.deleteMany({
          where: { OR: [{ email: existing.email }, { email: parsed.data.email }], type: "REGISTER_OTP" },
        });
        await tx.passwordResetToken.deleteMany({
          where: { OR: [{ email: existing.email }, { email: parsed.data.email }] },
        });
        await tx.verificationCode.create({
          data: { email: parsed.data.email, code: newOtp, type: "REGISTER_OTP", expiresAt },
        });
      }
    }, { isolationLevel: "Serializable" });

    if (emailChanged && newOtp) {
      await sendVerificationOtpEmail({ to: parsed.data.email, name: parsed.data.name, otp: newOtp });
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin");
    return {
      success: true,
      message: emailChanged
        ? "User updated. A verification code was sent to the new email address."
        : "User account updated.",
      userId,
      verificationEmail: emailChanged ? parsed.data.email : undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ADMIN") {
      return { ...emptyState, message: "The last administrator cannot be demoted." };
    }
    if (isUniqueConstraintError(error)) {
      return { ...emptyState, message: "That email address is already in use.", errors: { email: ["Choose a different email address."] } };
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ...emptyState, message: "Sign in to continue." };
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { ...emptyState, message: "Admin access required." };
    }
    console.error("Save admin user error:", error);
    return { ...emptyState, message: "Unable to save the user account." };
  }
}

export async function deleteAdminUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const admin = await requireAdmin();
    if (admin.id === userId) return { success: false, message: "You cannot delete your own account here." };

    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, _count: { select: { orders: true } } },
      });
      if (!target) throw new Error("USER_NOT_FOUND");
      if (target._count.orders > 0) throw new Error("USER_HAS_ORDERS");

      if (target.role === "ADMIN") {
        const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) throw new Error("LAST_ADMIN");
      }

      await tx.verificationCode.deleteMany({ where: { email: target.email } });
      await tx.passwordResetToken.deleteMany({ where: { email: target.email } });
      await tx.user.delete({ where: { id: userId } });
    }, { isolationLevel: "Serializable" });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, message: "User account deleted." };
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") return { success: false, message: "User account not found." };
    if (error instanceof Error && error.message === "USER_HAS_ORDERS") return { success: false, message: "This account has order history and cannot be deleted." };
    if (error instanceof Error && error.message === "LAST_ADMIN") return { success: false, message: "The last administrator cannot be deleted." };
    if (error instanceof Error && error.message === "UNAUTHORIZED") return { success: false, message: "Sign in to continue." };
    if (error instanceof Error && error.message === "FORBIDDEN") return { success: false, message: "Admin access required." };
    console.error("Delete admin user error:", error);
    return { success: false, message: "Unable to delete the user account." };
  }
}

export async function toggleUserRole(userId: string) {
  try {
    const admin = await requireAdmin();
    if (admin.id === userId) return { success: false, message: "You cannot change your own admin role." };

    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
      if (!target) throw new Error("USER_NOT_FOUND");
      const nextRole = target.role === "ADMIN" ? "USER" : "ADMIN";

      if (target.role === "ADMIN") {
        const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) throw new Error("LAST_ADMIN");
      }

      await tx.user.update({
        where: { id: userId },
        data: { role: nextRole, sessionVersion: { increment: 1 } },
      });
    }, { isolationLevel: "Serializable" });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, message: "User role updated." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "LAST_ADMIN") return { success: false, message: "The last administrator cannot be demoted." };
    if (message === "USER_NOT_FOUND") return { success: false, message: "User account not found." };
    if (message === "UNAUTHORIZED") return { success: false, message: "Sign in to continue." };
    if (message === "FORBIDDEN") return { success: false, message: "Admin access required." };
    console.error("Toggle user role error:", error);
    return { success: false, message: "Unable to update user role." };
  }
}
