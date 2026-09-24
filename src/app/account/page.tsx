import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-blue-600">My account</p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Welcome, {session.user.name ?? "Customer"}
          </h1>

          <p className="mt-2 text-slate-500">{session.user.email}</p>

          <div className="mt-6 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            {session.user.role}
          </div>
        </div>
      </div>
    </main>
  );
}
