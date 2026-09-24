import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import AdminUserForm from "@/components/admin/AdminUserForm";

export default async function EditAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      _count: { select: { orders: true } },
    },
  });
  if (!user) notFound();

  return (
    <AdminUserForm
      user={{ ...user, orderCount: user._count.orders }}
      isSelf={admin.id === user.id}
    />
  );
}
