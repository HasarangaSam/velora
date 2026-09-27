import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { calculateCouponDiscount, calculateShipping } from "@/lib/checkout";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = (await request.json()) as {
      couponCode?: string;
      subtotal?: number;
    };

    const couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";
    const subtotal = typeof body.subtotal === "number" ? body.subtotal : 0;

    if (!couponCode) {
      return NextResponse.json({ message: "Coupon code is required." }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });

    if (!coupon || coupon.status !== "ACTIVE") {
      return NextResponse.json({ valid: false, message: "Invalid or expired coupon code." });
    }

    const now = new Date();

    if (coupon.startsAt && coupon.startsAt > now) {
      return NextResponse.json({ valid: false, message: "This coupon is not yet active." });
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      return NextResponse.json({ valid: false, message: "This coupon has expired." });
    }

    if (coupon.minimumOrderValue && subtotal < Number(coupon.minimumOrderValue)) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order value of LKR ${Number(coupon.minimumOrderValue).toLocaleString("en-LK")} required.`,
      });
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, message: "This coupon has reached its usage limit." });
    }

    if (coupon.perUserLimit !== null) {
      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId: user.id },
      });

      if (userUsageCount >= coupon.perUserLimit) {
        return NextResponse.json({ valid: false, message: "You have already used this coupon." });
      }
    }

    if (coupon.code === "WELCOME500") {
      const previousPaidOrder = await prisma.order.findFirst({
        where: { userId: user.id, paymentStatus: "PAID" },
        select: { id: true },
      });
      if (previousPaidOrder) {
        return NextResponse.json({
          valid: false,
          message: "WELCOME500 is available on your first successful order only.",
        });
      }
    }

    const discount = calculateCouponDiscount(subtotal, {
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : null,
    });

    const shippingCost = calculateShipping(subtotal - discount);
    const total = subtotal - discount + shippingCost;

    return NextResponse.json({
      valid: true,
      discount,
      shippingCost,
      total,
      couponCode: coupon.code,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    console.error("Coupon validate error:", error);
    return NextResponse.json({ message: "Unable to validate coupon." }, { status: 500 });
  }
}
