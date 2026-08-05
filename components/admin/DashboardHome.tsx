import Link from "next/link";
import {
  ArrowUpLeft,
  Boxes,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  FolderKanban,
  PackageCheck,
  ShoppingBag,
  Truck,
  UsersRound,
  XCircle,
} from "lucide-react";

import AnimatedSection from "@/components/AnimatedSection";
import GoldBranch from "@/components/GoldBranch";

type LatestOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  totalItems: number;
  createdAt: string;
};

type LatestCustomer = {
  id: string;
  displayName: string;
  email: string;
  active: boolean;
  orderCount: number;
  createdAt: string;
};

type TopProduct = {
  productSlug: string;
  productNameAr: string;
  quantity: number;
  orderCount: number;
};

type Props = {
  productCount: number;
  categoryCount: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  preparingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  activeCustomers: number;
  totalOrderItems: number;
  latestOrders: LatestOrder[];
  latestCustomers: LatestCustomer[];
  topProducts: TopProduct[];
};

const orderStatusLabels: Record<string, string> = {
  PENDING: "قيد المراجعة",
  CONFIRMED: "تم التأكيد",
  PREPARING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "في انتظار الدفع",
  PAID: "مدفوع",
  FAILED: "فشل الدفع",
  REFUNDED: "تم رد المبلغ",
  PARTIALLY_REFUNDED: "رد جزئي",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(new Date(value));
}

function getStatusClass(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "border-sky-400/25 bg-sky-400/10 text-sky-200";

    case "PREPARING":
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";

    case "SHIPPED":
      return "border-violet-400/25 bg-violet-400/10 text-violet-200";

    case "DELIVERED":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";

    case "CANCELLED":
      return "border-red-400/25 bg-red-400/10 text-red-200";

    default:
      return "border-lime-300/25 bg-lime-300/10 text-lime-200";
  }
}

