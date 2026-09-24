import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type SuccessPageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
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
      status: true,
      paymentStatus: true,
      total: true,
    },
  });

  if (!order) {
    redirect("/account/orders");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        {order.paymentStatus === "PAID" ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              ✓
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Payment successful
            </h1>

            <p className="mt-3 text-slate-600">
              Your order has been confirmed successfully.
            </p>

            <div className="mt-6 rounded-lg bg-slate-50 p-4 text-left">
              <p className="text-sm text-slate-500">Order number</p>

              <p className="mt-1 font-semibold text-slate-900">
                {order.orderNumber}
              </p>

              <p className="mt-4 text-sm text-slate-500">Total</p>

              <p className="mt-1 font-semibold text-slate-900">
                LKR {Number(order.total).toFixed(2)}
              </p>
            </div>

            <Link
              href={`/account/orders/${order.id}`}
              className="mt-6 inline-flex rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Order
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900">
              Payment is being confirmed
            </h1>

            <p className="mt-3 text-slate-600">
              Your payment notification has not reached us yet. Please check
              your order shortly.
            </p>

            <Link
              href={`/account/orders/${order.id}`}
              className="mt-6 inline-flex rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              View Order
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
