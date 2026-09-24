"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store";

type ProductVariant = {
  id: string;
  size: string;
  colour: string;
  price: string;
  stock: number;
};

type ProductPurchaseProps = {
  productId: string;
  productName: string;
  slug: string;
  image: string | null;
  variants: ProductVariant[];
};

export default function ProductPurchase({
  productId,
  productName,
  slug,
  image,
  variants,
}: ProductPurchaseProps) {
  const { status } = useSession();

  const addGuestItem = useCartStore((state) => state.addItem);

  const [selectedSize, setSelectedSize] = useState(variants[0]?.size ?? "");

  const [selectedColour, setSelectedColour] = useState(
    variants[0]?.colour ?? "",
  );

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [addedSuccess, setAddedSuccess] = useState(false);

  const availableSizes = useMemo(
    () => Array.from(new Set(variants.map((variant) => variant.size))),
    [variants],
  );

  const availableColours = useMemo(
    () => Array.from(new Set(variants.map((variant) => variant.colour))),
    [variants],
  );

  const selectedVariant = variants.find(
    (variant) =>
      variant.size === selectedSize && variant.colour === selectedColour,
  );

  const matchingColours = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .filter((variant) => variant.size === selectedSize)
            .map((variant) => variant.colour),
        ),
      ),
    [variants, selectedSize],
  );

  function handleSizeChange(size: string) {
    setSelectedSize(size);

    const coloursForSize = variants
      .filter((variant) => variant.size === size)
      .map((variant) => variant.colour);

    if (!coloursForSize.includes(selectedColour)) {
      setSelectedColour(coloursForSize[0] ?? "");
    }

    setQuantity(1);
    setMessage("");
  }

  function handleColourChange(colour: string) {
    setSelectedColour(colour);
    setQuantity(1);
    setMessage("");
  }

  async function handleAddToCart() {
    if (!selectedVariant) {
      setMessage("Please select an available size and colour.");
      return;
    }

    setIsAdding(true);
    setMessage("");
    setAddedSuccess(false);

    try {
      if (status === "authenticated") {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variantId: selectedVariant.id,
            quantity,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setAddedSuccess(false);
          setMessage(data.message ?? "Unable to add the item.");
          return;
        }

        if (data.cart?.items) {
          useCartStore.getState().replaceItems(data.cart.items);
        }

        setAddedSuccess(true);
        setMessage("Item added to cart.");
      } else {
        addGuestItem({
          productId,
          variantId: selectedVariant.id,
          productName,
          slug,
          image,
          size: selectedVariant.size,
          colour: selectedVariant.colour,
          price: selectedVariant.price,
          quantity,
          stock: selectedVariant.stock,
        });

        setAddedSuccess(true);
        setMessage("Item added to cart.");
      }
    } catch {
      setAddedSuccess(false);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }

  const price = selectedVariant?.price ?? variants[0]?.price ?? "0.00";
  const stock = selectedVariant?.stock ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-2xl font-semibold text-slate-900">
          LKR {Number(price).toLocaleString("en-LK")}
        </p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-slate-900">Size</p>

        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleSizeChange(size)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                selectedSize === size
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-blue-500"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-slate-900">Colour</p>

        <div className="flex flex-wrap gap-2">
          {availableColours.map((colour) => {
            const isAvailable = matchingColours.includes(colour);

            return (
              <button
                key={colour}
                type="button"
                disabled={!isAvailable}
                onClick={() => handleColourChange(colour)}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                  selectedColour === colour
                    ? "border-blue-600 bg-blue-600 text-white"
                    : isAvailable
                      ? "border-slate-300 bg-white text-slate-700 hover:border-blue-500"
                      : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                }`}
              >
                {colour}
              </button>
            );
          })}
        </div>
      </div>

      {selectedVariant && (
        <p className="text-sm text-slate-500">{stock} available</p>
      )}

      <div>
        <p className="mb-3 text-sm font-medium text-slate-900">Quantity</p>

        <div className="flex w-fit items-center rounded-md border border-slate-300">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
            className="p-2 text-slate-600 disabled:opacity-40"
          >
            <Minus size={16} />
          </button>

          <span className="min-w-10 text-center text-sm font-medium">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() =>
              setQuantity((current) => Math.min(stock, current + 1))
            }
            disabled={!selectedVariant || quantity >= stock}
            className="p-2 text-slate-600 disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={
          status === "loading" || isAdding || !selectedVariant || stock <= 0
        }
        className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <ShoppingCart size={18} />
        {isAdding ? "Adding..." : "Add to Cart"}
      </button>

      {message && (
        <div
          className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm animate-in fade-in duration-200 ${
            addedSuccess
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {addedSuccess && <Check className="h-4 w-4 text-green-600" />}
            <span>{message}</span>
          </div>
          {addedSuccess && (
            <Link
              href="/cart"
              className="font-semibold text-green-700 underline hover:text-green-900"
            >
              View Cart →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
