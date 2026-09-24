"use client";

import { useTransition } from "react";
import { deleteCategory } from "@/app/admin/categories/actions";

type Props = {
  categoryId: string;
};

export default function DeleteCategoryButton({ categoryId }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?",
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const res = await deleteCategory(categoryId);
      if (!res.success) {
        window.alert(res.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
