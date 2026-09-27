"use client";

import "./globals.css";
import RouteErrorFallback from "@/components/layout/RouteErrorFallback";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <RouteErrorFallback error={error} retry={retry} title="Velora could not load" />
      </body>
    </html>
  );
}
