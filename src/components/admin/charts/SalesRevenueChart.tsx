"use client";

import { useMemo, useState } from "react";
import { TrendingUp, ShoppingBag, DollarSign } from "lucide-react";

export type DailyDataPoint = {
  date: string; // YYYY-MM-DD
  label: string; // "Sep 20"
  revenue: number;
  orders: number;
};

type SalesRevenueChartProps = {
  data30Days: DailyDataPoint[];
  data7Days: DailyDataPoint[];
};

export default function SalesRevenueChart({
  data30Days,
  data7Days,
}: SalesRevenueChartProps) {
  const [range, setRange] = useState<"7d" | "30d">("30d");
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const currentData = range === "7d" ? data7Days : data30Days;

  const { totalRevenue, totalOrders, avgRevenue, maxValue, points, pathD, areaD } = useMemo(() => {
    const totalRev = currentData.reduce((acc, d) => acc + d.revenue, 0);
    const totalOrd = currentData.reduce((acc, d) => acc + d.orders, 0);
    const avgRev = currentData.length ? totalRev / currentData.length : 0;

    const values = currentData.map((d) => (metric === "revenue" ? d.revenue : d.orders));
    const rawMax = Math.max(...values, 0);
    // Provide a sensible upper bound so flat 0 doesn't divide by zero
    const maxVal = rawMax === 0 ? (metric === "revenue" ? 10000 : 5) : rawMax * 1.15;

    // SVG coordinate space
    const width = 680;
    const height = 220;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 35;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const count = currentData.length;
    const stepX = count > 1 ? plotWidth / (count - 1) : plotWidth;

    const computedPoints = currentData.map((d, i) => {
      const val = metric === "revenue" ? d.revenue : d.orders;
      const x = paddingLeft + i * stepX;
      const y = paddingTop + plotHeight - (val / maxVal) * plotHeight;
      return { x, y, data: d };
    });

    let pD = "";
    let aD = "";

    if (computedPoints.length > 0) {
      pD = `M ${computedPoints[0].x} ${computedPoints[0].y}`;
      for (let i = 0; i < computedPoints.length - 1; i++) {
        const p0 = computedPoints[i];
        const p1 = computedPoints[i + 1];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp1y = p0.y;
        const cp2x = p0.x + (p1.x - p0.x) / 2;
        const cp2y = p1.y;
        pD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }

      const bottomY = paddingTop + plotHeight;
      const firstX = computedPoints[0].x;
      const lastX = computedPoints[computedPoints.length - 1].x;
      aD = `${pD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    }

    return {
      totalRevenue: totalRev,
      totalOrders: totalOrd,
      avgRevenue: avgRev,
      maxValue: maxVal,
      points: computedPoints,
      pathD: pD,
      areaD: aD,
    };
  }, [currentData, metric]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  // 4 horizontal gridlines
  const gridLines = [0, 0.33, 0.66, 1];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header with Title and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Revenue & Sales Trends</h2>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <TrendingUp size={12} className="mr-1" />
              Live Insights
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {range === "7d" ? "Performance over the past 7 days" : "Daily performance over the past 30 days"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMetric("revenue")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${
                metric === "revenue"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <DollarSign size={13} />
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setMetric("orders")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${
                metric === "orders"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag size={13} />
              Orders
            </button>
          </div>

          {/* Timeframe toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => { setRange("7d"); setHoverIndex(null); }}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                range === "7d"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => { setRange("30d"); setHoverIndex(null); }}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                range === "30d"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Summary Highlight Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4">
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            {range === "7d" ? "7-Day Total" : "30-Day Total"}
          </p>
          <p className="mt-0.5 text-lg font-bold text-slate-900">
            LKR {totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Orders Volume
          </p>
          <p className="mt-0.5 text-lg font-bold text-blue-600">
            {totalOrders} {totalOrders === 1 ? "order" : "orders"}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-lg bg-slate-50 border border-slate-100 p-3">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Daily Average
          </p>
          <p className="mt-0.5 text-lg font-bold text-emerald-600">
            LKR {avgRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Interactive SVG Area Chart */}
      <div className="relative mt-2 h-64 w-full select-none">
        <svg
          viewBox="0 0 680 220"
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {gridLines.map((ratio) => {
            const y = 20 + (1 - ratio) * 165;
            const val = ratio * maxValue;
            const label =
              metric === "revenue"
                ? val >= 1000
                  ? `${Math.round(val / 1000)}k`
                  : `${Math.round(val)}`
                : `${Math.round(val)}`;
            return (
              <g key={ratio}>
                <line
                  x1="45"
                  y1={y}
                  x2="660"
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray={ratio === 0 ? "0" : "3 3"}
                />
                <text
                  x="40"
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* X-axis date labels */}
          {points.map((pt, i) => {
            // Show label every N items depending on count
            const interval = range === "7d" ? 1 : Math.ceil(points.length / 7);
            const isVisible = i % interval === 0 || i === points.length - 1;
            if (!isVisible) return null;
            return (
              <text
                key={i}
                x={pt.x}
                y="205"
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-medium"
              >
                {pt.data.label}
              </text>
            );
          })}

          {/* Area Fill */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#salesGradient)"
              className="transition-all duration-300 ease-out"
            />
          )}

          {/* Main Stroke Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#strokeGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300 ease-out"
            />
          )}

          {/* Active Hover Crosshair Line & Point */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1="20"
                x2={activePoint.x}
                y2="185"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="7"
                fill="#3b82f6"
                fillOpacity="0.25"
                className="animate-ping"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* Invisible hover trigger columns */}
          {points.map((pt, i) => {
            const colWidth = 680 / points.length;
            const x = pt.x - colWidth / 2;
            return (
              <rect
                key={i}
                x={Math.max(0, x)}
                y="0"
                width={colWidth}
                height="220"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseMove={() => setHoverIndex(i)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip Box */}
        {activePoint && (
          <div
            className="pointer-events-none absolute z-20 transform -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm transition-all"
            style={{
              left: `${(activePoint.x / 680) * 100}%`,
              top: `${Math.max(10, (activePoint.y / 220) * 100 - 8)}%`,
            }}
          >
            <p className="font-semibold text-slate-800">{activePoint.data.label}</p>
            <div className="mt-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span className="text-slate-500">Revenue:</span>
                <span className="font-bold text-slate-900">
                  LKR {activePoint.data.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-slate-500">Orders:</span>
                <span className="font-bold text-slate-900">
                  {activePoint.data.orders}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
