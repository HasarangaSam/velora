"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/admin/products/actions";

export default function ProductRowActions({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this product and its images? Products with order history can’t be deleted; deactivate those instead.",
    );
    if (!confirmed) return;

    setMessage("");
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (!result.success) setMessage(result.message);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/products/${productId}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label="Delete product"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 transition hover:text-red-800 disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
          {isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
      {message && <p role="alert" className="max-w-64 text-xs leading-5 text-amber-700">{message}</p>}
    </div>
  );
}
