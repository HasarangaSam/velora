"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";

type Variant = {
  id: string;
  size: string;
  colour: string;
  price: string;
  stock: number;
};

type ProductPurchaseProps = {
  variants: Variant[];
};

export default function ProductPurchase({ variants }: ProductPurchaseProps) {
  const availableSizes = useMemo(
    () => [...new Set(variants.map((variant) => variant.size))],
    [variants],
  );

  const availableColours = useMemo(
    () => [...new Set(variants.map((variant) => variant.colour))],
    [variants],
  );

  const [selectedSize, setSelectedSize] = useState(availableSizes[0] ?? "");

  const [selectedColour, setSelectedColour] = useState(
    availableColours[0] ?? "",
  );

  const [quantity, setQuantity] = useState(1);

  const selectedVariant = variants.find(
    (variant) =>
      variant.size === selectedSize && variant.colour === selectedColour,
  );

  const price = selectedVariant ? Number(selectedVariant.price) : null;

  const maxQuantity = selectedVariant?.stock ?? 1;

  function handleSizeChange(size: string) {
    setSelectedSize(size);

    const matchingColours = variants
      .filter((variant) => variant.size === size)
      .map((variant) => variant.colour);

    if (!matchingColours.includes(selectedColour)) {
      setSelectedColour(matchingColours[0] ?? "");
    }

    setQuantity(1);
  }

  function handleColourChange(colour: string) {
    setSelectedColour(colour);
    setQuantity(1);
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(maxQuantity, current + 1));
  }

  return (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Size</h3>

        <div className="mt-3 flex flex-wrap gap-2">
          {availableSizes.map((size) => {
            const sizeAvailable = variants.some(
              (variant) => variant.size === size,
            );

            return (
              <button
                key={size}
                type="button"
                disabled={!sizeAvailable}
                onClick={() => handleSizeChange(size)}
                className={`min-w-12 rounded-lg border px-4 py-2.5 text-sm font-medium ${
                  selectedSize === size
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900">Colour</h3>

        <div className="mt-3 flex flex-wrap gap-2">
          {availableColours.map((colour) => {
            const colourAvailable = variants.some(
              (variant) =>
                variant.colour === colour && variant.size === selectedSize,
            );

            return (
              <button
                key={colour}
                type="button"
                disabled={!colourAvailable}
                onClick={() => handleColourChange(colour)}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
                  selectedColour === colour
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {colour}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {selectedVariant ? (
          <div>
            <p className="text-2xl font-bold text-slate-900">
              LKR{" "}
              {price?.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {selectedVariant.stock} available
            </p>
          </div>
        ) : (
          <p className="text-sm font-medium text-red-600">
            This size and colour combination is currently unavailable.
          </p>
        )}
      </div>

      {selectedVariant && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex h-12 items-center rounded-lg border border-slate-300">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="flex h-full w-11 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>

            <span className="w-10 text-center text-sm font-medium text-slate-900">
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={quantity >= maxQuantity}
              className="flex h-full w-11 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 font-medium text-white hover:bg-blue-700"
          >
            <ShoppingBag className="h-5 w-5" />
            Add to cart
          </button>
        </div>
      )}
    </div>
  );
}
