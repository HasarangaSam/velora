import Link from "next/link";

export default function ShopNotFound() {
  return (
    <main className="flex min-h-[55vh] items-center justify-center px-4 py-14">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Product unavailable</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">This item isn’t here</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">It may have sold out or been removed. You can find more pieces in the collection.</p>
        <Link href="/shop" className="mt-7 inline-flex rounded-lg bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">Continue shopping</Link>
      </div>
    </main>
  );
}
