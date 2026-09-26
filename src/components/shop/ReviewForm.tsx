"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProductReview, saveProductReview, type ProductReviewActionState } from "@/app/account/reviews/actions";
import StarRating from "@/components/shop/StarRating";

const initialState: ProductReviewActionState = { success: false, message: "" };

function ReviewSubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Saving…" : isEdit ? "Update review" : "Submit review"}
    </button>
  );
}

export default function ReviewForm({
  productId,
  existing,
  allowDelete = false,
}: {
  productId: string;
  existing?: { id: string; rating: number; title: string; comment: string; status: string; updatedAt?: Date } | null;
  allowDelete?: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveProductReview.bind(null, productId), initialState);
  const [deleting, startDelete] = useTransition();
  const [rating, setRating] = useState(existing?.rating ?? 0);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  function handleDelete() {
    if (!existing || deleting || !window.confirm("Delete your review?")) return;
    startDelete(async () => {
      const result = await deleteProductReview(existing.id);
      if (!result.success) window.alert(result.message);
      else router.refresh();
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      {existing?.status && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          Your review is {existing.status.toLowerCase()}. Changes will be reviewed before appearing publicly.
        </p>
      )}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800">Your rating</label>
        <StarRating rating={rating} onChange={setRating} />
        {state.errors?.rating && <p className="mt-1 text-xs text-rose-600">{state.errors.rating[0]}</p>}
      </div>
      <div>
        <label htmlFor={`review-title-${productId}`} className="mb-1.5 block text-sm font-medium text-slate-800">Review title</label>
        <input id={`review-title-${productId}`} name="title" required minLength={3} maxLength={80} defaultValue={existing?.title ?? ""} placeholder="What stood out to you?" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-100" />
        {state.errors?.title && <p className="mt-1 text-xs text-rose-600">{state.errors.title[0]}</p>}
      </div>
      <div>
        <label htmlFor={`review-comment-${productId}`} className="mb-1.5 block text-sm font-medium text-slate-800">Your review</label>
        <textarea id={`review-comment-${productId}`} name="comment" required minLength={15} maxLength={1500} rows={4} defaultValue={existing?.comment ?? ""} placeholder="Share a little about the fit, fabric, and how it worked for you." className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm leading-6 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-100" />
        {state.errors?.comment && <p className="mt-1 text-xs text-rose-600">{state.errors.comment[0]}</p>}
      </div>
      {state.message && <p role={state.success ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${state.success ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{state.message}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <ReviewSubmitButton isEdit={Boolean(existing)} />
        {allowDelete && existing && <button type="button" onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"><Trash2 size={15} />{deleting ? "Deleting…" : "Delete review"}</button>}
      </div>
    </form>
  );
}
