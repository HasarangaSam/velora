import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { OrderStatus } from "@/generated/prisma/enums";
import { Clock } from "lucide-react";
import QuickProcessButton from "@/components/admin/QuickProcessButton";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;

function getOrderAge(createdAt: Date) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return {
      text: `${Math.max(1, diffMins)}m ago`,
      isUrgent: false,
    };
  }
  if (diffHours < 24) {
    return {
      text: `${diffHours}h ago`,
      isUrgent: diffHours >= 12,
    };
  }
  return {
    text: `${diffDays}d ago`,
    isUrgent: true,
  };
}

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const getValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const requestedStatus = getValue(params.status);
  const search = (getValue(params.search) ?? "").trim().slice(0, 100);
  const requestedPage = Number.parseInt(getValue(params.page) ?? "1", 10);
  const safeRequestedPage = Number.isFinite(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;

  const validStatus =
    requestedStatus && Object.values(OrderStatus).includes(requestedStatus as OrderStatus)
      ? (requestedStatus as OrderStatus)
      : undefined;

  const where = {
    ...(validStatus ? { status: validStatus } : {}),
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" as const } },
            { shippingFullName: { contains: search, mode: "insensitive" as const } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [totalOrders, orders, statusCountsRaw] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safeRequestedPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: true,
        payment: true,
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));
  const page = Math.min(safeRequestedPage, totalPages);

  const countMap = new Map(statusCountsRaw.map((s) => [s.status, s._count._all]));
  const allOrdersCount = statusCountsRaw.reduce((sum, s) => sum + s._count._all, 0);
  const confirmedUnprocessedCount = countMap.get("CONFIRMED") ?? 0;

  function pageHref(targetPage: number) {
    const nextParams = new URLSearchParams();
    if (validStatus) nextParams.set("status", validStatus);
    if (search) nextParams.set("search", search);
    if (targetPage > 1) nextParams.set("page", String(targetPage));
    const query = nextParams.toString();
    return `/admin/orders${query ? `?${query}` : ""}`;
  }

  const tabs = [
    { key: "ALL", label: "All Orders", count: allOrdersCount, isNeedsProcessing: false },
    { key: "CONFIRMED", label: "Needs Processing", count: confirmedUnprocessedCount, isNeedsProcessing: true },
    { key: "PROCESSING", label: "Processing", count: countMap.get("PROCESSING") ?? 0, isNeedsProcessing: false },
    { key: "SHIPPED", label: "Shipped", count: countMap.get("SHIPPED") ?? 0, isNeedsProcessing: false },
    { key: "DELIVERED", label: "Delivered", count: countMap.get("DELIVERED") ?? 0, isNeedsProcessing: false },
    { key: "PENDING", label: "Pending Payment", count: countMap.get("PENDING") ?? 0, isNeedsProcessing: false },
    { key: "CANCELLED", label: "Cancelled", count: countMap.get("CANCELLED") ?? 0, isNeedsProcessing: false },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Fulfillment
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer orders, track payments, and pack & dispatch orders.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => {
          const isActive = (tab.key === "ALL" && !validStatus) || validStatus === tab.key;
          const tabParams = new URLSearchParams();
          if (tab.key !== "ALL") tabParams.set("status", tab.key);
          if (search) tabParams.set("search", search);
          const tabQuery = tabParams.toString();
          const href = `/admin/orders${tabQuery ? `?${tabQuery}` : ""}`;

          return (
            <Link
              key={tab.key}
              href={href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isActive
                  ? tab.isNeedsProcessing
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-blue-600 text-white shadow-xs"
                  : tab.isNeedsProcessing && tab.count > 0
                  ? "bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : tab.isNeedsProcessing && tab.count > 0
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      <form action="/admin/orders" method="get" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        {validStatus && <input type="hidden" name="status" value={validStatus} />}
        <div className="flex-1">
          <label htmlFor="search" className="mb-1.5 block text-xs font-medium text-slate-600">Search orders by number or customer</label>
          <input id="search" name="search" type="search" defaultValue={search} placeholder="Order number, customer name, or email" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700">Search</button>
          <Link href={validStatus ? `/admin/orders?status=${validStatus}` : "/admin/orders"} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Clear</Link>
        </div>
      </form>

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
                  const isConfirmed = order.status === "CONFIRMED";
                  const age = getOrderAge(order.createdAt);

                  return (
                    <tr
                      key={order.id}
                      className={`transition ${
                        isConfirmed
                          ? "bg-amber-50/30 hover:bg-amber-50/60"
                          : "hover:bg-slate-50"
                      }`}
                    >
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
                        {isConfirmed ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                              <Clock size={11} className="text-amber-600 animate-pulse" />
                              Needs Processing
                            </span>
                            <p
                              className={`text-[11px] font-medium ${
                                age.isUrgent ? "text-rose-600 font-bold" : "text-slate-500"
                              }`}
                            >
                              Confirmed {age.text}
                            </p>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === "DELIVERED"
                                ? "bg-emerald-50 text-emerald-700"
                                : order.status === "PROCESSING" || order.status === "SHIPPED"
                                ? "bg-indigo-50 text-indigo-700"
                                : order.status === "CANCELLED"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isConfirmed && (
                            <QuickProcessButton
                              orderId={order.id}
                              orderNumber={order.orderNumber}
                              size="sm"
                            />
                          )}
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                          >
                            Details →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalOrders > 0 && (
        <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalOrders)} of {totalOrders} orders</p>
          <nav aria-label="Order list pagination" className="flex items-center gap-2">
            {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50">Previous</Link> : <span aria-disabled="true" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">Previous</span>}
            <span className="px-2">Page {page} of {totalPages}</span>
            {page < totalPages ? <Link href={pageHref(page + 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50">Next</Link> : <span aria-disabled="true" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">Next</span>}
          </nav>
        </div>
      )}
    </div>
  );
}