export default function DashboardHome({
  productCount,
  categoryCount,
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
}: Props) {
  const metrics = [
    {
      label: "إجمالي الطلبات",
      value: totalOrders,
      detail: "كل الطلبات المسجلة",
      icon: ShoppingBag,
    },
    {
      label: "إجمالي العملاء",
      value: totalCustomers,
      detail: `${activeCustomers.toLocaleString(
        "ar-EG",
      )} حساب نشط`,
      icon: UsersRound,
    },
    {
      label: "المنتجات الحالية",
      value: productCount,
      detail: `${categoryCount.toLocaleString(
        "ar-EG",
      )} تصنيف`,
      icon: Boxes,
    },
    {
      label: "إجمالي القطع المطلوبة",
      value: totalOrderItems,
      detail: "مجموع كميات الطلبات",
      icon: PackageCheck,
    },
  ];

  const orderFlow = [
    {
      label: "قيد المراجعة",
      value: pendingOrders,
      icon: Clock3,
    },
    {
      label: "تم التأكيد",
      value: confirmedOrders,
      icon: CheckCircle2,
    },
    {
      label: "قيد التجهيز",
      value: preparingOrders,
      icon: Boxes,
    },
    {
      label: "تم الشحن",
      value: shippedOrders,
      icon: Truck,
    },
    {
      label: "تم التسليم",
      value: deliveredOrders,
      icon: PackageCheck,
    },
    {
      label: "ملغي",
      value: cancelledOrders,
      icon: XCircle,
    },
  ];

  return (
    <main
      className="relative min-h-screen flex-1 overflow-hidden bg-[#07140f] px-4 py-6 text-white sm:px-8 lg:px-12 lg:py-10"
      dir="rtl"
    >
      <GoldBranch className="-left-24 -top-20 opacity-[0.07]" />
      <GoldBranch
        rotate
        className="-bottom-24 -right-24 opacity-[0.07]"
      />

      <div className="relative mx-auto max-w-7xl">
        <AnimatedSection>
          <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-300">
                ArtVert Agricultural Platform
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                لوحة التحكم الرئيسية
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
                متابعة مباشرة للطلبات والعملاء والمنتجات
                وحركة المتجر من قاعدة بيانات PostgreSQL.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/orders"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-[#082017]"
              >
                إدارة الطلبات
                <ArrowUpLeft size={16} />
              </Link>

              <Link
                href="/admin/products"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-bold text-white/75 transition hover:bg-white/5"
              >
                إدارة المنتجات
                <ArrowUpLeft size={16} />
              </Link>
            </div>
          </header>
        </AnimatedSection>

        <AnimatedSection className="mt-7">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Metric
                key={metric.label}
                icon={metric.icon}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
              />
            ))}
          </section>
        </AnimatedSection>

        <AnimatedSection className="mt-7">
          <section className="rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5 shadow-2xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-emerald-300">
                  مسار تنفيذ الطلبات
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  حالات الطلبات الحالية
                </h2>
              </div>

              <Link
                href="/admin/orders"
                className="text-sm font-bold text-white/55 transition hover:text-emerald-300"
              >
                عرض كل الطلبات
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {orderFlow.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-black/15 p-4"
                  >
                    <Icon
                      size={19}
                      className="text-emerald-300"
                    />

                    <strong className="mt-4 block text-2xl font-black">
                      {item.value.toLocaleString("ar-EG")}
                    </strong>

                    <span className="mt-1 block text-xs text-white/45">
                      {item.label}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
        </AnimatedSection>

        <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <AnimatedSection>
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b2118]/90 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
                <div>
                  <p className="text-sm font-bold text-emerald-300">
                    أحدث النشاط
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    آخر الطلبات
                  </h2>
                </div>

                <Link
                  href="/admin/orders"
                  className="text-sm font-bold text-white/50 transition hover:text-emerald-300"
                >
                  عرض الكل
                </Link>
              </div>

              {latestOrders.length === 0 ? (
                <div className="p-8 text-center text-white/45">
                  لا توجد طلبات حتى الآن.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {latestOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="grid gap-4 p-5 transition hover:bg-white/[.025] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong
                            className="text-emerald-300"
                            dir="ltr"
                          >
                            {order.orderNumber}
                          </strong>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${getStatusClass(
                              order.status,
                            )}`}
                          >
                            {orderStatusLabels[
                              order.status
                            ] ?? order.status}
                          </span>
                        </div>

                        <p className="mt-2 truncate font-bold">
                          {order.customerName}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {order.totalItems.toLocaleString(
                            "ar-EG",
                          )}{" "}
                          قطعة ·{" "}
                          {paymentStatusLabels[
                            order.paymentStatus
                          ] ?? order.paymentStatus}
                        </p>
                      </div>

                      <span className="text-xs text-white/35">
                        {formatDate(order.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </AnimatedSection>

          <AnimatedSection>
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b2118]/90 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
                <div>
                  <p className="text-sm font-bold text-emerald-300">
                    المنتجات
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    الأكثر طلبًا
                  </h2>
                </div>

                <FolderKanban
                  size={21}
                  className="text-emerald-300"
                />
              </div>

              {topProducts.length === 0 ? (
                <div className="p-8 text-center text-white/45">
                  لا توجد بيانات مبيعات حتى الآن.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {topProducts.map((product, index) => (
                    <Link
                      key={product.productSlug}
                      href={`/products/${product.productSlug}`}
                      className="flex items-center gap-4 p-5 transition hover:bg-white/[.025]"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-300/10 font-black text-emerald-300">
                        {(index + 1).toLocaleString(
                          "ar-EG",
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <strong className="block truncate">
                          {product.productNameAr}
                        </strong>

                        <span className="mt-1 block text-xs text-white/40">
                          ظهر في{" "}
                          {product.orderCount.toLocaleString(
                            "ar-EG",
                          )}{" "}
                          طلب
                        </span>
                      </div>

                      <strong className="text-lg text-emerald-300">
                        {product.quantity.toLocaleString(
                          "ar-EG",
                        )}
                      </strong>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </AnimatedSection>
        </div>

        <AnimatedSection className="mt-7">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b2118]/90 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
              <div>
                <p className="text-sm font-bold text-emerald-300">
                  حسابات العملاء
                </p>

                <h2 className="mt-1 text-xl font-black">
                  أحدث العملاء
                </h2>
              </div>

              <Link
                href="/admin/customers"
                className="text-sm font-bold text-white/50 transition hover:text-emerald-300"
              >
                إدارة العملاء
              </Link>
            </div>

            {latestCustomers.length === 0 ? (
              <div className="p-8 text-center text-white/45">
                لا يوجد عملاء حتى الآن.
              </div>
            ) : (
              <div className="grid gap-px bg-white/10 sm:grid-cols-2 xl:grid-cols-3">
                {latestCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/admin/customers/${customer.id}`}
                    className="bg-[#0b2118] p-5 transition hover:bg-white/[.025]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300">
                        <CircleUserRound size={21} />
                      </div>

                      <div className="min-w-0">
                        <strong className="block truncate">
                          {customer.displayName}
                        </strong>

                        <span
                          className="mt-1 block truncate text-xs text-white/40"
                          dir="ltr"
                        >
                          {customer.email}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span
                        className={
                          customer.active
                            ? "text-emerald-300"
                            : "text-red-300"
                        }
                      >
                        {customer.active
                          ? "حساب نشط"
                          : "حساب معطل"}
                      </span>

                      <span className="text-white/40">
                        {customer.orderCount.toLocaleString(
                          "ar-EG",
                        )}{" "}
                        طلب
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </AnimatedSection>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Boxes;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5 shadow-xl shadow-black/10">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/55">
          {label}
        </p>

        <span className="grid size-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300">
          <Icon size={19} />
        </span>
      </div>

      <p className="mt-6 text-3xl font-black">
        {value.toLocaleString("ar-EG")}
      </p>

      <p className="mt-1 text-xs text-white/35">
        {detail}
      </p>
    </article>
  );
}
