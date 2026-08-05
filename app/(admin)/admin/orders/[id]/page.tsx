import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Copy,
  CreditCard,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Printer,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

import OrderStatusControls from "./OrderStatusControls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
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

const paymentMethodLabels: Record<string, string> = {
  CASH_ON_DELIVERY: "الدفع عند الاستلام",
  VODAFONE_CASH: "فودافون كاش",
  INSTAPAY: "إنستاباي",
  BANK_TRANSFER: "تحويل بنكي",
  ONLINE_PAYMENT: "دفع إلكتروني",
  OTHER: "طريقة أخرى",
};

const orderSourceLabels: Record<string, string> = {
  WEBSITE: "الموقع الإلكتروني",
  WHATSAPP: "واتساب",
  ADMIN: "لوحة الإدارة",
  PHONE: "الهاتف",
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
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(date);
}

function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("20")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `20${digits.slice(1)}`;
  }

  return `20${digits}`;
}

function buildWhatsAppMessage(order: {
  orderNumber: string;
  customerName: string;
  phone: string;
  alternativePhone: string | null;
  governorate: string;
  city: string;
  addressLine: string;
  notes: string | null;
  totalItems: number;
  items: Array<{
    productNameAr: string;
    quantity: number;
    packageSize: string | null;
  }>;
}) {
  const productLines = order.items
    .map((item, index) => {
      const packageText = item.packageSize
        ? ` - العبوة: ${item.packageSize}`
        : "";

      return `${index + 1}- ${item.productNameAr} × ${
        item.quantity
      }${packageText}`;
    })
    .join("\n");

  const alternativePhone = order.alternativePhone
    ? `\nرقم بديل: ${order.alternativePhone}`
    : "";

  const notes = order.notes
    ? `\nملاحظات: ${order.notes}`
    : "";

  return [
    "متابعة طلب ArtVert Egypt 🌱",
    "",
    `رقم الطلب: ${order.orderNumber}`,
    `اسم العميل: ${order.customerName}`,
    `الهاتف: ${order.phone}${alternativePhone}`,
    `العنوان: ${order.governorate}، ${order.city}، ${order.addressLine}${notes}`,
    "",
    "المنتجات:",
    productLines,
    "",
    `إجمالي عدد القطع: ${order.totalItems}`,
  ].join("\n");
}

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
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
          productImage: true,
          category: true,
          packageSize: true,
          quantity: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const whatsappMessage = buildWhatsAppMessage(order);
  const whatsappPhone = normalizeWhatsAppPhone(order.phone);

  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  return (
    <main
      className="min-h-screen bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/55 transition hover:text-lime-300"
            >
              <ArrowRight
                aria-hidden="true"
                size={17}
              />

              العودة إلى الطلبات
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1
                className="text-3xl font-black sm:text-4xl"
                dir="ltr"
              >
                {order.orderNumber}
              </h1>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${getOrderStatusClass(
                  order.status,
                )}`}
              >
                {orderStatusLabels[order.status] ?? order.status}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${getPaymentStatusClass(
                  order.paymentStatus,
                )}`}
              >
                {paymentStatusLabels[order.paymentStatus] ??
                  order.paymentStatus}
              </span>
            </div>

            <p className="mt-3 flex items-center gap-2 text-sm text-white/45">
              <CalendarDays
                aria-hidden="true"
                size={16}
              />

              تم إنشاء الطلب في {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#21a366] px-5 text-sm font-black text-white transition hover:bg-[#27b875]"
            >
              <MessageCircle
                aria-hidden="true"
                size={18}
              />

              التواصل عبر واتساب
            </a>

            <button
              type="button"
              className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-5 text-sm font-bold text-white/40"
              title="سيتم تفعيل الطباعة في خطوة لاحقة"
              disabled
            >
              <Printer
                aria-hidden="true"
                size={18}
              />

              طباعة الطلب
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/45">
                  حالة الطلب
                </p>

                <strong className="mt-3 block text-xl font-black">
                  {orderStatusLabels[order.status] ?? order.status}
                </strong>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <Package
                  aria-hidden="true"
                  size={22}
                />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/45">
                  حالة الدفع
                </p>

                <strong className="mt-3 block text-xl font-black">
                  {paymentStatusLabels[order.paymentStatus] ??
                    order.paymentStatus}
                </strong>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <CircleDollarSign
                  aria-hidden="true"
                  size={22}
                />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/45">
                  إجمالي القطع
                </p>

                <strong className="mt-3 block text-3xl font-black text-lime-300">
                  {order.totalItems.toLocaleString("ar-EG")}
                </strong>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <ShoppingBag
                  aria-hidden="true"
                  size={22}
                />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/45">
                  مصدر الطلب
                </p>

                <strong className="mt-3 block text-xl font-black">
                  {orderSourceLabels[order.source] ?? order.source}
                </strong>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <FileText
                  aria-hidden="true"
                  size={22}
                />
              </div>
            </div>
          </article>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1a0e] shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black">
                    <Package
                      aria-hidden="true"
                      size={21}
                      className="text-lime-300"
                    />

                    منتجات الطلب
                  </h2>

                  <p className="mt-2 text-sm text-white/45">
                    جميع المنتجات والكميات المسجلة وقت إنشاء الطلب
                  </p>
                </div>

                <span className="rounded-full bg-lime-300/10 px-4 py-2 text-sm font-black text-lime-300">
                  {order.items.length.toLocaleString("ar-EG")} منتج
                </span>
              </div>

              <div className="divide-y divide-white/10">
                {order.items.map((item, index) => (
                  <article
                    key={item.id}
                    className="grid gap-5 p-5 sm:grid-cols-[60px_minmax(0,1fr)_120px] sm:items-center sm:p-6"
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-lg font-black text-lime-300">
                      {(index + 1).toLocaleString("ar-EG")}
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="block truncate text-lg font-black transition hover:text-lime-300"
                      >
                        {item.productNameAr}
                      </Link>

                      <p className="mt-1 truncate text-sm text-white/40">
                        {item.productNameEn}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.category ? (
                          <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-bold text-white/55">
                            {item.category}
                          </span>
                        ) : null}

                        {item.packageSize ? (
                          <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-bold text-white/55">
                            العبوة: {item.packageSize}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-lime-300/15 bg-lime-300/[.05] p-4 text-center">
                      <span className="block text-xs font-bold text-white/45">
                        الكمية
                      </span>

                      <strong className="mt-2 block text-2xl font-black text-lime-300">
                        {item.quantity.toLocaleString("ar-EG")}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Clock3
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />

                سجل الطلب
              </h2>

              <div className="mt-6 space-y-0">
                <div className="relative flex gap-4 pb-8">
                  <div className="absolute right-[17px] top-9 h-[calc(100%-20px)] w-px bg-white/10" />

                  <div className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime-300 text-[#071109]">
                    <ShoppingBag
                      aria-hidden="true"
                      size={17}
                    />
                  </div>

                  <div>
                    <strong className="block font-black">
                      تم إنشاء الطلب
                    </strong>

                    <p className="mt-1 text-sm leading-7 text-white/45">
                      تم تسجيل الطلب من{" "}
                      {orderSourceLabels[order.source] ?? order.source}
                    </p>

                    <span className="mt-2 block text-xs text-white/35">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="relative flex gap-4">
                  <div className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-[#102315] text-white/60">
                    <Clock3
                      aria-hidden="true"
                      size={17}
                    />
                  </div>

                  <div>
                    <strong className="block font-black">
                      آخر تحديث
                    </strong>

                    <p className="mt-1 text-sm leading-7 text-white/45">
                      الحالة الحالية:{" "}
                      {orderStatusLabels[order.status] ?? order.status}
                    </p>

                    <span className="mt-2 block text-xs text-white/35">
                      {formatDate(order.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <UserRound
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />

                بيانات العميل
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <span className="block text-xs font-bold text-white/40">
                    الاسم بالكامل
                  </span>

                  <strong className="mt-2 block text-lg font-black">
                    {order.customerName}
                  </strong>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <span className="flex items-center gap-2 text-xs font-bold text-white/40">
                    <Phone
                      aria-hidden="true"
                      size={14}
                    />

                    رقم الهاتف
                  </span>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <a
                      href={`tel:${order.phone}`}
                      className="font-black transition hover:text-lime-300"
                      dir="ltr"
                    >
                      {order.phone}
                    </a>

                    <button
                      type="button"
                      className="grid h-9 w-9 cursor-not-allowed place-items-center rounded-lg border border-white/10 bg-white/[.04] text-white/35"
                      title="سيتم تفعيل النسخ لاحقًا"
                      disabled
                    >
                      <Copy
                        aria-hidden="true"
                        size={16}
                      />
                    </button>
                  </div>

                  {order.alternativePhone ? (
                    <a
                      href={`tel:${order.alternativePhone}`}
                      className="mt-2 block text-sm text-white/55 transition hover:text-lime-300"
                      dir="ltr"
                    >
                      رقم بديل: {order.alternativePhone}
                    </a>
                  ) : null}
                </div>

                <div className="border-t border-white/10 pt-5">
                  <span className="flex items-center gap-2 text-xs font-bold text-white/40">
                    <MapPin
                      aria-hidden="true"
                      size={14}
                    />

                    عنوان التوصيل
                  </span>

                  <p className="mt-2 leading-8 text-white/75">
                    {order.governorate}، {order.city}
                    <br />
                    {order.addressLine}
                  </p>
                </div>

                {order.notes ? (
                  <div className="border-t border-white/10 pt-5">
                    <span className="block text-xs font-bold text-white/40">
                      ملاحظات العميل
                    </span>

                    <p className="mt-2 whitespace-pre-wrap leading-8 text-white/65">
                      {order.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <CreditCard
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />

                الدفع
              </h2>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <span className="block text-xs font-bold text-white/40">
                    طريقة الدفع
                  </span>

                  <strong className="mt-2 block">
                    {paymentMethodLabels[order.paymentMethod] ??
                      order.paymentMethod}
                  </strong>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <span className="block text-xs font-bold text-white/40">
                    حالة الدفع
                  </span>

                  <strong className="mt-2 block">
                    {paymentStatusLabels[order.paymentStatus] ??
                      order.paymentStatus}
                  </strong>
                </div>
              </div>
            </section>

            <OrderStatusControls
              orderId={order.id}
              initialStatus={order.status}
              initialPaymentStatus={order.paymentStatus}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}