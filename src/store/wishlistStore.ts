"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistStore = {
  savedProductIds: string[];
  setSaved: (productId: string, isSaved: boolean) => void;
  toggleSaved: (productId: string) => boolean;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      savedProductIds: [],

      setSaved: (productId, isSaved) =>
        set((state) => {
          const hasProduct = state.savedProductIds.includes(productId);

          if (isSaved && !hasProduct) {
            return { savedProductIds: [...state.savedProductIds, productId] };
          }

          if (!isSaved && hasProduct) {
            return {
              savedProductIds: state.savedProductIds.filter(
                (id) => id !== productId,
              ),
            };
          }

          return state;
        }),

      toggleSaved: (productId) => {
        const nextSaved = !get().savedProductIds.includes(productId);
        set((state) => ({
          savedProductIds: nextSaved
            ? [...state.savedProductIds, productId]
            : state.savedProductIds.filter((id) => id !== productId),
        }));
        return nextSaved;
      },
    }),
    {
      name: "velora-wishlist",
    },
  ),
);
