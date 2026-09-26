import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Ticket,
  Users,
  ArrowLeft,
  ShieldCheck,
  MessageSquareText,
} from "lucide-react";
import NotificationBell from "@/components/layout/NotificationBell";

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0">
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

        <nav className="p-4 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition"
          >
            <Package size={18} />
            Products & Variants
          </Link>

          <Link
            href="/admin/categories"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition"
          >
            <Layers size={18} />
            Categories
          </Link>

          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition"
          >
            <ShoppingBag size={18} />
            Orders
          </Link>

          <Link
            href="/admin/coupons"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition"
          >
            <Ticket size={18} />
            Coupons
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition"
          >
            <Users size={18} />
            Customers & Roles
          </Link>

          <Link
            href="/admin/reviews"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition"
          >
            <MessageSquareText size={18} />
            Product Reviews
          </Link>
        </nav>

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
