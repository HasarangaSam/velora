import { prisma } from "@/lib/db/prisma";
import { calculateCouponDiscount, calculateShipping } from "@/lib/checkout";

type CheckoutCalculation = {
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  couponCode: string | null;
};

export async function calculateOrderTotals(
  userId: string,
  couponCode?: string,
  buyNow?: { variantId: string; quantity: number },
): Promise<CheckoutCalculation> {
  const cart = buyNow ? null : await prisma.cart.findUnique({
    where: {
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
          variant: {
            select: {
              id: true,
              productId: true,
              size: true,
              colour: true,
              price: true,
              stock: true,
            },
          },
        },
      },
    },
  });

  const buyNowVariant = buyNow ? await prisma.productVariant.findUnique({
    where: { id: buyNow.variantId },
    include: { product: { select: { id: true, name: true, isActive: true } } },
  }) : null;

  const items = buyNow && buyNowVariant
    ? [{ productId: buyNowVariant.productId, quantity: buyNow.quantity, product: buyNowVariant.product, variant: buyNowVariant }]
    : cart?.items ?? [];

  if (items.length === 0) {
    throw new Error("CART_EMPTY");
  }

  let subtotal = 0;

  for (const item of items) {
    if (!item.product.isActive) {
      throw new Error(`PRODUCT_UNAVAILABLE:${item.product.name}`);
    }

    if (item.variant.productId !== item.productId) {
      throw new Error("INVALID_CART_ITEM");
    }

    if (item.quantity > item.variant.stock) {
      throw new Error(`INSUFFICIENT_STOCK:${item.product.name}`);
    }

    subtotal += Number(item.variant.price) * item.quantity;
  }

  let discount = 0;
  let normalizedCouponCode: string | null = null;

  if (couponCode?.trim()) {
    const code = couponCode.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: {
        code,
      },
    });

    if (!coupon) {
      throw new Error("INVALID_COUPON");
    }

    const now = new Date();

    if (coupon.status !== "ACTIVE") {
      throw new Error("INVALID_COUPON");
    }

    if (coupon.startsAt && coupon.startsAt > now) {
      throw new Error("INVALID_COUPON");
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new Error("INVALID_COUPON");
    }

    if (
      coupon.minimumOrderValue &&
      subtotal < Number(coupon.minimumOrderValue)
    ) {
      throw new Error("COUPON_MINIMUM_NOT_MET");
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new Error("COUPON_USAGE_LIMIT_REACHED");
    }

    if (coupon.perUserLimit !== null) {
      const userUsageCount = await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId,
        },
      });

      if (userUsageCount >= coupon.perUserLimit) {
        throw new Error("COUPON_USER_LIMIT_REACHED");
      }
    }

    if (coupon.code === "WELCOME500") {
      const previousPaidOrder = await prisma.order.findFirst({
        where: { userId, paymentStatus: "PAID" },
        select: { id: true },
      });
      if (previousPaidOrder) throw new Error("WELCOME500_FIRST_ORDER_ONLY");
    }

    discount = calculateCouponDiscount(subtotal, {
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      maximumDiscount: coupon.maximumDiscount
        ? Number(coupon.maximumDiscount)
        : null,
    });

    normalizedCouponCode = coupon.code;
  }

  const shippingCost = calculateShipping(subtotal - discount);

  const total = subtotal - discount + shippingCost;

  return {
    subtotal,
    discount,
    shippingCost,
    total,
    couponCode: normalizedCouponCode,
  };
}
