import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-700"><Search size={25} aria-hidden="true" /></span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">404 · Page not found</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">We can’t find that page</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">The link may be outdated, or the page may have moved. Explore the latest collection or return to the home page.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="rounded-lg bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">Explore the collection</Link>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"><ArrowLeft size={15} aria-hidden="true" /> Back home</Link>
        </div>
      </div>
    </main>
  );
}
