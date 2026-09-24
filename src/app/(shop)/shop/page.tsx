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

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            Velora collection
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Shop
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Explore our latest clothing collection and find styles for everyday
            wear.
          </p>
        </div>

        <ProductFilters categories={categories} />

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {catalog.pagination.total} products
          </p>
        </div>

        {catalog.products.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No products found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or filter options.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
