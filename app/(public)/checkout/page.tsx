"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleCheck,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  useCart,
} from "@/components/cart/CartProvider";

const EGYPT_GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "البحر الأحمر",
  "البحيرة",
  "الفيوم",
  "الغربية",
  "الإسماعيلية",
  "المنوفية",
  "المنيا",
  "القليوبية",
  "الوادي الجديد",
  "السويس",
  "أسوان",
  "أسيوط",
  "بني سويف",
  "بورسعيد",
  "دمياط",
  "الشرقية",
  "جنوب سيناء",
  "كفر الشيخ",
  "مطروح",
  "الأقصر",
  "قنا",
  "شمال سيناء",
  "سوهاج",
] as const;

type CustomerData = {
  fullName: string;
  phone: string;
  alternativePhone: string;
  governorate: string;
  city: string;
  address: string;
  notes: string;
};

type CreatedOrderItem = {
  slug: string;
  nameAr: string;
  nameEn: string;
  image: string;
  quantity: number;
  category?: string;
};

type CreatedOrder = {
  orderNumber: string;
  createdAt: string;
  customer: CustomerData;
  items: CreatedOrderItem[];
  totalItems: number;
  status: string;
};

type OrderApiRecord = {
  orderNumber?: unknown;
  createdAt?: unknown;
  status?: unknown;
};

type OrderApiResponse = {
  order?: OrderApiRecord;
  data?: OrderApiRecord;
  error?: unknown;
  message?: unknown;
};

const WHATSAPP_NUMBER =
  "201080040408";

function buildWhatsAppMessage(
  order: CreatedOrder,
) {
  const productLines =
    order.items
      .map(
        (item, index) =>
          `${index + 1}- ${item.nameAr} × ${item.quantity}`,
      )
      .join("\n");

  const optionalPhone =
    order.customer
      .alternativePhone
      ? `\nرقم بديل: ${order.customer.alternativePhone}`
      : "";

  const optionalNotes =
    order.customer.notes
      ? `\nملاحظات: ${order.customer.notes}`
      : "";

  return [
    "طلب جديد من موقع ArtVert Egypt 🌱",
    "",
    `رقم الطلب: ${order.orderNumber}`,
    `الاسم: ${order.customer.fullName}`,
    `الهاتف: ${order.customer.phone}${optionalPhone}`,
    `المحافظة: ${order.customer.governorate}`,
    `المدينة/المنطقة: ${order.customer.city}`,
    `العنوان: ${order.customer.address}${optionalNotes}`,
    "",
    "المنتجات:",
    productLines,
    "",
    `إجمالي عدد القطع: ${order.totalItems}`,
    "",
    "يرجى تأكيد السعر والشحن وموعد التوصيل.",
  ].join("\n");
}

function getApiRecord(
  responseBody: OrderApiResponse | null,
): OrderApiRecord | null {
  if (!responseBody) {
    return null;
  }

  if (responseBody.order) {
    return responseBody.order;
  }

  if (responseBody.data) {
    return responseBody.data;
  }

  return responseBody as OrderApiRecord;
}

function getApiErrorMessage(
  responseBody: OrderApiResponse | null,
  status: number,
) {
  if (
    responseBody &&
    typeof responseBody.error ===
      "string" &&
    responseBody.error.trim()
  ) {
    return responseBody.error.trim();
  }

  if (
    responseBody &&
    typeof responseBody.message ===
      "string" &&
    responseBody.message.trim()
  ) {
    return responseBody.message.trim();
  }

  if (status === 400) {
    return "بعض بيانات الطلب غير صحيحة. راجع البيانات وحاول مرة أخرى.";
  }

  if (status === 409) {
    return "تعذر إنشاء رقم طلب جديد. حاول مرة أخرى.";
  }

  if (status >= 500) {
    return "تعذر حفظ الطلب حاليًا بسبب مشكلة في الخادم. حاول مرة أخرى.";
  }

  return "تعذر تسجيل الطلب. راجع اتصال الإنترنت وحاول مرة أخرى.";
}

