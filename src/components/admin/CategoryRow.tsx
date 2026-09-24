"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import EditCategoryForm from "./EditCategoryForm";
import DeleteCategoryButton from "./DeleteCategoryButton";

type Props = {
  category: {
    id: string;
    name: string;
    slug: string;
    productCount: number;
    isParent: boolean;
    childCount: number;
    parentName?: string;
  };
};

export default function CategoryRow({ category }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div
      className={`px-6 py-4 ${
        !category.isParent
          ? "pl-12 bg-slate-50/60 border-l-2 border-blue-100"
          : ""
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {!category.isParent && (
            <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900 truncate">
                {category.name}
              </p>
              {category.isParent && category.childCount > 0 && (
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex-shrink-0">
                  {category.childCount} sub
                </span>
              )}
              {!category.isParent && category.parentName && (
                <span className="text-[11px] text-slate-400 flex-shrink-0">
                  under {category.parentName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">/{category.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="text-xs text-slate-500">
            {category.productCount}{" "}
            {category.productCount === 1 ? "product" : "products"}
          </span>

          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {editing ? "Cancel" : "Edit"}
          </button>

          {category.productCount === 0 && category.childCount === 0 && (
            <DeleteCategoryButton categoryId={category.id} />
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4">
          <EditCategoryForm
            category={{
              id: category.id,
              name: category.name,
              slug: category.slug,
            }}
          />
        </div>
      )}
    </div>
  );
}
