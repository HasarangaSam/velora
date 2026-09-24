"use client";

import { useActionState } from "react";
import {
  updateCategory,
  type CategoryActionState,
} from "@/app/admin/categories/actions";
import SubmitButton from "./SubmitButton";

type Props = {
  category: {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
  };
};

const initialState: CategoryActionState = {
  success: false,
  message: "",
};

export default function EditCategoryForm({ category }: Props) {
  const updateCategoryWithId = updateCategory.bind(null, category.id);
  const [state, formAction] = useActionState(updateCategoryWithId, initialState);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-4 border-t border-slate-200 pt-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Category Name
        </label>
        <input
          name="name"
          defaultValue={category.name}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          required
        />
        {state.errors?.name && (
          <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Slug
        </label>
        <input
          name="slug"
          defaultValue={category.slug}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          required
        />
        {state.errors?.slug && (
          <p className="mt-1 text-xs text-red-600">{state.errors.slug[0]}</p>
        )}
      </div>

      {category.parentId && (
        <input type="hidden" name="parentId" value={category.parentId} />
      )}

      <SubmitButton pendingText="Saving...">Save changes</SubmitButton>

      {state.message && (
        <p
          className={`text-xs font-medium ${
            state.success ? "text-green-600" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
