import { Suspense } from "react";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
