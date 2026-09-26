"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { useFormStatus } from "react-dom";
import {
  verifyRegistrationOtp,
  resendRegistrationOtp,
  type VerifyOtpActionState,
} from "@/app/(auth)/register/actions";

// ---------------------------------------------------------------------------
// Submit button – reads useFormStatus to disable while pending
// ---------------------------------------------------------------------------
function VerifySubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Loader2 size={18} className="animate-spin" />}
      {pending ? "Verifying..." : "Verify email"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const initialState: VerifyOtpActionState = { success: false, message: "" };

export default function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();

  // email may come from query param (after redirect from register page)
  const emailFromQuery = params.get("email") ?? "";
  const requestedCallback = params.get("callbackUrl");
  const callbackUrl = requestedCallback?.startsWith("/") && !requestedCallback.startsWith("//")
    ? requestedCallback
    : null;
  const [email] = useState(emailFromQuery);

  // ---- verify OTP state
  const [verifyState, verifyAction] = useActionState(verifyRegistrationOtp, initialState);

  // ---- resend OTP state (separate action)
  const [resendState, resendAction] = useActionState(resendRegistrationOtp, initialState);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // OTP inputs – 6 separate boxes for a polished feel
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Redirect on successful verification
  useEffect(() => {
    if (verifyState.success) {
      const timer = setTimeout(() => {
        const next = new URLSearchParams({ verified: "true" });
        if (callbackUrl) next.set("callbackUrl", callbackUrl);
        router.push(`/login?${next.toString()}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [verifyState.success, router, callbackUrl]);

  // Start cooldown timer after resend
  useEffect(() => {
    if (resendState.success) {
      setResendCooldown(60);
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [resendState.success]);

  // Build the combined OTP string from individual boxes
  const otp = digits.join("");

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1); // only digits
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleDigitKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      event.preventDefault();
      const next = [...digits];
      pasted.split("").forEach((ch, i) => {
        if (i < 6) next[i] = ch;
      });
      setDigits(next);
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <MailCheck size={28} className="text-blue-600" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Email Verification
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-slate-500">
          {email ? (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-700">{email}</span>
            </>
          ) : (
            "Enter the 6-digit code we sent to your email."
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Verify form */}
        <form action={verifyAction} className="space-y-6">
          {/* Hidden email field */}
          <input type="hidden" name="email" value={email} />
          {/* Hidden combined OTP field – populated from digit boxes */}
          <input type="hidden" name="code" value={otp} />

          {/* 6-box OTP input */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Verification code
            </label>
            <div className="flex gap-2 sm:gap-3">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="h-14 w-full rounded-lg border border-slate-300 text-center text-xl font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                  disabled={verifyState.success}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Feedback message */}
          {verifyState.message && (
            <p
              className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                verifyState.success
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {verifyState.success && <ShieldCheck size={16} />}
              {verifyState.message}
            </p>
          )}

          <VerifySubmitButton />
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-xs text-slate-400">Didn't receive it?</span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        {/* Resend form */}
        <form action={resendAction}>
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            disabled={resendCooldown > 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} />
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend verification code"}
          </button>
        </form>

        {resendState.message && (
          <p
            className={`mt-3 text-center text-xs ${
              resendState.success ? "text-green-600" : "text-red-500"
            }`}
          >
            {resendState.message}
          </p>
        )}

        <p className="mt-5 text-center text-sm text-slate-500">
          Wrong email?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Go back to register
          </Link>
        </p>
      </div>
    </div>
  );
}
