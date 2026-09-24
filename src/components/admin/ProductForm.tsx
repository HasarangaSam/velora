"use client";

import { useActionState, useState } from "react";
import { PRODUCT_COLOURS, PRODUCT_SIZES } from "@/lib/catalog";
import {
  createProduct,
  type ProductActionState,
} from "@/app/admin/products/actions";
import SubmitButton from "./SubmitButton";

type Variant = {
  size: string;
  colour: string;
  price: string;
  stock: string;
};

type ProductFormProps = {
  categories: {
    id: string;
    name: string;
  }[];
};

const initialVariant: Variant = {
  size: "M",
  colour: "Black",
  price: "",
  stock: "0",
};

const initialState: ProductActionState = {
  success: false,
  message: "",
};

export default function ProductForm({ categories }: ProductFormProps) {
  const [state, formAction] = useActionState(createProduct, initialState);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [variants, setVariants] = useState<Variant[]>([
    {
      ...initialVariant,
    },
  ]);

  function updateVariant(index: number, field: keyof Variant, value: string) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              [field]: value,
            }
          : variant,
      ),
    );
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        ...initialVariant,
      },
    ]);
  }

  function removeVariant(index: number) {
    setVariants((current) =>
      current.filter((_, variantIndex) => variantIndex !== index),
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="isActive" value={String(isActive)} />

      <input type="hidden" name="isFeatured" value={String(isFeatured)} />

      <input type="hidden" name="isFeatured" value="false" />

      <div className="grid gap-6 md:grid-cols-2">
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
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="Classic Oxford Shirt"
          />

          {state.errors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Category
          </label>

          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="" disabled>
              Select category
            </option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {state.errors?.categoryId && (
            <p className="mt-1 text-sm text-red-600">
              {state.errors.categoryId[0]}
            </p>
          )}
        </div>
      </div>

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
          required
          rows={5}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          placeholder="Describe the product..."
        />

        {state.errors?.description && (
          <p className="mt-1 text-sm text-red-600">
            {state.errors.description[0]}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          Active
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
          />
          Featured
        </label>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Variants</h2>

            <p className="text-sm text-slate-500">
              Add the available size, colour, price, and stock.
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
            <div key={index} className="rounded-xl border border-slate-200 p-4">
              <div className="grid gap-4 md:grid-cols-4">
                <select
                  value={variant.size}
                  onChange={(event) =>
                    updateVariant(index, "size", event.target.value)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  {PRODUCT_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>

                <select
                  value={variant.colour}
                  onChange={(event) =>
                    updateVariant(index, "colour", event.target.value)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  {PRODUCT_COLOURS.map((colour) => (
                    <option key={colour} value={colour}>
                      {colour}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.price}
                  onChange={(event) =>
                    updateVariant(index, "price", event.target.value)
                  }
                  placeholder="Price"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  required
                />

                <input
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(event) =>
                    updateVariant(index, "stock", event.target.value)
                  }
                  placeholder="Stock"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </div>

              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
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
            state.success
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <SubmitButton pendingText="Creating product...">
        Create product
      </SubmitButton>
    </form>
  );
}
