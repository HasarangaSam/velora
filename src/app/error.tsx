"use client";

import RouteErrorFallback from "@/components/layout/RouteErrorFallback";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteErrorFallback error={error} retry={retry} />;
}
