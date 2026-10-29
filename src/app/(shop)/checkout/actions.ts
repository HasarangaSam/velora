"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { calculateCouponDiscount, calculateShipping } from "@/lib/checkout";
import { calculateOrderTotals } from "@/lib/order";
import { getCurrentPrice } from "@/lib/product-pricing";
import { createOrderSchema } from "@/lib/validation/order";
import { notifyAdmins } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/redis";

export type ValidateCouponResult = {
  valid: boolean;
  message?: string;
  discount?: number;
  shippingCost?: number;
  total?: number;
  couponCode?: string;
};

export async function validateCouponAction(
  rawCouponCode: string,
  rawSubtotal: number,
): Promise<ValidateCouponResult> {
  try {
    const user = await requireUser();

    const couponCode = typeof rawCouponCode === "string" ? rawCouponCode.trim().toUpperCase() : "";
    const subtotal = typeof rawSubtotal === "number" ? rawSubtotal : 0;

    if (!couponCode) {
      return { valid: false, message: "Coupon code is required." };
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });

    if (!coupon || coupon.status !== "ACTIVE") {
      return { valid: false, message: "Invalid or expired coupon code." };
    }

    const now = new Date();

    if (coupon.startsAt && coupon.startsAt > now) {
      return { valid: false, message: "This coupon is not yet active." };
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      return { valid: false, message: "This coupon has expired." };
    }

    if (coupon.minimumOrderValue && subtotal < Number(coupon.minimumOrderValue)) {
      return {
        valid: false,
        message: `Minimum order value of LKR ${Number(coupon.minimumOrderValue).toLocaleString("en-LK")} required.`,
      };
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: "This coupon has reached its usage limit." };
    }

    if (coupon.perUserLimit !== null) {
      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId: user.id },
      });

      if (userUsageCount >= coupon.perUserLimit) {
        return { valid: false, message: "You have already used this coupon." };
      }
    }

    if (coupon.code === "WELCOME500") {
      const previousPaidOrder = await prisma.order.findFirst({
        where: { userId: user.id, paymentStatus: "PAID" },
        select: { id: true },
      });
      if (previousPaidOrder) {
        return {
          valid: false,
          message: "WELCOME500 is available on your first successful order only.",
        };
      }
    }

    const discount = calculateCouponDiscount(subtotal, {
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : null,
    });

    const shippingCost = calculateShipping(subtotal - discount);
    const total = subtotal - discount + shippingCost;

    return {
      valid: true,
      discount,
      shippingCost,
      total,
      couponCode: coupon.code,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { valid: false, message: "Authentication required." };
    }
    console.error("Coupon validate error:", error);
    return { valid: false, message: "Unable to validate coupon." };
  }
}

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VEL-${timestamp}-${random}`;
}

export type SerializedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: string;
  discount: string;
  shippingCost: string;
  total: string;
  couponCode: string | null;
  paymentId: string | null;
};

export type CreateOrderActionResult = {
  success: boolean;
  message: string;
  order?: SerializedOrder;
  errors?: Record<string, string[]>;
};

export async function createOrderAction(
  body: unknown,
  idempotencyKey?: string,
): Promise<CreateOrderActionResult> {
  try {
    const user = await requireUser();

    const normalizedIdempotencyKey = idempotencyKey?.trim();
    if (!normalizedIdempotencyKey || !/^[\w-]{16,128}$/.test(normalizedIdempotencyKey)) {
      return { success: false, message: "A valid idempotency key is required." };
    }

    const result = createOrderSchema.safeParse(body);
    if (!result.success) {
      return {
        success: false,
        message: "Please provide valid checkout details.",
        errors: result.error.flatten().fieldErrors,
      };
    }

    const requestHash = createHash("sha256")
      .update(
        JSON.stringify({
          userId: user.id,
          addressId: result.data.addressId,
          couponCode: result.data.couponCode?.trim().toUpperCase() ?? "",
          buyNow: result.data.buyNow ?? null,
        }),
      )
      .digest("hex");

    const existingOrder = await prisma.order.findUnique({
      where: { checkoutRequestKey: normalizedIdempotencyKey },
      include: { payment: true },
    });

    if (existingOrder) {
      if (
        existingOrder.userId !== user.id ||
        existingOrder.checkoutRequestHash !== requestHash
      ) {
        return {
          success: false,
          message: "This checkout request key was already used for a different request.",
        };
      }

      return {
        success: true,
        message: "Order already created.",
        order: {
          id: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          status: existingOrder.status,
          paymentStatus: existingOrder.paymentStatus,
          subtotal: existingOrder.subtotal.toString(),
          discount: existingOrder.discount.toString(),
          shippingCost: existingOrder.shippingCost.toString(),
          total: existingOrder.total.toString(),
          couponCode: existingOrder.couponCode,
          paymentId: existingOrder.payment?.id ?? null,
        },
      };
    }

    const { success: rateLimitOk } = await checkRateLimit(`order:${user.id}`, 10, 600);
    if (!rateLimitOk) {
      return { success: false, message: "Too many checkout requests. Please wait a few minutes." };
    }

    const address = await prisma.address.findUnique({
      where: { id: result.data.addressId },
    });

    if (!address || address.userId !== user.id) {
      return { success: false, message: "The selected address is invalid." };
    }

    let totals;
    try {
      totals = await calculateOrderTotals(
        user.id,
        result.data.couponCode || undefined,
        result.data.buyNow,
      );
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      switch (true) {
        case error.message === "CART_EMPTY":
          return { success: false, message: "Your cart is empty." };
        case error.message === "INVALID_CART_ITEM":
          return { success: false, message: "Your cart contains an invalid item. Please refresh your cart." };
        case error.message.startsWith("PRODUCT_UNAVAILABLE:"):
          return { success: false, message: "One or more products in your cart are no longer available." };
        case error.message.startsWith("INSUFFICIENT_STOCK:"):
          return { success: false, message: "One or more items do not have enough stock." };
        case error.message === "INVALID_COUPON":
          return { success: false, message: "The coupon code is invalid or expired." };
        case error.message === "COUPON_MINIMUM_NOT_MET":
          return { success: false, message: "Your order does not meet the minimum value for this coupon." };
        case error.message === "COUPON_USAGE_LIMIT_REACHED":
          return { success: false, message: "This coupon has reached its usage limit." };
        case error.message === "COUPON_USER_LIMIT_REACHED":
          return { success: false, message: "You have already used this coupon." };
        case error.message === "WELCOME500_FIRST_ORDER_ONLY":
          return { success: false, message: "WELCOME500 is available on your first successful order only." };
        default:
          throw error;
      }
    }

    const buyNow = result.data.buyNow;
    const cart = buyNow
      ? null
      : await prisma.cart.findUnique({
          where: { userId: user.id },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    isActive: true,
                    price: true,
                    salePrice: true,
                  },
                },
                variant: {
                  select: {
                    id: true,
                    productId: true,
                    size: true,
                    colour: true,
                    stock: true,
                  },
                },
              },
            },
          },
        });

    const buyNowVariant = buyNow
      ? await prisma.productVariant.findUnique({
          where: { id: buyNow.variantId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                isActive: true,
                price: true,
                salePrice: true,
              },
            },
          },
        })
      : null;

    const itemsToOrder =
      buyNow && buyNowVariant
        ? [
            {
              productId: buyNowVariant.productId,
              variantId: buyNowVariant.id,
              quantity: buyNow.quantity,
              product: buyNowVariant.product,
              variant: buyNowVariant,
            },
          ]
        : (cart?.items ?? []);

    if (itemsToOrder.length === 0) {
      return { success: false, message: "Your cart is empty." };
    }

    let order;
    let replayed = false;

    try {
      order = await prisma.$transaction(async (tx) => {
        for (const item of itemsToOrder) {
          const currentVariant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            include: {
              product: { select: { isActive: true } },
            },
          });

          if (!currentVariant || !currentVariant.product.isActive) {
            throw new Error("PRODUCT_UNAVAILABLE");
          }

          if (currentVariant.productId !== item.productId) {
            throw new Error("INVALID_CART_ITEM");
          }

          if (currentVariant.stock < item.quantity) {
            throw new Error("INSUFFICIENT_STOCK");
          }
        }

        const createdOrder = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            checkoutRequestKey: normalizedIdempotencyKey,
            checkoutRequestHash: requestHash,
            userId: user.id,
            addressId: address.id,

            status: "PENDING",
            paymentStatus: "PENDING",

            shippingFullName: address.fullName,
            shippingPhone: address.phone,
            shippingAddressLine1: address.addressLine1,
            shippingAddressLine2: address.addressLine2 || null,
            shippingCity: address.city,
            shippingDistrict: address.district,
            shippingPostalCode: address.postalCode,

            subtotal: totals.subtotal,
            discount: totals.discount,
            shippingCost: totals.shippingCost,
            total: totals.total,
            couponCode: totals.couponCode,

            items: {
              create: itemsToOrder.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                name: item.product.name,
                size: item.variant.size,
                colour: item.variant.colour,
                price: getCurrentPrice(item.product),
                quantity: item.quantity,
              })),
            },

            payment: {
              create: {
                amount: totals.total,
                currency: "LKR",
                provider: "PAYHERE",
                status: "PENDING",
              },
            },
          },
          include: {
            items: true,
            payment: true,
          },
        });

        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }

        return createdOrder;
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        const concurrentOrder = await prisma.order.findUnique({
          where: { checkoutRequestKey: normalizedIdempotencyKey },
          include: { payment: true },
        });
        if (
          concurrentOrder?.userId === user.id &&
          concurrentOrder.checkoutRequestHash === requestHash
        ) {
          order = concurrentOrder;
          replayed = true;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    try {
      await notifyAdmins({
        title: "New order received",
        message: `Order #${order.orderNumber} has been placed.`,
        href: `/admin/orders/${order.id}`,
      });
    } catch (notificationError) {
      console.error("Could not create new-order admin notification:", notificationError);
    }

    revalidatePath("/cart");
    revalidatePath("/account/orders");

    return {
      success: true,
      message: replayed ? "Order already created." : "Order created successfully.",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal.toString(),
        discount: order.discount.toString(),
        shippingCost: order.shippingCost.toString(),
        total: order.total.toString(),
        couponCode: order.couponCode,
        paymentId: order.payment?.id ?? null,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return { success: false, message: "Authentication required." };
      }
      if (error.message === "PRODUCT_UNAVAILABLE") {
        return { success: false, message: "One or more products in your cart are no longer available." };
      }
      if (error.message === "INVALID_CART_ITEM") {
        return { success: false, message: "Your cart contains an invalid item." };
      }
      if (error.message === "INSUFFICIENT_STOCK") {
        return { success: false, message: "One or more items do not have enough stock." };
      }
    }

    console.error("Create order action error:", error);
    return { success: false, message: "Unable to create your order." };
  }
}
