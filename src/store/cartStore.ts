"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItemData } from "@/types/cart";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CartStore = {
  items: CartItemData[];

  /** Add an item or increment quantity if it already exists (capped by stock). */
  addItem: (item: CartItemData) => void;

  /** Update quantity of an existing item (clamped to [1, stock]). */
  updateQuantity: (variantId: string, quantity: number) => void;

  /** Remove a single item by variantId. */
  removeItem: (variantId: string) => void;

  /** Empty the cart. */
  clear: () => void;

  /** Replace all items at once (used during server-side cart sync). */
  replaceItems: (items: CartItemData[]) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (current) => current.variantId === item.variantId,
          );

          if (!existing) {
            return { items: [...state.items, item] };
          }

          const quantity = Math.min(existing.quantity + item.quantity, item.stock);

          return {
            items: state.items.map((current) =>
              current.variantId === item.variantId
                ? { ...current, quantity }
                : current,
            ),
          };
        }),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
              : item,
          ),
        })),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),

      clear: () => set({ items: [] }),

      replaceItems: (items) => set({ items }),
    }),
    {
      name: "velora-cart", // localStorage key
    },
  ),
);
