"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Trash2, X } from "lucide-react";
import { deleteProductReviewByAdmin, moderateProductReview } from "@/app/admin/reviews/actions";

type ReviewModerationActionsProps = {
  reviewId: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
};

export default function ReviewModerationActions({
  reviewId,
  status = "PENDING",
}: ReviewModerationActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function moderate(nextStatus: "APPROVED" | "REJECTED") {
    if (pending) return;
    if (
      nextStatus === "REJECTED" &&
      !window.confirm("Reject this review? It won’t appear on the product page.")
    ) {
      return;
    }
    startTransition(async () => {
      const result = await moderateProductReview(reviewId, nextStatus);
      if (!result.success) {
        window.alert(result.message);
      } else {
        window.dispatchEvent(new CustomEvent("notifications:refresh"));
        router.refresh();
      }
    });
  }

  function removeReview() {
    if (pending) return;
    if (
      !window.confirm(
        "Permanently delete this customer review and comment? This action cannot be undone."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteProductReviewByAdmin(reviewId);
      if (!result.success) {
        window.alert(result.message);
      } else {
        window.dispatchEvent(new CustomEvent("notifications:refresh"));
        router.refresh();
      }
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {status !== "APPROVED" && (
        <button
          type="button"
          onClick={() => moderate("APPROVED")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} Approve
        </button>
      )}

      {status !== "REJECTED" && (
        <button
          type="button"
          onClick={() => moderate("REJECTED")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-60"
        >
          <X size={14} /> Reject
        </button>
      )}

      <button
        type="button"
        onClick={removeReview}
        disabled={pending}
        title="Delete review"
        aria-label="Delete review"
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 hover:border-rose-300 disabled:opacity-60"
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
}
