"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export type NotificationItemData = {
  id: string;
  title: string;
  message: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsResult = {
  success: boolean;
  notifications: NotificationItemData[];
  unreadCount: number;
};

export async function getUserNotificationsAction(): Promise<NotificationsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, notifications: [], unreadCount: 0 };
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientUserId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          message: true,
          href: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { recipientUserId: session.user.id, readAt: null },
      }),
    ]);

    return {
      success: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        href: n.href,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  } catch (error) {
    console.error("Get notifications error:", error);
    return { success: false, notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationsReadAction(
  id?: string,
  all?: boolean,
): Promise<{ success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    const where = all
      ? { recipientUserId: session.user.id, readAt: null }
      : { id: id ?? "", recipientUserId: session.user.id, readAt: null };

    await prisma.notification.updateMany({
      where,
      data: { readAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return { success: false };
  }
}
