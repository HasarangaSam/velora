"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, X } from "lucide-react";
import { moderateProductReview } from "@/app/admin/reviews/actions";

export default function ReviewModerationActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function moderate(status: "APPROVED" | "REJECTED") {
    if (pending) return;
    if (status === "REJECTED" && !window.confirm("Reject this review? It won’t appear on the product page.")) return;
    startTransition(async () => {
      const result = await moderateProductReview(reviewId, status);
      if (!result.success) window.alert(result.message);
      else router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button type="button" onClick={() => moderate("APPROVED")} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
        {pending ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} Approve
      </button>
      <button type="button" onClick={() => moderate("REJECTED")} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60">
        <X size={14} /> Reject
      </button>
    </div>
  );
}
