"use client";

import { useActionState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deleteAdminUser, saveAdminUser, type AdminUserActionState } from "@/app/admin/users/actions";
import SubmitButton from "./SubmitButton";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  emailVerified: Date | null;
  orderCount: number;
};

const initialState: AdminUserActionState = { success: false, message: "" };

export default function AdminUserForm({ user, isSelf = false }: { user?: AdminUser; isSelf?: boolean }) {
  const router = useRouter();
  const action = saveAdminUser.bind(null, user?.id ?? null);
  const [state, formAction] = useActionState(action, initialState);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (!state.success || user || !state.userId) return;
    const timeout = window.setTimeout(() => router.push(`/admin/users/${state.userId}`), 1200);
    return () => window.clearTimeout(timeout);
  }, [router, state.success, state.userId, user]);

  function handleDelete() {
    if (!user || deleting) return;
    if (!window.confirm(`Delete ${user.name ?? user.email}? This action cannot be undone.`)) return;
    startDelete(async () => {
      const result = await deleteAdminUser(user.id);
      if (result.success) router.push("/admin/users");
      else window.alert(result.message);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Account management</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{user ? "Edit user" : "Create user"}</h1>
        <p className="mt-2 text-sm text-slate-500">Manage account details and access to the Velora store.</p>
      </div>

      <form action={formAction} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {state.message && (
          <div role={state.success ? "status" : "alert"} className={`rounded-xl border px-4 py-3 text-sm ${state.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            {state.message}
            {state.verificationEmail && (
              <Link href={`/verify-email?email=${encodeURIComponent(state.verificationEmail)}`} className="ml-2 font-medium underline underline-offset-2">Open verification</Link>
            )}
            {state.success && !user && <span className="ml-2 text-xs">Opening account…</span>}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input id="name" name="name" required minLength={2} maxLength={100} defaultValue={user?.name ?? ""} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-100" />
            {state.errors?.name && <p className="mt-1 text-sm text-rose-600">{state.errors.name[0]}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
            <input id="email" name="email" type="email" required maxLength={255} defaultValue={user?.email ?? ""} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-100" />
            {state.errors?.email && <p className="mt-1 text-sm text-rose-600">{state.errors.email[0]}</p>}
            {user && <p className="mt-1.5 text-xs text-slate-500">Changing the email address requires the user to verify the new address.</p>}
          </div>

          {!user && (
            <div className="sm:col-span-2">
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Initial password</label>
              <input id="password" name="password" type="password" required minLength={8} maxLength={100} autoComplete="new-password" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-100" />
              <p className="mt-1.5 text-xs text-slate-500">Use at least 8 characters. The user can change it later in account settings.</p>
              {state.errors?.password && <p className="mt-1 text-sm text-rose-600">{state.errors.password[0]}</p>}
            </div>
          )}

          <div>
            <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">Account role</label>
            {isSelf && user ? (
              <>
                <input type="hidden" name="role" value={user.role} />
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Administrator · This is your signed-in account</p>
              </>
            ) : (
              <select id="role" name="role" defaultValue={user?.role ?? "USER"} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-100">
                <option value="USER">Customer</option>
                <option value="ADMIN">Administrator</option>
              </select>
            )}
            {state.errors?.role && <p className="mt-1 text-sm text-rose-600">{state.errors.role[0]}</p>}
          </div>

          {user && (
            <div className="self-end text-sm text-slate-500">
              {user.emailVerified ? "Email verified" : "Email not verified"}
              <span className="mx-2 text-slate-300">·</span>
              {user.orderCount} {user.orderCount === 1 ? "order" : "orders"}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          {user ? (
            <button type="button" onClick={handleDelete} disabled={deleting || user.orderCount > 0 || isSelf} title={isSelf ? "You cannot delete your own admin account here." : user.orderCount > 0 ? "Accounts with order history are retained." : "Delete this user account"} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
              <Trash2 className="h-4 w-4" /> {deleting ? "Deleting…" : "Delete account"}
            </button>
          ) : <span />}
          <SubmitButton pendingText="Saving…" disabled={state.success}>{user ? "Save changes" : "Create account"}</SubmitButton>
        </div>
        {user?.orderCount ? <p className="-mt-4 text-xs text-slate-500">Users with order history can’t be deleted so the store can retain its order records.</p> : null}
      </form>
    </div>
  );
}
