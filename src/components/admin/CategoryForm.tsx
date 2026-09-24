"use client";

import { useActionState } from "react";
import {
  createCategory,
  type CategoryActionState,
} from "@/app/admin/categories/actions";
import SubmitButton from "./SubmitButton";

type ParentCategory = { id: string; name: string };

const initialState: CategoryActionState = {
  success: false,
  message: "",
};

export default function CategoryForm({
  parentCategories,
}: {
  parentCategories: ParentCategory[];
}) {
  const [state, formAction] = useActionState(createCategory, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {/* Name */}
      <div>
        <label
          htmlFor="category-name"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Category name
        </label>
        <input
          id="category-name"
          name="name"
          required
          placeholder="e.g. Shirts"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {state.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label
          htmlFor="category-slug"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Slug
        </label>
        <input
          id="category-slug"
          name="slug"
          required
          placeholder="e.g. shirts"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {state.errors?.slug && (
          <p className="mt-1 text-sm text-red-600">{state.errors.slug[0]}</p>
        )}
      </div>

      {/* Parent category (optional) */}
      <div>
        <label
          htmlFor="category-parent"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Parent category{" "}
          <span className="text-xs font-normal text-slate-400">(leave empty for top-level)</span>
        </label>
        <select
          id="category-parent"
          name="parentId"
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
        >
          <option value="">— Top-level category —</option>
          {parentCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {state.message && (
        <p
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <SubmitButton pendingText="Creating...">Create category</SubmitButton>
    </form>
  );
}
