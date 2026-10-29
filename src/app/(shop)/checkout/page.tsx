import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getCartAction } from "@/app/(shop)/cart/actions";
import CheckoutPageClient from "@/components/checkout/CheckoutPageClient";

type CheckoutPageProps = {
  searchParams: Promise<{ buyNowVariantId?: string; quantity?: string }>;
};

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  // Read the buy-now and quantity parameters before deciding whether the user can proceed.
  const params = await searchParams;
  const session = await auth();

  // Guests are redirected to login with the current checkout context preserved so they can
  // return to the same purchase flow after authentication.
  if (!session?.user?.id) {
    const callbackUrl = params.buyNowVariantId
      ? `/checkout?buyNowVariantId=${encodeURIComponent(params.buyNowVariantId)}&quantity=${encodeURIComponent(params.quantity ?? "1")}`
      : "/checkout";
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const [addresses, cartResult] = await Promise.all([
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    getCartAction(params.buyNowVariantId, params.quantity ? Number(params.quantity) : 1),
  ]);

  return (
    <CheckoutPageClient
      initialAddresses={addresses}
      initialCart={cartResult.cart ?? null}
      buyNow={
        params.buyNowVariantId
          ? {
              variantId: params.buyNowVariantId,
              quantity: Number(params.quantity ?? 1),
            }
          : undefined
      }
    />
  );
}
