"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useSession } from "next-auth/react";
import CartItem from "@/components/shop/CartItem";
import { useCartStore } from "@/lib/cart-store";
import type { CartData, CartItemData } from "@/types/cart";

export default function CartPageClient() {
  const { status } = useSession();

  const guestItems = useCartStore((state) => state.items);
  const updateGuestQuantity = useCartStore((state) => state.updateQuantity);
  const removeGuestItem = useCartStore((state) => state.removeItem);

  const [serverCart, setServerCart] = useState<CartData | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      setServerCart(null);
      setLoading(false);
      return;
    }

    async function loadCart() {
      try {
        setLoading(true);

        const response = await fetch("/api/cart", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ?? "Unable to load the cart.");
        }

        setServerCart(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load the cart.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [status]);

  const items: CartItemData[] =
    status === "authenticated" ? (serverCart?.items ?? []) : guestItems;

  const subtotal =
    status === "authenticated"
      ? Number(serverCart?.subtotal ?? "0")
      : guestItems.reduce(
          (total, item) => total + Number(item.price) * item.quantity,
          0,
        );

  async function updateServerItem(item: CartItemData, quantity: number) {
    if (!item.id) {
      return;
    }

    setUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/cart/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to update the cart.");
        return;
      }

      setServerCart(data.cart);
    } catch {
      setError("Unable to update the cart.");
    } finally {
      setUpdating(false);
    }
  }

  async function removeServerItem(item: CartItemData) {
    if (!item.id) {
      return;
    }

    setUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/cart/${item.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to remove the item.");
        return;
      }

      setServerCart(data.cart);
    } catch {
      setError("Unable to remove the item.");
    } finally {
      setUpdating(false);
    }
  }

  function handleUpdate(item: CartItemData, quantity: number) {
    if (status === "authenticated") {
      updateServerItem(item, quantity);
      return;
    }

    updateGuestQuantity(item.variantId, quantity);
  }

  function handleRemove(item: CartItemData) {
    if (status === "authenticated") {
      removeServerItem(item);
      return;
    }

    removeGuestItem(item.variantId);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-8 h-32 animate-pulse rounded bg-slate-100" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Shopping Cart</h1>

        <p className="mt-2 text-slate-500">
          Review your selected items before checkout.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center">
          <ShoppingBag size={42} className="mx-auto text-slate-300" />

          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Your cart is empty
          </h2>

          <p className="mt-2 text-slate-500">
            Add some products to your cart to continue.
          </p>

          <Link
            href="/shop"
            className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-slate-200 bg-white px-5">
            {items.map((item) => (
              <CartItem
                key={item.variantId}
                item={item}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                disabled={updating}
              />
            ))}
          </div>

          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Order Summary
            </h2>

            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>

              <span className="font-semibold text-slate-900">
                LKR {subtotal.toLocaleString("en-LK")}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Shipping, discounts and final stock validation will be calculated
              during checkout.
            </p>

            <Link
              href={
                status === "authenticated"
                  ? "/checkout"
                  : "/login?callbackUrl=/checkout"
              }
              className="mt-6 flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              Proceed to Checkout
              <ArrowRight size={17} />
            </Link>

            <Link
              href="/shop"
              className="mt-3 block text-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
