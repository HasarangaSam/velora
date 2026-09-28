"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Ticket,
  Users,
  MessageSquareText,
} from "lucide-react";

type SidebarCounts = {
  orders: number;
  reviews: number;
};

const COUNT_REFRESH_INTERVAL = 15_000;

export default function AdminSidebarNavigation({
  initialCounts,
}: {
  initialCounts: SidebarCounts;
}) {
  const [counts, setCounts] = useState(initialCounts);

  const refreshCounts = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/admin/sidebar-counts", {
        cache: "no-store",
        signal,
      });
      if (!response.ok) return;

      const data: unknown = await response.json();
      if (
        typeof data !== "object" || data === null ||
        !("orders" in data) || !("reviews" in data)
      ) return;

      const { orders, reviews } = data;
      if (
        typeof orders !== "number" || typeof reviews !== "number" ||
        !Number.isSafeInteger(orders) || !Number.isSafeInteger(reviews) ||
        orders < 0 || reviews < 0
      ) return;

      setCounts((current) =>
        current.orders === orders && current.reviews === reviews
          ? current
          : { orders, reviews },
      );
    } catch {
      // Keep the last known server counts if a background refresh fails.
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initialRefresh = window.setTimeout(
      () => void refreshCounts(controller.signal),
      0,
    );
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshCounts(controller.signal);
      }
    }, COUNT_REFRESH_INTERVAL);
    const handleFocus = () => void refreshCounts(controller.signal);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshCounts(controller.signal);
      }
    };
    const handleAdminRefresh = () => void refreshCounts(controller.signal);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("notifications:refresh", handleAdminRefresh);

    return () => {
      controller.abort();
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("notifications:refresh", handleAdminRefresh);
    };
  }, [refreshCounts]);

  return (
    <nav className="space-y-1 p-4" aria-label="Admin navigation">
      <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600">
        <LayoutDashboard size={18} />
        Dashboard
      </Link>

      <Link href="/admin/products" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600">
        <Package size={18} />
        Products &amp; Variants
      </Link>

      <Link href="/admin/categories" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600">
        <Layers size={18} />
        Categories
      </Link>

      <Link href="/admin/orders" className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600">
        <span className="flex items-center gap-3"><ShoppingBag size={18} />Orders</span>
        {counts.orders > 0 && (
          <span title={`${counts.orders} confirmed orders awaiting processing`} className="inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
            {counts.orders > 99 ? "99+" : counts.orders}
          </span>
        )}
      </Link>

      <Link href="/admin/coupons" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600">
        <Ticket size={18} />
        Coupons
      </Link>

      <Link href="/admin/users" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600">
        <Users size={18} />
        User Management
      </Link>

      <Link href="/admin/reviews" className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600">
        <span className="flex items-center gap-3"><MessageSquareText size={18} />Product Reviews</span>
        {counts.reviews > 0 && (
          <span title={`${counts.reviews} reviews awaiting moderation`} className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
            {counts.reviews > 99 ? "99+" : counts.reviews}
          </span>
        )}
      </Link>
    </nav>
  );
}
