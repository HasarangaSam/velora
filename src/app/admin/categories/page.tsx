import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import CategoryForm from "@/components/admin/CategoryForm";
import CategoryRow from "@/components/admin/CategoryRow";

export default async function AdminCategoriesPage() {
  await requireAdmin();

  // Fetch top-level categories with their children
  const topLevel = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
      children: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { products: true, subProducts: true } },
        },
      },
    },
  });

  // For the form: only top-level categories can be parents
  const parentOptions = topLevel.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Catalog
        </span>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">Categories</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage top-level categories (Men, Women, Kids) and their sub-categories (Shirts, Sarees, etc.).
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Create form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm self-start">
          <h2 className="text-lg font-semibold text-slate-900">Add category</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">
            Create a top-level or sub-category.
          </p>
          <CategoryForm parentCategories={parentOptions} />
        </section>

        {/* Category tree */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-900">All categories</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {topLevel.length} top-level • {topLevel.reduce((s, c) => s + c.children.length, 0)} sub-categories
            </p>
          </div>

          {topLevel.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No categories yet. Create your first one.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topLevel.map((parent) => (
                <div key={parent.id}>
                  {/* Parent row */}
                  <CategoryRow
                    category={{
                      id: parent.id,
                      name: parent.name,
                      slug: parent.slug,
                      productCount: parent._count.products,
                      isParent: true,
                      childCount: parent.children.length,
                    }}
                  />

                  {/* Sub-category rows */}
                  {parent.children.map((child) => (
                    <CategoryRow
                      key={child.id}
                      category={{
                        id: child.id,
                        name: child.name,
                        slug: child.slug,
                        productCount:
                          child._count.products + child._count.subProducts,
                        isParent: false,
                        childCount: 0,
                        parentName: parent.name,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
