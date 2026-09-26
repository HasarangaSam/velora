"use client";

import { Layers, ArrowRight } from "lucide-react";
import Link from "next/link";

export type CategorySalesStat = {
  name: string;
  itemCount: number;
  revenue: number;
};

type CategoryPerformanceChartProps = {
  categories: CategorySalesStat[];
  totalRevenue: number;
};

const BAR_COLORS = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-600",
];

export default function CategoryPerformanceChart({
  categories,
  totalRevenue,
}: CategoryPerformanceChartProps) {
  const maxRevenue = Math.max(...categories.map((c) => c.revenue), 1);

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Category Sales</h2>
          <p className="mt-0.5 text-xs text-slate-500">Revenue contribution by category</p>
        </div>
        <Link
          href="/admin/categories"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Categories <ArrowRight size={13} />
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="my-auto flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <Layers className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-600">No category sales recorded</p>
          <p className="mt-1 text-xs text-slate-400">Completed orders will reflect category performance here.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {categories.map((cat, idx) => {
            const pctOfMax = Math.min(100, Math.round((cat.revenue / maxRevenue) * 100));
            const pctOfTotal = totalRevenue > 0 ? Math.round((cat.revenue / totalRevenue) * 100) : 0;
            const barColor = BAR_COLORS[idx % BAR_COLORS.length];

            return (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <span className="truncate font-semibold text-slate-800">{cat.name}</span>
                    <span className="text-[11px] text-slate-400">({cat.itemCount} items)</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-bold text-slate-900">
                      LKR {cat.revenue.toLocaleString()}
                    </span>
                    <span className="w-10 text-[11px] font-medium text-slate-500">
                      {pctOfTotal}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                    style={{ width: `${Math.max(4, pctOfMax)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
