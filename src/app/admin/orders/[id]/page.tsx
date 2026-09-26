import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import OrderStatusUpdater from "@/components/admin/OrderStatusUpdater";
import { ArrowLeft, CreditCard, MapPin, User, Package } from "lucide-react";
import Image from "next/image";

type OrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminOrderDetailPage({
  params,
}: OrderDetailPageProps) {
  await requireAdmin();

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-2"
          >
            <ArrowLeft size={14} /> Back to all orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
              {order.orderNumber}
            </h1>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                order.paymentStatus === "PAID"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              Payment: {order.paymentStatus}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items and Totals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <Package size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Ordered Items</h2>
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

            {/* Financial Totals */}
            <div className="bg-slate-50 p-5 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 text-xs">
                <span>Subtotal</span>
                <span>LKR {Number(order.subtotal).toLocaleString()}</span>
              </div>

              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-600 text-xs font-medium">
                  <span>Discount ({order.couponCode ?? "Coupon"})</span>
                  <span>- LKR {Number(order.discount).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 text-xs">
                <span>Shipping Cost</span>
                <span>LKR {Number(order.shippingCost).toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-base">
                <span>Total Amount</span>
                <span className="text-blue-600">
                  LKR {Number(order.total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* PayHere Payment Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Payment Details</h2>
            </div>

            {order.payment ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Provider</span>
                  <span className="font-semibold text-slate-800">
                    {order.payment.provider}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Status</span>
                  <span
                    className={`font-semibold ${
                      order.payment.status === "PAID"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {order.payment.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">
                    PayHere Ref ID
                  </span>
                  <span className="font-mono text-slate-800">
                    {order.payment.providerId ?? "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Amount</span>
                  <span className="font-semibold text-slate-800">
                    {order.payment.currency} {Number(order.payment.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No payment record found.</p>
            )}
          </div>
        </div>

        {/* Right Column: Customer & Delivery Info & Status Updater */}
        <div className="space-y-6">
          {/* Status Updater */}
          <OrderStatusUpdater
            orderId={order.id}
            currentStatus={order.status}
          />

          {/* Customer Profile */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Customer Info</h2>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Name</span>
                <span className="font-semibold text-slate-800">
                  {order.user.name ?? order.shippingFullName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Email</span>
                <span className="font-medium text-slate-800">
                  {order.user.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Phone</span>
                <span className="font-medium text-slate-800">
                  {order.shippingPhone}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Shipping Address</h2>
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900">
                {order.shippingFullName}
              </p>
              <p>{order.shippingAddressLine1}</p>
              {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
              <p>
                {order.shippingCity}, {order.shippingDistrict}
              </p>
              <p>{order.shippingPostalCode}</p>
              <p className="text-slate-500 pt-1 font-mono">
                Phone: {order.shippingPhone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
