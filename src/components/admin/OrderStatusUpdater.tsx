"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateOrderStatusAction,
  type OrderActionState,
} from "@/app/admin/orders/actions";
import { OrderStatus } from "@/generated/prisma/enums";

function StatusButton({
  targetStatus,
  currentStatus,
}: {
  targetStatus: string;
  currentStatus: string;
}) {
  const { pending } = useFormStatus();
  const isActive = currentStatus === targetStatus;

  return (
    <button
      type="submit"
      name="status"
      value={targetStatus}
      disabled={pending || isActive}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-60 ${
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
      }`}
    >
      {targetStatus}
    </button>
  );
}

const initialState: OrderActionState = {
  success: false,
  message: "",
};

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const updateWithId = updateOrderStatusAction.bind(null, orderId);
  const [state, formAction] = useActionState(updateWithId, {
    ...initialState,
    currentStatus,
  });

  const activeStatus = state.currentStatus ?? currentStatus;
  const statuses = Object.values(OrderStatus);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
      <h3 className="font-semibold text-slate-900 text-sm">
        Update Order Status
      </h3>
      <p className="text-xs text-slate-500">
        Transition this order through its fulfillment lifecycle.
      </p>

      <form action={formAction} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <StatusButton
              key={s}
              targetStatus={s}
              currentStatus={activeStatus}
            />
          ))}
        </div>

        {state.message && (
          <p
            className={`text-xs font-medium animate-fade-in ${
              state.success ? "text-blue-600" : "text-red-600"
            }`}
          >
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}
