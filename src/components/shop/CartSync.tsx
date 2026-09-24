"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/cart-store";

export default function CartSync() {
  const { status } = useSession();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const replaceItems = useCartStore((state) => state.replaceItems);

  const syncing = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || items.length === 0 || syncing.current) {
      return;
    }

    syncing.current = true;

    async function syncCart() {
      try {
        const response = await fetch("/api/cart/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
            })),
          }),
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        const skippedIds = new Set<string>(data.skippedVariantIds ?? []);

        const remainingGuestItems = items.filter((item) =>
          skippedIds.has(item.variantId),
        );

        if (remainingGuestItems.length > 0) {
          replaceItems(remainingGuestItems);
        } else {
          clear();
        }
      } catch (error) {
        console.error("Cart synchronization error:", error);
      } finally {
        syncing.current = false;
      }
    }

    syncCart();
  }, [status, items, clear, replaceItems]);

  return null;
}
