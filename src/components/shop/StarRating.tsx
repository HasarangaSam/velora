"use client";

import { Star } from "lucide-react";

export default function StarRating({
  rating,
  onChange,
  size = 18,
}: {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
}) {
  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={size} className={star <= rating ? "fill-current" : "text-slate-200"} aria-hidden="true" />
        ))}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Product rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating === star}
          aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
          onClick={() => onChange(star)}
          className="rounded p-1 text-amber-500 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <Star size={size + 2} className={star <= rating ? "fill-current" : "text-slate-300"} />
        </button>
      ))}
      <input type="hidden" name="rating" value={rating || ""} />
    </div>
  );
}
