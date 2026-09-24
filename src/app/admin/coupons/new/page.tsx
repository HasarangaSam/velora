import { requireAdmin } from "@/lib/auth/require-admin";
import CreateCouponForm from "@/components/admin/CreateCouponForm";

export default async function NewCouponPage() {
  await requireAdmin();

  return <CreateCouponForm />;
}
