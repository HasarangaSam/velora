"use client";

import { useEffect, useRef } from "react";

type PayHereFormProps = {
  action: string;
  fields: Record<string, string>;
};

export default function PayHereForm({ action, fields }: PayHereFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />

        <h1 className="text-lg font-semibold text-slate-900">
          Redirecting to PayHere
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Please wait while we securely redirect you to the payment gateway.
        </p>

        <form ref={formRef} method="POST" action={action} className="hidden">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        </form>
      </div>
    </div>
  );
}
