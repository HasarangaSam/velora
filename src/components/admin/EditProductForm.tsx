"use client";

import { useActionState, useState } from "react";
import { PRODUCT_COLOURS, PRODUCT_SIZES } from "@/lib/catalog";
import SubmitButton from "./SubmitButton";
import {
  updateProduct,
  type ProductActionState,
} from "@/app/admin/products/actions";

type Variant = {
  id?: string;
  size: string;
  colour: string;
  price: string;
  stock: string;
};

type SubCategory = {
  id: string;
  name: string;
  slug: string;
};

type Category = {
  id: string;
  name: string;
  children?: SubCategory[];
};

type Product = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  subCategoryId?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  variants: {
    id: string;
    size: string;
    colour: string;
    price: string;
    stock: number;
  }[];
};

type EditProductFormProps = {
  product: Product;
  categories: Category[];
};

const emptyVariant: Variant = {
  size: "M",
  colour: "Black",
  price: "",
  stock: "0",
};

const initialState: ProductActionState = {
  success: false,
  message: "",
};

export default function EditProductForm({
  product,
  categories,
}: EditProductFormProps) {
  const updateProductWithId = updateProduct.bind(null, product.id);
  const [state, formAction] = useActionState(updateProductWithId, initialState);

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [subCategoryId, setSubCategoryId] = useState(
    product.subCategoryId ?? "",
  );
  const [isActive, setIsActive] = useState(product.isActive);
  const [isFeatured, setIsFeatured] = useState(product.isFeatured);

  const subCategories =
    categories.find((c) => c.id === categoryId)?.children ?? [];

  const [variants, setVariants] = useState<Variant[]>(
    product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      colour: variant.colour,
      price: variant.price,
      stock: String(variant.stock),
    })),
  );

  function updateVariant(index: number, field: keyof Variant, value: string) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    );
  }

  function addVariant() {
    setVariants((current) => [...current, { ...emptyVariant }]);
  }

  function removeVariant(index: number) {
    if (variants.length === 1) {
      alert("A product must have at least one variant.");
      return;
    }

    setVariants((current) =>
      current.filter((_, variantIndex) => variantIndex !== index),
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="isActive" value={String(isActive)} />
      <input type="hidden" name="isFeatured" value={String(isFeatured)} />
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Product information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Update the basic information for this product.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Product name
            </label>

            <input
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={150}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Category
            </label>

            <select
              id="category"
              name="categoryId"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setSubCategoryId("");
              }}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {subCategories.length > 0 && (
            <div>
              <label
                htmlFor="subCategory"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sub-category{" "}
                <span className="text-xs font-normal text-slate-400">
                  (optional)
                </span>
              </label>

              <select
                id="subCategory"
                name="subCategoryId"
                value={subCategoryId}
                onChange={(event) => setSubCategoryId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">— No sub-category —</option>
                {subCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={6}
              maxLength={5000}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4"
              />
              Active product
            </label>

            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(event) => setIsFeatured(event.target.checked)}
                className="h-4 w-4"
              />
              Featured product
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Product variants
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage available sizes, colours, prices and stock.
            </p>
          </div>

          <button
            type="button"
            onClick={addVariant}
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Add variant
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div
              key={variant.id ?? `new-${index}`}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Size / fit
                  </label>

                  <select
                    value={variant.size}
                    onChange={(event) =>
                      updateVariant(index, "size", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    {PRODUCT_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Colour
                  </label>

                  <select
                    value={variant.colour}
                    onChange={(event) =>
                      updateVariant(index, "colour", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    {PRODUCT_COLOURS.map((colour) => (
                      <option key={colour} value={colour}>
                        {colour}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Price (LKR)
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={variant.price}
                    onChange={(event) =>
                      updateVariant(index, "price", event.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Stock quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={variant.stock}
                    onChange={(event) =>
                      updateVariant(index, "stock", event.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Remove variant
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {state.message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            !state.success
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving changes...">
          Save changes
        </SubmitButton>
      </div>
    </form>
  );
}
