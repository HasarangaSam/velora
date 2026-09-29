import ProductCard from "@/components/shop/ProductCard";
import ProductFilters from "@/components/shop/ProductFilters";
import ProductPagination from "@/components/shop/ProductPagination";
import { getCatalogProducts } from "@/lib/catalog-products";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { getCategoryDisplayName } from "@/lib/category-display";

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Shop",
  description: "Browse fashion and clothing at Velora.",
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  // Next.js resolves search params as a promise in server components, so we wait for them
  // before building the filter state and query inputs.
  const params = await searchParams;

  // Normalize query-string values so filter params behave consistently whether they are
  // single strings or arrays from the URL.
  const getValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  // Fetch the catalog, top-level category tree, and current session in parallel to reduce
  // the initial request latency on the shop page.
  const [catalog, categories, session] = await Promise.all([
    getCatalogProducts({
      search: getValue(params.search),
      category: getValue(params.category),
      saleOnly: getValue(params.saleOnly),
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
    auth(),
  ]);

  // Determine which products are already saved by the current user so we can highlight
  // wishlist state without extra client-side fetches.
  const savedProductIds =
    session?.user?.id && catalog.products.length > 0
      ? new Set(
          (
            await prisma.wishlistItem.findMany({
              where: {
                userId: session.user.id,
                productId: {
                  in: catalog.products.map((product) => product.id),
                },
              },
              select: { productId: true },
            })
          ).map((item) => item.productId),
        )
      : new Set<string>();

  // Resolve the active category label so the page heading and counts can read naturally.
  const selectedCategory = getValue(params.category);
  const selectedCategoryRecord = categories
    .flatMap((category) => [category, ...(category.children ?? [])])
    .find((category) => category.slug === selectedCategory);
  const selectedCategoryName = selectedCategoryRecord
    ? getCategoryDisplayName(selectedCategoryRecord)
    : undefined;

  // "saleOnly" is an optional URL toggle that changes both the header and the empty state.
  const saleOnly = getValue(params.saleOnly) === "true";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
        {/* Header area reflects the currently selected collection state and sale filter. */}
        <div className="mb-8 border-b border-stone-200 pb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Velora / Clothing
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-stone-950 sm:text-4xl">
            {saleOnly
              ? "The Sale Edit"
              : selectedCategoryName
                ? `${selectedCategoryName} collection`
                : "The everyday collection"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            {saleOnly
              ? "Discover considered styles at special prices, while they last."
              : selectedCategoryName
                ? `Explore the latest ${selectedCategoryName.toLowerCase()} styles.`
                : "Considered essentials for the way you live, made for comfort and everyday wear."}
          </p>
        </div>

        {/* Filter UI is driven by the category tree loaded from the database. */}
        <ProductFilters categories={categories} />

        {/* Summary row shows the current count and the price formatting convention. */}
        <div className="mt-8 flex items-center justify-between border-b border-stone-200 pb-3">
          <p className="text-sm text-stone-600">
            {catalog.pagination.total}{" "}
            {saleOnly
              ? "sale items"
              : selectedCategoryName
                ? `${selectedCategoryName.toLowerCase()} items`
                : "items"}
          </p>
          <p className="text-xs text-stone-500">Prices shown in LKR</p>
        </div>

        {/* Empty-state messaging changes based on the active filter context so users know
        whether they should revisit a sale, a category, or general search. */}
        {catalog.products.length === 0 ? (
          <div className="mt-8 rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-medium text-stone-900">
              No products found
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              {saleOnly
                ? "There are no discounted items available right now. Please check back soon."
                : selectedCategoryName
                  ? `There are no ${selectedCategoryName.toLowerCase()} items matching these filters.`
                  : "Try changing your search or filter options."}
            </p>
          </div>
        ) : (
          <>
            {/* Product grid uses a responsive layout and marks each item as saved when it is
            already in the current user's wishlist. */}
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
              {catalog.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSaved={savedProductIds.has(product.id)}
                />
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
