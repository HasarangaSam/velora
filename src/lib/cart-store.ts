"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItemData } from "@/types/cart";

type GuestCartItem = Omit<CartItemData, "id">;

type CartStore = {
  items: GuestCartItem[];
  addItem: (item: GuestCartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  replaceItems: (items: GuestCartItem[]) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (currentItem) => currentItem.variantId === item.variantId,
          );

          if (!existingItem) {
            return {
              items: [...state.items, item],
            };
          }

          const quantity = Math.min(
            existingItem.quantity + item.quantity,
            item.stock,
          );

          return {
            items: state.items.map((currentItem) =>
              currentItem.variantId === item.variantId
                ? {
                    ...currentItem,
                    quantity,
                  }
                : currentItem,
            ),
          };
        }),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? {
                  ...item,
                  quantity: Math.max(1, Math.min(quantity, item.stock)),
                }
              : item,
          ),
        })),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),

      clear: () =>
        set({
          items: [],
        }),

      replaceItems: (items) =>
        set({
          items,
        }),
    }),
    {
      name: "velora-cart",
    },
  ),
);
