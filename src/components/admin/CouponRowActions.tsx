"use client";

import { useState } from "react";
import { toggleCouponStatus, deleteCoupon } from "@/app/admin/coupons/actions";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";

export default function CouponRowActions({
  couponId,
  currentStatus,
}: {
  couponId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    await toggleCouponStatus(couponId, currentStatus);
    setLoading(false);
  }

  async function handleDelete() {
    if (loading) return;
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    setLoading(true);
    await deleteCoupon(couponId);
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={handleToggle}
        disabled={loading}
        title={currentStatus === "ACTIVE" ? "Deactivate" : "Activate"}
        className="text-slate-500 hover:text-blue-600 transition"
      >
        {currentStatus === "ACTIVE" ? (
          <ToggleRight size={22} className="text-emerald-600" />
        ) : (
          <ToggleLeft size={22} className="text-slate-400" />
        )}
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        title="Delete Coupon"
        className="text-slate-400 hover:text-rose-600 transition"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
