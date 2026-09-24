"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/app/admin/orders/actions";
import { OrderStatus } from "@/generated/prisma/enums";

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const statuses = Object.values(OrderStatus);

  async function handleUpdate(newStatus: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setStatus(newStatus);
        setMessage("Status updated successfully!");
      } else {
        setMessage(res.message || "Failed to update.");
      }
    } catch {
      setMessage("Error updating status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
      <h3 className="font-semibold text-slate-900 text-sm">Update Order Status</h3>
      <p className="text-xs text-slate-500">
        Transition this order through its fulfillment lifecycle.
      </p>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => handleUpdate(s)}
            disabled={loading || status === s}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-60 ${
              status === s
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {message && (
        <p className="text-xs font-medium text-blue-600 animate-fade-in">
          {message}
        </p>
      )}
    </div>
  );
}
