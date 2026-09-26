"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";

export type WishlistActionResult = {
  success: boolean;
  isSaved: boolean;
  message: string;
  count?: number;
};

export async function setWishlistItem(productId: string, isSaved: boolean): Promise<WishlistActionResult> {
  try {
    const user = await requireUser();
    const parsed = z.object({ productId: z.string().min(1).max(100), isSaved: z.boolean() }).safeParse({ productId, isSaved });
    if (!parsed.success) return { success: false, isSaved: false, message: "Invalid wishlist request." };

    if (parsed.data.isSaved) {
      const product = await prisma.product.findFirst({
        where: { id: parsed.data.productId, isActive: true },
        select: { id: true },
      });
      if (!product) return { success: false, isSaved: false, message: "This product is no longer available." };

      await prisma.wishlistItem.upsert({
        where: { userId_productId: { userId: user.id, productId: product.id } },
        create: { userId: user.id, productId: product.id },
        update: {},
      });
    } else {
      await prisma.wishlistItem.deleteMany({
        where: { userId: user.id, productId: parsed.data.productId },
      });
    }

    revalidatePath("/account/wishlist");
    revalidatePath("/account");
    revalidatePath("/shop");
    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId }, select: { slug: true } });
    if (product) revalidatePath(`/products/${product.slug}`);

    const count = await prisma.wishlistItem.count({
      where: { userId: user.id, product: { isActive: true } },
    });

    return { success: true, isSaved: parsed.data.isSaved, count, message: parsed.data.isSaved ? "Saved to your wishlist." : "Removed from your wishlist." };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, isSaved: !isSaved, message: "Sign in to save items to your wishlist." };
    }
    console.error("Update wishlist error:", error);
    return { success: false, isSaved: !isSaved, message: "Unable to update your wishlist. Please try again." };
  }
}
