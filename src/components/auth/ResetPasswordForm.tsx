"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useFormStatus } from "react-dom";
import {
  resetPassword,
  type ResetPasswordState,
} from "@/app/(auth)/forgot-password/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Loader2 size={18} className="animate-spin" />}
      {pending ? "Resetting..." : "Reset password"}
    </button>
  );
}

const initialState: ResetPasswordState = { success: false, message: "" };

export default function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, formAction] = useActionState(resetPassword, initialState);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => router.push("/login?passwordReset=true"), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="text-lg font-semibold text-red-800">Invalid reset link</h1>
        <p className="mt-2 text-sm text-red-600">
          This link is invalid or has already been used.
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Request a new reset link →
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <Lock size={28} className="text-blue-600" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          New Password
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose a strong password that you haven&apos;t used before.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {state.success ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <ShieldCheck size={24} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Password updated!</h2>
            <p className="mt-2 text-sm text-slate-500">{state.message}</p>
            <p className="mt-3 text-xs text-slate-400">Redirecting you to sign in…</p>
          </div>
        ) : (
          <form action={formAction} className="space-y-5">
            {/* Token passed as hidden field */}
            <input type="hidden" name="token" value={token} />

            {/* New password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                New password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {state.errors?.password && (
                <p className="mt-1 text-xs text-red-600">{state.errors.password[0]}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {state.errors?.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {state.errors.confirmPassword[0]}
                </p>
              )}
            </div>

            {state.message && !state.success && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {state.message}
              </p>
            )}

            <SubmitButton />

            <p className="text-center text-sm text-slate-500">
              Remember your password?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
