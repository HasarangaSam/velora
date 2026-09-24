"use client";

import { useState } from "react";
import EditCategoryForm from "./EditCategoryForm";
import DeleteCategoryButton from "./DeleteCategoryButton";

type Props = {
  category: {
    id: string;
    name: string;
    slug: string;
    productCount: number;
  };
};

export default function CategoryRow({ category }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-slate-900">{category.name}</p>

          <p className="mt-1 text-sm text-slate-500">/{category.slug}</p>
        </div>

        <div className="flex items-center gap-5">
          <span className="text-sm text-slate-500">
            {category.productCount}{" "}
            {category.productCount === 1 ? "product" : "products"}
          </span>

          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {editing ? "Cancel" : "Edit"}
          </button>

          {category.productCount === 0 && (
            <DeleteCategoryButton categoryId={category.id} />
          )}
        </div>
      </div>

      {editing && <EditCategoryForm category={category} />}
    </div>
  );
}
