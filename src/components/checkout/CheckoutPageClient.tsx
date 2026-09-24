"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import AddressSelector, {
  type CheckoutAddress,
} from "@/components/checkout/AddressSelector";
import type { CartData } from "@/types/cart";

export default function CheckoutPageClient() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCheckoutData() {
    try {
      setLoading(true);
      setError("");

      const [cartResponse, addressResponse] = await Promise.all([
        fetch("/api/cart", {
          cache: "no-store",
        }),
        fetch("/api/addresses", {
          cache: "no-store",
        }),
      ]);

      const cartData = await cartResponse.json();
      const addressData = await addressResponse.json();

      if (!cartResponse.ok) {
        throw new Error(cartData.message ?? "Unable to load your cart.");
      }

      if (!addressResponse.ok) {
        throw new Error(
          addressData.message ?? "Unable to load your addresses.",
        );
      }

      setCart(cartData);
      setAddresses(addressData.addresses);

      const defaultAddress =
        addressData.addresses.find(
          (address: CheckoutAddress) => address.isDefault,
        ) ?? addressData.addresses[0];

      setSelectedAddressId(defaultAddress?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load checkout.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="h-80 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-60 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Your cart is empty
          </h1>

          <p className="mt-2 text-slate-500">
            Add some products before continuing to checkout.
          </p>

          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Cart
        </Link>

        <h1 className="mt-5 text-3xl font-semibold text-slate-900">Checkout</h1>

        <p className="mt-2 text-slate-500">
          Select your delivery address and review your order.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Delivery Address
            </h2>

            <AddressSelector
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelect={(address) => setSelectedAddressId(address.id)}
              onAddressChanged={loadCheckoutData}
            />
          </div>

          {selectedAddress && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-medium text-slate-900">
                Selected delivery address
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedAddress.fullName}
                <br />
                {selectedAddress.addressLine1}
                {selectedAddress.addressLine2 &&
                  `, ${selectedAddress.addressLine2}`}
                <br />
                {selectedAddress.city}, {selectedAddress.district}{" "}
                {selectedAddress.postalCode}
                <br />
                {selectedAddress.phone}
              </p>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Order Summary
          </h2>

          <div className="mt-5 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.variantId}
                className="flex justify-between gap-4 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {item.productName}
                  </p>

                  <p className="mt-1 text-slate-500">
                    {item.size} / {item.colour} × {item.quantity}
                  </p>
                </div>

                <p className="shrink-0 font-medium text-slate-900">
                  LKR{" "}
                  {(Number(item.price) * item.quantity).toLocaleString("en-LK")}
                </p>
              </div>
            ))}
          </div>

          <div className="my-5 border-t border-slate-200" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Subtotal</span>

            <span className="font-semibold text-slate-900">
              LKR {Number(cart.subtotal).toLocaleString("en-LK")}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Shipping</span>

            <span className="text-sm font-medium text-slate-700">
              Calculated next
            </span>
          </div>

          <div className="my-5 border-t border-slate-200" />

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Total</span>

            <span className="text-xl font-semibold text-slate-900">
              LKR {Number(cart.subtotal).toLocaleString("en-LK")}
            </span>
          </div>

          <button
            type="button"
            disabled={!selectedAddress}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Continue to Payment
            <ArrowRight size={17} />
          </button>

          {!selectedAddress && (
            <p className="mt-3 text-center text-xs text-slate-500">
              Please select a delivery address to continue.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
