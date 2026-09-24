import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        address: true,
        items: {
          include: {
            product: {
              select: {
                slug: true,
                images: {
                  where: {
                    isPrimary: true,
                  },
                  take: 1,
                  orderBy: {
                    sortOrder: "asc",
                  },
                  select: {
                    url: true,
                  },
                },
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order || order.userId !== user.id) {
      return NextResponse.json(
        {
          message: "Order not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
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
        createdAt: order.createdAt,
        address: order.address,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          size: item.size,
          colour: item.colour,
          price: item.price.toString(),
          quantity: item.quantity,
          image: item.product.images[0]?.url ?? null,
          slug: item.product.slug,
        })),
        payment: order.payment
          ? {
              id: order.payment.id,
              status: order.payment.status,
              amount: order.payment.amount.toString(),
              currency: order.payment.currency,
              provider: order.payment.provider,
              providerId: order.payment.providerId,
              providerOrderId: order.payment.providerOrderId,
            }
          : null,
      },
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

    console.error("Get order error:", error);

    return NextResponse.json(
      {
        message: "Unable to load the order.",
      },
      { status: 500 },
    );
  }
}
