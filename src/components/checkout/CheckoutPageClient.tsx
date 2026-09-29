"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Tag,
  X,
  XCircle,
} from "lucide-react";

import AddressSelector, {
  type CheckoutAddress,
} from "@/components/checkout/AddressSelector";
import { useCartStore } from "@/store";
import { SHIPPING_COST } from "@/lib/checkout";

import type { CartData } from "@/types/cart";

type CouponState =
  | { status: "idle" }
  | { status: "validating" }
  | {
      status: "valid";
      code: string;
      discount: number;
      shippingCost: number;
      total: number;
    }
  | { status: "invalid"; message: string };

// The checkout client handles the heavy UI work: loading cart data, selecting addresses,
// validating coupons, and creating the order before redirecting to payment.
export default function CheckoutPageClient({
  buyNow,
}: {
  buyNow?: { variantId: string; quantity: number };
}) {
  const router = useRouter();
  const buyNowVariantId = buyNow?.variantId;
  const buyNowQuantity = buyNow?.quantity;
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponState>({ status: "idle" });
  const checkoutRequest = useRef<{ fingerprint: string; key: string } | null>(
    null,
  );

  const loadCheckoutData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");

      const cartUrl = buyNowVariantId
        ? `/api/cart?buyNowVariantId=${encodeURIComponent(buyNowVariantId)}&quantity=${buyNowQuantity}`
        : "/api/cart";
      const [cartResponse, addressResponse] = await Promise.all([
        fetch(cartUrl, {
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
      setLoadError(
        err instanceof Error ? err.message : "Unable to load checkout.",
      );
    } finally {
      setLoading(false);
    }
  }, [buyNowQuantity, buyNowVariantId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCheckoutData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCheckoutData]);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  const clearCart = useCartStore((state) => state.clear);

  // Derived totals update whenever the cart contents or discount state changes.
  const subtotal = cart ? Number(cart.subtotal) : 0;

  const derivedShipping =
    coupon.status === "valid" ? coupon.shippingCost : SHIPPING_COST;
  const derivedTotal =
    coupon.status === "valid" ? coupon.total : subtotal + SHIPPING_COST;

  // Coupon validation happens on the server so the business rules remain centralized.
  async function handleApplyCoupon() {
    const code = couponCode.trim();
    if (!code) return;

    setCoupon({ status: "validating" });
    setSubmitError("");

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: code, subtotal }),
      });

      const data = (await response.json()) as {
        valid?: boolean;
        message?: string;
        discount?: number;
        shippingCost?: number;
        total?: number;
        couponCode?: string;
      };

      if (!response.ok) {
        setCoupon({
          status: "invalid",
          message: data.message ?? "Unable to validate coupon.",
        });
        setCouponCode("");
        return;
      }

      if (data.valid) {
        setCoupon({
          status: "valid",
          code: data.couponCode!,
          discount: data.discount!,
          shippingCost: data.shippingCost!,
          total: data.total!,
        });
      } else {
        setCoupon({
          status: "invalid",
          message: data.message ?? "Invalid coupon code.",
        });
        setCouponCode("");
      }
    } catch {
      setCoupon({ status: "invalid", message: "Unable to validate coupon." });
      setCouponCode("");
    }
  }

  function handleRemoveCoupon() {
    setCoupon({ status: "idle" });
    setCouponCode("");
  }

  // Submit a single order request and attach an idempotency key to prevent duplicate checkout
  // submissions if the user clicks the button repeatedly.
  async function handleCreateOrder() {
    if (!selectedAddressId) {
      setSubmitError("Please select a delivery address.");
      return;
    }

    setCreatingOrder(true);
    setSubmitError("");

    try {
      const orderRequest = {
        addressId: selectedAddressId,
        couponCode: coupon.status === "valid" ? coupon.code : undefined,
        ...(buyNow ? { buyNow } : {}),
      };
      const fingerprint = JSON.stringify(orderRequest);
      if (checkoutRequest.current?.fingerprint !== fingerprint) {
        const persistedRequest = sessionStorage.getItem(
          "velora:checkout:idempotency",
        );
        if (persistedRequest) {
          try {
            const parsed = JSON.parse(persistedRequest) as {
              fingerprint?: string;
              key?: string;
            };
            if (parsed.fingerprint === fingerprint && parsed.key) {
              checkoutRequest.current = { fingerprint, key: parsed.key };
            }
          } catch {
            sessionStorage.removeItem("velora:checkout:idempotency");
          }
        }
        if (checkoutRequest.current?.fingerprint !== fingerprint) {
          checkoutRequest.current = { fingerprint, key: crypto.randomUUID() };
        }
        sessionStorage.setItem(
          "velora:checkout:idempotency",
          JSON.stringify(checkoutRequest.current),
        );
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutRequest.current.key,
        },
        body: JSON.stringify(orderRequest),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.message ?? "Unable to create your order.");
        return;
      }

      // Clear local cart store — DB cart already cleared by the server
      if (!buyNow) clearCart();
      sessionStorage.removeItem("velora:checkout:idempotency");

      router.push(`/checkout/payment?orderId=${data.order.id}`);
    } catch {
      setSubmitError("Unable to create your order.");
    } finally {
      setCreatingOrder(false);
    }
  }

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

  if (loadError) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">{loadError}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => void loadCheckoutData()}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
            <Link
              href="/cart"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to Cart
            </Link>
          </div>
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

          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Subtotal</span>

            <span className="font-semibold text-slate-900">
              LKR {subtotal.toLocaleString("en-LK")}
            </span>
          </div>

          {/* Discount row — only shown when coupon applied */}
          {coupon.status === "valid" && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-green-600">
                Discount{" "}
                <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
                  {coupon.code}
                </span>
              </span>

              <span className="text-sm font-medium text-green-600">
                − LKR {coupon.discount.toLocaleString("en-LK")}
              </span>
            </div>
          )}

          {/* Shipping row */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Shipping</span>

            {derivedShipping === 0 ? (
              <span className="text-sm font-medium text-green-600">Free</span>
            ) : (
              <span className="text-sm font-medium text-slate-700">
                LKR {derivedShipping.toLocaleString("en-LK")}
              </span>
            )}
          </div>

          {/* Coupon section */}
          <div className="mt-6">
            <label
              htmlFor="coupon"
              className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700"
            >
              <Tag size={14} />
              Coupon Code
            </label>

            {coupon.status === "valid" ? (
              /* Applied coupon pill */
              <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {coupon.code} applied
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Remove coupon"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ) : (
              /* Input + Apply */
              <div className="flex gap-2">
                <input
                  id="coupon"
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value.toUpperCase());
                    if (coupon.status === "invalid")
                      setCoupon({ status: "idle" });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleApplyCoupon();
                  }}
                  placeholder="Enter coupon code"
                  disabled={coupon.status === "validating"}
                  className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500 disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() => void handleApplyCoupon()}
                  disabled={
                    !couponCode.trim() || coupon.status === "validating"
                  }
                  className="shrink-0 rounded-md bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {coupon.status === "validating" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
            )}

            {/* Validation feedback */}
            {coupon.status === "invalid" && (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                <XCircle size={12} />
                {coupon.message}
              </p>
            )}

            {coupon.status === "idle" && (
              <p className="mt-2 text-xs text-slate-500">
                The coupon will be validated again on the server when your order
                is created.
              </p>
            )}
          </div>

          <div className="my-5 border-t border-slate-200" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Total</span>

            <span className="text-xl font-semibold text-slate-900">
              LKR {derivedTotal.toLocaleString("en-LK")}
            </span>
          </div>

          {submitError && (
            <div className="mt-4 flex items-start justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                <span>{submitError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSubmitError("")}
                className="shrink-0 text-red-400 hover:text-red-600"
                aria-label="Dismiss error"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateOrder}
            disabled={!selectedAddress || creatingOrder}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {creatingOrder ? "Creating Order..." : "Continue to Payment"}

            {!creatingOrder && <ArrowRight size={17} />}
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
