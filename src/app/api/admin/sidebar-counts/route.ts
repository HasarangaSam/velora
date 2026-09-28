import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }

  const [orders, reviews] = await Promise.all([
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.productReview.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json(
    { orders, reviews },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
