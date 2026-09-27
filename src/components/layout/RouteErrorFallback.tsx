"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function RouteErrorFallback({
  error,
  retry,
  title = "This page ran into a problem",
  homeHref = "/",
  homeLabel = "Return to the store",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
  homeHref?: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error("Route rendering error:", error);
  }, [error]);

  return (
    <main role="alert" className="flex min-h-[55vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700"><AlertTriangle size={25} aria-hidden="true" /></span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Your data is safe. Try loading this page again, or go back and continue browsing.</p>
        {error.digest && <p className="mt-3 font-mono text-xs text-slate-400">Reference: {error.digest}</p>}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={retry} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"><RefreshCw size={16} aria-hidden="true" /> Try again</button>
          <Link href={homeHref} className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{homeLabel}</Link>
        </div>
      </div>
    </main>
  );
}
