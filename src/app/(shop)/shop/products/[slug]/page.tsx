import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductPurchase from "@/components/shop/ProductPurchase";
import { getProductBySlug } from "@/lib/product";

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

          <span className="mx-2">/</span>

          <span className="text-slate-700">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery productName={product.name} images={product.images} />

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              {product.category.name}
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-6 whitespace-pre-line text-base leading-7 text-slate-600">
              {product.description}
            </div>

            {variants.length > 0 ? (
              <ProductPurchase variants={variants} />
            ) : (
              <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-700">
                  This product is currently out of stock.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
