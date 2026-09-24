import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { getUserCart } from "@/lib/cart";
import { updateCartItemSchema } from "@/lib/validation/cart";

type RouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();

    const { itemId } = await context.params;

    const body = await request.json();

    const result = updateCartItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Please provide a valid quantity.",
        },
        { status: 400 },
      );
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        id: itemId,
      },
      include: {
        cart: {
          select: {
            userId: true,
          },
        },
        variant: {
          select: {
            stock: true,
            product: {
              select: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!cartItem || cartItem.cart.userId !== user.id) {
      return NextResponse.json(
        { message: "Cart item not found." },
        { status: 404 },
      );
    }

    if (!cartItem.variant.product.isActive) {
      return NextResponse.json(
        { message: "This product is no longer available." },
        { status: 409 },
      );
    }

    if (result.data.quantity > cartItem.variant.stock) {
      return NextResponse.json(
        {
          message: `Only ${cartItem.variant.stock} item${
            cartItem.variant.stock === 1 ? "" : "s"
          } available.`,
        },
        { status: 409 },
      );
    }

    await prisma.cartItem.update({
      where: {
        id: itemId,
      },
      data: {
        quantity: result.data.quantity,
      },
    });

    const cart = await getUserCart(user.id);

    return NextResponse.json({
      message: "Cart updated.",
      cart,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    console.error("Update cart item error:", error);

    return NextResponse.json(
      { message: "Unable to update the cart." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();

    const { itemId } = await context.params;

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        id: itemId,
      },
      include: {
        cart: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!cartItem || cartItem.cart.userId !== user.id) {
      return NextResponse.json(
        { message: "Cart item not found." },
        { status: 404 },
      );
    }

    await prisma.cartItem.delete({
      where: {
        id: itemId,
      },
    });

    const cart = await getUserCart(user.id);

    return NextResponse.json({
      message: "Item removed from cart.",
      cart,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    console.error("Delete cart item error:", error);

    return NextResponse.json(
      { message: "Unable to remove the item." },
      { status: 500 },
    );
  }
}
