import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { getOrCreateCart, getUserCart } from "@/lib/cart";
import { addToCartSchema } from "@/lib/validation/cart";

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const url = new URL(request.url);
    const buyNowVariantId = url.searchParams.get("buyNowVariantId");
    if (buyNowVariantId) {
      const parsed = addToCartSchema.safeParse({
        variantId: buyNowVariantId,
        quantity: url.searchParams.get("quantity") ?? 1,
      });
      if (!parsed.success) {
        return NextResponse.json({ message: "Invalid Buy Now selection." }, { status: 400 });
      }

      const variant = await prisma.productVariant.findUnique({
        where: { id: parsed.data.variantId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              images: { where: { isPrimary: true }, take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
            },
          },
        },
      });
      if (!variant || !variant.product.isActive) {
        return NextResponse.json({ message: "This product is no longer available." }, { status: 404 });
      }
      if (variant.stock < parsed.data.quantity) {
        return NextResponse.json({ message: "There is not enough stock for that quantity." }, { status: 409 });
      }

      const subtotal = Number(variant.price) * parsed.data.quantity;
      return NextResponse.json({
        items: [{
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          slug: variant.product.slug,
          image: variant.product.images[0]?.url ?? null,
          size: variant.size,
          colour: variant.colour,
          price: variant.price.toString(),
          quantity: parsed.data.quantity,
          stock: variant.stock,
        }],
        itemCount: parsed.data.quantity,
        subtotal: subtotal.toFixed(2),
      });
    }

    const cart = await getUserCart(user.id);

    return NextResponse.json(cart);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    console.error("Get cart error:", error);

    return NextResponse.json(
      { message: "Unable to load the cart." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = await request.json();

    const result = addToCartSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Please provide valid cart details.",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { variantId, quantity } = result.data;

    const variant = await prisma.productVariant.findUnique({
      where: {
        id: variantId,
      },
      include: {
        product: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!variant || !variant.product.isActive) {
      return NextResponse.json(
        { message: "This product is no longer available." },
        { status: 404 },
      );
    }

    if (variant.stock <= 0) {
      return NextResponse.json(
        { message: "This item is out of stock." },
        { status: 409 },
      );
    }

    const cart = await getOrCreateCart(user.id);

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    const newQuantity = (existingItem?.quantity ?? 0) + quantity;

    if (newQuantity > variant.stock) {
      return NextResponse.json(
        {
          message: `Only ${variant.stock} item${
            variant.stock === 1 ? "" : "s"
          } available.`,
        },
        { status: 409 },
      );
    }

    await prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
      create: {
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        quantity,
      },
      update: {
        quantity: newQuantity,
        productId: variant.productId,
      },
    });

    const updatedCart = await getUserCart(user.id);

    return NextResponse.json({
      message: "Item added to cart.",
      cart: updatedCart,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    console.error("Add to cart error:", error);

    return NextResponse.json(
      { message: "Unable to add the item to your cart." },
      { status: 500 },
    );
  }
}
