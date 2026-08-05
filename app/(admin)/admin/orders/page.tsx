import Link from "next/link";
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  Eye,
  FilePenLine,
  MapPin,
  Package,
  Phone,
  RefreshCcw,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

import DeleteOrderButton from "./DeleteOrderButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrdersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    paymentStatus?: string;
    page?: string;
  }>;
};

const ORDER_STATUSES = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const PAYMENT_STATUSES = [
  "ALL",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;

const PAGE_SIZE = 20;

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

const paymentMethodLabels: Record<string, string> = {
  CASH_ON_DELIVERY: "الدفع عند الاستلام",
  VODAFONE_CASH: "فودافون كاش",
  INSTAPAY: "إنستاباي",
  BANK_TRANSFER: "تحويل بنكي",
  ONLINE_PAYMENT: "دفع إلكتروني",
  OTHER: "طريقة أخرى",
};

const orderSourceLabels: Record<string, string> = {
  WEBSITE: "الموقع",
  WHATSAPP: "واتساب",
  ADMIN: "لوحة الإدارة",
  PHONE: "هاتف",
};

function getOrderStatusClass(status: string) {
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

function getPaymentStatusClass(status: string) {
  switch (status) {
    case "PAID":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";

    case "FAILED":
      return "border-red-400/25 bg-red-400/10 text-red-200";

    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "border-violet-400/25 bg-violet-400/10 text-violet-200";

    default:
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(date);
}

function normalizePage(value: string | undefined) {
  const parsedPage = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsedPage) || parsedPage < 1) {
    return 1;
  }

  return parsedPage;
}

function normalizeOrderStatus(value: string | undefined) {
  if (
    value &&
    ORDER_STATUSES.includes(
      value as (typeof ORDER_STATUSES)[number],
    )
  ) {
    return value;
  }

  return "ALL";
}

function normalizePaymentStatus(value: string | undefined) {
  if (
    value &&
    PAYMENT_STATUSES.includes(
      value as (typeof PAYMENT_STATUSES)[number],
    )
  ) {
    return value;
  }

  return "ALL";
}

function buildPageUrl({
  search,
  status,
  paymentStatus,
  page,
}: {
  search: string;
  status: string;
  paymentStatus: string;
  page: number;
}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (status !== "ALL") {
    params.set("status", status);
  }

  if (paymentStatus !== "ALL") {
    params.set("paymentStatus", paymentStatus);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `/admin/orders?${query}`
    : "/admin/orders";
}

export default async function OrdersPage({
  searchParams,
}: OrdersPageProps) {
  const params = await searchParams;

  const search = (params.search ?? "").trim();
  const status = normalizeOrderStatus(params.status);
  const paymentStatus = normalizePaymentStatus(
    params.paymentStatus,
  );
  const requestedPage = normalizePage(params.page);

  const where = {
    ...(status !== "ALL"
      ? {
          status: status as
            | "PENDING"
            | "CONFIRMED"
            | "PREPARING"
            | "SHIPPED"
            | "DELIVERED"
            | "CANCELLED",
        }
      : {}),
    ...(paymentStatus !== "ALL"
      ? {
          paymentStatus: paymentStatus as
            | "PENDING"
            | "PAID"
            | "FAILED"
            | "REFUNDED"
            | "PARTIALLY_REFUNDED",
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              orderNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              customerName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              governorate: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              city: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    cancelledOrders,
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
        status: "DELIVERED",
      },
    }),
    prisma.order.count({
      where: {
        status: "CANCELLED",
      },
    }),
  ]);

  const filteredCount = await prisma.order.count({
    where,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCount / PAGE_SIZE),
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const orders = await prisma.order.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      source: true,
      customerName: true,
      phone: true,
      alternativePhone: true,
      governorate: true,
      city: true,
      addressLine: true,
      notes: true,
      totalItems: true,
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          productSlug: true,
          productNameAr: true,
          productNameEn: true,
          quantity: true,
          packageSize: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const stats = [
    {
      label: "إجمالي الطلبات",
      value: totalOrders,
      icon: ShoppingBag,
    },
    {
      label: "قيد المراجعة",
      value: pendingOrders,
      icon: RefreshCcw,
    },
    {
      label: "تم التأكيد",
      value: confirmedOrders,
      icon: Package,
    },
    {
      label: "تم التسليم",
      value: deliveredOrders,
      icon: Banknote,
    },
    {
      label: "الطلبات الملغاة",
      value: cancelledOrders,
      icon: CircleDollarSign,
    },
  ];

  return (
    <main
      className="min-h-screen bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-sm font-black text-lime-300">
              إدارة المتجر
            </span>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              إدارة الطلبات
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-white/55">
              عرض الطلبات المحفوظة داخل PostgreSQL ومتابعة بيانات
              العملاء والمنتجات وحالات الدفع والتوصيل.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[.04] px-5 text-sm font-bold text-white/70 transition hover:border-lime-300/35 hover:text-white"
          >
            العودة للوحة التحكم

            <ChevronLeft
              aria-hidden="true"
              size={18}
            />
          </Link>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white/50">
                      {stat.label}
                    </p>

                    <strong className="mt-3 block text-3xl font-black text-white">
                      {stat.value.toLocaleString("ar-EG")}
                    </strong>
                  </div>

                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                    <Icon
                      aria-hidden="true"
                      size={22}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
          <form
            method="GET"
            action="/admin/orders"
            className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto]"
          >
            <label className="relative block">
              <Search
                aria-hidden="true"
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                name="search"
                defaultValue={search}
                placeholder="رقم الطلب، اسم العميل، الهاتف أو المحافظة"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pr-11 pl-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
              />
            </label>

            <select
              name="status"
              defaultValue={status}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
            >
              <option value="ALL">
                كل حالات الطلب
              </option>

              {ORDER_STATUSES.filter(
                (value) => value !== "ALL",
              ).map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {orderStatusLabels[value]}
                </option>
              ))}
            </select>

            <select
              name="paymentStatus"
              defaultValue={paymentStatus}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
            >
              <option value="ALL">
                كل حالات الدفع
              </option>

              {PAYMENT_STATUSES.filter(
                (value) => value !== "ALL",
              ).map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {paymentStatusLabels[value]}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <button
                type="submit"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-[#071109] transition hover:bg-lime-200"
              >
                <Search
                  aria-hidden="true"
                  size={18}
                />

                بحث
              </button>
            </div>
          </form>

          {(search ||
            status !== "ALL" ||
            paymentStatus !== "ALL") && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-sm text-white/50">
                تم العثور على{" "}
                <strong className="text-lime-300">
                  {filteredCount.toLocaleString("ar-EG")}
                </strong>{" "}
                طلب
              </p>

              <Link
                href="/admin/orders"
                className="text-sm font-bold text-white/60 transition hover:text-lime-300"
              >
                مسح البحث والفلاتر
              </Link>
            </div>
          )}
        </section>

        <section className="mt-8 space-y-5">
          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#0b1a0e] px-6 py-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime-300/10 text-lime-300">
                <ShoppingBag
                  aria-hidden="true"
                  size={30}
                />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                لا توجد طلبات
              </h2>

              <p className="mt-3 text-white/50">
                لا توجد طلبات مطابقة للبحث أو الفلاتر الحالية.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1a0e] shadow-2xl"
              >
                <div className="flex flex-col gap-5 border-b border-white/10 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <strong
                      className="text-lg font-black text-lime-300"
                      dir="ltr"
                    >
                      {order.orderNumber}
                    </strong>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${getOrderStatusClass(
                        order.status,
                      )}`}
                    >
                      {orderStatusLabels[order.status] ??
                        order.status}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${getPaymentStatusClass(
                        order.paymentStatus,
                      )}`}
                    >
                      {paymentStatusLabels[
                        order.paymentStatus
                      ] ?? order.paymentStatus}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/45">
                    <span className="flex items-center gap-2">
                      <CalendarDays
                        aria-hidden="true"
                        size={16}
                      />

                      {formatDate(order.createdAt)}
                    </span>

                    <span>
                      المصدر:{" "}
                      {orderSourceLabels[order.source] ??
                        order.source}
                    </span>
                  </div>
                </div>

                <div className="grid gap-0 xl:grid-cols-[340px_minmax(0,1fr)_280px]">
                  <div className="border-b border-white/10 p-5 sm:p-6 xl:border-l xl:border-b-0">
                    <h2 className="flex items-center gap-2 font-black">
                      <UserRound
                        aria-hidden="true"
                        size={18}
                        className="text-lime-300"
                      />

                      بيانات العميل
                    </h2>

                    <div className="mt-5 space-y-4 text-sm">
                      <div>
                        <span className="block text-xs text-white/40">
                          الاسم
                        </span>

                        <strong className="mt-1 block text-white">
                          {order.customerName}
                        </strong>
                      </div>

                      <div>
                        <span className="flex items-center gap-2 text-xs text-white/40">
                          <Phone
                            aria-hidden="true"
                            size={14}
                          />

                          الهاتف
                        </span>

                        <a
                          href={`tel:${order.phone}`}
                          className="mt-1 block font-bold text-white transition hover:text-lime-300"
                          dir="ltr"
                        >
                          {order.phone}
                        </a>

                        {order.alternativePhone ? (
                          <a
                            href={`tel:${order.alternativePhone}`}
                            className="mt-1 block text-xs text-white/50 transition hover:text-lime-300"
                            dir="ltr"
                          >
                            {order.alternativePhone}
                          </a>
                        ) : null}
                      </div>

                      <div>
                        <span className="flex items-center gap-2 text-xs text-white/40">
                          <MapPin
                            aria-hidden="true"
                            size={14}
                          />

                          عنوان التوصيل
                        </span>

                        <p className="mt-1 leading-7 text-white/75">
                          {order.governorate}، {order.city}
                          <br />
                          {order.addressLine}
                        </p>
                      </div>

                      {order.notes ? (
                        <div>
                          <span className="block text-xs text-white/40">
                            ملاحظات العميل
                          </span>

                          <p className="mt-1 leading-7 text-white/65">
                            {order.notes}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-b border-white/10 p-5 sm:p-6 xl:border-l xl:border-b-0">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="flex items-center gap-2 font-black">
                        <Package
                          aria-hidden="true"
                          size={18}
                          className="text-lime-300"
                        />

                        المنتجات
                      </h2>

                      <span className="rounded-full bg-white/[.06] px-3 py-1 text-xs font-black text-white/65">
                        {order.totalItems.toLocaleString(
                          "ar-EG",
                        )}{" "}
                        قطعة
                      </span>
                    </div>

                    <div className="mt-5 space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-white/8 bg-white/[.025] p-4"
                        >
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.productSlug}`}
                              className="block truncate font-black text-white transition hover:text-lime-300"
                            >
                              {item.productNameAr}
                            </Link>

                            <p className="mt-1 truncate text-xs text-white/40">
                              {item.productNameEn}
                            </p>

                            {item.packageSize ? (
                              <p className="mt-2 text-xs text-white/50">
                                العبوة: {item.packageSize}
                              </p>
                            ) : null}
                          </div>

                          <span className="grid h-9 min-w-9 place-items-center rounded-full bg-lime-300/10 px-2 text-sm font-black text-lime-300">
                            {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <h2 className="flex items-center gap-2 font-black">
                      <CircleDollarSign
                        aria-hidden="true"
                        size={18}
                        className="text-lime-300"
                      />

                      الدفع والمتابعة
                    </h2>

                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                        <span className="block text-xs text-white/40">
                          طريقة الدفع
                        </span>

                        <strong className="mt-2 block text-sm text-white">
                          {paymentMethodLabels[
                            order.paymentMethod
                          ] ?? order.paymentMethod}
                        </strong>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                        <span className="block text-xs text-white/40">
                          آخر تحديث
                        </span>

                        <strong className="mt-2 block text-sm text-white">
                          {formatDate(order.updatedAt)}
                        </strong>
                      </div>

                      <div className="grid gap-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-black text-[#071109] transition hover:bg-lime-200"
                        >
                          <Eye
                            aria-hidden="true"
                            size={17}
                          />

                          فتح تفاصيل الطلب
                        </Link>

                        <Link
                          href={`/admin/orders/${order.id}/edit`}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-400/[.08] px-4 text-sm font-black text-sky-200 transition hover:bg-sky-400/15"
                        >
                          <FilePenLine
                            aria-hidden="true"
                            size={17}
                          />

                          تعديل الطلب
                        </Link>

                        <DeleteOrderButton
                          orderId={order.id}
                          orderNumber={order.orderNumber}
                          customerName={order.customerName}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        {filteredCount > 0 && totalPages > 1 ? (
          <nav
            className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b1a0e] p-4"
            aria-label="صفحات الطلبات"
          >
            <p className="text-sm text-white/50">
              الصفحة{" "}
              <strong className="text-white">
                {currentPage.toLocaleString("ar-EG")}
              </strong>{" "}
              من{" "}
              <strong className="text-white">
                {totalPages.toLocaleString("ar-EG")}
              </strong>
            </p>

            <div className="flex items-center gap-3">
              {currentPage > 1 ? (
                <Link
                  href={buildPageUrl({
                    search,
                    status,
                    paymentStatus,
                    page: currentPage - 1,
                  })}
                  className="flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold text-white/70 transition hover:border-lime-300/35 hover:text-white"
                >
                  السابق
                </Link>
              ) : (
                <span className="flex min-h-10 cursor-not-allowed items-center justify-center rounded-xl border border-white/5 bg-white/[.02] px-4 text-sm font-bold text-white/25">
                  السابق
                </span>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={buildPageUrl({
                    search,
                    status,
                    paymentStatus,
                    page: currentPage + 1,
                  })}
                  className="flex min-h-10 items-center justify-center rounded-xl bg-lime-300 px-4 text-sm font-black text-[#071109] transition hover:bg-lime-200"
                >
                  التالي
                </Link>
              ) : (
                <span className="flex min-h-10 cursor-not-allowed items-center justify-center rounded-xl bg-lime-300/30 px-4 text-sm font-black text-[#071109]/50">
                  التالي
                </span>
              )}
            </div>
          </nav>
        ) : null}
      </div>
    </main>
  );
}