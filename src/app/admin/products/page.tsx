import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import Image from "next/image";
import ProductRowActions from "@/components/admin/ProductRowActions";

type AdminProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/account");
  }

  const params = await searchParams;
  const getValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const search = (getValue(params.search) ?? "").trim().slice(0, 100);
  const requestedStatus = getValue(params.status);
  const status = requestedStatus === "active" || requestedStatus === "inactive"
    ? requestedStatus
    : "all";
  const categorySlug = getValue(params.category) ?? "";
  const requestedPage = Number.parseInt(getValue(params.page) ?? "1", 10);
  const safeRequestedPage = Number.isFinite(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;

  const where = {
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(status !== "all" ? { isActive: status === "active" } : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
  };

  const [totalProducts, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { parentId: null },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const page = Math.min(safeRequestedPage, totalPages);
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      variants: true,
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  function pageHref(targetPage: number) {
    const nextParams = new URLSearchParams();
    if (search) nextParams.set("search", search);
    if (status !== "all") nextParams.set("status", status);
    if (categorySlug) nextParams.set("category", categorySlug);
    if (targetPage > 1) nextParams.set("page", String(targetPage));
    const query = nextParams.toString();
    return `/admin/products${query ? `?${query}` : ""}`;
  }

  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600">Catalog</p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">Products</h1>

            <p className="mt-2 text-slate-500">
              Manage Velora products, variants, pricing, and inventory.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Add product
          </Link>
        </div>

        <form action="/admin/products" method="get" className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(220px,1fr)_minmax(160px,220px)_minmax(160px,220px)_auto] sm:items-end">
          <div>
            <label htmlFor="search" className="mb-1.5 block text-xs font-medium text-slate-600">Search by name</label>
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Product name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label htmlFor="category" className="mb-1.5 block text-xs font-medium text-slate-600">Category</label>
            <select id="category" name="category" defaultValue={categorySlug} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="mb-1.5 block text-xs font-medium text-slate-600">Status</label>
            <select id="status" name="status" defaultValue={status} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700">Apply</button>
            <Link href="/admin/products" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Clear</Link>
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {products.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                {totalProducts === 0 && !search && status === "all" && !categorySlug ? "No products yet" : "No matching products"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {totalProducts === 0 && !search && status === "all" && !categorySlug
                  ? "Add your first product to start building the catalog."
                  : "Try changing your search or filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                      Product
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                      Category
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                      Variants
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                      Stock
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                      Status
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {products.map((product) => {
                    const totalStock = product.variants.reduce(
                      (total, variant) => total + variant.stock,
                      0,
                    );

                    const primaryImage = product.images[0];

                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                              {primaryImage ? (
                                <Image src={primaryImage.url} alt={product.name} width={48} height={48} className="h-full w-full object-cover" />
                              ) : null}
                            </div>

                            <div>
                              <p className="font-medium text-slate-900">
                                {product.name}
                              </p>

                              <p className="text-xs text-slate-500">
                                {product.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {product.category.name}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {product.variants.length}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {totalStock}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              product.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <ProductRowActions productId={product.id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalProducts > 0 && (
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalProducts)} of {totalProducts} products</p>
            <nav aria-label="Product list pagination" className="flex items-center gap-2">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-white">Previous</Link>
              ) : (
                <span aria-disabled="true" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">Previous</span>
              )}
              <span className="px-2">Page {page} of {totalPages}</span>
              {page < totalPages ? (
                <Link href={pageHref(page + 1)} className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-white">Next</Link>
              ) : (
                <span aria-disabled="true" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">Next</span>
              )}
            </nav>
          </div>
        )}
      </div>
    </main>
  );
}
