import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductPurchase from "@/components/shop/ProductPurchase";
import { getProductBySlug } from "@/lib/product";
import WishlistButton from "@/components/shop/WishlistButton";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import ProductReviews from "@/components/shop/ProductReviews";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [savedRecord, collectionProducts] = await Promise.all([
    session?.user?.id
      ? prisma.wishlistItem.findUnique({
          where: { userId_productId: { userId: session.user.id, productId: product.id } },
          select: { id: true },
        })
      : null,
    prisma.product.findMany({
      where: { categoryId: product.categoryId, isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: [{ createdAt: "desc" }, { slug: "asc" }],
    }),
  ]);
  const saved = Boolean(savedRecord);
  const productIndex = collectionProducts.findIndex((item) => item.id === product.id);
  const previousProduct = productIndex > 0 ? collectionProducts[productIndex - 1] : null;
  const nextProduct = productIndex >= 0 && productIndex < collectionProducts.length - 1
    ? collectionProducts[productIndex + 1]
    : null;

  const variants = product.variants.map((variant) => ({
    id: variant.id,
    size: variant.size,
    colour: variant.colour,
    price: variant.price.toString(),
    stock: variant.stock,
  }));

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <nav className="text-sm text-stone-500">
          <Link href="/shop" className="transition hover:text-stone-950">
            Shop
          </Link>

          <span className="mx-2">/</span>

          <Link
            href={`/shop?category=${product.category.slug}`}
            className="transition hover:text-stone-950"
          >
            {product.category.name}
          </Link>

          {product.subCategory && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/shop?category=${product.subCategory.slug}`}
                className="transition hover:text-stone-950"
              >
                {product.subCategory.name}
              </Link>
            </>
          )}

          <span className="mx-2">/</span>

          <span className="font-medium text-stone-800">{product.name}</span>
        </nav>

        <nav aria-label="Browse products" className="flex items-center gap-2">
          {previousProduct ? <Link href={`/products/${previousProduct.slug}`} aria-label={`Previous product: ${previousProduct.name}`} title={previousProduct.name}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:border-stone-900 hover:bg-stone-900 hover:text-white"><ChevronLeft size={18} /></Link>
            : <span aria-hidden="true" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-300"><ChevronLeft size={18} /></span>}
          <span className="hidden text-xs text-stone-500 sm:inline">More in {product.category.name}</span>
          {nextProduct ? <Link href={`/products/${nextProduct.slug}`} aria-label={`Next product: ${nextProduct.name}`} title={nextProduct.name}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:border-stone-900 hover:bg-stone-900 hover:text-white"><ChevronRight size={18} /></Link>
            : <span aria-hidden="true" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-300"><ChevronRight size={18} /></span>}
        </nav>
        </div>

        <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28"><ProductGallery productName={product.name} images={product.images} /></div>

          <div className="py-1 sm:py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
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

            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-5 max-w-xs">
              <WishlistButton key={`${product.id}-${saved}`} productId={product.id} productName={product.name} initialSaved={saved} variant="label" />
            </div>

            <div className="mt-6 whitespace-pre-line border-t border-stone-200 pt-5 text-sm leading-7 text-stone-600 sm:text-[15px]">
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
              <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4">
                <p className="text-sm font-medium text-stone-700">
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
