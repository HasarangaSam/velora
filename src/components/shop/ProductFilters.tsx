"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductSearchInput from "@/components/shop/ProductSearchInput";

type SubCategory = {
  name: string;
  slug: string;
};

type Category = {
  name: string;
  slug: string;
  children?: SubCategory[];
};

type ProductFiltersProps = {
  categories: Category[];
};

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    setSearch(new URLSearchParams(searchParamsString).get("search") ?? "");
  }, [searchParamsString]);

  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.delete("page");

    router.push(`/shop?${params.toString()}`);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParamsString);
      if (search.trim()) params.set("search", search.trim());
      else params.delete("search");
      params.delete("page");
      const next = params.toString();
      if (next !== searchParamsString) router.replace(`/shop${next ? `?${next}` : ""}`, { scroll: false });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [router, search, searchParamsString]);

  const activeCollection = categories.find((item) =>
    item.slug === category || item.children?.some((child) => child.slug === category),
  );
  const visibleCategories = activeCollection ? [activeCollection] : categories;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-stone-900">
        <SlidersHorizontal className="h-4 w-4" />
        Refine your selection
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <ProductSearchInput id="search" label="Search" value={search} onChange={setSearch}
          onSubmit={(value) => { setSearch(value); updateFilters({ search: value.trim() }); }} />

        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-xs font-medium text-slate-600"
          >
            Category
          </label>

          <select
            id="category"
            value={category}
            onChange={(event) =>
              updateFilters({
                category: event.target.value,
              })
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100"
          >
            {!activeCollection && <option value="">All categories</option>}

            {visibleCategories.map((item) =>
              item.children && item.children.length > 0 ? (
                <optgroup key={item.slug} label={item.name}>
                  <option value={item.slug}>All {item.name}</option>
                  {item.children.map((sub) => (
                    <option key={sub.slug} value={sub.slug}>
                      {sub.name}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="minPrice"
            className="mb-2 block text-xs font-medium text-slate-600"
          >
            Min price
          </label>

          <input
            id="minPrice"
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) =>
              updateFilters({
                minPrice: event.target.value,
              })
            }
            placeholder="0"
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100"
          />
        </div>

        <div>
          <label
            htmlFor="maxPrice"
            className="mb-2 block text-xs font-medium text-slate-600"
          >
            Max price
          </label>

          <input
            id="maxPrice"
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) =>
              updateFilters({
                maxPrice: event.target.value,
              })
            }
            placeholder="100000"
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100"
          />
        </div>

        <div>
          <label
            htmlFor="sort"
            className="mb-2 block text-xs font-medium text-slate-600"
          >
            Sort
          </label>

          <select
            id="sort"
            value={sort}
            onChange={(event) =>
              updateFilters({
                sort: event.target.value,
              })
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100"
          >
            <option value="newest">Newest</option>
            <option value="name">Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>
      {(category || minPrice || maxPrice || searchParams.get("search")) && (
        <button type="button" onClick={() => { setSearch(""); updateFilters({ category: "", minPrice: "", maxPrice: "", search: "" }); }}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-950">
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );
}
