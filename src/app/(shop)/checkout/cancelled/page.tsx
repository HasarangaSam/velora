import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type CancelledPageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

export default async function CancelledPage({
  searchParams,
}: CancelledPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;

  if (!params.orderId) {
    redirect("/account/orders");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      userId: session.user.id,
    },
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
    },
  });

  if (!order) {
    redirect("/account/orders");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Payment was not completed
        </h1>

        <p className="mt-3 text-slate-600">
          Your order has not been confirmed. You can return to checkout and try
          the payment again.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={`/checkout/payment?orderId=${order.id}`}
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try Payment Again
          </Link>

          <Link
            href="/account/orders"
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            My Orders
          </Link>
        </div>
      </div>
    </main>
  );
}
