"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";
import { notifyAdmins } from "@/lib/notifications";

export type ProductReviewActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

const emptyState: ProductReviewActionState = { success: false, message: "" };

export async function saveProductReview(
  productId: string,
  _previous: ProductReviewActionState,
  formData: FormData,
): Promise<ProductReviewActionState> {
  try {
    const user = await requireUser();
    const parsed = z.object({
      rating: z.coerce.number().int().min(1, "Choose a star rating.").max(5),
      title: z.string().trim().min(3, "Add a short review title.").max(80),
      comment: z.string().trim().min(15, "Write at least 15 characters.").max(1500),
    }).safeParse({
      rating: formData.get("rating"),
      title: formData.get("title"),
      comment: formData.get("comment"),
    });

    if (!parsed.success) {
      return { ...emptyState, message: "Please review the highlighted fields.", errors: parsed.error.flatten().fieldErrors };
    }

    const [product, purchase] = await Promise.all([
      prisma.product.findFirst({ where: { id: productId, isActive: true }, select: { id: true, slug: true, name: true } }),
      prisma.orderItem.findFirst({
        where: {
          productId,
          order: { userId: user.id, paymentStatus: "PAID", status: { not: "CANCELLED" } },
        },
        select: { id: true },
      }),
    ]);

    if (!product) return { ...emptyState, message: "This product is no longer available for review." };
    if (!purchase) return { ...emptyState, message: "Only customers with a paid order for this product can leave a review." };

    const existing = await prisma.productReview.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
      select: { id: true },
    });

    await prisma.productReview.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: {
        userId: user.id,
        productId,
        rating: parsed.data.rating,
        title: parsed.data.title,
        comment: parsed.data.comment,
        status: "PENDING",
        verifiedPurchase: true,
      },
      update: {
        rating: parsed.data.rating,
        title: parsed.data.title,
        comment: parsed.data.comment,
        status: "PENDING",
        verifiedPurchase: true,
      },
    });

    if (!existing) {
      try {
        await notifyAdmins({
          title: "New product review",
          message: `A customer reviewed ${product.name}.`,
          href: "/admin/reviews",
        });
      } catch (notificationError) {
        console.error("Could not create new-review admin notification:", notificationError);
      }
    }

    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/account/reviews");
    revalidatePath("/admin/reviews");
    return {
      success: true,
      message: existing ? "Your update was sent for approval." : "Your review was submitted for approval.",
    };
  } catch (error) {
    console.error("Save product review error:", error);
    return { ...emptyState, message: "Unable to save your review. Please try again." };
  }
}

export async function deleteProductReview(reviewId: string): Promise<ProductReviewActionState> {
  try {
    const user = await requireUser();
    const parsedId = z.string().min(1).max(100).safeParse(reviewId);
    if (!parsedId.success) return { ...emptyState, message: "Invalid review." };

    const review = await prisma.productReview.findFirst({
      where: { id: parsedId.data, userId: user.id },
      select: { product: { select: { slug: true } } },
    });
    if (!review) return { ...emptyState, message: "Review not found." };

    await prisma.productReview.delete({ where: { id: parsedId.data } });
    revalidatePath(`/products/${review.product.slug}`);
    revalidatePath("/account/reviews");
    revalidatePath("/admin/reviews");
    return { success: true, message: "Review deleted." };
  } catch (error) {
    console.error("Delete product review error:", error);
    return { ...emptyState, message: "Unable to delete your review." };
  }
}
