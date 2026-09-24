"use client";

import { useActionState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { changeMyEmail, changeMyPassword, deleteMyAccount, updateMyProfile, type ProfileActionState } from "@/app/account/profile/actions";

const initialState: ProfileActionState = { success: false, message: "" };

function FormMessage({ state }: { state: ProfileActionState }) {
  if (!state.message) return null;
  return <p role={state.success ? "status" : "alert"} className={`mt-3 rounded-lg px-3 py-2 text-sm ${state.success ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{state.message}</p>;
}

export default function ProfileManager({ profile }: {
  profile: { name: string | null; email: string; hasPassword: boolean };
}) {
  const router = useRouter();
  const [profileState, profileAction] = useActionState(updateMyProfile, initialState);
  const [emailState, emailAction] = useActionState(changeMyEmail, initialState);
  const [passwordState, passwordAction] = useActionState(changeMyPassword, initialState);
  const [deleteState, deleteAction] = useActionState(deleteMyAccount, initialState);

  useEffect(() => {
    if (profileState.success) router.refresh();
  }, [profileState.success, router]);

  useEffect(() => {
    if (!passwordState.success && !deleteState.success && !emailState.success) return;
    const timeout = window.setTimeout(() => {
      const callbackUrl = deleteState.success
        ? "/"
        : emailState.success && emailState.verificationEmail
          ? `/verify-email?email=${encodeURIComponent(emailState.verificationEmail)}`
          : "/login?passwordUpdated=true";
      void signOut({ callbackUrl });
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [deleteState.success, emailState.success, emailState.verificationEmail, passwordState.success]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Personal details</p>
          <h2 className="mt-2 text-xl font-medium text-stone-950">Profile</h2>
          <p className="mt-1 text-sm text-stone-500">Keep the name on your account up to date.</p>
        </div>

        <form action={profileAction} className="max-w-xl space-y-5">
          <div>
            <label htmlFor="profileName" className="mb-2 block text-sm font-medium text-stone-700">Full name</label>
            <input id="profileName" name="name" defaultValue={profile.name ?? ""} required minLength={2} maxLength={100} className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
            {profileState.errors?.name && <p className="mt-1 text-sm text-rose-600">{profileState.errors.name[0]}</p>}
          </div>
          <button type="submit" className="rounded-xl bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700">Save profile</button>
          <FormMessage state={profileState} />
        </form>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Account access</p>
          <h2 className="mt-2 text-xl font-medium text-stone-950">Email address</h2>
          <p className="mt-1 text-sm text-stone-500">Current sign-in email: <span className="font-medium text-stone-700">{profile.email}</span></p>
        </div>
        <form action={emailAction} className="max-w-xl space-y-4">
          <input type="hidden" name="currentEmail" value={profile.email} />
          <div>
            <label htmlFor="newEmail" className="mb-2 block text-sm font-medium text-stone-700">New email address</label>
            <input id="newEmail" name="newEmail" type="email" autoComplete="email" required maxLength={255} className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
            {emailState.errors?.newEmail && <p className="mt-1 text-sm text-rose-600">{emailState.errors.newEmail[0]}</p>}
          </div>
          {profile.hasPassword && <div>
            <label htmlFor="emailPassword" className="mb-2 block text-sm font-medium text-stone-700">Current password</label>
            <input id="emailPassword" name="password" type="password" autoComplete="current-password" required className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
          </div>}
          <p className="text-xs leading-5 text-stone-500">We’ll send a verification code to the new address. You’ll need to verify it before signing in again.</p>
          <button type="submit" className="rounded-xl border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-50">Update email</button>
          <FormMessage state={emailState} />
        </form>
      </section>

      {profile.hasPassword && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Sign-in security</p>
            <h2 className="mt-2 text-xl font-medium text-stone-950">Change password</h2>
            <p className="mt-1 text-sm text-stone-500">You’ll need to sign in again after changing your password.</p>
          </div>
          <form action={passwordAction} className="max-w-xl space-y-4">
            <div>
              <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-stone-700">Current password</label>
              <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
            </div>
            <div>
              <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-stone-700">New password</label>
              <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={100} required className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
              {passwordState.errors?.newPassword && <p className="mt-1 text-sm text-rose-600">{passwordState.errors.newPassword[0]}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-stone-700">Confirm new password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={100} required className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
              {passwordState.errors?.confirmPassword && <p className="mt-1 text-sm text-rose-600">{passwordState.errors.confirmPassword[0]}</p>}
            </div>
            <button type="submit" className="rounded-xl bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700">Update password</button>
            <FormMessage state={passwordState} />
          </form>
        </section>
      )}

      <details className="rounded-2xl border border-rose-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none p-6 text-sm font-medium text-rose-700 sm:px-8">Close account</summary>
        <div className="border-t border-rose-100 px-6 py-6 sm:px-8">
          <p className="max-w-2xl text-sm leading-6 text-stone-600">Closing your account permanently removes your sign-in, saved addresses, and cart. Accounts with order history can’t be closed here because order records must be retained.</p>
          <form action={deleteAction} onSubmit={(event) => { if (!window.confirm("Permanently close your Velora account?")) event.preventDefault(); }} className="mt-5 max-w-xl space-y-4">
            <div>
              <label htmlFor="confirmEmail" className="mb-2 block text-sm font-medium text-stone-700">Confirm your email</label>
              <input id="confirmEmail" name="email" type="email" required autoComplete="email" className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
            </div>
            {profile.hasPassword && (
              <div>
                <label htmlFor="deletePassword" className="mb-2 block text-sm font-medium text-stone-700">Current password</label>
                <input id="deletePassword" name="password" type="password" required autoComplete="current-password" className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
              </div>
            )}
            <div>
              <label htmlFor="deleteConfirmation" className="mb-2 block text-sm font-medium text-stone-700">Type DELETE to confirm</label>
              <input id="deleteConfirmation" name="confirmation" required pattern="DELETE" className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100" />
            </div>
            <button type="submit" className="rounded-xl border border-rose-300 px-5 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50">Permanently close account</button>
            <FormMessage state={deleteState} />
          </form>
        </div>
      </details>
    </div>
  );
}
