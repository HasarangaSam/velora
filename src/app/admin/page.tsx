import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCache, setCache } from "@/lib/redis";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import SalesRevenueChart, {
  DailyDataPoint,
} from "@/components/admin/charts/SalesRevenueChart";
import OrderStatusDonutChart from "@/components/admin/charts/OrderStatusDonutChart";
import CategoryPerformanceChart from "@/components/admin/charts/CategoryPerformanceChart";
import ReviewRatingBreakdown from "@/components/admin/charts/ReviewRatingBreakdown";
import OrdersAwaitingProcessingQueue, {
  ConfirmedOrderItem,
} from "@/components/admin/OrdersAwaitingProcessingQueue";

export const revalidate = 0; // Dynamic dashboard

type DashboardStats = {
  totalSales: number;
  totalOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
};

async function getDashboardStats(): Promise<DashboardStats> {
  const cacheKey = "velora:admin:stats";
  const cached = await getCache<DashboardStats>(cacheKey);
  if (cached) return cached;

  const [
    salesAgg,
    totalOrders,
    confirmedOrders,
    pendingOrders,
    totalProducts,
    lowStockVariants,
    totalCustomers,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count({
      where: { stock: { lte: 5 } },
    }),
    prisma.user.count({ where: { role: "USER" } }),
  ]);

  const stats: DashboardStats = {
    totalSales: Number(salesAgg._sum.total ?? 0),
    totalOrders,
    confirmedOrders,
    pendingOrders,
    totalProducts,
    lowStockCount: lowStockVariants,
    totalCustomers,
  };

  await setCache(cacheKey, stats, 30); // Cache for 30s
  return stats;
}

export default async function AdminDashboardPage() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    stats,
    recentOrders,
    pastOrders,
    orderStatusCountsRaw,
    paidOrderItems,
    reviewsGroupBy,
    reviewAgg,
    unprocessedOrdersRaw,
  ] = await Promise.all([
    getDashboardStats(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: true,
      },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        total: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.orderItem.findMany({
      where: {
        order: { paymentStatus: "PAID" },
      },
      select: {
        price: true,
        quantity: true,
        product: {
          select: {
            category: { select: { name: true } },
          },
        },
      },
    }),
    prisma.productReview.groupBy({
      by: ["rating"],
      _count: { _all: true },
    }),
    prisma.productReview.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: { status: "CONFIRMED" },
      take: 6,
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { email: true } },
        items: { select: { quantity: true } },
      },
    }),
  ]);

  const confirmedOrdersQueue: ConfirmedOrderItem[] = unprocessedOrdersRaw.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt.toISOString(),
    total: Number(o.total),
    itemCount: o.items.reduce((acc, it) => acc + it.quantity, 0),
    shippingFullName: o.shippingFullName,
    shippingCity: o.shippingCity,
    customerEmail: o.user.email,
  }));

  // Compute 30-day and 7-day daily data for sales & revenue line/area chart
  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { revenue: 0, orders: 0 });
  }

  for (const order of pastOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const current = dailyMap.get(key);
    if (current) {
      if (order.paymentStatus === "PAID") {
        current.revenue += Number(order.total);
      }
      current.orders += 1;
    }
  }

  const data30Days: DailyDataPoint[] = Array.from(dailyMap.entries()).map(([dateStr, val]) => {
    const d = new Date(dateStr + "T00:00:00");
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      date: dateStr,
      label,
      revenue: Math.round(val.revenue),
      orders: val.orders,
    };
  });

  const data7Days = data30Days.slice(-7);

  // Compute order status counts for donut chart
  const statusCounts = [
    "DELIVERED",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "PENDING",
    "CANCELLED",
  ].map((status) => {
    const found = orderStatusCountsRaw.find((s) => s.status === status);
    return {
      status,
      count: found ? found._count._all : 0,
    };
  });

  // Compute category sales for bar chart
  const catMap = new Map<string, { itemCount: number; revenue: number }>();
  for (const item of paidOrderItems) {
    const catName = item.product?.category?.name ?? "General";
    const prev = catMap.get(catName) ?? { itemCount: 0, revenue: 0 };
    prev.itemCount += item.quantity;
    prev.revenue += Number(item.price) * item.quantity;
    catMap.set(catName, prev);
  }

  const categoryStats = Array.from(catMap.entries())
    .map(([name, stat]) => ({
      name,
      itemCount: stat.itemCount,
      revenue: Math.round(stat.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Compute review rating breakdown
  const ratingStats = [5, 4, 3, 2, 1].map((r) => {
    const found = reviewsGroupBy.find((g) => g.rating === r);
    return {
      rating: r,
      count: found ? found._count._all : 0,
    };
  });
  const totalReviews = reviewAgg._count._all;
  const avgRating = reviewAgg._avg.rating ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Overview
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time business performance, sales trends, and fulfillment analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Package size={16} />
            Add New Product
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <ShoppingBag size={16} />
            View Orders
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Total Revenue
            </span>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              LKR {stats.totalSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <TrendingUp size={14} />
              <span>Paid customer orders</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Total Orders
            </span>
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalOrders}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.confirmedOrders} confirmed & fulfilled
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Pending Orders
            </span>
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-amber-600">
              {stats.pendingOrders}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Awaiting payment or confirmation
            </p>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Active Products
            </span>
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalProducts}
            </p>
            <Link
              href="/admin/products"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Manage catalog <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Low Stock Variants
            </span>
            <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-rose-600">
              {stats.lowStockCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Variants with 5 or fewer items
            </p>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Registered Customers
            </span>
            <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalCustomers}
            </p>
            <Link
              href="/admin/users"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View accounts <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Priority Action Queue: Confirmed Orders Awaiting Processing */}
      <OrdersAwaitingProcessingQueue
        orders={confirmedOrdersQueue}
        totalConfirmedCount={stats.confirmedOrders}
      />

      {/* Analytics & Graphs Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Analytics & Insights</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive visual charts analyzing store revenue, order pipeline, categories, and customer feedback.
          </p>
        </div>

        {/* Row 1: Sales Trend (2/3) & Order Status Donut (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesRevenueChart data30Days={data30Days} data7Days={data7Days} />
          </div>
          <div className="lg:col-span-1">
            <OrderStatusDonutChart
              statusCounts={statusCounts}
              totalOrders={stats.totalOrders}
            />
          </div>
        </div>

        {/* Row 2: Category Sales (1/2) & Review Rating Breakdown (1/2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryPerformanceChart
            categories={categoryStats}
            totalRevenue={stats.totalSales}
          />
          <ReviewRatingBreakdown
            ratings={ratingStats}
            totalReviews={totalReviews}
            avgRating={avgRating}
          />
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest transactions made on Velora
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Orders <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            No orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 text-xs">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {order.shippingFullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.user.email}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      LKR {Number(order.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : order.paymentStatus === "PENDING"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === "CONFIRMED" || order.status === "DELIVERED"
                            ? "bg-blue-50 text-blue-700"
                            : order.status === "PROCESSING" || order.status === "SHIPPED"
                            ? "bg-indigo-50 text-indigo-700"
                            : order.status === "CANCELLED"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Details
                      </Link>
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
