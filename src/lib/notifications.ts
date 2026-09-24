import { prisma } from "@/lib/db/prisma";

type NotificationInput = { title: string; message: string; href: string };

export async function notifyUser(userId: string, notification: NotificationInput) {
  return prisma.notification.create({ data: { recipientUserId: userId, ...notification } });
}

export async function notifyAdmins(notification: NotificationInput) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!admins.length) return;
  await prisma.notification.createMany({
    data: admins.map(({ id }) => ({ recipientUserId: id, ...notification })),
  });
}
