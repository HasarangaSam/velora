import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { ArrowLeft, Package, CreditCard } from "lucide-react";

export default async function CustomerOrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      payment: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-2"
          >
            <ArrowLeft size={14} /> Back to account
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            My Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Check the history of your orders and fulfillment progress.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-800 text-base">
                No orders placed yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Explore our catalog to find styles you love.
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                Start Shopping
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
                    className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 text-sm">
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

                      <p className="text-xs text-slate-500">
                        Date:{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })}{" "}
                        • {totalItems} {totalItems === 1 ? "item" : "items"}
                      </p>

                      <p className="text-xs text-slate-600 line-clamp-1">
                        {order.items.map((i) => `${i.name} (${i.size})`).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Total</span>
                        <span className="font-bold text-slate-900 text-sm">
                          LKR {Number(order.total).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.paymentStatus === "PENDING" && (
                          <Link
                            href={`/checkout/payment?orderId=${order.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                          >
                            <CreditCard size={13} />
                            Pay Now
                          </Link>
                        )}

                        <Link
                          href={`/account/orders/${order.id}`}
                          className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Details
                        </Link>
                      </div>
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
