import Link from "next/link";

export default function AccountNotFound() {
  return (
    <main className="flex min-h-[50vh] items-center justify-center px-4 py-12">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">404 · Account</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">We couldn’t find that account page</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">The profile or order may no longer be available.</p>
        <Link href="/account" className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Go to your account</Link>
      </div>
    </main>
  );
}
