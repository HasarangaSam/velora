import ProductCard from "@/components/shop/ProductCard";
import ProductFilters from "@/components/shop/ProductFilters";
import ProductPagination from "@/components/shop/ProductPagination";
import { getCatalogProducts } from "@/lib/catalog-products";
import { prisma } from "@/lib/db/prisma";

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Shop",
  description: "Browse fashion and clothing at Velora.",
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const getValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const [catalog, categories] = await Promise.all([
    getCatalogProducts({
      search: getValue(params.search),
      category: getValue(params.category),
      minPrice: getValue(params.minPrice),
      maxPrice: getValue(params.maxPrice),
      sort: getValue(params.sort),
      page: getValue(params.page),
    }),

    prisma.category.findMany({
      where: { parentId: null },
      orderBy: {
        name: "asc",
      },
      include: {
        children: {
          orderBy: {
            name: "asc",
          },
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  const selectedCategory = getValue(params.category);
  const selectedCategoryName = categories
    .flatMap((category) => [category, ...(category.children ?? [])])
    .find((category) => category.slug === selectedCategory)?.name;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
        <div className="mb-8 border-b border-stone-200 pb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Velora / Clothing</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-stone-950 sm:text-4xl">
            {selectedCategoryName ? `${selectedCategoryName} collection` : "The everyday collection"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            {selectedCategoryName ? `Explore the latest ${selectedCategoryName.toLowerCase()} styles.` : "Considered essentials for the way you live, made for comfort and everyday wear."}
          </p>
        </div>

        <ProductFilters categories={categories} />

        <div className="mt-8 flex items-center justify-between border-b border-stone-200 pb-3">
          <p className="text-sm text-stone-600">
            {catalog.pagination.total} {selectedCategoryName ? `${selectedCategoryName.toLowerCase()} ` : ""}items
          </p>
          <p className="text-xs text-stone-500">Prices shown in LKR</p>
        </div>

        {catalog.products.length === 0 ? (
          <div className="mt-8 rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-medium text-stone-900">
              No products found
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              {selectedCategoryName ? `There are no ${selectedCategoryName.toLowerCase()} items matching these filters.` : "Try changing your search or filter options."}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
              {catalog.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <ProductPagination
              page={catalog.pagination.page}
              totalPages={catalog.pagination.totalPages}
              searchParams={params}
            />
          </>
        )}
      </div>
    </main>
  );
}
