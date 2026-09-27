"use client";

import RouteErrorFallback from "@/components/layout/RouteErrorFallback";

export default function ShopError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteErrorFallback error={error} retry={retry} title="The collection is temporarily unavailable" homeHref="/shop" homeLabel="Browse the collection" />;
}
