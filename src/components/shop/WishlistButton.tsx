"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { setWishlistItem } from "@/app/account/wishlist/actions";

export default function WishlistButton({
  productId,
  productName,
  initialSaved = false,
  variant = "icon",
}: {
  productId: string;
  productName: string;
  initialSaved?: boolean;
  variant?: "icon" | "label";
}) {
  const router = useRouter();
  const { status } = useSession();
  const [saved, setSaved] = useState(initialSaved);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending || status === "loading") return;

    if (status !== "authenticated") {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);
    setMessage("");
    startTransition(async () => {
      const result = await setWishlistItem(productId, nextSaved);
      if (!result.success) {
        setSaved(result.isSaved);
        setMessage(result.message);
        return;
      }
      setMessage(result.message);
      if (typeof result.count === "number") {
        window.dispatchEvent(new CustomEvent("velora:wishlist-count", { detail: result.count }));
      }
      router.refresh();
    });
  }

  const title = status === "authenticated"
    ? saved ? "Remove from wishlist" : "Save to wishlist"
    : "Sign in to save to wishlist";

  if (variant === "label") {
    return (
      <div>
        <button
          type="button"
          onClick={handleClick}
          disabled={pending || status === "loading"}
          aria-pressed={saved}
          className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border px-5 text-sm font-medium transition disabled:cursor-wait disabled:opacity-60 ${saved ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border-slate-300 bg-white text-slate-800 hover:border-slate-500"}`}
          title={title}
        >
          <Heart size={17} className={saved ? "fill-current" : ""} />
          {pending ? "Updating…" : saved ? "Saved to wishlist" : "Add to wishlist"}
        </button>
        {message && <p role="status" className="mt-2 text-xs text-slate-500">{message}</p>}
      </div>
    );
  }

  return (
    <div className="absolute right-3 top-3 z-10">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || status === "loading"}
        aria-label={`${title}: ${productName}`}
        aria-pressed={saved}
        title={title}
        className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur transition disabled:cursor-wait disabled:opacity-60 ${saved ? "border-rose-200 bg-white text-rose-600" : "border-white/80 bg-white/95 text-stone-700 hover:scale-105 hover:text-rose-600"}`}
      >
        <Heart size={18} className={saved ? "fill-current" : ""} />
      </button>
      {message && <span role="status" className="sr-only">{message}</span>}
    </div>
  );
}
