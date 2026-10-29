"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export type AdminSidebarCounts = {
  orders: number;
  reviews: number;
};

export async function getAdminSidebarCountsAction(): Promise<AdminSidebarCounts | null> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return null;
    }

    const [orders, reviews] = await Promise.all([
      prisma.order.count({ where: { status: "CONFIRMED" } }),
      prisma.productReview.count({ where: { status: "PENDING" } }),
    ]);

    return { orders, reviews };
  } catch {
    return null;
  }
}
