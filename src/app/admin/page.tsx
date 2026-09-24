import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-blue-600">Admin panel</p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Velora Administration
          </h1>

          <p className="mt-2 text-slate-500">Signed in as {user.email}.</p>
        </div>
      </div>
    </main>
  );
}
