import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCache, setCache } from "@/lib/redis";
import ProductCard from "@/components/shop/ProductCard";
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";

type HomepageProduct = {
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

async function getFeaturedProducts(): Promise<HomepageProduct[]> {
  const cacheKey = "velora:featured_products";
  const cached = await getCache<HomepageProduct[]>(cacheKey);
  if (cached) return cached;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    take: 8,
    orderBy: [
      { isFeatured: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      category: {
        select: { name: true, slug: true },
      },
      images: {
        where: { isPrimary: true },
        take: 1,
      },
      variants: {
        where: { stock: { gt: 0 } },
        orderBy: { price: "asc" },
        select: { price: true, stock: true },
      },
    },
  });

  const formatted: HomepageProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    image: p.images[0]?.url ?? null,
    priceFrom: p.variants[0]?.price.toString() ?? null,
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
  }));

  await setCache(cacheKey, formatted, 120);
  return formatted;
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white py-16 sm:py-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide uppercase">
              <Sparkles size={14} />
              Sri Lankan Fashion Redefined
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Comfortable, Modern Clothing for Everyday Style.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Discover clean fits, breathable cottons, and timeless essentials tailored for the island lifestyle.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 hover:shadow-lg transition"
              >
                Shop Collection
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/shop?category=men"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Explore Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Collections
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Categories <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Men */}
          <Link
            href="/shop?category=men"
            className="group relative h-80 rounded-2xl overflow-hidden bg-slate-900 p-8 flex flex-col justify-end shadow-sm"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 opacity-80"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            <div className="relative z-10 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Men
              </span>
              <h3 className="text-2xl font-bold mt-1">Men's Wardrobe</h3>
              <p className="text-xs text-slate-300 mt-1">
                T-shirts, casual shirts, chinos & oversized fits
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-blue-400 transition">
                Shop Men →
              </div>
            </div>
          </Link>

          {/* Women */}
          <Link
            href="/shop?category=women"
            className="group relative h-80 rounded-2xl overflow-hidden bg-slate-900 p-8 flex flex-col justify-end shadow-sm"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 opacity-80"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            <div className="relative z-10 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Women
              </span>
              <h3 className="text-2xl font-bold mt-1">Women's Styles</h3>
              <p className="text-xs text-slate-300 mt-1">
                Contemporary dresses, tops, linen wear & denim
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-blue-400 transition">
                Shop Women →
              </div>
            </div>
          </Link>

          {/* Kids */}
          <Link
            href="/shop?category=kids"
            className="group relative h-80 rounded-2xl overflow-hidden bg-slate-900 p-8 flex flex-col justify-end shadow-sm"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 opacity-80"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            <div className="relative z-10 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Kids
              </span>
              <h3 className="text-2xl font-bold mt-1">Kids' Comfort</h3>
              <p className="text-xs text-slate-300 mt-1">
                Playful, gentle cotton tees & comfortable sets
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-blue-400 transition">
                Shop Kids →
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Curated Picks
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Featured Products
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View Entire Shop <ArrowRight size={14} />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
            <h3 className="text-base font-semibold text-slate-800">
              Catalog is getting ready
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              New arrivals will be listed shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Promo Banner with Coupon Mention */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl bg-blue-600 text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Limited Time Welcome Offer
            </span>
            <h2 className="text-2xl sm:text-4xl font-black">
              Get 10% Off Your First Order
            </h2>
            <p className="text-sm text-blue-100 max-w-xl">
              Use code <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">VELORA10</span> at checkout to enjoy 10% discount on all apparel.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-blue-600 hover:bg-blue-50 transition flex-shrink-0 shadow-sm"
          >
            Claim Discount
          </Link>
        </div>
      </section>
    </main>
  );
}
