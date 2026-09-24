import { requireAdmin } from "@/lib/auth/require-admin";
import ProductForm from "@/components/admin/ProductForm";
import { prisma } from "@/lib/db/prisma";

export default async function NewProductPage() {
  await requireAdmin();

  // Fetch top-level categories with their sub-categories
  const categoriesWithChildren = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: {
      children: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">Products</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Add product</h1>
          <p className="mt-2 text-slate-500">
            Create a product and define its available variants.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          {categoriesWithChildren.length === 0 ? (
            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              Create at least one category before adding a product.
            </div>
          ) : (
            <ProductForm categories={categoriesWithChildren} />
          )}
        </div>
      </div>
    </main>
  );
}
