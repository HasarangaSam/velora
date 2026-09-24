"use client";

import { useActionState, useState } from "react";
import { PRODUCT_COLOURS, PRODUCT_SIZES } from "@/lib/catalog";
import {
  createProduct,
  type ProductActionState,
} from "@/app/admin/products/actions";
import SubmitButton from "./SubmitButton";

type SubCategory = { id: string; name: string; slug: string };

type Category = {
  id: string;
  name: string;
  children: SubCategory[];
};

type Variant = {
  size: string;
  colour: string;
  price: string;
  stock: string;
};

const initialVariant: Variant = { size: "M", colour: "Black", price: "", stock: "0" };

const initialState: ProductActionState = { success: false, message: "" };

export default function ProductForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState(createProduct, initialState);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [variants, setVariants] = useState<Variant[]>([{ ...initialVariant }]);

  // Sub-categories for the currently selected main category
  const subCategories =
    categories.find((c) => c.id === selectedCategoryId)?.children ?? [];

  function updateVariant(index: number, field: keyof Variant, value: string) {
    setVariants((cur) =>
      cur.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="isActive" value={String(isActive)} />
      <input type="hidden" name="isFeatured" value={String(isFeatured)} />
      <input
        type="hidden"
        name="variants"
        value={JSON.stringify(variants)}
      />

      {/* Name + Category row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
            Product name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Classic Oxford Shirt"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {state.errors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
          )}
        </div>

        {/* Main category */}
        <div>
          <label htmlFor="categoryId" className="mb-2 block text-sm font-medium text-slate-700">
            Main category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="" disabled>Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {state.errors?.categoryId && (
            <p className="mt-1 text-sm text-red-600">{state.errors.categoryId[0]}</p>
          )}
        </div>
      </div>

      {/* Sub-category — only shown when main category has children */}
      {subCategories.length > 0 && (
        <div>
          <label htmlFor="subCategoryId" className="mb-2 block text-sm font-medium text-slate-700">
            Sub-category{" "}
            <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <select
            id="subCategoryId"
            name="subCategoryId"
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">— No sub-category —</option>
            {subCategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          placeholder="Describe the product..."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {state.errors?.description && (
          <p className="mt-1 text-sm text-red-600">{state.errors.description[0]}</p>
        )}
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
          />
          Active (visible in shop)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="rounded"
          />
          Featured (shown on homepage)
        </label>
      </div>

      {/* Variants */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Variants</h2>
            <p className="text-xs text-slate-500 mt-0.5">Define size, colour, price and stock.</p>
          </div>
          <button
            type="button"
            onClick={() => setVariants((cur) => [...cur, { ...initialVariant }])}
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
          >
            + Add variant
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <select
                  value={variant.size}
                  onChange={(e) => updateVariant(index, "size", e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {PRODUCT_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={variant.colour}
                  onChange={(e) => updateVariant(index, "colour", e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {PRODUCT_COLOURS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.price}
                  onChange={(e) => updateVariant(index, "price", e.target.value)}
                  placeholder="Price (LKR)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />

                <input
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(e) => updateVariant(index, "stock", e.target.value)}
                  placeholder="Stock"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setVariants((cur) => cur.filter((_, i) => i !== index))
                  }
                  className="mt-3 text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Remove variant
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {state.message && (
        <p
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <SubmitButton pendingText="Creating product...">Create product</SubmitButton>
    </form>
  );
}
