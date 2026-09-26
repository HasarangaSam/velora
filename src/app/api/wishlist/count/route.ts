import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }

  const count = await prisma.wishlistItem.count({
    where: { userId: session.user.id, product: { isActive: true } },
  });

  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
