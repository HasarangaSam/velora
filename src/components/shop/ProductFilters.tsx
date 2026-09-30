"use client";

import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
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

const SORT_LABELS: Record<string, string> = {
  newest: "Newest",
  name: "Name",
  "price-low": "Price: Low to High",
  "price-high": "Price: High to Low",
};

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
  const [mobileExpanded, setMobileExpanded] = useState(false);

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

  // Active filter calculation for mobile chips & clear button
  const hasCategory = Boolean(category);
  const hasSearch = Boolean(search.trim());
  const hasPrice = Boolean(minPrice.trim() || maxPrice.trim());
  const hasCustomSort = Boolean(sort && sort !== "newest");
  const hasActiveFilters = Boolean(
    category || minPrice || maxPrice || searchParams.get("search"),
  );

  let activeFilterCount = 0;
  if (hasCategory) activeFilterCount++;
  if (hasSearch) activeFilterCount++;
  if (hasPrice) activeFilterCount++;
  if (hasCustomSort) activeFilterCount++;

  function getActiveCategoryLabel(slug: string): string {
    for (const item of categories) {
      if (item.slug === slug) return getCategoryDisplayName(item);
      if (item.children) {
        for (const child of item.children) {
          if (child.slug === slug) return getCategoryDisplayName(child);
        }
      }
    }
    return slug;
  }

  function handleClearAll() {
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
  }

  const priceBadgeLabel =
    minPrice && maxPrice
      ? `LKR ${Number(minPrice).toLocaleString("en-LK")} - ${Number(maxPrice).toLocaleString("en-LK")}`
      : minPrice
        ? `From LKR ${Number(minPrice).toLocaleString("en-LK")}`
        : maxPrice
          ? `Up to LKR ${Number(maxPrice).toLocaleString("en-LK")}`
          : "";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      {/* Mobile-only Header Bar: Collapsible toggle with filter count */}
      <div className="flex sm:hidden items-center justify-between">
        <button
          type="button"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-stone-900 focus:outline-none"
          aria-expanded={mobileExpanded}
        >
          <SlidersHorizontal className="h-4 w-4 text-blue-600" />
          <span>Filters &amp; Sort</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white shadow-xs">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 py-1 px-2 rounded-lg hover:bg-rose-50 transition"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-stone-600 py-1 px-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition"
            aria-expanded={mobileExpanded}
          >
            <span>{mobileExpanded ? "Hide" : "Expand"}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                mobileExpanded ? "rotate-180 text-blue-600" : "text-stone-400"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Active Filter Chips (shown when collapsed on mobile) */}
      {!mobileExpanded && (hasCategory || hasSearch || hasPrice || hasCustomSort) && (
        <div className="sm:hidden mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-stone-500 font-medium mr-1">Active:</span>

          {hasCategory && (
            <button
              type="button"
              onClick={() => updateFilters({ category: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 transition"
              title="Remove category filter"
            >
              <span>{getActiveCategoryLabel(category)}</span>
              <X className="h-3 w-3" />
            </button>
          )}

          {hasSearch && (
            <button
              type="button"
              onClick={() => {
                setDrafts((current) => ({ ...current, search: "" }));
                updateFilters({ search: "" });
              }}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 transition"
              title="Clear search"
            >
              <span>&ldquo;{search.trim()}&rdquo;</span>
              <X className="h-3 w-3" />
            </button>
          )}

          {hasPrice && (
            <button
              type="button"
              onClick={() => {
                setDrafts((current) => ({
                  ...current,
                  minPrice: "",
                  maxPrice: "",
                }));
                updateFilters({ minPrice: "", maxPrice: "" });
              }}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 transition"
              title="Remove price range"
            >
              <span>{priceBadgeLabel}</span>
              <X className="h-3 w-3" />
            </button>
          )}

          {hasCustomSort && (
            <button
              type="button"
              onClick={() => updateFilters({ sort: "newest" })}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 transition"
              title="Reset sort order"
            >
              <span>Sort: {SORT_LABELS[sort] ?? sort}</span>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Desktop Header: Exact original appearance */}
      <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-stone-900">
        <SlidersHorizontal className="h-4 w-4" />
        Refine your selection
      </div>

      {/* Inputs Grid: Hidden on mobile when collapsed, exact original grid layout on sm & lg */}
      <div
        className={`${
          mobileExpanded ? "grid" : "hidden"
        } sm:grid mt-4 gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]`}
      >
        <ProductSearchInput
          id="search"
          label="Search"
          showSuggestions={false}
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

      {/* Mobile action button when expanded */}
      {mobileExpanded && (
        <div className="sm:hidden mt-4 pt-3 border-t border-stone-100 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileExpanded(false)}
            className="w-full rounded-xl bg-stone-900 py-2.5 text-center text-xs font-semibold text-white hover:bg-stone-800 transition shadow-xs"
          >
            Done &amp; View Results
          </button>
        </div>
      )}

      {/* Desktop Clear filters button: Exact original position & style */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearAll}
          className="hidden sm:inline-flex mt-4 items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-950"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );
}
