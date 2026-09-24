import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { OrderStatus } from "@/generated/prisma/enums";

type OrdersPageProps = {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
};

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  await requireAdmin();

  const { status, search } = await searchParams;

  const validStatus =
    status && Object.values(OrderStatus).includes(status as OrderStatus)
      ? (status as OrderStatus)
      : undefined;

  const orders = await prisma.order.findMany({
    where: {
      ...(validStatus ? { status: validStatus } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: "insensitive" } },
              { shippingFullName: { contains: search, mode: "insensitive" } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
      items: true,
      payment: true,
    },
  });

  const statuses = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Fulfillment
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer orders, track payments, and update delivery status.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {statuses.map((s) => {
          const isActive =
            (s === "ALL" && !status) || status === s;
          const href =
            s === "ALL" ? "/admin/orders" : `/admin/orders?status=${s}`;
          return (
            <Link
              key={s}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s}
            </Link>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No orders found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">Order Number</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Total</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Order Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const itemCount = order.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  );

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900 text-xs">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {order.shippingFullName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.user.email}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        LKR {Number(order.total).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700"
                              : order.paymentStatus === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === "CONFIRMED" || order.status === "DELIVERED"
                              ? "bg-blue-50 text-blue-700"
                              : order.status === "PROCESSING" || order.status === "SHIPPED"
                              ? "bg-indigo-50 text-indigo-700"
                              : order.status === "CANCELLED"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
