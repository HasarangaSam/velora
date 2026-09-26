"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
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

type SelectedImage = { file: File; previewUrl: string };

const initialVariant: Variant = { size: "M", colour: "Black", price: "", stock: "0" };

const initialState: ProductActionState = { success: false, message: "" };

export default function ProductForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState(createProduct, initialState);
  const router = useRouter();
  const [images, setImages] = useState<SelectedImage[]>([]);
  const imagePreviewUrls = useRef<string[]>([]);
  const [imageProgress, setImageProgress] = useState("");
  const [imageError, setImageError] = useState("");
  const processedProductId = useRef<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [variants, setVariants] = useState<Variant[]>([{ ...initialVariant }]);

  useEffect(() => () => {
    imagePreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // Sub-categories for the currently selected main category
  const subCategories =
    categories.find((c) => c.id === selectedCategoryId)?.children ?? [];

  useEffect(() => {
    if (!state.success || !state.productId || processedProductId.current === state.productId) return;
    const productId = state.productId;
    processedProductId.current = productId;

    async function uploadSelectedImages() {
      const failures: string[] = [];
      for (let index = 0; index < images.length; index++) {
        const file = images[index].file;
        setImageProgress(`Uploading image ${index + 1} of ${images.length}: ${file.name}`);
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
          failures.push(`${file.name} (must be an image up to 5 MB)`);
          continue;
        }
        try {
          const body = new FormData();
          body.append("image", file);
          const response = await fetch(`/api/admin/products/${productId}/images`, { method: "POST", body });
          const data = await response.json();
          if (!response.ok) failures.push(`${file.name} (${data.message ?? "upload failed"})`);
        } catch {
          failures.push(`${file.name} (network error)`);
        }
      }

      if (failures.length) {
        setImageError(`Some images could not be uploaded: ${failures.join(", ")}. You can add them from the product edit page.`);
        setImageProgress("");
        return;
      } else {
        router.replace("/admin/products");
      }
    }

    void uploadSelectedImages();
  }, [images, router, state.productId, state.success]);

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
            <p className="text-xs text-slate-500 mt-0.5">Set size or choose One Size for sarees and other size-free products. Stock is tracked per option.</p>
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
                <label className="space-y-1 text-xs font-medium text-slate-600">
                  Size / fit
                  <select
                    value={variant.size}
                    onChange={(e) => updateVariant(index, "size", e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800"
                  >
                    {PRODUCT_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-xs font-medium text-slate-600">
                  Colour
                  <select
                    value={variant.colour}
                    onChange={(e) => updateVariant(index, "colour", e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800"
                  >
                    {PRODUCT_COLOURS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-xs font-medium text-slate-600">
                  Price (LKR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.price}
                    onChange={(e) => updateVariant(index, "price", e.target.value)}
                    placeholder="0.00"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800"
                    required
                  />
                </label>

                <label className="space-y-1 text-xs font-medium text-slate-600">
                  Stock quantity
                  <input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(e) => updateVariant(index, "stock", e.target.value)}
                    placeholder="0"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800"
                    required
                  />
                </label>
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

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <ImagePlus size={19} aria-hidden="true" />
          </span>
          <div>
            <label htmlFor="productImages" className="block text-sm font-semibold text-slate-900">
              Product images
            </label>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Add photos for the product gallery. The first photo is used as the main image.
            </p>
          </div>
        </div>

        <label htmlFor="productImages" className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
          <span className="text-sm font-medium text-slate-800">Choose product photos</span>
          <span className="mt-1 text-xs text-slate-500">JPG, PNG or WEBP · Up to 5 MB each · Select multiple</span>
          <input id="productImages" type="file" accept="image/jpeg,image/png,image/webp" multiple
            onChange={(event) => {
              imagePreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
              const selected = Array.from(event.target.files ?? []).map((file) => ({
                file,
                previewUrl: URL.createObjectURL(file),
              }));
              imagePreviewUrls.current = selected.map((image) => image.previewUrl);
              setImages(selected);
            }}
            className="sr-only" />
        </label>

        {images.length > 0 && (
          <div className="mt-5">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Selected photos <span className="font-normal text-slate-500">({images.length})</span>
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image, index) => (
                <div key={`${image.file.name}-${index}`} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <div role="img" aria-label={`Preview of ${image.file.name}`} className="aspect-[4/5] bg-cover bg-center"
                    style={{ backgroundImage: `url("${image.previewUrl}")` }} />
                  <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${index === 0 ? "bg-slate-900 text-white" : "bg-white/95 text-slate-700"}`}>
                    {index === 0 ? "Main image" : `Image ${index + 1}`}
                  </span>
                  <button type="button" aria-label={`Remove ${image.file.name}`} onClick={() => {
                    URL.revokeObjectURL(image.previewUrl);
                    const nextImages = images.filter((_, imageIndex) => imageIndex !== index);
                    imagePreviewUrls.current = nextImages.map((selectedImage) => selectedImage.previewUrl);
                    setImages(nextImages);
                  }} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-700">
                    <X size={16} aria-hidden="true" />
                  </button>
                  <div className="truncate border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-600" title={image.file.name}>
                    {image.file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {imageProgress && <p role="status" className="mt-3 text-sm text-blue-700">{imageProgress}</p>}
        {imageError && <p role="alert" className="mt-3 text-sm text-amber-700">{imageError}</p>}
      </section>

      {state.message && (
        <p
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}

      {imageError && state.productId && (
        <a href={`/admin/products/${state.productId}`} className="inline-flex rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
          Continue to product images
        </a>
      )}

      <SubmitButton pendingText="Creating product..." disabled={state.success}>Create product</SubmitButton>
    </form>
  );
}
