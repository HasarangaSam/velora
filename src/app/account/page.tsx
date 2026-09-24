import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  ShoppingBag,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Package,
  UserRound,
  Heart,
  MessageSquareText,
} from "lucide-react";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }

  const [orders, addressCount, wishlistCount, reviewCount] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    }),
    prisma.address.count({
      where: { userId: session.user.id },
    }),
    prisma.wishlistItem.count({ where: { userId: session.user.id, product: { isActive: true } } }),
    prisma.productReview.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Customer Account
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Welcome, {session.user.name ?? "Customer"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{session.user.email}</p>
          </div>

          <div className="flex items-center gap-3">
            {session.user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200 hover:bg-blue-100 transition"
              >
                <ShieldCheck size={15} />
                Admin Panel
              </Link>
            )}

            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              Shop Apparel <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/account/profile"
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-stone-400 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
                <UserRound size={20} />
              </div>
              <span className="text-xs font-semibold text-stone-600 transition-transform group-hover:translate-x-1">Edit →</span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Profile & security</h2>
            <p className="mt-1 text-xs text-slate-500">Update your name, change your password, or close your account.</p>
          </Link>

          <Link
            href="/account/reviews"
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><MessageSquareText size={20} /></div>
              <span className="text-xs font-semibold text-blue-600 transition-transform group-hover:translate-x-1">Manage →</span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">My Reviews</h2>
            <p className="mt-1 text-xs text-slate-500">{reviewCount} {reviewCount === 1 ? "review" : "reviews"} shared with the community.</p>
          </Link>

          <Link
            href="/account/wishlist"
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-rose-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Heart size={20} />
              </div>
              <span className="text-xs font-semibold text-rose-600 transition-transform group-hover:translate-x-1">View →</span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">My Wishlist</h2>
            <p className="mt-1 text-xs text-slate-500">{wishlistCount} saved {wishlistCount === 1 ? "item" : "items"} to come back to.</p>
          </Link>

          <Link
            href="/account/orders"
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                View All →
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-4">My Orders</h2>
            <p className="text-xs text-slate-500 mt-1">
              You have placed {orders.length} orders. Track fulfillment and view invoices.
            </p>
          </Link>

          <Link
            href="/account/addresses"
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                Manage →
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-4">Saved Addresses</h2>
            <p className="text-xs text-slate-500 mt-1">
              {addressCount} saved delivery addresses for faster checkout.
            </p>
          </Link>
        </div>

        {/* Recent Orders Section */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track your latest shipments and purchases
              </p>
            </div>
            <Link
              href="/account/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Order History <ArrowRight size={14} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <Package size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No orders yet</p>
              <p className="text-xs text-slate-400 mt-1">
                When you place an order, it will appear here.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
              >
                Browse Shop Now →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => {
                const totalItems = order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                );

                return (
                  <div
                    key={order.id}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            order.status === "CONFIRMED" || order.status === "DELIVERED"
                              ? "bg-blue-50 text-blue-700"
                              : order.status === "PROCESSING" || order.status === "SHIPPED"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Placed on{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        • {totalItems} {totalItems === 1 ? "item" : "items"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className="font-bold text-slate-900 text-sm">
                        LKR {Number(order.total).toLocaleString()}
                      </span>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
