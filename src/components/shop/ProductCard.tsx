import Image from "next/image";
import Link from "next/link";
import WishlistButton from "@/components/shop/WishlistButton";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    category: {
      name: string;
      slug: string;
    };
    subCategory?: { name: string } | null;
    image: string | null;
    priceFrom: string | null;
    totalStock: number;
  };
  isSaved?: boolean;
};

function formatPrice(price: string | null) {
  if (!price) {
    return "Price unavailable";
  }

  return `LKR ${Number(price).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ProductCard({ product, isSaved = false }: ProductCardProps) {
  return (
    <article className="group relative min-w-0">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-100">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-stone-400">
              <span className="text-2xl" aria-hidden="true">✳</span>
              <span>Image coming soon</span>
            </div>
          )}
          {product.totalStock < 5 && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-stone-700 shadow-sm">
              Almost gone
            </span>
          )}
        </div>

        <div className="px-0.5 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500">
            {product.subCategory?.name ?? product.category.name}
          </p>

          <h2 className="mt-1.5 line-clamp-2 text-sm font-medium leading-5 text-stone-900 transition-colors group-hover:text-stone-600 sm:text-[15px]">
            {product.name}
          </h2>

          <p className="mt-2 text-sm font-semibold text-stone-900">
            {formatPrice(product.priceFrom)}
          </p>
        </div>
      </Link>
      <WishlistButton productId={product.id} productName={product.name} initialSaved={isSaved} />
    </article>
  );
}
