"use client";

import { useState } from "react";
import { toggleUserRole } from "@/app/admin/users/actions";
import { Shield, ShieldAlert } from "lucide-react";

export default function UserRoleToggle({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(currentRole);

  async function handleToggle() {
    if (isSelf || loading) return;
    const confirmed = confirm(
      `Are you sure you want to change this user's role to ${role === "ADMIN" ? "USER" : "ADMIN"}?`,
    );
    if (!confirmed) return;

    setLoading(true);
    const res = await toggleUserRole(userId, role);
    if (res.success) {
      setRole(role === "ADMIN" ? "USER" : "ADMIN");
    } else {
      alert(res.message);
    }
    setLoading(false);
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
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-60 ${
        role === "ADMIN"
          ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {role === "ADMIN" ? (
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
