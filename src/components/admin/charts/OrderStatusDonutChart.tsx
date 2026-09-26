"use client";

import { useState } from "react";
import { PackageCheck } from "lucide-react";

export type OrderStatusCount = {
  status: string;
  count: number;
};

type OrderStatusDonutChartProps = {
  statusCounts: OrderStatusCount[];
  totalOrders: number;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; hoverColor: string; bg: string }
> = {
  DELIVERED: {
    label: "Delivered",
    color: "#10b981", // emerald-500
    hoverColor: "#059669",
    bg: "bg-emerald-500",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "#3b82f6", // blue-500
    hoverColor: "#2563eb",
    bg: "bg-blue-500",
  },
  PROCESSING: {
    label: "Processing",
    color: "#8b5cf6", // violet-500
    hoverColor: "#7c3aed",
    bg: "bg-violet-500",
  },
  SHIPPED: {
    label: "Shipped",
    color: "#06b6d4", // cyan-500
    hoverColor: "#0891b2",
    bg: "bg-cyan-500",
  },
  PENDING: {
    label: "Pending",
    color: "#f59e0b", // amber-500
    hoverColor: "#d97706",
    bg: "bg-amber-500",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#94a3b8", // slate-400
    hoverColor: "#64748b",
    bg: "bg-slate-400",
  },
};

export default function OrderStatusDonutChart({
  statusCounts,
  totalOrders,
}: OrderStatusDonutChartProps) {
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  const radius = 62;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius; // ~389.55

  // Filter only statuses that have at least 1 order, or fallback to an empty ring if 0
  const activeStatuses = statusCounts.filter((item) => item.count > 0);

  let cumulativeOffset = 0;
  const segments = activeStatuses.map((item) => {
    const fraction = totalOrders > 0 ? item.count / totalOrders : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += fraction * circumference;

    const config = STATUS_CONFIG[item.status] ?? {
      label: item.status,
      color: "#64748b",
      hoverColor: "#475569",
      bg: "bg-slate-500",
    };

    return {
      ...item,
      fraction,
      strokeDasharray,
      strokeDashoffset,
      config,
    };
  });

  const activeSegment = hoveredStatus
    ? segments.find((s) => s.status === hoveredStatus)
    : null;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Order Fulfillment</h2>
          <p className="mt-0.5 text-xs text-slate-500">Distribution across fulfillment stages</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <PackageCheck size={18} />
        </div>
      </div>

      {totalOrders === 0 ? (
        <div className="my-auto flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <p className="text-sm font-medium">No order data yet</p>
          <p className="mt-1 text-xs">New orders will populate this fulfillment breakdown.</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center">
          {/* Donut Chart SVG */}
          <div className="relative h-48 w-48">
            <svg
              className="h-full w-full -rotate-90 transform"
              viewBox="0 0 160 160"
            >
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
              />

              {/* Segments */}
              {segments.map((seg) => {
                const isHovered = hoveredStatus === seg.status;
                return (
                  <circle
                    key={seg.status}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={isHovered ? seg.config.hoverColor : seg.config.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    className="cursor-pointer transition-all duration-200 ease-out"
                    onMouseEnter={() => setHoveredStatus(seg.status)}
                    onMouseLeave={() => setHoveredStatus(null)}
                  />
                );
              })}
            </svg>

            {/* Centered Total / Active Label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              {activeSegment ? (
                <>
                  <span className="text-2xl font-extrabold text-slate-900">
                    {activeSegment.count}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {activeSegment.config.label}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {Math.round(activeSegment.fraction * 100)}% of total
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-extrabold text-slate-900">
                    {totalOrders}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Total Orders
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Legend Grid */}
          <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
            {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
              const item = statusCounts.find((s) => s.status === statusKey);
              const count = item?.count ?? 0;
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
              const isHovered = hoveredStatus === statusKey;

              return (
                <button
                  type="button"
                  key={statusKey}
                  onMouseEnter={() => setHoveredStatus(statusKey)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  className={`flex items-center justify-between rounded-lg p-2 text-left transition ${
                    isHovered ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="truncate text-xs font-medium text-slate-700">
                      {config.label}
                    </span>
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <span className="text-xs font-bold text-slate-900">{count}</span>
                    <span className="ml-1 text-[10px] text-slate-400">({pct}%)</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
