import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import CategoryForm from "@/components/admin/CategoryForm";
import DeleteCategoryButton from "@/components/admin/DeleteCategoryButton";
import CategoryRow from "@/components/admin/CategoryRow";

export default async function AdminCategoriesPage() {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/account");
  }

  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">Catalog</p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">Categories</h1>

          <p className="mt-2 text-slate-500">
            Manage the categories used throughout the Velora catalog.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Add category
            </h2>

            <p className="mt-1 mb-6 text-sm text-slate-500">
              Create a category for your products.
            </p>

            <CategoryForm />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Existing categories
              </h2>
            </div>

            {categories.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No categories have been created yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {categories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={{
                      id: category.id,
                      name: category.name,
                      slug: category.slug,
                      productCount: category._count.products,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
