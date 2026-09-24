import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    category: {
      name: string;
      slug: string;
    };
    image: string | null;
    priceFrom: string | null;
    totalStock: number;
  };
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

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No image
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
            {product.category.name}
          </p>

          <h2 className="mt-2 line-clamp-2 text-base font-semibold text-slate-900">
            {product.name}
          </h2>

          <p className="mt-2 text-sm font-medium text-slate-700">
            From {formatPrice(product.priceFrom)}
          </p>
        </div>
      </Link>
    </article>
  );
}
