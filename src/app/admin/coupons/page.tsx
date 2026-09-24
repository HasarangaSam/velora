import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import CouponRowActions from "@/components/admin/CouponRowActions";
import { Ticket, Plus } from "lucide-react";

export default async function AdminCouponsPage() {
  await requireAdmin();

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { usages: true },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Promotions
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Coupons</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage promotional discount codes for your customers.
          </p>
        </div>

        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus size={16} />
          Create Coupon
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Ticket className="mx-auto text-slate-300 mb-3" size={36} />
            <p className="font-semibold text-slate-700">No coupons found</p>
            <p className="text-xs text-slate-400 mt-1">
              Create your first promotional discount coupon.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Discount</th>
                  <th className="px-6 py-3.5">Min Order</th>
                  <th className="px-6 py-3.5">Usage / Limit</th>
                  <th className="px-6 py-3.5">Expires</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded text-xs border border-blue-100">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}% OFF`
                        : `LKR ${Number(coupon.discountValue).toLocaleString()} OFF`}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {coupon.minimumOrderValue
                        ? `LKR ${Number(coupon.minimumOrderValue).toLocaleString()}`
                        : "None"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {coupon.usedCount} used
                      {coupon.usageLimit !== null && ` / ${coupon.usageLimit}`}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coupon.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {coupon.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CouponRowActions
                        couponId={coupon.id}
                        currentStatus={coupon.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
