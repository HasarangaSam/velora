"use client";

import { useState } from "react";
import { BadgeCheck, ChevronDown, Loader2 } from "lucide-react";
import StarRating from "@/components/shop/StarRating";
import { getMoreProductReviews } from "@/app/account/reviews/actions";

export type ReviewItem = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string | Date;
  user: { name: string | null };
};

type Props = {
  productId: string;
  initialReviews: ReviewItem[];
  totalCount: number;
  pageSize?: number;
};

// This list keeps local review pagination state so users can load more approved reviews without a
// full page refresh.
export default function ProductReviewsList({
  productId,
  initialReviews,
  totalCount,
  pageSize = 5,
}: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMore = reviews.length < totalCount;

  async function handleLoadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    setError("");

    try {
      const res = await getMoreProductReviews(
        productId,
        reviews.length,
        pageSize,
      );
      if (res.success && res.reviews.length > 0) {
        setReviews((prev) => [...prev, ...res.reviews]);
      } else if (!res.success) {
        setError("Unable to load more reviews. Please try again.");
      }
    } catch {
      setError("Unable to load more reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-sm text-slate-500">
        No approved reviews yet.
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {reviews.map((review) => {
          const dateObj = new Date(review.createdAt);
          return (
            <article key={review.id} className="py-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <StarRating rating={review.rating} size={15} />
                <time
                  className="text-xs text-slate-500"
                  dateTime={dateObj.toISOString()}
                >
                  {dateObj.toLocaleDateString("en-LK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">
                {review.title}
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                {review.comment}
              </p>
              <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                {review.user.name ?? "Velora customer"}
                {review.verifiedPurchase && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <BadgeCheck size={14} /> Verified purchase
                    </span>
                  </>
                )}
              </p>
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-slate-500" />
                Loading reviews…
              </>
            ) : (
              <>
                Load More Reviews
                <ChevronDown size={16} className="text-slate-400" />
              </>
            )}
          </button>
          <p className="text-xs text-slate-400">
            Showing {reviews.length} of {totalCount} reviews
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
