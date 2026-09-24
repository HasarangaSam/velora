import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MessageSquareText, Star } from "lucide-react";
import ReviewModerationActions from "@/components/admin/ReviewModerationActions";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Review moderation | Velora Admin" };

export default async function AdminReviewsPage() {
  const [pendingReviews, approvedCount, rejectedCount] = await Promise.all([
    prisma.productReview.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        verifiedPurchase: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        product: {
          select: {
            name: true,
            slug: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
      },
    }),
    prisma.productReview.count({ where: { status: "APPROVED" } }),
    prisma.productReview.count({ where: { status: "REJECTED" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Store feedback</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Review moderation</h1>
        <p className="mt-2 text-sm text-slate-500">Check customer feedback before it appears publicly on product pages.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-medium text-amber-800">Awaiting review</p><p className="mt-1 text-2xl font-semibold text-amber-950">{pendingReviews.length}</p></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-medium text-emerald-800">Published</p><p className="mt-1 text-2xl font-semibold text-emerald-950">{approvedCount}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Rejected</p><p className="mt-1 text-2xl font-semibold text-slate-900">{rejectedCount}</p></div>
      </div>

      {pendingReviews.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <MessageSquareText className="mx-auto h-9 w-9 text-slate-300" />
          <h2 className="mt-4 font-semibold text-slate-900">All caught up</h2>
          <p className="mt-1 text-sm text-slate-500">There are no customer reviews waiting for approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingReviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <Link href={`/products/${review.product.slug}`} className="flex items-center gap-3 sm:w-64 sm:shrink-0">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                    {review.product.images[0]?.url && <Image src={review.product.images[0].url} alt={review.product.name} fill sizes="56px" className="object-cover" />}
                  </div>
                  <span className="line-clamp-2 text-sm font-medium text-slate-800">{review.product.name}</span>
                </Link>
                <div className="min-w-0 flex-1 border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800"><Star size={15} className="fill-amber-400 text-amber-400" /> {review.rating}/5</span>
                    {review.verifiedPurchase && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"><BadgeCheck size={13} /> Verified purchase</span>}
                    <time className="text-xs text-slate-400" dateTime={review.createdAt.toISOString()}>{review.createdAt.toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" })}</time>
                  </div>
                  <h2 className="mt-2 font-semibold text-slate-950">{review.title}</h2>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{review.comment}</p>
                  <p className="mt-3 text-xs text-slate-500">By <span className="font-medium text-slate-700">{review.user.name ?? "Customer"}</span> · {review.user.email}</p>
                </div>
                <ReviewModerationActions reviewId={review.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
