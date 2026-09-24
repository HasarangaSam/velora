"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createCoupon, CouponActionState } from "@/app/admin/coupons/actions";
import { ArrowLeft, Ticket } from "lucide-react";

const initialState: CouponActionState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Creating Coupon..." : "Create Coupon"}
    </button>
  );
}

export default function CreateCouponForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createCoupon, initialState);

  useEffect(() => {
    if (state.success) {
      const timeout = setTimeout(() => {
        router.push("/admin/coupons");
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [state.success, router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/coupons"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-2"
        >
          <ArrowLeft size={14} /> Back to coupons
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Ticket className="text-blue-600" size={24} />
          Create Discount Coupon
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Set up a promotional code for customer cart discounts.
        </p>
      </div>

      <form
        action={formAction}
        className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6"
      >
        {state.message && (
          <div
            className={`p-4 rounded-lg text-sm font-medium ${
              state.success
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {state.message}
            {state.success && (
              <span className="block text-xs mt-1 text-emerald-600">
                Redirecting to coupons list...
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Coupon Code */}
          <div className="md:col-span-2">
            <label
              htmlFor="code"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Coupon Code *
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              placeholder="e.g. VELORA10, SUMMER500"
              className="w-full font-mono uppercase rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Discount Type */}
          <div>
            <label
              htmlFor="discountType"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Discount Type *
            </label>
            <select
              id="discountType"
              name="discountType"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (LKR)</option>
            </select>
          </div>

          {/* Discount Value */}
          <div>
            <label
              htmlFor="discountValue"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Discount Value *
            </label>
            <input
              id="discountValue"
              name="discountValue"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g. 10 for 10%, 500 for LKR 500"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Minimum Order Value */}
          <div>
            <label
              htmlFor="minimumOrderValue"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Min. Order Value (LKR)
            </label>
            <input
              id="minimumOrderValue"
              name="minimumOrderValue"
              type="number"
              step="0.01"
              min="0"
              placeholder="Optional, e.g. 3000"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Maximum Discount */}
          <div>
            <label
              htmlFor="maximumDiscount"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Max Discount Cap (LKR)
            </label>
            <input
              id="maximumDiscount"
              name="maximumDiscount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Optional, e.g. 2000"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Total Usage Limit */}
          <div>
            <label
              htmlFor="usageLimit"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Total Usage Limit
            </label>
            <input
              id="usageLimit"
              name="usageLimit"
              type="number"
              min="1"
              placeholder="Optional, e.g. 100 uses"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Per User Limit */}
          <div>
            <label
              htmlFor="perUserLimit"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Per User Limit
            </label>
            <input
              id="perUserLimit"
              name="perUserLimit"
              type="number"
              min="1"
              placeholder="Optional, default 1"
              defaultValue="1"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Expiration Date */}
          <div className="md:col-span-2">
            <label
              htmlFor="expiresAt"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Expiry Date
            </label>
            <input
              id="expiresAt"
              name="expiresAt"
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/admin/coupons"
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            Cancel
          </Link>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
