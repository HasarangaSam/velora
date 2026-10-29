"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store";
import { getCartAction, syncGuestCartAction } from "@/app/(shop)/cart/actions";

const CART_SYNCED_KEY = "velora-cart-synced";

export default function CartSync() {
  const { status } = useSession();
  const clear = useCartStore((state) => state.clear);
  const replaceItems = useCartStore((state) => state.replaceItems);

  const prevStatusRef = useRef(status);
  const syncingRef = useRef(false);

  useEffect(() => {
    // If user logged out, clear cart store and reset the sync flag
    if (prevStatusRef.current === "authenticated" && status === "unauthenticated") {
      clear();
      sessionStorage.removeItem(CART_SYNCED_KEY);
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

        // Check if we already merged guest items into the DB this session.
        // Without this flag, a page refresh would re-read the persisted localStorage
        // items and sync them again, doubling quantities in the database.
        const alreadySynced = sessionStorage.getItem(CART_SYNCED_KEY) === "1";

        if (currentItems.length > 0 && !alreadySynced) {
          // Guest items present and not yet synced — merge into DB cart
          const result = await syncGuestCartAction(
            currentItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
            })),
          );

          if (result.success && result.cart?.items) {
            // Mark this session as synced BEFORE replacing items so that
            // any re-render triggered by replaceItems doesn't sync again.
            sessionStorage.setItem(CART_SYNCED_KEY, "1");
            replaceItems(result.cart.items);
          }
        } else {
          // No unsynced guest items — just load the user's existing DB cart
          const result = await getCartAction();

          if (result.success && result.cart?.items) {
            replaceItems(result.cart.items);
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
