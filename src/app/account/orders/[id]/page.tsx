import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { ArrowLeft, CreditCard, MapPin, Package } from "lucide-react";
import Image from "next/image";

type CustomerOrderDetailProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerOrderDetailPage({
  params,
}: CustomerOrderDetailProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/orders");
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
      payment: true,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-2"
          >
            <ArrowLeft size={14} /> Back to orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                {order.orderNumber}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>

            {order.paymentStatus === "PENDING" && (
              <Link
                href={`/checkout/payment?orderId=${order.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
              >
                <CreditCard size={15} />
                Complete PayHere Payment
              </Link>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">
              Payment Status
            </span>
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full font-semibold ${
                order.paymentStatus === "PAID"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">
              Fulfillment Status
            </span>
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full font-semibold ${
                order.status === "CONFIRMED" || order.status === "DELIVERED"
                  ? "bg-blue-50 text-blue-700"
                  : order.status === "PROCESSING" || order.status === "SHIPPED"
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {order.status}
            </span>
          </div>

          {order.payment?.providerId && (
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">
                PayHere Transaction ID
              </span>
              <span className="font-mono text-slate-700 font-semibold">
                {order.payment.providerId}
              </span>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Package size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">Order Items</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => {
              const img = item.product?.images[0]?.url;
              return (
                <div
                  key={item.id}
                  className="p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                      {img ? (
                        <Image
                          src={img}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Size: <span className="font-medium text-slate-700">{item.size}</span> | Colour:{" "}
                        <span className="font-medium text-slate-700">{item.colour}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Quantity: {item.quantity} × LKR {Number(item.price).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">
                      LKR {(Number(item.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing summary */}
          <div className="bg-slate-50 p-5 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>LKR {Number(order.subtotal).toLocaleString()}</span>
            </div>

            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon Discount ({order.couponCode})</span>
                <span>- LKR {Number(order.discount).toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Shipping Fee</span>
              <span>LKR {Number(order.shippingCost).toLocaleString()}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
              <span>Total Paid</span>
              <span className="text-blue-600">
                LKR {Number(order.total).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">Delivery Address</h2>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-900">
              {order.shippingFullName}
            </p>
            <p>{order.shippingAddressLine1}</p>
            {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
            <p>
              {order.shippingCity}, {order.shippingDistrict} {order.shippingPostalCode}
            </p>
            <p className="text-slate-500 pt-1 font-mono">
              Phone: {order.shippingPhone}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
