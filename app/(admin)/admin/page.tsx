import type { Metadata } from "next";

import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardHome from "@/components/admin/DashboardHome";
import { UserRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getProductCatalog } from "@/lib/products/product-catalog";

export const metadata: Metadata = {
  title: "لوحة التحكم",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.AGRONOMIST,
  );

  const products = await getProductCatalog().list();

  const categoryCount = new Set(
    products.map((product) => product.category),
  ).size;

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    preparingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalCustomers,
    activeCustomers,
    totalOrderItems,
    latestOrders,
    latestCustomers,
    topProducts,
  ] = await Promise.all([
    prisma.order.count(),

    prisma.order.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.order.count({
      where: {
        status: "CONFIRMED",
      },
    }),

    prisma.order.count({
      where: {
        status: "PREPARING",
      },
    }),

    prisma.order.count({
      where: {
        status: "SHIPPED",
      },
    }),

    prisma.order.count({
      where: {
        status: "DELIVERED",
      },
    }),

    prisma.order.count({
      where: {
        status: "CANCELLED",
      },
    }),

    prisma.customer.count(),

    prisma.customer.count({
      where: {
        active: true,
      },
    }),

    prisma.order.aggregate({
      _sum: {
        totalItems: true,
      },
    }),

    prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        paymentStatus: true,
        totalItems: true,
        createdAt: true,
      },
    }),

    prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        displayName: true,
        email: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),

    prisma.orderItem.groupBy({
      by: [
        "productSlug",
        "productNameAr",
      ],
      _sum: {
        quantity: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 6,
    }),
  ]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_15%_6%,rgba(143,202,45,.12),transparent_25%),radial-gradient(circle_at_88%_18%,rgba(38,164,83,.12),transparent_27%),linear-gradient(145deg,#02150d_0%,#063220_48%,#02180f_100%)] text-white font-sans lg:flex">
      
      {/* شبكة الخلفية الخفيفة المدمجة مع التصميم (Subtle Grid Overlay) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* المحتوى الفعلي للوحة التحكم */}
      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        <AdminSidebar />

        <DashboardHome
          productCount={products.length}
          categoryCount={categoryCount}
          totalOrders={totalOrders}
          pendingOrders={pendingOrders}
          confirmedOrders={confirmedOrders}
          preparingOrders={preparingOrders}
          shippedOrders={shippedOrders}
          deliveredOrders={deliveredOrders}
          cancelledOrders={cancelledOrders}
          totalCustomers={totalCustomers}
          activeCustomers={activeCustomers}
          totalOrderItems={
            totalOrderItems._sum.totalItems ?? 0
          }
          latestOrders={latestOrders.map((order) => ({
            ...order,
            createdAt: order.createdAt.toISOString(),
          }))}
          latestCustomers={latestCustomers.map(
            (customer) => ({
              id: customer.id,
              displayName: customer.displayName,
              email: customer.email,
              active: customer.active,
              orderCount: customer._count.orders,
              createdAt:
                customer.createdAt.toISOString(),
            }),
          )}
          topProducts={topProducts.map((product) => ({
            productSlug: product.productSlug,
            productNameAr: product.productNameAr,
            quantity: product._sum.quantity ?? 0,
            orderCount: product._count._all,
          }))}
        />
      </div>
    </div>
  );
}