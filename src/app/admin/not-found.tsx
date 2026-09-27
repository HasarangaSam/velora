import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdminNotFound() {
  return (
    <main className="flex min-h-[50vh] items-center justify-center px-4 py-12">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">404 · Admin</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Record not found</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">This record may have been removed or the link may be incorrect.</p>
        <Link href="/admin" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"><ArrowLeft size={15} /> Back to admin</Link>
      </div>
    </main>
  );
}
