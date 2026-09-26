import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MessageSquareText, Star } from "lucide-react";
import ReviewModerationActions from "@/components/admin/ReviewModerationActions";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { auth } from "@/auth";

export const metadata = { title: "Review moderation | Velora Admin" };

type AdminReviewsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  await requireAdmin();
  const session = await auth();

  const params = searchParams ? await searchParams : undefined;
  const rawReviewId = params?.reviewId;
  const targetReviewId = Array.isArray(rawReviewId) ? rawReviewId[0] : rawReviewId;
  const rawStatus = params?.status;
  const statusFilter = (Array.isArray(rawStatus) ? rawStatus[0] : rawStatus)?.toUpperCase();
  const currentTab = (statusFilter === "PENDING" || statusFilter === "APPROVED" || statusFilter === "REJECTED")
    ? statusFilter
    : "ALL";

  if (session?.user?.id && targetReviewId) {
    try {
      await prisma.notification.updateMany({
        where: {
          recipientUserId: session.user.id,
          readAt: null,
          href: { contains: targetReviewId },
        },
        data: { readAt: new Date() },
      });
    } catch (error) {
      console.error("Failed to mark review notification as read on view:", error);
    }
  }

  const whereClause: { status?: "PENDING" | "APPROVED" | "REJECTED" } = {};
  if (currentTab !== "ALL") {
    whereClause.status = currentTab;
  }

  const [reviews, totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.productReview.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        status: true,
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
    prisma.productReview.count(),
    prisma.productReview.count({ where: { status: "PENDING" } }),
    prisma.productReview.count({ where: { status: "APPROVED" } }),
    prisma.productReview.count({ where: { status: "REJECTED" } }),
  ]);

  if (session?.user?.id && pendingCount === 0) {
    try {
      await prisma.notification.updateMany({
        where: {
          recipientUserId: session.user.id,
          readAt: null,
          href: { startsWith: "/admin/reviews" },
        },
        data: { readAt: new Date() },
      });
    } catch (error) {
      console.error("Failed to clear stale review notifications:", error);
    }
  }

  const tabs = [
    { label: "All Reviews", value: "ALL", count: totalCount, href: "/admin/reviews?status=ALL" },
    { label: "Awaiting Review", value: "PENDING", count: pendingCount, href: "/admin/reviews?status=PENDING" },
    { label: "Published", value: "APPROVED", count: approvedCount, href: "/admin/reviews?status=APPROVED" },
    { label: "Rejected", value: "REJECTED", count: rejectedCount, href: "/admin/reviews?status=REJECTED" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Store feedback</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Review moderation</h1>
        <p className="mt-2 text-sm text-slate-500">View customer reviews and comments, approve or reject feedback, or delete inappropriate submissions.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Link
          href="/admin/reviews?status=ALL"
          className={`rounded-xl border p-4 transition hover:shadow-sm ${
            currentTab === "ALL" ? "border-slate-400 bg-slate-50 ring-2 ring-slate-400/20" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-medium text-slate-600">Total Reviews</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{totalCount}</p>
        </Link>
        <Link
          href="/admin/reviews?status=PENDING"
          className={`rounded-xl border p-4 transition hover:shadow-sm ${
            currentTab === "PENDING" ? "border-amber-400 bg-amber-50 ring-2 ring-amber-400/20" : "border-amber-200 bg-amber-50/50"
          }`}
        >
          <p className="text-xs font-medium text-amber-800">Awaiting Review</p>
          <p className="mt-1 text-2xl font-semibold text-amber-950">{pendingCount}</p>
        </Link>
        <Link
          href="/admin/reviews?status=APPROVED"
          className={`rounded-xl border p-4 transition hover:shadow-sm ${
            currentTab === "APPROVED" ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-400/20" : "border-emerald-200 bg-emerald-50/50"
          }`}
        >
          <p className="text-xs font-medium text-emerald-800">Published</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-950">{approvedCount}</p>
        </Link>
        <Link
          href="/admin/reviews?status=REJECTED"
          className={`rounded-xl border p-4 transition hover:shadow-sm ${
            currentTab === "REJECTED" ? "border-rose-400 bg-rose-50 ring-2 ring-rose-400/20" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-medium text-slate-500">Rejected</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{rejectedCount}</p>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.href}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isActive ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <MessageSquareText className="mx-auto h-9 w-9 text-slate-300" />
          <h2 className="mt-4 font-semibold text-slate-900">No reviews found</h2>
          <p className="mt-1 text-sm text-slate-500">
            {currentTab === "ALL"
              ? "There are no customer reviews yet."
              : currentTab === "PENDING"
              ? "There are no customer reviews waiting for approval."
              : `There are no ${currentTab.toLowerCase()} reviews.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isTargeted = targetReviewId === review.id;
            return (
              <article
                key={review.id}
                id={`review-${review.id}`}
                className={`rounded-xl border bg-white p-5 shadow-sm transition-all sm:p-6 ${
                  isTargeted ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <Link href={`/products/${review.product.slug}`} className="flex items-center gap-3 sm:w-64 sm:shrink-0">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {review.product.images[0]?.url && (
                        <Image
                          src={review.product.images[0].url}
                          alt={review.product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <span className="line-clamp-2 text-sm font-medium text-slate-800">{review.product.name}</span>
                  </Link>

                  <div className="min-w-0 flex-1 border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800">
                        <Star size={15} className="fill-amber-400 text-amber-400" /> {review.rating}/5
                      </span>

                      {review.status === "PENDING" && (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          Awaiting Review
                        </span>
                      )}
                      {review.status === "APPROVED" && (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Published
                        </span>
                      )}
                      {review.status === "REJECTED" && (
                        <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                          Rejected
                        </span>
                      )}

                      {review.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <BadgeCheck size={13} /> Verified purchase
                        </span>
                      )}

                      {isTargeted && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                          From notification
                        </span>
                      )}

                      <time className="text-xs text-slate-400" dateTime={review.createdAt.toISOString()}>
                        {review.createdAt.toLocaleDateString("en-LK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>

                    <h2 className="mt-2 font-semibold text-slate-950">{review.title}</h2>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{review.comment}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      By <span className="font-medium text-slate-700">{review.user.name ?? "Customer"}</span> · {review.user.email}
                    </p>
                  </div>

                  <ReviewModerationActions reviewId={review.id} status={review.status} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
