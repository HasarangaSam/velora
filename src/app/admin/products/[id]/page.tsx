import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";
import EditProductForm from "@/components/admin/EditProductForm";
import ProductImageManager from "@/components/admin/ProductImageManager";

type ProductEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductEditPage({
  params,
}: ProductEditPageProps) {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/account");
  }

  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        variants: {
          orderBy: [
            {
              size: "asc",
            },
            {
              colour: "asc",
            },
          ],
        },
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    }),

    prisma.category.findMany({
      where: { parentId: null },
      orderBy: {
        name: "asc",
      },
      include: {
        children: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  const serializedProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    subCategoryId: product.subCategoryId,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      colour: variant.colour,
      price: variant.price.toString(),
      stock: variant.stock,
    })),
  };

  const serializedImages = product.images.map((image) => ({
    id: image.id,
    url: image.url,
    publicId: image.publicId,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Product management
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Edit product
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Update product information, variants, inventory and images.
            </p>
          </div>

          <Link
            href="/admin/products"
            className="inline-flex w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to products
          </Link>
        </div>

        <div className="space-y-8">
          <EditProductForm
            product={serializedProduct}
            categories={categories}
          />

          <ProductImageManager
            productId={product.id}
            initialImages={serializedImages}
          />
        </div>
      </div>
    </main>
  );
}
