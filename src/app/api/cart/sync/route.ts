import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { getOrCreateCart, getUserCart } from "@/lib/cart";
import { syncCartSchema } from "@/lib/validation/cart";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = await request.json();

    const result = syncCartSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Invalid cart data.",
        },
        { status: 400 },
      );
    }

    const cart = await getOrCreateCart(user.id);

    const skippedVariantIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of result.data.items) {
        const variant = await tx.productVariant.findUnique({
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

        if (!variant || !variant.product.isActive || variant.stock <= 0) {
          skippedVariantIds.push(item.variantId);
          continue;
        }

        const existingItem = await tx.cartItem.findUnique({
          where: {
            cartId_variantId: {
              cartId: cart.id,
              variantId: variant.id,
            },
          },
        });

        const quantity = Math.min(
          (existingItem?.quantity ?? 0) + item.quantity,
          variant.stock,
        );

        await tx.cartItem.upsert({
          where: {
            cartId_variantId: {
              cartId: cart.id,
              variantId: variant.id,
            },
          },
          create: {
            cartId: cart.id,
            productId: variant.productId,
            variantId: variant.id,
            quantity,
          },
          update: {
            quantity,
            productId: variant.productId,
          },
        });
      }
    });

    const cartData = await getUserCart(user.id);

    return NextResponse.json({
      message: "Cart synchronized.",
      cart: cartData,
      skippedVariantIds,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    console.error("Sync cart error:", error);

    return NextResponse.json(
      { message: "Unable to synchronize the cart." },
      { status: 500 },
    );
  }
}
