"use client";

import { useTransition } from "react";
import { toggleUserRole } from "@/app/admin/users/actions";
import { Shield, ShieldAlert, Loader2 } from "lucide-react";

export default function UserRoleToggle({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (isSelf || isPending) return;
    const targetRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    const confirmed = confirm(
      `Are you sure you want to change this user's role to ${targetRole}?`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await toggleUserRole(userId);
      if (!res.success) {
        alert(res.message);
      }
    });
  }

  if (isSelf) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        <Shield size={12} /> ADMIN (You)
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-60 ${
        currentRole === "ADMIN"
          ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {isPending ? (
        <Loader2 size={13} className="animate-spin" />
      ) : currentRole === "ADMIN" ? (
        <>
          <ShieldAlert size={13} />
          Demote to User
        </>
      ) : (
        <>
          <Shield size={13} />
          Promote to Admin
        </>
      )}
    </button>
  );
}
