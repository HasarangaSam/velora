import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import NotificationBell from "@/components/layout/NotificationBell";
import LogoutButton from "@/components/auth/LogoutButton";
import AdminSidebarNavigation from "@/components/admin/AdminSidebarNavigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const [unprocessedOrdersCount, pendingReviewsCount] = await Promise.all([
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.productReview.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full flex-shrink-0 border-r border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:self-start md:overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-tight text-blue-600">
              VELORA
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={12} />
              ADMIN
            </span>
          </Link>
        </div>

        <AdminSidebarNavigation
          initialCounts={{ orders: unprocessedOrdersCount, reviews: pendingReviewsCount }}
        />

        <div className="p-4 border-t border-slate-100 mt-auto">
          <div className="mb-4 px-3 py-2 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 font-medium">Logged in as</p>
            <p className="text-xs font-semibold text-slate-800 truncate">
              {session.user.email}
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 font-medium transition"
          >
            <ArrowLeft size={16} />
            Return to Store
          </Link>

          <div className="mt-2">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="font-bold text-lg text-blue-600">Velora Admin</span>
          <div className="flex items-center gap-5">
            <NotificationBell />
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600"
            >
              Store Front
            </Link>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10">{children}</div>
      </div>
    </div>
  );
}
