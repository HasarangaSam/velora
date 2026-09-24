import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Sign in required." }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientUserId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, message: true, href: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { recipientUserId: session.user.id, readAt: null } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Sign in required." }, { status: 401 });

  let body: { id?: string; all?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const where = body.all
    ? { recipientUserId: session.user.id, readAt: null }
    : { id: body.id ?? "", recipientUserId: session.user.id, readAt: null };

  await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
  return NextResponse.json({ success: true });
}