function CheckoutSteps() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-2xl border border-white/10 bg-white/[.03] p-3 sm:p-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime-300 text-[#071109]">
          <CircleCheck size={17} />
        </span>
        <span className="truncate text-xs font-black text-white sm:text-sm">
          السلة
        </span>
      </div>

      <span className="h-px w-5 bg-lime-300/50 sm:w-10" />

      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-lime-300/35 bg-lime-300/10 text-lime-300">
          2
        </span>
        <span className="truncate text-xs font-black text-lime-300 sm:text-sm">
          البيانات
        </span>
      </div>

      <span className="h-px w-5 bg-white/10 sm:w-10" />

      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.03] text-white/40">
          3
        </span>
        <span className="truncate text-xs font-black text-white/40 sm:text-sm">
          التأكيد
        </span>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const {
    items,
    totalItems,
    isReady,
    clearCart,
  } = useCart();

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [
    createdOrder,
    setCreatedOrder,
  ] =
    useState<CreatedOrder | null>(
      null,
    );

  const whatsappUrl =
    useMemo(() => {
      if (!createdOrder) {
        return "";
      }

      const message =
        buildWhatsAppMessage(
          createdOrder,
        );

      return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        message,
      )}`;
    }, [createdOrder]);

  async function submitOrder(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      items.length === 0 ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const formData =
      new FormData(
        event.currentTarget,
      );

    const customer: CustomerData =
      {
        fullName: String(
          formData.get(
            "fullName",
          ) || "",
        ).trim(),
        phone: String(
          formData.get(
            "phone",
          ) || "",
        ).trim(),
        alternativePhone:
          String(
            formData.get(
              "alternativePhone",
            ) || "",
          ).trim(),
        governorate: String(
          formData.get(
            "governorate",
          ) || "",
        ).trim(),
        city: String(
          formData.get(
            "city",
          ) || "",
        ).trim(),
        address: String(
          formData.get(
            "address",
          ) || "",
        ).trim(),
        notes: String(
          formData.get(
            "notes",
          ) || "",
        ).trim(),
      };

    const orderItems: CreatedOrderItem[] =
      items.map((item) => ({
        slug: item.slug,
        nameAr:
          item.nameAr,
        nameEn:
          item.nameEn,
        image: item.image,
        quantity:
          item.quantity,
        category:
          item.category,
      }));

    try {
      const response =
        await fetch(
          "/api/orders",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            cache:
              "no-store",
            body: JSON.stringify({
              customer,
              items:
                orderItems,
            }),
          },
        );

      const responseBody =
        (await response
          .json()
          .catch(
            () => null,
          )) as OrderApiResponse | null;

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            responseBody,
            response.status,
          ),
        );
      }

      const savedOrder =
        getApiRecord(
          responseBody,
        );

      if (
        !savedOrder ||
        typeof savedOrder.orderNumber !==
          "string" ||
        !savedOrder.orderNumber.trim()
      ) {
        throw new Error(
          "تم إرسال الطلب، لكن الخادم لم يُرجع رقم الطلب بصورة صحيحة.",
        );
      }

      const createdAt =
        typeof savedOrder.createdAt ===
          "string" &&
        savedOrder.createdAt.trim()
          ? savedOrder.createdAt
          : new Date().toISOString();

      const status =
        typeof savedOrder.status ===
          "string" &&
        savedOrder.status.trim()
          ? savedOrder.status
          : "PENDING";

      setCreatedOrder({
        orderNumber:
          savedOrder.orderNumber.trim(),
        createdAt,
        customer,
        items: orderItems,
        totalItems,
        status,
      });

      clearCart();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء تسجيل الطلب.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!isReady) {
    return (
      <main
        className="relative min-h-screen overflow-hidden bg-[#061008] px-3 py-10 text-white font-sans sm:px-6 sm:py-14"
        dir="rtl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(200,243,63,.06),transparent_42%)]" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="h-10 w-60 animate-pulse rounded-xl bg-white/[.06]" />

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="h-[620px] animate-pulse rounded-[28px] bg-[#0b1a0e]/50 backdrop-blur-md" />
            <div className="h-[460px] animate-pulse rounded-[28px] bg-[#0b1a0e]/50 backdrop-blur-md" />
          </div>
        </div>
      </main>
    );
  }

  if (createdOrder) {
    return (
      <main
        className="relative grid min-h-[calc(100vh-76px)] place-items-center overflow-hidden bg-[#061008] px-3 py-12 text-white font-sans sm:px-6 sm:py-16"
        dir="rtl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(200,243,63,.09),transparent_48%)]" />

        <section className="relative z-10 w-full max-w-2xl rounded-[28px] border border-lime-300/20 bg-[#0b1a0e]/95 p-6 text-center shadow-[0_0_45px_rgba(200,243,63,0.13)] backdrop-blur-xl sm:rounded-[32px] sm:p-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime-300 text-[#071109] shadow-[0_15px_45px_rgba(200,243,63,.35)]">
            <CheckCircle2
              aria-hidden="true"
              size={42}
            />
          </div>

          <h1 className="mt-6 text-2xl font-black text-white sm:text-4xl">
            تم تسجيل طلبك بنجاح
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-white/68 sm:text-base">
            تم حفظ الطلب داخل قاعدة البيانات. أرسل الطلب عبر واتساب حتى يتم تأكيد الأسعار وتكلفة الشحن وموعد التوصيل.
          </p>

          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-lime-300/15 bg-lime-300/[.06] p-5">
            <span className="text-sm text-white/60">
              رقم الطلب
            </span>

            <strong
              className="mt-2 block text-xl font-black text-lime-300"
              dir="ltr"
            >
              {
                createdOrder.orderNumber
              }
            </strong>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
              <span className="text-white/60">
                إجمالي القطع
              </span>

              <strong className="text-white">
                {
                  createdOrder.totalItems
                }
              </strong>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#21a366] px-6 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#27b875] sm:text-base"
          >
            <MessageCircle
              aria-hidden="true"
              size={21}
            />
            إرسال الطلب عبر واتساب
          </a>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/products"
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/75 transition hover:border-lime-300/35 hover:text-white"
            >
              متابعة التسوق
            </Link>

            <Link
              href="/"
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/75 transition hover:border-lime-300/35 hover:text-white"
            >
              العودة للرئيسية
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main
        className="relative grid min-h-[calc(100vh-76px)] place-items-center overflow-hidden bg-[#061008] px-3 py-12 text-white font-sans sm:px-6 sm:py-16"
        dir="rtl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(200,243,63,.07),transparent_50%)]" />

        <section className="relative z-10 w-full max-w-xl rounded-[28px] border border-lime-300/20 bg-[#0b1a0e]/95 p-6 text-center shadow-[0_0_40px_rgba(200,243,63,0.12)] backdrop-blur-xl sm:rounded-[32px] sm:p-8">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime-300/10 text-lime-300 shadow-[0_0_20px_rgba(200,243,63,0.18)]">
            <ShoppingBag
              aria-hidden="true"
              size={38}
            />
          </div>

          <h1 className="mt-6 text-2xl font-black text-white sm:text-3xl">
            لا توجد منتجات لإتمام الطلب
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/58 sm:text-base">
            أضف منتجًا واحدًا على الأقل إلى السلة أولًا.
          </p>

          <Link
            href="/products"
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200 sm:w-auto"
          >
            تصفح المنتجات
            <ArrowLeft
              aria-hidden="true"
              size={18}
            />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#061008] px-3 py-10 text-white font-sans sm:px-6 sm:py-14"
      dir="rtl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize:
            "50px 50px",
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_14%_8%,rgba(200,243,63,.06),transparent_28%),radial-gradient(circle_at_88%_15%,rgba(38,164,83,.08),transparent_30%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <CheckoutSteps />

        <div className="mt-7">
          <span className="text-sm font-bold text-lime-300">
            الخطوة الأخيرة
          </span>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            إتمام الطلب
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
            أدخل بيانات التواصل والتوصيل، ثم أكد الطلب لإرساله إلى فريق ArtVert.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <form
            onSubmit={submitOrder}
            className="rounded-[28px] border border-lime-300/15 bg-[#0b1a0e]/95 p-4 shadow-[0_0_30px_rgba(200,243,63,0.08)] backdrop-blur-xl sm:p-7"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <User
                  aria-hidden="true"
                  size={23}
                />
              </div>

              <div>
                <h2 className="text-xl font-black">
                  بيانات العميل
                </h2>

                <p className="mt-1 text-xs text-white/55">
                  البيانات المطلوبة لتأكيد الطلب
                </p>
              </div>
            </div>

            {submitError ? (
              <div
                className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm leading-7 text-red-100"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle
                  aria-hidden="true"
                  size={21}
                  className="mt-1 shrink-0 text-red-300"
                />

                <div>
                  <strong className="block font-black">
                    لم يتم تسجيل الطلب
                  </strong>

                  <p className="mt-1 text-red-100/80">
                    {
                      submitError
                    }
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-white/80">
                  الاسم بالكامل *
                </span>

                <input
                  required
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  disabled={
                    submitting
                  }
                  placeholder="اكتب الاسم بالكامل"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80">
                  <Phone
                    aria-hidden="true"
                    size={15}
                    className="text-lime-300"
                  />
                  رقم الهاتف *
                </span>

                <input
                  required
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="[0-9+ ]{10,16}"
                  maxLength={16}
                  disabled={
                    submitting
                  }
                  placeholder="01xxxxxxxxx"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/80">
                  رقم هاتف بديل
                </span>

                <input
                  name="alternativePhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="[0-9+ ]{10,16}"
                  maxLength={16}
                  disabled={
                    submitting
                  }
                  placeholder="اختياري"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80">
                  <MapPin
                    aria-hidden="true"
                    size={15}
                    className="text-lime-300"
                  />
                  المحافظة *
                </span>

                <select
                  required
                  name="governorate"
                  defaultValue=""
                  disabled={
                    submitting
                  }
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#08140c] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option
                    value=""
                    disabled
                  >
                    اختر المحافظة
                  </option>

                  {EGYPT_GOVERNORATES.map(
                    (governorate) => (
                      <option
                        key={
                          governorate
                        }
                        value={
                          governorate
                        }
                      >
                        {
                          governorate
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/80">
                  المدينة أو المنطقة *
                </span>

                <input
                  required
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  maxLength={120}
                  disabled={
                    submitting
                  }
                  placeholder="مثال: المعادي"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-white/80">
                  العنوان بالتفصيل *
                </span>

                <textarea
                  required
                  name="address"
                  autoComplete="street-address"
                  rows={4}
                  maxLength={500}
                  disabled={
                    submitting
                  }
                  placeholder="اسم الشارع، رقم العقار، الدور، الشقة وأقرب علامة مميزة"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[.04] p-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-white/80">
                  ملاحظات على الطلب
                </span>

                <textarea
                  name="notes"
                  rows={3}
                  maxLength={1000}
                  disabled={
                    submitting
                  }
                  placeholder="أي تفاصيل إضافية أو وقت مناسب للتواصل"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[.04] p-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
                <Truck
                  size={18}
                  className="mt-0.5 shrink-0 text-lime-300"
                />
                <p className="text-xs leading-6 text-white/52">
                  الشحن يُحدد حسب المحافظة.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-lime-300"
                />
                <p className="text-xs leading-6 text-white/52">
                  بياناتك تستخدم لتأكيد الطلب فقط.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
                <PackageCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-lime-300"
                />
                <p className="text-xs leading-6 text-white/52">
                  لا يتم خصم أي مبلغ الآن.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 text-sm font-black text-[#071109] shadow-[0_8px_20px_rgba(200,243,63,0.2)] transition hover:-translate-y-0.5 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:text-base"
            >
              <PackageCheck
                aria-hidden="true"
                size={21}
              />

              {submitting
                ? "جاري تسجيل الطلب..."
                : "تأكيد الطلب"}
            </button>
          </form>

          <aside className="h-fit rounded-[28px] border border-lime-300/20 bg-[#0b1a0e]/95 p-5 shadow-[0_0_30px_rgba(200,243,63,0.12)] backdrop-blur-xl sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                <ShoppingBag size={21} />
              </div>

              <div>
                <h2 className="text-xl font-black text-white sm:text-2xl">
                  ملخص الطلب
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  راجع المنتجات قبل التأكيد
                </p>
              </div>
            </div>

            <div className="mt-6 max-h-[430px] space-y-3 overflow-y-auto border-b border-white/10 pb-6 pl-1">
              {items.map((item) => (
                <article
                  key={item.slug}
                  className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative h-[72px] overflow-hidden rounded-xl border border-white/[.06] bg-white"
                  >
                    <Image
                      src={item.image}
                      alt={item.nameAr}
                      fill
                      sizes="72px"
                      className="object-contain p-1.5"
                    />
                  </Link>

                  <div className="min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="block truncate text-sm font-black text-white transition hover:text-lime-300"
                    >
                      {
                        item.nameAr
                      }
                    </Link>

                    <p
                      dir="ltr"
                      className="mt-1 truncate text-[10px] font-bold uppercase tracking-[.09em] text-white/35"
                    >
                      {
                        item.nameEn
                      }
                    </p>

                    <span className="mt-2 block text-xs text-white/55">
                      الكمية:{" "}
                      <strong className="text-lime-300">
                        {
                          item.quantity
                        }
                      </strong>
                    </span>
                  </div>

                  <span className="grid h-8 min-w-8 place-items-center rounded-full bg-lime-300/10 px-2 text-xs font-black text-lime-300">
                    {
                      item.quantity
                    }
                  </span>
                </article>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between pt-1">
              <span className="text-white/70">
                إجمالي القطع
              </span>

              <strong className="text-2xl font-black text-lime-300">
                {
                  totalItems
                }
              </strong>
            </div>

            <div className="mt-5 rounded-2xl border border-lime-300/15 bg-lime-300/[.05] p-4 text-xs leading-6 text-white/58">
              سيتم تأكيد السعر النهائي والعبوات وتكلفة الشحن قبل تجهيز الطلب.
            </div>

            <Link
              href="/cart"
              className="mt-5 flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-5 text-sm font-bold text-white/75 transition hover:border-lime-300/35 hover:bg-white/[.08] hover:text-white"
            >
              تعديل السلة
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
