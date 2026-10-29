"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { getOrCreateCart, getUserCart } from "@/lib/cart";
import { addToCartSchema, syncCartSchema, updateCartItemSchema } from "@/lib/validation/cart";
import { getCurrentPrice } from "@/lib/product-pricing";
import type { CartData } from "@/types/cart";

export type CartActionResult = {
  success: boolean;
  message: string;
  cart?: CartData;
  error?: string;
  skippedVariantIds?: string[];
};

export async function getCartAction(buyNowVariantId?: string, quantity: number = 1): Promise<CartActionResult> {
  try {
    const user = await requireUser();

    if (buyNowVariantId) {
      const parsed = addToCartSchema.safeParse({
        variantId: buyNowVariantId,
        quantity,
      });

      if (!parsed.success) {
        return { success: false, message: "Invalid Buy Now selection." };
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
              price: true,
              salePrice: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                orderBy: { sortOrder: "asc" },
                select: { url: true },
              },
            },
          },
        },
      });

      if (!variant || !variant.product.isActive) {
        return { success: false, message: "This product is no longer available." };
      }

      if (variant.stock < parsed.data.quantity) {
        return { success: false, message: "There is not enough stock for that quantity." };
      }

      const currentPrice = getCurrentPrice(variant.product);
      const subtotal = currentPrice * parsed.data.quantity;

      const cart: CartData = {
        items: [
          {
            productId: variant.productId,
            variantId: variant.id,
            productName: variant.product.name,
            slug: variant.product.slug,
            image: variant.product.images[0]?.url ?? null,
            size: variant.size,
            colour: variant.colour,
            price: currentPrice.toFixed(2),
            quantity: parsed.data.quantity,
            stock: variant.stock,
          },
        ],
        itemCount: parsed.data.quantity,
        subtotal: subtotal.toFixed(2),
      };

      return { success: true, message: "Buy now item loaded.", cart };
    }

    const cart = await getUserCart(user.id);
    return { success: true, message: "Cart loaded.", cart };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, message: "Authentication required." };
    }
    console.error("Get cart action error:", error);
    return { success: false, message: "Unable to load the cart." };
  }
}

export async function addToCartAction(variantId: string, quantity: number): Promise<CartActionResult> {
  try {
    const user = await requireUser();

    const result = addToCartSchema.safeParse({ variantId, quantity });
    if (!result.success) {
      return { success: false, message: "Please provide valid cart details." };
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: result.data.variantId },
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
      return { success: false, message: "This product is no longer available." };
    }

    if (variant.stock <= 0) {
      return { success: false, message: "This item is out of stock." };
    }

    const cart = await getOrCreateCart(user.id);

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: result.data.variantId,
        },
      },
    });

    const newQuantity = (existingItem?.quantity ?? 0) + result.data.quantity;

    if (newQuantity > variant.stock) {
      return {
        success: false,
        message: `Only ${variant.stock} item${variant.stock === 1 ? "" : "s"} available.`,
      };
    }

    await prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: result.data.variantId,
        },
      },
      create: {
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        quantity: result.data.quantity,
      },
      update: {
        quantity: newQuantity,
        productId: variant.productId,
      },
    });

    revalidatePath("/cart");
    revalidatePath("/checkout");

    const updatedCart = await getUserCart(user.id);

    return {
      success: true,
      message: "Item added to cart.",
      cart: updatedCart,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, message: "Authentication required." };
    }
    console.error("Add to cart action error:", error);
    return { success: false, message: "Unable to add the item to your cart." };
  }
}

export async function updateCartItemQuantityAction(itemId: string, quantity: number): Promise<CartActionResult> {
  try {
    const user = await requireUser();

    const result = updateCartItemSchema.safeParse({ quantity });
    if (!result.success) {
      return { success: false, message: "Please provide a valid quantity." };
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: { select: { userId: true } },
        variant: {
          select: {
            stock: true,
            product: { select: { isActive: true } },
          },
        },
      },
    });

    if (!cartItem || cartItem.cart.userId !== user.id) {
      return { success: false, message: "Cart item not found." };
    }

    if (!cartItem.variant.product.isActive) {
      return { success: false, message: "This product is no longer available." };
    }

    if (result.data.quantity > cartItem.variant.stock) {
      return {
        success: false,
        message: `Only ${cartItem.variant.stock} item${cartItem.variant.stock === 1 ? "" : "s"} available.`,
      };
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: result.data.quantity },
    });

    revalidatePath("/cart");
    revalidatePath("/checkout");

    const updatedCart = await getUserCart(user.id);

    return {
      success: true,
      message: "Cart updated.",
      cart: updatedCart,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, message: "Authentication required." };
    }
    console.error("Update cart action error:", error);
    return { success: false, message: "Unable to update the cart." };
  }
}

export async function removeCartItemAction(itemId: string): Promise<CartActionResult> {
  try {
    const user = await requireUser();

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: { select: { userId: true } },
      },
    });

    if (!cartItem || cartItem.cart.userId !== user.id) {
      return { success: false, message: "Cart item not found." };
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    revalidatePath("/cart");
    revalidatePath("/checkout");

    const updatedCart = await getUserCart(user.id);

    return {
      success: true,
      message: "Item removed from cart.",
      cart: updatedCart,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, message: "Authentication required." };
    }
    console.error("Remove cart item action error:", error);
    return { success: false, message: "Unable to remove the item." };
  }
}

export async function syncGuestCartAction(items: Array<{ variantId: string; quantity: number }>): Promise<CartActionResult> {
  try {
    const user = await requireUser();

    const result = syncCartSchema.safeParse({ items });
    if (!result.success) {
      return { success: false, message: "Invalid cart data." };
    }

    const cart = await getOrCreateCart(user.id);
    const skippedVariantIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of result.data.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            product: { select: { isActive: true } },
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

    revalidatePath("/cart");
    revalidatePath("/checkout");

    const cartData = await getUserCart(user.id);

    return {
      success: true,
      message: "Cart synchronized.",
      cart: cartData,
      skippedVariantIds,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, message: "Authentication required." };
    }
    console.error("Sync cart action error:", error);
    return { success: false, message: "Unable to synchronize the cart." };
  }
}
