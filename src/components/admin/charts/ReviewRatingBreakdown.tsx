"use client";

import { Star, MessageSquareText, ArrowRight } from "lucide-react";
import Link from "next/link";

export type RatingBreakdownItem = {
  rating: number; // 1 to 5
  count: number;
};

type ReviewRatingBreakdownProps = {
  ratings: RatingBreakdownItem[];
  totalReviews: number;
  avgRating: number;
};

export default function ReviewRatingBreakdown({
  ratings,
  totalReviews,
  avgRating,
}: ReviewRatingBreakdownProps) {
  const ratingMap = new Map(ratings.map((r) => [r.rating, r.count]));

  const rows = [5, 4, 3, 2, 1].map((star) => {
    const count = ratingMap.get(star) ?? 0;
    const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { star, count, pct };
  });

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Customer Feedback</h2>
          <p className="mt-0.5 text-xs text-slate-500">Rating distribution and satisfaction score</p>
        </div>
        <Link
          href="/admin/reviews"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Reviews <ArrowRight size={13} />
        </Link>
      </div>

      {totalReviews === 0 ? (
        <div className="my-auto flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <MessageSquareText className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-600">No customer reviews yet</p>
          <p className="mt-1 text-xs text-slate-400">Customer ratings and satisfaction score will appear here.</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Average Rating Score Card */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-5 text-center sm:w-44 shrink-0">
            <span className="text-4xl font-black text-slate-900">
              {avgRating.toFixed(1)}
            </span>
            <div className="mt-2 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={
                    star <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200"
                  }
                />
              ))}
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* 5-star to 1-star Breakdown Bars */}
          <div className="flex-1 space-y-2.5">
            {rows.map((row) => (
              <div key={row.star} className="flex items-center gap-2.5 text-xs">
                <span className="flex w-12 items-center gap-1 font-semibold text-slate-700">
                  <span>{row.star}</span>
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                </span>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      row.star >= 4
                        ? "bg-emerald-500"
                        : row.star === 3
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>

                <div className="w-16 text-right">
                  <span className="font-semibold text-slate-800">{row.count}</span>
                  <span className="ml-1 text-[11px] text-slate-400">({row.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
