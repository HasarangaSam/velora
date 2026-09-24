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
      select: { id: true, product: { select: { slug: true } } },
    });
    if (!review) return { success: false, message: "Review not found." };

    const updated = await prisma.productReview.updateMany({
      where: { id: review.id, status: "PENDING" },
      data: { status: input.data.status },
    });
    if (updated.count === 0) return { success: false, message: "This review has already been moderated." };
    revalidatePath("/admin/reviews");
    revalidatePath("/account/reviews");
    revalidatePath(`/products/${review.product.slug}`);
    return { success: true, message: `Review ${input.data.status.toLowerCase()}.` };
  } catch (error) {
    console.error("Moderate product review error:", error);
    return { success: false, message: "Unable to update the review." };
  }
}
