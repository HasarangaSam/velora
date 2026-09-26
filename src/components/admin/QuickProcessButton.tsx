"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, PackageCheck } from "lucide-react";
import { updateOrderStatus } from "@/app/admin/orders/actions";

type QuickProcessButtonProps = {
  orderId: string;
  orderNumber: string;
  size?: "sm" | "default";
};

export default function QuickProcessButton({
  orderId,
  orderNumber,
  size = "default",
}: QuickProcessButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleStartProcessing() {
    if (pending) return;
    if (
      !window.confirm(
        `Start processing order #${orderNumber}? This will mark it as PROCESSING and notify the customer.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await updateOrderStatus(orderId, "PROCESSING");
      if (!res.success) {
        window.alert(res.message);
      } else {
        window.dispatchEvent(new CustomEvent("notifications:refresh"));
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleStartProcessing}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition ${
        size === "sm"
          ? "bg-amber-500 hover:bg-amber-600 px-2.5 py-1 text-xs text-white shadow-xs"
          : "bg-amber-500 hover:bg-amber-600 px-3.5 py-2 text-xs text-white shadow-sm"
      } disabled:opacity-60`}
      title="Mark as PROCESSING"
    >
      {pending ? (
        <LoaderCircle size={13} className="animate-spin" />
      ) : (
        <PackageCheck size={14} />
      )}
      <span>Start Processing</span>
    </button>
  );
}
