import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-5xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Fashion for everyday life
          </p>

          <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Welcome to Velora
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Discover clothing designed to bring together everyday comfort,
            modern style, and confidence.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Shop now
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
