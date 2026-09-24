import { requireAdmin } from "@/lib/auth/require-admin";
import AdminUserForm from "@/components/admin/AdminUserForm";

export default async function NewAdminUserPage() {
  await requireAdmin();
  return <AdminUserForm />;
}
