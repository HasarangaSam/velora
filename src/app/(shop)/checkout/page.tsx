import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CheckoutPageClient from "@/components/checkout/CheckoutPageClient";

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/checkout");
  }

  return <CheckoutPageClient />;
}
