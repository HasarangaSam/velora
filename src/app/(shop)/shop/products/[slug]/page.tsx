import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductPurchase from "@/components/shop/ProductPurchase";
import { getProductBySlug } from "@/lib/product";
import WishlistButton from "@/components/shop/WishlistButton";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import ProductReviews from "@/components/shop/ProductReviews";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const session = await auth();
  const saved = session?.user?.id
    ? Boolean(await prisma.wishlistItem.findUnique({
        where: { userId_productId: { userId: session.user.id, productId: product.id } },
        select: { id: true },
      }))
    : false;

  const variants = product.variants.map((variant) => ({
    id: variant.id,
    size: variant.size,
    colour: variant.colour,
    price: variant.price.toString(),
    stock: variant.stock,
  }));

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm text-slate-500">
          <Link href="/shop" className="hover:text-blue-600">
            Shop
          </Link>

          <span className="mx-2">/</span>

          <Link
            href={`/shop?category=${product.category.slug}`}
            className="hover:text-blue-600"
          >
            {product.category.name}
          </Link>

          {product.subCategory && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/shop?category=${product.subCategory.slug}`}
                className="hover:text-blue-600"
              >
                {product.subCategory.name}
              </Link>
            </>
          )}

          <span className="mx-2">/</span>

          <span className="text-slate-700">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery productName={product.name} images={product.images} />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                {product.category.name}
              </span>
              {product.subCategory && (
                <>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-sm font-medium text-slate-500">
                    {product.subCategory.name}
                  </span>
                </>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-5 max-w-xs">
              <WishlistButton productId={product.id} productName={product.name} initialSaved={saved} variant="label" />
            </div>

            <div className="mt-6 whitespace-pre-line text-base leading-7 text-slate-600">
              {product.description}
            </div>

            {variants.length > 0 ? (
              <ProductPurchase
                productId={product.id}
                productName={product.name}
                slug={product.slug}
                image={product.images[0]?.url ?? null}
                variants={product.variants.map((variant) => ({
                  id: variant.id,
                  size: variant.size,
                  colour: variant.colour,
                  price: variant.price.toString(),
                  stock: variant.stock,
                }))}
              />
            ) : (
              <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-700">
                  This product is currently out of stock.
                </p>
              </div>
            )}
          </div>
        </div>

        <ProductReviews productId={product.id} productSlug={product.slug} userId={session?.user?.id} />
      </div>
    </main>
  );
}
