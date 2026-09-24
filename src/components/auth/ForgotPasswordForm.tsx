"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, Send } from "lucide-react";
import { useFormStatus } from "react-dom";
import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/app/(auth)/forgot-password/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Send size={16} />
      )}
      {pending ? "Sending..." : "Send reset link"}
    </button>
  );
}

const initialState: ForgotPasswordState = { success: false, message: "" };

export default function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <Mail size={28} className="text-blue-600" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Password Reset
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Forgot your password?</h1>
        <p className="mt-2 text-sm text-slate-500">
          No worries! Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {state.success ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Send size={22} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Check your email</h2>
            <p className="mt-2 text-sm text-slate-500">{state.message}</p>
            <p className="mt-4 text-xs text-slate-400">
              The link expires in <strong>15 minutes</strong>. Check your spam folder if you
              don't see it.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={15} /> Back to sign in
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {state.message && !state.success && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {state.message}
              </p>
            )}

            <SubmitButton />

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={15} /> Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
