import Image from "next/image";
import Link from "next/link";
import WishlistButton from "@/components/shop/WishlistButton";
import { ArrowUpRight } from "lucide-react";
import { getCategoryDisplayName } from "@/lib/category-display";
import { getCurrentPrice, getDiscountPercent } from "@/lib/product-pricing";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    category: {
      name: string;
      slug: string;
    };
    subCategory?: { name: string; slug: string } | null;
    image: string | null;
    price: string;
    salePrice: string | null;
    totalStock: number;
  };
  isSaved?: boolean;
};

function formatPrice(price: number | string) {
  return `LKR ${Number(price).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ProductCard({ product, isSaved = false }: ProductCardProps) {
  return (
    <article className="group relative min-w-0">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-black/[0.03]">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="transform-gpu object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.3,1)] group-hover:scale-[1.06] group-focus-visible:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-stone-400">
              <span className="text-2xl" aria-hidden="true">✳</span>
              <span>Image coming soon</span>
            </div>
          )}
          {product.totalStock > 0 && product.totalStock < 5 && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-stone-700 shadow-sm backdrop-blur">
              Almost gone
            </span>
          )}
          {getDiscountPercent(product) !== null && <span className="absolute right-3 top-3 rounded-full bg-rose-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">{getDiscountPercent(product)}% off</span>}
          <span className="absolute bottom-3 right-3 hidden h-9 w-9 items-center justify-center rounded-full bg-white/95 text-stone-800 shadow-sm transition group-hover:flex group-focus-visible:flex" aria-hidden="true">
            <ArrowUpRight size={17} />
          </span>
        </div>

        <div className="px-0.5 pt-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            {product.subCategory ? getCategoryDisplayName(product.subCategory) : getCategoryDisplayName(product.category)}
          </p>

          <h2 className="mt-1.5 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-stone-900 transition-colors group-hover:text-stone-600 sm:text-[15px]">
            {product.name}
          </h2>

          <div className="mt-2 flex items-baseline gap-2"><p className="text-sm font-semibold tracking-tight text-stone-950">{formatPrice(getCurrentPrice(product))}</p>{getDiscountPercent(product) !== null && <><span className="text-xs text-stone-500 line-through">{formatPrice(product.price)}</span><span className="text-[10px] font-semibold text-rose-700">{getDiscountPercent(product)}% OFF</span></>}</div>
        </div>
      </Link>
      <WishlistButton key={`${product.id}-${isSaved}`} productId={product.id} productName={product.name} initialSaved={isSaved} />
    </article>
  );
}
