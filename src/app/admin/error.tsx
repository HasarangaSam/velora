"use client";

import RouteErrorFallback from "@/components/layout/RouteErrorFallback";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteErrorFallback error={error} retry={retry} title="The admin page could not be loaded" homeHref="/admin" homeLabel="Back to dashboard" />;
}
