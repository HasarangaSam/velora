"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store";

export default function CartSync() {
  const { status } = useSession();
  const clear = useCartStore((state) => state.clear);
  const replaceItems = useCartStore((state) => state.replaceItems);

  const prevStatusRef = useRef(status);
  const syncingRef = useRef(false);

  useEffect(() => {
    // If user logged out, clear cart store to prevent lingering items
    if (prevStatusRef.current === "authenticated" && status === "unauthenticated") {
      clear();
      prevStatusRef.current = status;
      return;
    }
    prevStatusRef.current = status;

    if (status !== "authenticated" || syncingRef.current) {
      return;
    }

    async function syncOrLoadCart() {
      syncingRef.current = true;
      try {
        const currentItems = useCartStore.getState().items;

        // If there are guest items in store, sync them with the user's DB cart
        if (currentItems.length > 0) {
          const response = await fetch("/api/cart/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: currentItems.map((item) => ({
                variantId: item.variantId,
                quantity: item.quantity,
              })),
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.cart?.items) {
              replaceItems(data.cart.items);
            }
          }
        } else {
          // If no guest items, load user's existing DB cart to populate store & navbar
          const response = await fetch("/api/cart", {
            cache: "no-store",
          });

          if (response.ok) {
            const data = await response.json();
            if (data.items) {
              replaceItems(data.items);
            }
          }
        }
      } catch (error) {
        console.error("Cart synchronization error:", error);
      } finally {
        syncingRef.current = false;
      }
    }

    void syncOrLoadCart();
  }, [status, clear, replaceItems]);

  return null;
}
