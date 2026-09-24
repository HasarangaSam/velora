import Link from "next/link";
import { BadgeCheck, MessageSquareText, Star } from "lucide-react";
import ReviewForm from "@/components/shop/ReviewForm";
import StarRating from "@/components/shop/StarRating";
import { getProductReviewData } from "@/lib/reviews";

export default async function ProductReviews({ productId, productSlug, userId }: { productId: string; productSlug: string; userId?: string }) {
  const data = await getProductReviewData(productId, userId);

  return (
    <section id="reviews" className="mt-16 border-t border-slate-200 pt-10 sm:mt-20 sm:pt-14">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Customer notes</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Reviews & ratings</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Thoughtful feedback from customers who have purchased this piece.</p>
        </div>

        {data.count > 0 ? (
          <div className="grid w-full max-w-xl gap-6 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="text-center sm:min-w-28">
              <p className="text-4xl font-semibold tracking-tight text-slate-950">{data.average.toFixed(1)}</p>
              <StarRating rating={Math.round(data.average)} size={15} />
              <p className="mt-1 text-xs text-slate-500">{data.count} {data.count === 1 ? "review" : "reviews"}</p>
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((rating) => {
                const amount = data.distribution[rating] ?? 0;
                const percent = data.count ? amount / data.count * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-3 text-right">{rating}</span>
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} /></div>
                    <span className="w-5 text-right">{amount}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
            <MessageSquareText className="h-5 w-5 shrink-0 text-slate-400" />
            Be the first to share your experience with this product.
          </div>
        )}
      </div>

      <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]">
        <div>
          {data.reviews.length ? (
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {data.reviews.map((review) => (
                <article key={review.id} className="py-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <StarRating rating={review.rating} size={15} />
                    <time className="text-xs text-slate-500" dateTime={review.createdAt.toISOString()}>{review.createdAt.toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" })}</time>
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-900">{review.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{review.comment}</p>
                  <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    {review.user.name ?? "Velora customer"}
                    {review.verifiedPurchase && <><span className="text-slate-300">·</span><span className="inline-flex items-center gap-1 text-emerald-700"><BadgeCheck size={14} /> Verified purchase</span></>}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-sm text-slate-500">No approved reviews yet.</div>
          )}
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-950">Share your experience</h3>
          <p className="mt-1 text-sm leading-5 text-slate-500">Reviews are checked by our team before they appear on the product page.</p>
          {userId ? data.canReview ? (
            <div className="mt-5">
              <ReviewForm
                key={`${data.currentReview?.id ?? "new"}-${data.currentReview?.updatedAt?.toISOString() ?? ""}`}
                productId={productId}
                existing={data.currentReview}
                allowDelete
              />
            </div>
          ) : data.currentReview ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">You’ve already submitted a review. <Link href="/account/reviews" className="font-medium text-blue-700 underline underline-offset-2">Manage it in your account.</Link></div>
          ) : (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-5 text-slate-600">A review form will be available here after you have a paid order for this product.</p>
          ) : (
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/products/${productSlug}#reviews`)}`} className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">Sign in to review</Link>
          )}
        </aside>
      </div>
    </section>
  );
}
