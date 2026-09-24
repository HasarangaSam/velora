import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import UserRoleToggle from "@/components/admin/UserRoleToggle";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Accounts
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Users & Roles</h1>
          <p className="text-sm text-slate-500 mt-1">
            View registered customer accounts and manage administrative privileges.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Users className="mx-auto text-slate-300 mb-3" size={36} />
            <p className="font-semibold text-slate-700">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Total Orders</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  <th className="px-6 py-3.5 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {user.name ?? "Unnamed Customer"}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {user.id}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium text-xs">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          user.role === "ADMIN"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-800">
                      {user._count.orders} {user._count.orders === 1 ? "order" : "orders"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <UserRoleToggle
                        userId={user.id}
                        currentRole={user.role}
                        isSelf={currentAdmin.id === user.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
