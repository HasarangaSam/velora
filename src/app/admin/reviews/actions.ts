"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";

export async function moderateProductReview(reviewId: string, nextStatus: "APPROVED" | "REJECTED") {
  try {
    await requireAdmin();
    const input = z.object({
      reviewId: z.string().min(1).max(100),
      status: z.enum(["APPROVED", "REJECTED"]),
    }).safeParse({ reviewId, status: nextStatus });
    if (!input.success) return { success: false, message: "Invalid review action." };

    const review = await prisma.productReview.findUnique({
      where: { id: input.data.reviewId },
      select: {
        id: true,
        productId: true,
        product: { select: { name: true, slug: true } },
      },
    });
    if (!review) return { success: false, message: "Review not found." };

    await prisma.productReview.update({
      where: { id: review.id },
      data: { status: input.data.status },
    });

    try {
      await prisma.notification.updateMany({
        where: {
          readAt: null,
          OR: [
            { href: { contains: review.id } },
            {
              href: { startsWith: "/admin/reviews" },
              message: { contains: review.product.name },
            },
          ],
        },
        data: { readAt: new Date() },
      });

      const remainingPending = await prisma.productReview.count({
        where: { status: "PENDING" },
      });
      if (remainingPending === 0) {
        await prisma.notification.updateMany({
          where: {
            readAt: null,
            href: { startsWith: "/admin/reviews" },
          },
          data: { readAt: new Date() },
        });
      }
    } catch (notifError) {
      console.error("Could not mark review notifications as read:", notifError);
    }

    revalidatePath("/admin/reviews");
    revalidatePath("/account/reviews");
    revalidatePath(`/products/${review.product.slug}`);
    return { success: true, message: `Review ${input.data.status.toLowerCase()}.` };
  } catch (error) {
    console.error("Moderate product review error:", error);
    return { success: false, message: "Unable to update the review." };
  }
}

export async function deleteProductReviewByAdmin(reviewId: string) {
  try {
    await requireAdmin();
    const input = z.object({
      reviewId: z.string().min(1).max(100),
    }).safeParse({ reviewId });
    if (!input.success) return { success: false, message: "Invalid review ID." };

    const review = await prisma.productReview.findUnique({
      where: { id: input.data.reviewId },
      select: {
        id: true,
        product: { select: { slug: true } },
      },
    });
    if (!review) return { success: false, message: "Review not found." };

    await prisma.productReview.delete({
      where: { id: review.id },
    });

    try {
      await prisma.notification.updateMany({
        where: {
          readAt: null,
          OR: [
            { href: { contains: review.id } },
          ],
        },
        data: { readAt: new Date() },
      });

      const remainingPending = await prisma.productReview.count({
        where: { status: "PENDING" },
      });
      if (remainingPending === 0) {
        await prisma.notification.updateMany({
          where: {
            readAt: null,
            href: { startsWith: "/admin/reviews" },
          },
          data: { readAt: new Date() },
        });
      }
    } catch (notifErr) {
      console.error("Could not clean up notifications on review delete:", notifErr);
    }

    revalidatePath("/admin/reviews");
    revalidatePath("/account/reviews");
    revalidatePath(`/products/${review.product.slug}`);
    return { success: true, message: "Review deleted successfully." };
  } catch (error) {
    console.error("Delete review error:", error);
    return { success: false, message: "Unable to delete review." };
  }
}
