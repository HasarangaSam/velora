"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItemData } from "@/types/cart";

type CartItemProps = {
  item: CartItemData;
  onUpdate: (item: CartItemData, quantity: number) => void;
  onRemove: (item: CartItemData) => void;
  disabled?: boolean;
};

export default function CartItem({
  item,
  onUpdate,
  onRemove,
  disabled = false,
}: CartItemProps) {
  return (
    <div className="flex gap-4 border-b border-slate-200 py-5">
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.productName}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-slate-900">{item.productName}</h3>

        <p className="mt-1 text-sm text-slate-500">
          Size: {item.size} · Colour: {item.colour}
        </p>

        <p className="mt-2 font-medium text-slate-900">
          LKR {Number(item.price).toLocaleString("en-LK")}
        </p>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex w-fit items-center rounded-md border border-slate-300">
            <button
              type="button"
              disabled={disabled || item.quantity <= 1}
              onClick={() => onUpdate(item, item.quantity - 1)}
              className="p-2 text-slate-600 disabled:opacity-40"
            >
              <Minus size={14} />
            </button>

            <span className="min-w-8 text-center text-sm">{item.quantity}</span>

            <button
              type="button"
              disabled={disabled || item.quantity >= item.stock}
              onClick={() => onUpdate(item, item.quantity + 1)}
              className="p-2 text-slate-600 disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(item)}
            className="text-slate-400 transition hover:text-red-600 disabled:opacity-40"
            aria-label={`Remove ${item.productName}`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
