import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Mail, MapPin, Package, Pencil, Phone, ShoppingBag, UserRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 10;

const orderStatusStyle: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-indigo-50 text-indigo-700",
  SHIPPED: "bg-violet-50 text-violet-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

function formatLkr(amount: number | string) {
  return `LKR ${Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const requestedPage = Number.parseInt(rawPage ?? "1", 10);
  const requestedPageSafe = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const customer = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          fullName: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          district: true,
          postalCode: true,
          isDefault: true,
        },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!customer) notFound();
  const customerId = customer.id;

  const totalPages = Math.max(1, Math.ceil(customer._count.orders / PAGE_SIZE));
  const page = Math.min(requestedPageSafe, totalPages);
  const [orders, paidOrders] = await Promise.all([
    prisma.order.findMany({
      where: { userId: customerId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        discount: true,
        shippingCost: true,
        total: true,
        couponCode: true,
        createdAt: true,
        items: {
          select: { id: true, name: true, size: true, colour: true, price: true, quantity: true },
        },
      },
    }),
    prisma.order.aggregate({
      where: { userId: customerId, paymentStatus: "PAID" },
      _sum: { total: true },
    }),
  ]);

  function pageHref(targetPage: number) {
    return targetPage > 1 ? `/admin/users/${customerId}?page=${targetPage}` : `/admin/users/${customerId}`;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900">
            <ArrowLeft size={16} /> Back to customers
          </Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Customer management</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{customer.name ?? "Unnamed customer"}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customer.role === "ADMIN" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}`}>{customer.role === "ADMIN" ? "Admin account" : "Customer"}</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">Profile, saved addresses, and complete order history.</p>
        </div>
        <Link href={`/admin/users/${customer.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
          <Pencil size={15} /> Edit account
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500"><ShoppingBag size={16} /> Total orders</div>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{customer._count.orders}</p>
          <p className="mt-1 text-xs text-slate-500">All order statuses</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500"><Package size={16} /> Paid order value</div>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{formatLkr(paidOrders._sum.total?.toString() ?? 0)}</p>
          <p className="mt-1 text-xs text-slate-500">Paid orders, including shipping</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin size={16} /> Saved addresses</div>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{customer.addresses.length}</p>
          <p className="mt-1 text-xs text-slate-500">On this customer account</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950"><UserRound size={18} className="text-blue-600" /> Customer information</h2>
          <dl className="mt-5 space-y-4">
            <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt><dd className="mt-1 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800"><Mail size={14} className="text-slate-400" />{customer.email}<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${customer.emailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{customer.emailVerified ? "Verified" : "Unverified"}</span></dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Customer since</dt><dd className="mt-1 flex items-center gap-2 text-sm text-slate-700"><CalendarDays size={14} className="text-slate-400" />{customer.createdAt.toLocaleDateString("en-LK", { dateStyle: "long" })}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Account ID</dt><dd className="mt-1 break-all font-mono text-xs text-slate-500">{customer.id}</dd></div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950"><MapPin size={18} className="text-blue-600" /> Saved addresses</h2>
          {customer.addresses.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No saved addresses on this account.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {customer.addresses.map((address) => (
                <article key={address.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{address.fullName}</p>{address.isDefault && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Default</span>}</div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}<br />{address.city}, {address.district} {address.postalCode}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><Phone size={12} />{address.phone}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-lg font-semibold text-slate-950">Order history</h2><p className="mt-1 text-sm text-slate-500">Orders are shown newest first. Item prices reflect the amount recorded when the order was placed.</p></div>
          <span className="text-sm font-medium text-slate-500">{customer._count.orders} {customer._count.orders === 1 ? "order" : "orders"}</span>
        </div>
        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center"><ShoppingBag className="mx-auto text-slate-300" size={32} /><p className="mt-3 text-sm font-medium text-slate-700">No orders yet</p><p className="mt-1 text-xs text-slate-500">Completed purchases will appear here.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <article key={order.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-slate-900 hover:text-blue-700">{order.orderNumber}<ArrowRight size={14} /></Link>
                    <p className="mt-1 text-xs text-slate-500">{order.createdAt.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${orderStatusStyle[order.status] ?? "bg-slate-100 text-slate-600"}`}>{order.status}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${order.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700" : order.paymentStatus === "FAILED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>Payment {order.paymentStatus.toLowerCase()}</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                  <ul className="space-y-2">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                        <span className="text-slate-700">{item.name} <span className="text-xs text-slate-500">· {item.size} / {item.colour} · Qty {item.quantity}</span></span>
                        <span className="text-xs font-medium text-slate-600">{formatLkr(Number(item.price) * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-slate-100 pt-3 text-sm md:min-w-40 md:border-l md:border-t-0 md:pl-5 md:pt-0 md:text-right">
                    {Number(order.discount) > 0 && <p className="text-xs text-emerald-700">Discount −{formatLkr(order.discount.toString())}</p>}
                    <p className="mt-1 font-semibold text-slate-950">{formatLkr(order.total.toString())}</p>
                    <p className="text-[11px] text-slate-500">{order.items.length} {order.items.length === 1 ? "line item" : "line items"}{order.couponCode ? ` · ${order.couponCode}` : ""}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {customer._count.orders > PAGE_SIZE && (
          <nav aria-label="Order history pagination" className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm">
            <span className="text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50">Previous</Link> : <span className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">Previous</span>}
              {page < totalPages ? <Link href={pageHref(page + 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50">Next</Link> : <span className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">Next</span>}
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}
