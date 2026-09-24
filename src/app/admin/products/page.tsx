import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";

export default async function AdminProductsPage() {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/account");
  }

  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true,
      images: {
        where: {
          isPrimary: true,
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
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

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {products.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                No products yet
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Add your first product to start building the catalog.
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
                                <img
                                  src={primaryImage.url}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
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
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
