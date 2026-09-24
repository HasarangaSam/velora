import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset Password – Velora",
  description: "Set a new password for your Velora account.",
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
