import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { calculateOrderTotals } from "@/lib/order";
import { createOrderSchema } from "@/lib/validation/order";
import { notifyAdmins } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/redis";

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `VEL-${timestamp}-${random}`;
}

function serializeCreatedOrder<T extends {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: { toString(): string };
  discount: { toString(): string };
  shippingCost: { toString(): string };
  total: { toString(): string };
  couponCode: string | null;
  payment: { id: string } | null;
}>(order: T) {
  return {
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
  };
}

export async function GET() {
  try {
    const user = await requireUser();

    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
          },
        },
        payment: {
          select: {
            status: true,
            amount: true,
            currency: true,
          },
        },
      },
    });

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal.toString(),
        discount: order.discount.toString(),
        shippingCost: order.shippingCost.toString(),
        total: order.total.toString(),
        couponCode: order.couponCode,
        createdAt: order.createdAt,
        itemCount: order.items.reduce(
          (total, item) => total + item.quantity,
          0,
        ),
        payment: order.payment
          ? {
              status: order.payment.status,
              amount: order.payment.amount.toString(),
              currency: order.payment.currency,
            }
          : null,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    console.error("Get orders error:", error);

    return NextResponse.json(
      {
        message: "Unable to load orders.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
    if (!idempotencyKey || !/^[\w-]{16,128}$/.test(idempotencyKey)) {
      return NextResponse.json(
        { message: "A valid Idempotency-Key header is required." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Please provide valid checkout details.",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const requestHash = createHash("sha256")
      .update(JSON.stringify({
        userId: user.id,
        addressId: result.data.addressId,
        couponCode: result.data.couponCode?.trim().toUpperCase() ?? "",
        buyNow: result.data.buyNow ?? null,
      }))
      .digest("hex");

    const existingOrder = await prisma.order.findUnique({
      where: { checkoutRequestKey: idempotencyKey },
      include: { payment: true },
    });
    if (existingOrder) {
      if (existingOrder.userId !== user.id || existingOrder.checkoutRequestHash !== requestHash) {
        return NextResponse.json(
          { message: "This checkout request key was already used for a different request." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { message: "Order already created.", order: serializeCreatedOrder(existingOrder) },
        { status: 200 },
      );
    }

    const { success } = await checkRateLimit(`order:${user.id}`, 10, 600);
    if (!success) {
      return NextResponse.json(
        { message: "Too many checkout requests. Please wait a few minutes." },
        { status: 429 },
      );
    }

    const address = await prisma.address.findUnique({
      where: {
        id: result.data.addressId,
      },
    });

    if (!address || address.userId !== user.id) {
      return NextResponse.json(
        {
          message: "The selected address is invalid.",
        },
        { status: 400 },
      );
    }

    let totals;

    try {
      totals = await calculateOrderTotals(
        user.id,
        result.data.couponCode || undefined,
        result.data.buyNow,
      );
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      switch (true) {
        case error.message === "CART_EMPTY":
          return NextResponse.json(
            {
              message: "Your cart is empty.",
            },
            { status: 400 },
          );

        case error.message === "INVALID_CART_ITEM":
          return NextResponse.json(
            {
              message:
                "Your cart contains an invalid item. Please refresh your cart.",
            },
            { status: 400 },
          );

        case error.message.startsWith("PRODUCT_UNAVAILABLE:"):
          return NextResponse.json(
            {
              message:
                "One or more products in your cart are no longer available.",
            },
            { status: 409 },
          );

        case error.message.startsWith("INSUFFICIENT_STOCK:"):
          return NextResponse.json(
            {
              message: "One or more items do not have enough stock.",
            },
            { status: 409 },
          );

        case error.message === "INVALID_COUPON":
          return NextResponse.json(
            {
              message: "The coupon code is invalid or expired.",
            },
            { status: 400 },
          );

        case error.message === "COUPON_MINIMUM_NOT_MET":
          return NextResponse.json(
            {
              message:
                "Your order does not meet the minimum value for this coupon.",
            },
            { status: 400 },
          );

        case error.message === "COUPON_USAGE_LIMIT_REACHED":
          return NextResponse.json(
            {
              message: "This coupon has reached its usage limit.",
            },
            { status: 400 },
          );

        case error.message === "COUPON_USER_LIMIT_REACHED":
          return NextResponse.json(
            {
              message: "You have already used this coupon.",
            },
            { status: 400 },
          );

        case error.message === "WELCOME500_FIRST_ORDER_ONLY":
          return NextResponse.json(
            { message: "WELCOME500 is available on your first successful order only." },
            { status: 400 },
          );

        default:
          throw error;
      }
    }

    const buyNow = result.data.buyNow;
    const cart = buyNow ? null : await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, isActive: true } },
            variant: { select: { id: true, productId: true, size: true, colour: true, price: true, stock: true } },
          },
        },
      },
    });
    const buyNowVariant = buyNow ? await prisma.productVariant.findUnique({
      where: { id: buyNow.variantId },
      include: { product: { select: { id: true, name: true, isActive: true } } },
    }) : null;
    const itemsToOrder = buyNow && buyNowVariant
      ? [{ productId: buyNowVariant.productId, variantId: buyNowVariant.id, quantity: buyNow.quantity, product: buyNowVariant.product, variant: buyNowVariant }]
      : cart?.items ?? [];

    if (itemsToOrder.length === 0) {
      return NextResponse.json(
        {
          message: "Your cart is empty.",
        },
        { status: 400 },
      );
    }

    let order;
    let replayed = false;
    try {
      order = await prisma.$transaction(async (tx) => {
      for (const item of itemsToOrder) {
        const currentVariant = await tx.productVariant.findUnique({
          where: {
            id: item.variantId,
          },
          include: {
            product: {
              select: {
                isActive: true,
              },
            },
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
          checkoutRequestKey: idempotencyKey,
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
              price: item.variant.price,
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
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        const concurrentOrder = await prisma.order.findUnique({
          where: { checkoutRequestKey: idempotencyKey },
          include: { payment: true },
        });
        if (concurrentOrder?.userId === user.id && concurrentOrder.checkoutRequestHash === requestHash) {
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

    return NextResponse.json(
      {
        message: replayed ? "Order already created." : "Order created successfully.",
        order: serializeCreatedOrder(order),
      },
      { status: replayed ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { message: "Authentication required." },
          { status: 401 },
        );
      }

      if (error.message === "PRODUCT_UNAVAILABLE") {
        return NextResponse.json(
          {
            message: "A product in your cart is no longer available.",
          },
          { status: 409 },
        );
      }

      if (error.message === "INVALID_CART_ITEM") {
        return NextResponse.json(
          {
            message: "Your cart contains an invalid item.",
          },
          { status: 409 },
        );
      }

      if (error.message === "INSUFFICIENT_STOCK") {
        return NextResponse.json(
          {
            message:
              "One or more items are no longer available in the requested quantity.",
          },
          { status: 409 },
        );
      }
    }

    console.error("Create order error:", error);

    return NextResponse.json(
      {
        message: "Unable to create the order.",
      },
      { status: 500 },
    );
  }
}
