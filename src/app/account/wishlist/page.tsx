import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { auth } from "@/auth";
import ProductCard from "@/components/shop/ProductCard";
import { prisma } from "@/lib/db/prisma";

export const metadata = {
  title: "My Wishlist | Velora",
  description: "Products you have saved to your Velora wishlist.",
};

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Faccount%2Fwishlist");

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id, product: { isActive: true } },
    orderBy: { createdAt: "desc" },
    select: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: { select: { name: true, slug: true } },
          subCategory: { select: { name: true, slug: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
            orderBy: { sortOrder: "asc" },
            select: { url: true },
          },
          variants: {
            where: { stock: { gt: 0 } },
            orderBy: { price: "asc" },
            select: { price: true, stock: true },
          },
        },
      },
    },
  });

  const products = items.map(({ product }) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    subCategory: product.subCategory,
    image: product.images[0]?.url ?? null,
    priceFrom: product.variants[0]?.price.toString() ?? null,
    totalStock: product.variants.reduce((total, variant) => total + variant.stock, 0),
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900">
          <ArrowLeft size={16} /> Back to account
        </Link>

        <div className="mt-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-600"><Heart size={14} /> Saved for later</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">My wishlist</h1>
            <p className="mt-2 text-sm text-slate-600">{products.length} {products.length === 1 ? "item" : "items"} available in your wishlist</p>
          </div>
          <Link href="/shop" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
            <ShoppingBag size={16} /> Continue shopping
          </Link>
        </div>

        {products.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500"><Heart size={24} /></div>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">Your wishlist is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Tap the heart on anything you like and it’ll be waiting here when you’re ready.</p>
            <Link href="/shop" className="mt-6 inline-flex rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">Explore the collection</Link>
          </section>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} isSaved />)}
          </div>
        )}
      </div>
    </main>
  );
}
