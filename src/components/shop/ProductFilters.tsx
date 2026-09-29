"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductSearchInput from "@/components/shop/ProductSearchInput";
import { getCategoryDisplayName } from "@/lib/category-display";

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

// Keep URL-driven filter fields in sync with local input state so the user can edit filters
// without losing the current focus or trigger a full remount.
type FilterDrafts = {
  query: string;
  search: string;
  minPrice: string;
  maxPrice: string;
};

function getFilterDrafts(query: string): FilterDrafts {
  const params = new URLSearchParams(query);
  return {
    query,
    search: params.get("search") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
  };
}

const FILTER_DEBOUNCE_MS = 500;

export default function ProductFilters({ categories }: ProductFiltersProps) {
  return <ProductFiltersForm categories={categories} />;
}

// The form reads from the current URL params, updates the query string, and debounces price/search
// edits so the shop list refreshes without an unnecessary burst of navigation events.
function ProductFiltersForm({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [drafts, setDrafts] = useState(() =>
    getFilterDrafts(searchParamsString),
  );

  // Sync external URL changes without remounting the inputs. Keying the form to
  // the query string loses focus whenever a debounced price update navigates.
  if (drafts.query !== searchParamsString) {
    setDrafts(getFilterDrafts(searchParamsString));
  }
  const currentDrafts =
    drafts.query === searchParamsString
      ? drafts
      : getFilterDrafts(searchParamsString);
  const { search, minPrice, maxPrice } = currentDrafts;

  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

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
      const nextSearch = search.trim();
      const currentSearch = params.get("search") ?? "";
      const nextMinPrice = minPrice.trim();
      const nextMaxPrice = maxPrice.trim();
      const currentMinPrice = params.get("minPrice") ?? "";
      const currentMaxPrice = params.get("maxPrice") ?? "";

      if (nextSearch) params.set("search", nextSearch);
      else params.delete("search");
      if (nextMinPrice) params.set("minPrice", nextMinPrice);
      else params.delete("minPrice");
      if (nextMaxPrice) params.set("maxPrice", nextMaxPrice);
      else params.delete("maxPrice");

      if (
        nextSearch !== currentSearch ||
        nextMinPrice !== currentMinPrice ||
        nextMaxPrice !== currentMaxPrice
      ) {
        params.delete("page");
      }

      const next = params.toString();
      if (next !== searchParamsString) {
        router.replace(`/shop${next ? `?${next}` : ""}`, { scroll: false });
      }
    }, FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [router, search, minPrice, maxPrice, searchParamsString]);

  const activeCollection = categories.find(
    (item) =>
      item.slug === category ||
      item.children?.some((child) => child.slug === category),
  );
  const visibleCategories = activeCollection ? [activeCollection] : categories;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-stone-900">
        <SlidersHorizontal className="h-4 w-4" />
        Refine your selection
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <ProductSearchInput
          id="search"
          label="Search"
          value={search}
          onChange={(value) =>
            setDrafts((current) => ({ ...current, search: value }))
          }
          onSubmit={(value) => {
            setDrafts((current) => ({ ...current, search: value }));
            updateFilters({ search: value.trim() });
          }}
          onClear={() => {
            setDrafts((current) => ({ ...current, search: "" }));
            updateFilters({ search: "" });
          }}
        />

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
                      {getCategoryDisplayName(sub)}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option key={item.slug} value={item.slug}>
                  {getCategoryDisplayName(item)}
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
              setDrafts((current) => ({
                ...current,
                minPrice: event.target.value,
              }))
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
              setDrafts((current) => ({
                ...current,
                maxPrice: event.target.value,
              }))
            }
            placeholder="No maximum"
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
        <button
          type="button"
          onClick={() => {
            setDrafts((current) => ({
              ...current,
              search: "",
              minPrice: "",
              maxPrice: "",
            }));
            updateFilters({
              category: "",
              minPrice: "",
              maxPrice: "",
              search: "",
            });
          }}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-950"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );
}
