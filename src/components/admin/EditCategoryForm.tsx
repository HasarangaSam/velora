"use client";

import { useState } from "react";

type Props = {
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

export default function EditCategoryForm({ category }: Props) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Unable to update category.");
        return;
      }

      setMessage("Category updated successfully.");
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 border-t border-slate-200 pt-4"
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        required
      />

      <input
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        required
      />

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save changes"}
      </button>

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  );
}
