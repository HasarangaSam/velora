"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setItems(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Notification polling is a convenience and must not interrupt shopping.
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 45_000);
    const handleFocus = () => void refresh();
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  async function markRead(id?: string) {
    setBusy(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { all: true }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function openNotification(item: NotificationItem) {
    if (!item.readAt) await markRead(item.id);
    setOpen(false);
    router.push(item.href);
  }

  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => { setOpen((value) => !value); if (!open) void refresh(); }}
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"} aria-expanded={open}
        className="relative rounded-full p-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950">
        <Bell size={20} strokeWidth={1.8} />
        {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-4 text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {open && (
        <section aria-label="Notifications" className="absolute right-0 z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
          <header className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <div><h2 className="text-sm font-semibold text-stone-900">Notifications</h2><p className="mt-0.5 text-xs text-stone-500">Recent account activity</p></div>
            {unreadCount > 0 && <button type="button" disabled={busy} onClick={() => void markRead()} className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-950 disabled:opacity-50"><CheckCheck size={14} /> Mark all read</button>}
          </header>
          {items.length ? <ul className="max-h-[25rem] overflow-y-auto">
            {items.map((item) => <li key={item.id}>
              <button type="button" onClick={() => void openNotification(item)} className={`flex w-full gap-3 border-b border-stone-100 px-4 py-3 text-left last:border-0 hover:bg-stone-50 ${item.readAt ? "" : "bg-blue-50/50"}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-transparent" : "bg-blue-600"}`} />
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-stone-900">{item.title}</span><span className="mt-0.5 block text-xs leading-5 text-stone-600">{item.message}</span><time className="mt-1 block text-[11px] text-stone-400">{new Date(item.createdAt).toLocaleString()}</time></span>
                {item.readAt && <Check size={14} className="mt-1 text-stone-300" />}
              </button>
            </li>)}
          </ul> : <p className="px-4 py-8 text-center text-sm text-stone-500">You’re all caught up.</p>}
        </section>
      )}
    </div>
  );
}
