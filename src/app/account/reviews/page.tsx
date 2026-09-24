import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import { auth } from "@/auth";
import ReviewForm from "@/components/shop/ReviewForm";
import StarRating from "@/components/shop/StarRating";
import { prisma } from "@/lib/db/prisma";

export const metadata = {
  title: "My Reviews | Velora",
  description: "Manage your Velora product reviews.",
};

export default async function AccountReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Faccount%2Freviews");

  const reviews = await prisma.productReview.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      productId: true,
      rating: true,
      title: true,
      comment: true,
      status: true,
      updatedAt: true,
      product: {
        select: {
          name: true,
          slug: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"><ArrowLeft size={16} /> Back to account</Link>
        <div className="mt-6 border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Your account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">My reviews</h1>
          <p className="mt-2 text-sm text-slate-600">Update or remove the feedback you’ve shared with Velora.</p>
        </div>

        {reviews.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <MessageSquareText className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-4 font-semibold text-slate-900">No reviews yet</h2>
            <p className="mt-2 text-sm text-slate-500">After a paid order, you can review the products you purchased.</p>
            <Link href="/account/orders" className="mt-5 inline-flex text-sm font-medium text-blue-700 hover:underline">View your orders</Link>
          </section>
        ) : (
          <div className="mt-7 space-y-5">
            {reviews.map((review) => (
              <article key={`${review.id}-${review.updatedAt.toISOString()}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
                  <Link href={`/products/${review.product.slug}`} className="flex items-center gap-4 sm:w-64 sm:shrink-0">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {review.product.images[0]?.url && <Image src={review.product.images[0].url} alt={review.product.name} fill sizes="64px" className="object-cover" />}
                    </div>
                    <div><p className="text-xs text-slate-500">Product</p><p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{review.product.name}</p></div>
                  </Link>
                  <div className="min-w-0 flex-1 border-t border-slate-100 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StarRating rating={review.rating} size={15} />
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${review.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : review.status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>{review.status === "PENDING" ? "Pending review" : review.status.toLowerCase()}</span>
                    </div>
                    <h2 className="mt-3 font-semibold text-slate-900">{review.title}</h2>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{review.comment}</p>
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-6">
                  <ReviewForm
                    key={`${review.id}-${review.updatedAt.toISOString()}`}
                    productId={review.productId}
                    existing={{ ...review, updatedAt: review.updatedAt }}
                    allowDelete
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
