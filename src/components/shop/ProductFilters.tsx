"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Category = {
  name: string;
  slug: string;
};

type ProductFiltersProps = {
  categories: Category[];
};

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

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

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();

    updateFilters({
      search,
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <form onSubmit={handleSearch}>
          <label
            htmlFor="search"
            className="mb-2 block text-xs font-medium text-slate-600"
          >
            Search
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              id="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </form>

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
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All categories</option>

            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="name">Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
}
