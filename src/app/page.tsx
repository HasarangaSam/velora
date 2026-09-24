import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";
import { getCache, setCache } from "@/lib/redis";
import ProductCard from "@/components/shop/ProductCard";
import { ArrowRight } from "lucide-react";

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
      {/* Editorial hero */}
      <section className="bg-[#f4f1eb]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:px-8 lg:py-16">
          <div className="order-2 py-4 lg:order-1 lg:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-600">Everyday, considered</p>
            <h1 className="mt-5 max-w-xl text-4xl font-medium leading-[1.08] tracking-tight text-stone-950 sm:text-5xl lg:text-6xl">
              Good clothes.<br />Room to be yourself.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-stone-600">
              Easy to wear, made to last. Find thoughtful pieces for the everyday and whatever comes next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex items-center gap-3 rounded-full bg-stone-950 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-stone-700">
                Shop all clothing <ArrowRight size={16} />
              </Link>
              <Link href="/shop?category=women" className="inline-flex items-center rounded-full border border-stone-400 px-6 py-3.5 text-sm font-medium text-stone-800 transition hover:border-stone-800">
                Shop women
              </Link>
            </div>
            <p className="mt-8 text-[11px] text-stone-500">Photography by <a href="https://unsplash.com/photos/a-man-and-woman-wearing-clothing-r846zuiIE_Q" target="_blank" rel="noreferrer" className="underline underline-offset-2">Aliya Amangeldi / Unsplash</a></p>
          </div>
          <div className="relative order-1 min-h-[300px] overflow-hidden rounded-2xl bg-stone-300 sm:min-h-[420px] lg:order-2 lg:min-h-[560px]">
            <Image
              src="https://images.unsplash.com/photo-1664915933754-5d24b1e81432?auto=format&fit=crop&fm=jpg&q=85&w=1800"
              alt="Two people wearing relaxed everyday fashion"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center"
            />
            <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-stone-800 backdrop-blur sm:bottom-6 sm:left-6">The new everyday edit</div>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              Find your place
            </span>
            <h2 className="mt-2 text-3xl font-medium tracking-tight text-stone-950 sm:text-4xl">
              A collection for everyone
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 transition hover:text-stone-950"
          >
            Browse all clothing <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {/* Men */}
          <Link
            href="/shop?category=men"
            className="group relative flex min-h-[360px] flex-col justify-end overflow-hidden rounded-2xl bg-stone-900 p-6 sm:min-h-[400px] sm:p-8"
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-75 transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative z-10 text-white">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200">
                Men
              </span>
              <h3 className="mt-2 text-3xl font-medium tracking-tight">Men&apos;s collection</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-stone-200">
                T-shirts, casual shirts, chinos & oversized fits
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white transition group-hover:gap-3">
                Shop Men <ArrowRight size={16} />
              </div>
            </div>
          </Link>

          {/* Women */}
          <Link
            href="/shop?category=women"
            className="group relative flex min-h-[360px] flex-col justify-end overflow-hidden rounded-2xl bg-stone-900 p-6 sm:min-h-[400px] sm:p-8"
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-75 transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative z-10 text-white">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200">
                Women
              </span>
              <h3 className="mt-2 text-3xl font-medium tracking-tight">Women&apos;s collection</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-stone-200">
                Contemporary dresses, tops, linen wear & denim
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white transition group-hover:gap-3">
                Shop Women <ArrowRight size={16} />
              </div>
            </div>
          </Link>

          {/* Kids */}
          <Link
            href="/shop?category=kids"
            className="group relative flex min-h-[360px] flex-col justify-end overflow-hidden rounded-2xl bg-stone-900 p-6 sm:min-h-[400px] sm:p-8"
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-75 transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative z-10 text-white">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200">
                Kids
              </span>
              <h3 className="mt-2 text-3xl font-medium tracking-tight">Kids&apos; collection</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-stone-200">
                Playful, gentle cotton tees & comfortable sets
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white transition group-hover:gap-3">
                Shop Kids <ArrowRight size={16} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-[#f5f3ee] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              Selected for you
            </span>
            <h2 className="mt-2 text-3xl font-medium tracking-tight text-stone-950 sm:text-4xl">
              Pieces to live in
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 transition hover:text-stone-950"
          >
            View all clothing <ArrowRight size={16} />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
            <h3 className="text-base font-medium text-stone-900">
              Catalog is getting ready
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              New arrivals will be listed shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col justify-between gap-6 border-t border-stone-200 pt-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">The Velora point of view</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-medium leading-tight tracking-tight text-stone-950 sm:text-3xl">Less occasion dressing. More pieces you reach for every day.</h2>
          </div>
          <Link href="/shop" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-stone-700 transition hover:text-stone-950">
            Find your next favourite <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
