"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { DiscountType, CouponStatus } from "@/generated/prisma/enums";

export type CouponActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function createCoupon(
  _prev: CouponActionState,
  formData: FormData,
): Promise<CouponActionState> {
  try {
    await requireAdmin();

    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    const discountType = String(formData.get("discountType") ?? "") as DiscountType;
    const discountValue = Number(formData.get("discountValue") ?? 0);
    const minimumOrderValue = formData.get("minimumOrderValue")
      ? Number(formData.get("minimumOrderValue"))
      : null;
    const maximumDiscount = formData.get("maximumDiscount")
      ? Number(formData.get("maximumDiscount"))
      : null;
    const usageLimit = formData.get("usageLimit")
      ? Number(formData.get("usageLimit"))
      : null;
    const perUserLimit = formData.get("perUserLimit")
      ? Number(formData.get("perUserLimit"))
      : null;
    const startsAt = formData.get("startsAt")
      ? new Date(String(formData.get("startsAt")))
      : null;
    const expiresAt = formData.get("expiresAt")
      ? new Date(String(formData.get("expiresAt")))
      : null;

    if (!code || code.length < 3) {
      return { success: false, message: "Coupon code must be at least 3 characters." };
    }

    if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
      return { success: false, message: "Invalid discount type." };
    }

    if (discountValue <= 0) {
      return { success: false, message: "Discount value must be greater than zero." };
    }

    if (discountType === "PERCENTAGE" && discountValue > 100) {
      return { success: false, message: "Percentage discount cannot exceed 100%." };
    }

    const existing = await prisma.coupon.findUnique({
      where: { code },
    });

    if (existing) {
      return { success: false, message: `Coupon "${code}" already exists.` };
    }

    await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue,
        minimumOrderValue,
        maximumDiscount,
        usageLimit,
        perUserLimit,
        startsAt,
        expiresAt,
        status: "ACTIVE",
      },
    });

    revalidatePath("/admin/coupons");
    return { success: true, message: `Coupon "${code}" created successfully.` };
  } catch (error) {
    console.error("Create coupon error:", error);
    return { success: false, message: "Failed to create coupon." };
  }
}

export async function toggleCouponStatus(id: string, currentStatus: string) {
  try {
    await requireAdmin();

    const newStatus: CouponStatus =
      currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    await prisma.coupon.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath("/admin/coupons");
    return { success: true, message: `Coupon marked as ${newStatus}.` };
  } catch (error) {
    console.error("Toggle coupon status error:", error);
    return { success: false, message: "Failed to update coupon status." };
  }
}

export async function deleteCoupon(id: string) {
  try {
    await requireAdmin();

    await prisma.coupon.delete({
      where: { id },
    });

    revalidatePath("/admin/coupons");
    return { success: true, message: "Coupon deleted successfully." };
  } catch (error) {
    console.error("Delete coupon error:", error);
    return { success: false, message: "Failed to delete coupon." };
  }
}
