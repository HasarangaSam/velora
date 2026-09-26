import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import QuickProcessButton from "@/components/admin/QuickProcessButton";

export type ConfirmedOrderItem = {
  id: string;
  orderNumber: string;
  createdAt: string; // ISO string
  total: number;
  itemCount: number;
  shippingFullName: string;
  shippingCity: string;
  customerEmail: string;
};

type OrdersAwaitingProcessingQueueProps = {
  orders: ConfirmedOrderItem[];
  totalConfirmedCount: number;
};

function getOrderAge(createdAtStr: string) {
  const diffMs = Date.now() - new Date(createdAtStr).getTime();
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
    text: `${diffDays}d waiting`,
    isUrgent: true,
  };
}

export default function OrdersAwaitingProcessingQueue({
  orders,
  totalConfirmedCount,
}: OrdersAwaitingProcessingQueueProps) {
  if (totalConfirmedCount === 0) {
    return (
      <div className="flex items-center gap-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-emerald-900 shadow-xs">
        <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Fulfillment Queue is Clear</p>
          <p className="text-xs text-emerald-700">
            No confirmed orders are currently waiting for processing.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
        >
          View all orders
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-5 shadow-sm">
      {/* Alert Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-200/70 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-amber-950">
                Action Required: {totalConfirmedCount}{" "}
                {totalConfirmedCount === 1 ? "Order" : "Orders"} Awaiting Processing
              </h2>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
                Confirmed & Paid
              </span>
            </div>
            <p className="text-xs text-amber-800/90 mt-0.5">
              These customer orders have been verified and require packaging & fulfillment.
            </p>
          </div>
        </div>

        <Link
          href="/admin/orders?status=CONFIRMED"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-700 transition"
        >
          View All ({totalConfirmedCount}) <ArrowRight size={14} />
        </Link>
      </div>

      {/* Quick Queue Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {orders.map((order) => {
          const age = getOrderAge(order.createdAt);
          return (
            <div
              key={order.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-amber-300 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {order.orderNumber}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      age.isUrgent
                        ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Clock size={11} />
                    {age.text}
                  </span>
                </div>

                <div className="mt-2.5">
                  <p className="text-sm font-semibold text-slate-800">
                    {order.shippingFullName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {order.shippingCity} · {order.customerEmail}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
                  <span>{order.itemCount} {order.itemCount === 1 ? "item" : "items"}</span>
                  <span className="font-bold text-slate-900">
                    LKR {order.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="text-xs font-semibold text-slate-600 hover:text-blue-600"
                >
                  View Details
                </Link>
                <QuickProcessButton
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  size="sm"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
