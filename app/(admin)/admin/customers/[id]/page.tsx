import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  CalendarDays,
  CircleUserRound,
  Heart,
  ImageIcon,
  Leaf,
  Mail,
  MapPin,
  MonitorSmartphone,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CustomerDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(date);
}

function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "قيد المراجعة",
    CONFIRMED: "تم التأكيد",
    PREPARING: "قيد التجهيز",
    SHIPPED: "تم الشحن",
    DELIVERED: "تم التسليم",
    CANCELLED: "ملغي",
  };

  return labels[status] ?? status;
}

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

export default async function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      locale: true,
      emailVerifiedAt: true,
      active: true,
      historyOptIn: true,
      imageSavingOptIn: true,
      analyticsOptIn: true,
      marketingOptIn: true,
      deletionRequestedAt: true,
      createdAt: true,
      updatedAt: true,

      addresses: {
        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        select: {
          id: true,
          phone: true,
          alternativePhone: true,
          governorate: true,
          city: true,
          addressLine: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      orders: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          totalItems: true,
          customerName: true,
          phone: true,
          governorate: true,
          city: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      sessions: {
        orderBy: {
          lastSeenAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          lastSeenAt: true,
          expiresAt: true,
          revokedAt: true,
          createdAt: true,
        },
      },

      diagnoses: {
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          createdAt: true,
        },
      },

      savedPlants: {
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          customerId: true,
          plantId: true,
          createdAt: true,
        },
      },

      productFavorites: {
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          customerId: true,
          productId: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              entity: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      },

      savedImages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          createdAt: true,
        },
      },

      _count: {
        select: {
          sessions: true,
          diagnoses: true,
          savedPlants: true,
          productFavorites: true,
          savedImages: true,
          jobs: true,
          auditLogs: true,
          addresses: true,
          orders: true,
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const latestSession = customer.sessions[0] ?? null;
  const activeSessions = customer.sessions.filter(
    (session) =>
      session.revokedAt === null &&
      session.expiresAt > new Date(),
  );

  return (
    <main
      className="min-h-screen bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/customers"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/55 transition hover:text-lime-300"
            >
              <ArrowRight aria-hidden="true" size={17} />
              العودة إلى العملاء
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black sm:text-4xl">
                {customer.displayName}
              </h1>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${
                  customer.active
                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                    : "border-red-400/25 bg-red-400/10 text-red-200"
                }`}
              >
                {customer.active ? "حساب نشط" : "حساب معطل"}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${
                  customer.emailVerifiedAt
                    ? "border-sky-400/25 bg-sky-400/10 text-sky-200"
                    : "border-amber-400/25 bg-amber-400/10 text-amber-200"
                }`}
              >
                {customer.emailVerifiedAt
                  ? "البريد موثق"
                  : "البريد غير موثق"}
              </span>

              {customer.deletionRequestedAt ? (
                <span className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1 text-xs font-black text-red-200">
                  طلب حذف الحساب
                </span>
              ) : null}
            </div>

            <p
              className="mt-3 text-base font-bold text-white/45"
              dir="ltr"
            >
              {customer.email}
            </p>
          </div>

          <a
            href={`mailto:${customer.email}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[.04] px-5 text-sm font-bold text-white/70 transition hover:border-lime-300/30 hover:text-white"
          >
            <Mail aria-hidden="true" size={18} />
            إرسال بريد
          </a>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5">
            <span className="text-sm text-white/45">الطلبات</span>
            <strong className="mt-3 block text-3xl font-black">
              {customer._count.orders.toLocaleString("ar-EG")}
            </strong>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5">
            <span className="text-sm text-white/45">
              تشخيصات Doctor
            </span>
            <strong className="mt-3 block text-3xl font-black">
              {customer._count.diagnoses.toLocaleString("ar-EG")}
            </strong>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5">
            <span className="text-sm text-white/45">
              النباتات المحفوظة
            </span>
            <strong className="mt-3 block text-3xl font-black">
              {customer._count.savedPlants.toLocaleString("ar-EG")}
            </strong>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5">
            <span className="text-sm text-white/45">
              المنتجات المفضلة
            </span>
            <strong className="mt-3 block text-3xl font-black">
              {customer._count.productFavorites.toLocaleString("ar-EG")}
            </strong>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5">
            <span className="text-sm text-white/45">
              الجلسات النشطة
            </span>
            <strong className="mt-3 block text-3xl font-black">
              {activeSessions.length.toLocaleString("ar-EG")}
            </strong>
          </article>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <ShoppingBag
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />
                طلبات العميل
              </h2>

              {customer.orders.length === 0 ? (
                <p className="mt-5 text-white/45">
                  لا توجد طلبات مسجلة لهذا العميل.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {customer.orders.map((order) => (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-white/10 bg-white/[.025] p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-black text-lime-300 transition hover:text-lime-200"
                            dir="ltr"
                          >
                            {order.orderNumber}
                          </Link>

                          <p className="mt-2 text-sm text-white/45">
                            {order.totalItems.toLocaleString("ar-EG")} قطعة
                            · {order.governorate}، {order.city}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getOrderStatusClass(
                              order.status,
                            )}`}
                          >
                            {getOrderStatusLabel(order.status)}
                          </span>

                          <span className="text-xs text-white/35">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <MapPin
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />
                العناوين
              </h2>

              {customer.addresses.length === 0 ? (
                <p className="mt-5 text-white/45">
                  لا توجد عناوين محفوظة.
                </p>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {customer.addresses.map((address) => (
                    <article
                      key={address.id}
                      className="rounded-2xl border border-white/10 bg-white/[.025] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong>
                          {address.governorate}، {address.city}
                        </strong>

                        {address.isDefault ? (
                          <span className="rounded-full bg-lime-300/10 px-3 py-1 text-xs font-black text-lime-200">
                            العنوان الرئيسي
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 leading-7 text-white/60">
                        {address.addressLine}
                      </p>

                      <a
                        href={`tel:${address.phone}`}
                        className="mt-3 flex items-center gap-2 text-sm font-bold text-lime-300"
                        dir="ltr"
                      >
                        <Phone aria-hidden="true" size={15} />
                        {address.phone}
                      </a>

                      {address.alternativePhone ? (
                        <a
                          href={`tel:${address.alternativePhone}`}
                          className="mt-2 block text-sm text-white/45"
                          dir="ltr"
                        >
                          رقم بديل: {address.alternativePhone}
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Heart
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />
                المنتجات المفضلة
              </h2>

              {customer.productFavorites.length === 0 ? (
                <p className="mt-5 text-white/45">
                  لا توجد منتجات مفضلة.
                </p>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {customer.productFavorites.map((favorite) => (
                    <Link
                      key={`${favorite.customerId}-${favorite.productId}`}
                      href={`/admin/products/${favorite.product.id}`}
                      className="rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-lime-300/30"
                    >
                      <strong className="block">
                        {favorite.product.nameAr}
                      </strong>

                      <span className="mt-1 block text-sm text-white/40">
                        {favorite.product.nameEn}
                      </span>

                      <span className="mt-3 block text-xs text-white/35">
                        أُضيف للمفضلة في{" "}
                        {formatDate(favorite.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <div className="grid gap-8 lg:grid-cols-3">
              <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5">
                <Stethoscope
                  aria-hidden="true"
                  size={22}
                  className="text-lime-300"
                />
                <h2 className="mt-4 font-black">
                  تشخيصات Doctor
                </h2>
                <strong className="mt-3 block text-3xl font-black">
                  {customer._count.diagnoses.toLocaleString("ar-EG")}
                </strong>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5">
                <Leaf
                  aria-hidden="true"
                  size={22}
                  className="text-lime-300"
                />
                <h2 className="mt-4 font-black">
                  النباتات المحفوظة
                </h2>
                <strong className="mt-3 block text-3xl font-black">
                  {customer._count.savedPlants.toLocaleString("ar-EG")}
                </strong>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5">
                <ImageIcon
                  aria-hidden="true"
                  size={22}
                  className="text-lime-300"
                />
                <h2 className="mt-4 font-black">
                  الصور المحفوظة
                </h2>
                <strong className="mt-3 block text-3xl font-black">
                  {customer._count.savedImages.toLocaleString("ar-EG")}
                </strong>
              </section>
            </div>
          </div>

          <aside className="space-y-8">
            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <CircleUserRound
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />
                بيانات الحساب
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <span className="block text-xs text-white/40">
                    الاسم
                  </span>
                  <strong className="mt-2 block">
                    {customer.displayName}
                  </strong>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <span className="block text-xs text-white/40">
                    البريد الإلكتروني
                  </span>
                  <strong
                    className="mt-2 block break-all text-sm"
                    dir="ltr"
                  >
                    {customer.email}
                  </strong>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <span className="block text-xs text-white/40">
                    اللغة
                  </span>
                  <strong className="mt-2 block">
                    {customer.locale}
                  </strong>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <span className="block text-xs text-white/40">
                    تاريخ التسجيل
                  </span>
                  <strong className="mt-2 block text-sm">
                    {formatDate(customer.createdAt)}
                  </strong>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <span className="block text-xs text-white/40">
                    آخر تحديث
                  </span>
                  <strong className="mt-2 block text-sm">
                    {formatDate(customer.updatedAt)}
                  </strong>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <ShieldCheck
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />
                الخصوصية والموافقات
              </h2>

              <div className="mt-5 space-y-3">
                {[
                  ["حفظ السجل", customer.historyOptIn],
                  ["حفظ الصور", customer.imageSavingOptIn],
                  ["التحليلات", customer.analyticsOptIn],
                  ["التسويق", customer.marketingOptIn],
                ].map(([label, enabled]) => (
                  <div
                    key={String(label)}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.025] p-4"
                  >
                    <span className="text-sm text-white/60">
                      {String(label)}
                    </span>

                    <strong
                      className={
                        enabled
                          ? "text-emerald-300"
                          : "text-white/35"
                      }
                    >
                      {enabled ? "موافق" : "غير موافق"}
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <MonitorSmartphone
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />
                الجلسات
              </h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
                  <span className="block text-xs text-white/40">
                    إجمالي الجلسات
                  </span>
                  <strong className="mt-2 block text-xl">
                    {customer._count.sessions.toLocaleString("ar-EG")}
                  </strong>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
                  <span className="block text-xs text-white/40">
                    الجلسات النشطة
                  </span>
                  <strong className="mt-2 block text-xl text-lime-300">
                    {activeSessions.length.toLocaleString("ar-EG")}
                  </strong>
                </div>

                {latestSession ? (
                  <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
                    <span className="block text-xs text-white/40">
                      آخر نشاط
                    </span>
                    <strong className="mt-2 block text-sm">
                      {formatDate(latestSession.lastSeenAt)}
                    </strong>
                  </div>
                ) : null}
              </div>
            </section>

            {customer.deletionRequestedAt ? (
              <section className="rounded-3xl border border-red-400/20 bg-red-400/[.06] p-5 shadow-2xl sm:p-6">
                <h2 className="flex items-center gap-2 text-xl font-black text-red-100">
                  <Ban aria-hidden="true" size={21} />
                  طلب حذف الحساب
                </h2>

                <p className="mt-4 text-sm leading-7 text-red-100/70">
                  طلب العميل حذف حسابه في{" "}
                  {formatDate(customer.deletionRequestedAt)}.
                </p>
              </section>
            ) : null}

            <section className="rounded-3xl border border-lime-300/15 bg-lime-300/[.05] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <CalendarDays
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />
                ملخص النشاط
              </h2>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.025] p-4">
                  <span className="text-sm text-white/50">
                    وظائف الخلفية
                  </span>
                  <strong>
                    {customer._count.jobs.toLocaleString("ar-EG")}
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.025] p-4">
                  <span className="text-sm text-white/50">
                    سجلات التدقيق
                  </span>
                  <strong>
                    {customer._count.auditLogs.toLocaleString("ar-EG")}
                  </strong>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}