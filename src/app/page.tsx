import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCache, setCache } from "@/lib/redis";
import ProductCard from "@/components/shop/ProductCard";
import { ArrowRight } from "lucide-react";
import WelcomeOffer from "@/components/shop/WelcomeOffer";

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
  const cacheKey = "velora:featured_products:v2";
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
        orderBy: { sortOrder: "asc" },
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
  // Featured products depend on live database data, so defer this query until
  // a request instead of trying to execute it during a production build.
  await connection();
  const featuredProducts = await getFeaturedProducts();

  return (
    <main className="bg-white">
      {/* Editorial hero */}
      <section className="bg-[#f2ede5]">
        <div className="mx-auto grid max-w-[90rem] items-center gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14 lg:px-10 lg:py-12">
          <div className="order-2 py-3 lg:order-1 lg:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-600">The Velora edit</p>
            <h1 className="mt-5 max-w-xl text-4xl font-medium leading-[1.04] tracking-tight text-stone-950 sm:text-5xl lg:text-6xl">
              Find your style.<br />Wear it your way.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-stone-600 sm:text-lg">
              Thoughtfully chosen clothing for everyday plans, special occasions, and everything in between.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex items-center gap-3 rounded-full bg-stone-950 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-stone-700">
                Shop all clothing <ArrowRight size={16} />
              </Link>
              <Link href="/shop?sort=newest" className="inline-flex items-center rounded-full border border-stone-400 px-6 py-3.5 text-sm font-medium text-stone-800 transition hover:border-stone-800 hover:bg-white/40">
                Explore new arrivals
              </Link>
            </div>
            <p className="mt-7 text-[11px] text-stone-500">Photography by <a href="https://unsplash.com/photos/woman-wearing-sunglasses-mVGW8j9rrC4" target="_blank" rel="noreferrer" className="underline underline-offset-2">Napat Saeng / Unsplash</a></p>
          </div>
          <div className="relative order-1 min-h-[360px] overflow-hidden rounded-[1.5rem] bg-stone-300 sm:min-h-[520px] lg:order-2 lg:min-h-[660px]">
            <Image
              src="https://images.unsplash.com/photo-1562572159-4efc207f5aff?auto=format&fit=crop&w=1800&q=85"
              alt="Fashion model wearing sunglasses"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-[center_42%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-stone-800 backdrop-blur sm:bottom-6 sm:left-6">New season, new favourites</div>
          </div>
        </div>
      </section>

      <WelcomeOffer />

      <section aria-label="Shopping benefits" className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-stone-200 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
          <div className="py-4 text-center sm:py-5"><p className="text-sm font-semibold text-stone-900">Free delivery over Rs. 10,000</p><p className="mt-1 text-xs text-stone-500">Automatically applied at checkout</p></div>
          <div className="py-4 text-center sm:py-5"><p className="text-sm font-semibold text-stone-900">Thoughtful pieces, easy to find</p><p className="mt-1 text-xs text-stone-500">Shop by collection or occasion</p></div>
          <div className="py-4 text-center sm:py-5"><p className="text-sm font-semibold text-stone-900">Secure PayHere checkout</p><p className="mt-1 text-xs text-stone-500">Your payment is confirmed before dispatch</p></div>
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

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid overflow-hidden rounded-[1.5rem] bg-[#eee8df] md:grid-cols-2">
          <div className="relative min-h-[300px] bg-stone-200 sm:min-h-[420px]">
            <Image src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85"
              alt="Richly coloured silk saree with traditional detailing" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 lg:py-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">The occasion edit</p>
            <h2 className="mt-3 max-w-md text-3xl font-medium leading-tight tracking-tight text-stone-950 sm:text-4xl">A little more special, in every detail.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-stone-600">Explore statement sarees and considered pieces for celebrations, family gatherings, and the days worth dressing up for.</p>
            <Link href="/shop?category=women-sarees" className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700">Shop the saree edit <ArrowRight size={16} /></Link>
          </div>
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
