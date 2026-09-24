import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In – Velora",
  description: "Sign in to your Velora account to manage orders and more.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
