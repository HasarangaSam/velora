import { prisma } from "@/lib/db/prisma";

export async function getProductReviewData(productId: string, userId?: string) {
  const [reviews, aggregate, distribution, canReview, currentReview] = await Promise.all([
    prisma.productReview.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        verifiedPurchase: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.productReview.aggregate({
      where: { productId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.productReview.groupBy({
      by: ["rating"],
      where: { productId, status: "APPROVED" },
      _count: { rating: true },
    }),
    userId
      ? prisma.orderItem.findFirst({
          where: {
            productId,
            order: { userId, paymentStatus: "PAID", status: { not: "CANCELLED" } },
          },
          select: { id: true },
        })
      : null,
    userId
      ? prisma.productReview.findUnique({
          where: { userId_productId: { userId, productId } },
          select: { id: true, rating: true, title: true, comment: true, status: true, updatedAt: true },
        })
      : null,
  ]);

  return {
    reviews,
    average: aggregate._avg.rating ?? 0,
    count: aggregate._count._all,
    distribution: Object.fromEntries(distribution.map((entry) => [entry.rating, entry._count.rating])) as Record<number, number>,
    canReview: Boolean(canReview),
    currentReview,
  };
}
