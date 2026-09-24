"use client";

import { useActionState } from "react";
import {
  createCategory,
  type CategoryActionState,
} from "@/app/admin/categories/actions";
import SubmitButton from "./SubmitButton";

const initialState: CategoryActionState = {
  success: false,
  message: "",
};

export default function CategoryForm() {
  const [state, formAction] = useActionState(createCategory, initialState);

  return (
    <form action={formAction} className="space-y-5">
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
          placeholder="Men"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />

        {state.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

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
          placeholder="men"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />

        {state.errors?.slug && (
          <p className="mt-1 text-sm text-red-600">{state.errors.slug[0]}</p>
        )}
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
