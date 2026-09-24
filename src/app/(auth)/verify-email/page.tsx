import { Suspense } from "react";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

export const metadata = {
  title: "Verify Email – Velora",
  description: "Verify your email address to activate your Velora account.",
};

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
