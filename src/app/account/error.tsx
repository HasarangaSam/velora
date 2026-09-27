"use client";

import RouteErrorFallback from "@/components/layout/RouteErrorFallback";

export default function AccountError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteErrorFallback error={error} retry={retry} title="Your account page could not be loaded" homeHref="/account" homeLabel="Back to your account" />;
}
