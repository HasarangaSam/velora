"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { UserRole } from "@/generated/prisma/enums";

export async function toggleUserRole(userId: string, currentRole: string) {
  try {
    const admin = await requireAdmin();

    if (admin.id === userId) {
      return { success: false, message: "You cannot change your own admin role." };
    }

    const newRole: UserRole = currentRole === "ADMIN" ? "USER" : "ADMIN";

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        sessionVersion: { increment: 1 }, // Invalidate old session on role change
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return { success: true, message: `User role changed to ${newRole}.` };
  } catch (error) {
    console.error("Toggle user role error:", error);
    return { success: false, message: "Failed to update user role." };
  }
}
