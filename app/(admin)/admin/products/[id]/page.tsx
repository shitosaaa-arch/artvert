import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FilePenLine,
  ImageIcon,
  Package,
  ShoppingBag,
  Sparkles,
  Tags,
  Trash2,
  Wheat,
} from "lucide-react";

import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    deleteStatus?: string;
    deleteError?: string;
  }>;
};

type DeleteApiResponse = {
  success?: boolean;
  action?: "DELETED" | "ARCHIVED";
  message?: string;
  error?: string;
};

const publicationStateLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};

const syncStatusLabels: Record<string, string> = {
  PENDING: "في انتظار المزامنة",
  SYNCED: "متزامن",
  FAILED: "فشل المزامنة",
};

function getPublicationStateClass(state: string) {
  switch (state) {
    case "PUBLISHED":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";

    case "ARCHIVED":
      return "border-white/10 bg-white/[.04] text-white/50";

    default:
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  }
}

function getSyncStatusClass(status: string) {
  switch (status) {
    case "SYNCED":
      return "border-sky-400/25 bg-sky-400/10 text-sky-200";

    case "FAILED":
      return "border-red-400/25 bg-red-400/10 text-red-200";

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

function formatMoney(value: string | number) {
  const numericValue = Number(value);

  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function readJsonStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

async function deleteProductAction(formData: FormData) {
  "use server";

  const productIdValue = formData.get("productId");
  const productId =
    typeof productIdValue === "string"
      ? productIdValue.trim()
      : "";

  if (!productId) {
    redirect(
      `/admin/products?deleteError=${encodeURIComponent(
        "معرّف المنتج غير صحيح.",
      )}`,
    );
  }

  const requestHeaders = await headers();
  const cookieStore = await cookies();

  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host");

  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production"
      ? "https"
      : "http");

  if (!host) {
    redirect(
      `/admin/products/${encodeURIComponent(
        productId,
      )}?deleteError=${encodeURIComponent(
        "تعذر تحديد عنوان الخادم.",
      )}`,
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${protocol}://${host}/api/admin/products/${encodeURIComponent(
        productId,
      )}`,
      {
        method: "DELETE",
        headers: {
          cookie: cookieStore.toString(),
        },
        cache: "no-store",
      },
    );
  } catch {
    redirect(
      `/admin/products/${encodeURIComponent(
        productId,
      )}?deleteError=${encodeURIComponent(
        "تعذر الاتصال بخدمة حذف المنتج.",
      )}`,
    );
  }

  const responseBody = (await response
    .json()
    .catch(() => null)) as DeleteApiResponse | null;

  if (!response.ok) {
    const message =
      responseBody?.message ||
      responseBody?.error ||
      "تعذر حذف المنتج.";

    redirect(
      `/admin/products/${encodeURIComponent(
        productId,
      )}?deleteError=${encodeURIComponent(message)}`,
    );
  }

  const action = responseBody?.action;

  if (action === "ARCHIVED") {
    redirect(
      `/admin/products/${encodeURIComponent(
        productId,
      )}?deleteStatus=archived`,
    );
  }

  redirect("/admin/products?deleteStatus=deleted");
}

export default async function ProductDetailsPage({
  params,
  searchParams,
}: ProductDetailsPageProps) {
  const { id } = await params;
  const pageSearchParams = await searchParams;

  const deleteStatus =
    pageSearchParams.deleteStatus ?? "";

  const deleteError =
    pageSearchParams.deleteError ?? "";

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      legacyId: true,
      category: true,
      nameAr: true,
      nameEn: true,
      shortDescription: true,
      description: true,
      composition: true,
      dosage: true,
      packageSize: true,
      price: true,
      comparePrice: true,
      benefits: true,
      crops: true,
      createdAt: true,
      updatedAt: true,
      entity: {
        select: {
          slug: true,
          name: true,
          schemaVersion: true,
          publicationState: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          url: true,
          alt: true,
          ownership: true,
          sortOrder: true,
          contentType: true,
          width: true,
          height: true,
          createdAt: true,
        },
      },
      aliases: {
        orderBy: {
          value: "asc",
        },
        select: {
          id: true,
          value: true,
          normalizedValue: true,
          locale: true,
        },
      },
      syncState: {
        select: {
          status: true,
          lastSyncedAt: true,
          diagnosticCode: true,
          updatedAt: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          images: true,
          aliases: true,
          recommendations: true,
          favoritedByCustomers: true,
          orderItems: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const benefits = readJsonStringArray(product.benefits);
  const crops = readJsonStringArray(product.crops);

  const syncStatus =
    product.syncState?.status ?? "PENDING";

  const price = Number(product.price);
  const comparePrice =
    product.comparePrice === null
      ? null
      : Number(product.comparePrice);

  const discountPercentage =
    comparePrice !== null &&
    comparePrice > price &&
    comparePrice > 0
      ? Math.round(
          ((comparePrice - price) / comparePrice) * 100,
        )
      : null;

  return (
    <main
      className="min-h-screen bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/55 transition hover:text-lime-300"
            >
              <ArrowRight
                aria-hidden="true"
                size={17}
              />

              العودة إلى المنتجات
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black sm:text-4xl">
                {product.nameAr}
              </h1>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${getPublicationStateClass(
                  product.entity.publicationState,
                )}`}
              >
                {publicationStateLabels[
                  product.entity.publicationState
                ] ?? product.entity.publicationState}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${getSyncStatusClass(
                  syncStatus,
                )}`}
              >
                {syncStatusLabels[syncStatus] ?? syncStatus}
              </span>
            </div>

            <p className="mt-2 text-lg font-bold text-white/45">
              {product.nameEn}
            </p>

            <p className="mt-4 max-w-3xl leading-8 text-white/55">
              {product.shortDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/products/${product.entity.slug}`}
              target="_blank"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-5 text-sm font-bold text-white/70 transition hover:border-lime-300/35 hover:text-white"
            >
              عرض في الموقع
            </Link>

            <Link
              href={`/admin/products/${product.id}/edit`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 text-sm font-black text-[#071109] transition hover:bg-lime-200"
            >
              <FilePenLine
                aria-hidden="true"
                size={18}
              />

              تعديل المنتج
            </Link>
          </div>
        </header>

        {deleteStatus === "archived" ? (
          <section
            role="status"
            className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-5 text-amber-100"
          >
            <AlertTriangle
              aria-hidden="true"
              size={22}
              className="mt-1 shrink-0 text-amber-300"
            />

            <div>
              <strong className="font-black">
                تم أرشفة المنتج
              </strong>

              <p className="mt-1 text-sm leading-7">
                المنتج مرتبط بطلبات سابقة، لذلك تم أرشفته بدل
                حذفه نهائيًا للحفاظ على سجل الطلبات.
              </p>
            </div>
          </section>
        ) : null}

        {deleteError ? (
          <section
            role="alert"
            className="mt-8 flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-400/10 p-5 text-red-100"
          >
            <AlertTriangle
              aria-hidden="true"
              size={22}
              className="mt-1 shrink-0 text-red-300"
            />

            <div>
              <strong className="font-black">
                لم يتم حذف المنتج
              </strong>

              <p className="mt-1 text-sm leading-7">
                {deleteError}
              </p>
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/45">
                  السعر الحالي
                </p>

                <strong className="mt-3 block text-2xl font-black text-lime-300">
                  {formatMoney(price)}
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
                  السعر قبل الخصم
                </p>

                <strong className="mt-3 block text-xl font-black">
                  {comparePrice !== null
                    ? formatMoney(comparePrice)
                    : "غير محدد"}
                </strong>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <Sparkles
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
                  نسبة الخصم
                </p>

                <strong className="mt-3 block text-2xl font-black">
                  {discountPercentage !== null
                    ? `${discountPercentage.toLocaleString(
                        "ar-EG",
                      )}%`
                    : "—"}
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
                  عدد الصور
                </p>

                <strong className="mt-3 block text-3xl font-black">
                  {product._count.images.toLocaleString(
                    "ar-EG",
                  )}
                </strong>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <ImageIcon
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
                  مرات الطلب
                </p>

                <strong className="mt-3 block text-3xl font-black">
                  {product._count.orderItems.toLocaleString(
                    "ar-EG",
                  )}
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
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1a0e] shadow-2xl">
              <div className="border-b border-white/10 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <ImageIcon
                    aria-hidden="true"
                    size={21}
                    className="text-lime-300"
                  />

                  صور المنتج
                </h2>

                <p className="mt-2 text-sm text-white/45">
                  جميع الصور المرتبطة بالمنتج داخل قاعدة البيانات
                </p>
              </div>

              {product.images.length === 0 ? (
                <div className="grid min-h-64 place-items-center p-8 text-center">
                  <div>
                    <ImageIcon
                      aria-hidden="true"
                      size={48}
                      className="mx-auto text-white/20"
                    />

                    <p className="mt-4 text-white/45">
                      لا توجد صور مرتبطة بهذا المنتج.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  {product.images.map((image) => (
                    <article
                      key={image.id}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]"
                    >
                      <div className="aspect-square bg-white/[.02]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="h-full w-full object-contain p-5"
                        />
                      </div>

                      <div className="border-t border-white/10 p-4">
                        <strong className="block truncate text-sm">
                          {image.alt}
                        </strong>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/40">
                          <span>{image.ownership}</span>

                          <span>
                            ترتيب:{" "}
                            {image.sortOrder.toLocaleString(
                              "ar-EG",
                            )}
                          </span>

                          {image.width && image.height ? (
                            <span dir="ltr">
                              {image.width}×{image.height}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="text-xl font-black">
                الوصف الكامل
              </h2>

              <p className="mt-5 whitespace-pre-wrap leading-9 text-white/70">
                {product.description}
              </p>
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
                <h2 className="text-xl font-black">
                  التركيب
                </h2>

                <p className="mt-5 whitespace-pre-wrap leading-8 text-white/70">
                  {product.composition}
                </p>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
                <h2 className="text-xl font-black">
                  الجرعة وطريقة الاستخدام
                </h2>

                <p className="mt-5 whitespace-pre-wrap leading-8 text-white/70">
                  {product.dosage}
                </p>
              </section>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <Sparkles
                    aria-hidden="true"
                    size={21}
                    className="text-lime-300"
                  />

                  الفوائد
                </h2>

                {benefits.length === 0 ? (
                  <p className="mt-5 text-white/45">
                    لا توجد فوائد مسجلة.
                  </p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {benefits.map((benefit, index) => (
                      <div
                        key={`${benefit}-${index}`}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4"
                      >
                        <span className="grid h-7 min-w-7 place-items-center rounded-full bg-lime-300/10 text-xs font-black text-lime-300">
                          {(index + 1).toLocaleString(
                            "ar-EG",
                          )}
                        </span>

                        <p className="leading-7 text-white/70">
                          {benefit}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <Wheat
                    aria-hidden="true"
                    size={21}
                    className="text-lime-300"
                  />

                  المحاصيل والاستخدامات
                </h2>

                {crops.length === 0 ? (
                  <p className="mt-5 text-white/45">
                    لا توجد محاصيل مسجلة.
                  </p>
                ) : (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {crops.map((crop, index) => (
                      <span
                        key={`${crop}-${index}`}
                        className="rounded-full border border-lime-300/15 bg-lime-300/[.06] px-4 py-2 text-sm font-bold text-lime-100"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          <aside className="space-y-8">
            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="text-xl font-black">
                البيانات الأساسية
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <span className="block text-xs text-white/40">
                    التصنيف
                  </span>

                  <strong className="mt-2 block">
                    {product.category}
                  </strong>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <span className="block text-xs text-white/40">
                    حجم العبوة
                  </span>

                  <strong className="mt-2 block">
                    {product.packageSize}
                  </strong>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <span className="block text-xs text-white/40">
                    رابط المنتج
                  </span>

                  <strong
                    className="mt-2 block break-all text-sm text-lime-300"
                    dir="ltr"
                  >
                    {product.entity.slug}
                  </strong>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <span className="block text-xs text-white/40">
                    إصدار الـ schema
                  </span>

                  <strong className="mt-2 block">
                    V
                    {product.entity.schemaVersion.toLocaleString(
                      "ar-EG",
                    )}
                  </strong>
                </div>

                {product.legacyId !== null ? (
                  <div className="border-t border-white/10 pt-5">
                    <span className="block text-xs text-white/40">
                      المعرّف القديم
                    </span>

                    <strong className="mt-2 block">
                      {product.legacyId.toLocaleString(
                        "ar-EG",
                      )}
                    </strong>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Tags
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />

                الأسماء البديلة
              </h2>

              {product.aliases.length === 0 ? (
                <p className="mt-5 text-white/45">
                  لا توجد أسماء بديلة.
                </p>
              ) : (
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.aliases.map((alias) => (
                    <span
                      key={alias.id}
                      className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-sm text-white/70"
                    >
                      {alias.value}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Bot
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />

                مزامنة Doctor
              </h2>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <span className="block text-xs text-white/40">
                  الحالة
                </span>

                <strong className="mt-2 block">
                  {syncStatusLabels[syncStatus] ?? syncStatus}
                </strong>
              </div>

              {product.syncState?.lastSyncedAt ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] p-4">
                  <span className="block text-xs text-white/40">
                    آخر مزامنة
                  </span>

                  <strong className="mt-2 block text-sm">
                    {formatDate(
                      product.syncState.lastSyncedAt,
                    )}
                  </strong>
                </div>
              ) : null}

              {product.syncState?.diagnosticCode ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/[.07] p-4">
                  <span className="block text-xs text-red-200/70">
                    كود الخطأ
                  </span>

                  <strong className="mt-2 block break-all text-sm text-red-100">
                    {product.syncState.diagnosticCode}
                  </strong>
                </div>
              ) : null}
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <CalendarDays
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />

                سجل المنتج
              </h2>

              <div className="mt-5 space-y-5">
                <div>
                  <span className="block text-xs text-white/40">
                    تاريخ الإنشاء
                  </span>

                  <strong className="mt-2 block text-sm">
                    {formatDate(product.createdAt)}
                  </strong>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <span className="block text-xs text-white/40">
                    آخر تحديث
                  </span>

                  <strong className="mt-2 block text-sm">
                    {formatDate(product.updatedAt)}
                  </strong>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <span className="block text-xs text-white/40">
                    أنشأه
                  </span>

                  <strong className="mt-2 block">
                    {product.createdBy.name}
                  </strong>

                  <span
                    className="mt-1 block text-xs text-white/40"
                    dir="ltr"
                  >
                    {product.createdBy.email}
                  </span>
                </div>

                {product.updatedBy ? (
                  <div className="border-t border-white/10 pt-5">
                    <span className="block text-xs text-white/40">
                      آخر تعديل بواسطة
                    </span>

                    <strong className="mt-2 block">
                      {product.updatedBy.name}
                    </strong>

                    <span
                      className="mt-1 block text-xs text-white/40"
                      dir="ltr"
                    >
                      {product.updatedBy.email}
                    </span>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-lime-300/15 bg-lime-300/[.05] p-5 shadow-2xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Clock3
                  aria-hidden="true"
                  size={21}
                  className="text-lime-300"
                />

                الإحصائيات
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.025] p-4">
                  <span className="text-sm text-white/50">
                    الأسماء البديلة
                  </span>

                  <strong>
                    {product._count.aliases.toLocaleString(
                      "ar-EG",
                    )}
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.025] p-4">
                  <span className="text-sm text-white/50">
                    توصيات Doctor
                  </span>

                  <strong>
                    {product._count.recommendations.toLocaleString(
                      "ar-EG",
                    )}
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.025] p-4">
                  <span className="text-sm text-white/50">
                    المفضلة
                  </span>

                  <strong>
                    {product._count.favoritedByCustomers.toLocaleString(
                      "ar-EG",
                    )}
                  </strong>
                </div>
              </div>
            </section>

            <div className="space-y-3">
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-[#071109] transition hover:bg-lime-200"
              >
                <FilePenLine
                  aria-hidden="true"
                  size={19}
                />

                تعديل المنتج
              </Link>

              <details className="group overflow-hidden rounded-2xl border border-red-400/20 bg-red-400/[.05]">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 px-5 font-black text-red-200 transition hover:bg-red-400/10">
                  <Trash2
                    aria-hidden="true"
                    size={19}
                  />

                  حذف المنتج
                </summary>

                <div className="border-t border-red-400/15 p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      aria-hidden="true"
                      size={21}
                      className="mt-1 shrink-0 text-red-300"
                    />

                    <div>
                      <strong className="block text-red-100">
                        تأكيد حذف {product.nameAr}
                      </strong>

                      <p className="mt-2 text-sm leading-7 text-white/55">
                        إذا كان المنتج مستخدمًا في طلبات سابقة،
                        سيتم أرشفته بدل حذفه. أما إذا لم يكن مرتبطًا
                        بطلبات، فسيتم حذفه نهائيًا مع بياناته
                        المرتبطة.
                      </p>
                    </div>
                  </div>

                  <form
                    action={deleteProductAction}
                    className="mt-5"
                  >
                    <input
                      type="hidden"
                      name="productId"
                      value={product.id}
                    />

                    <button
                      type="submit"
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-black text-white transition hover:bg-red-400"
                    >
                      <Trash2
                        aria-hidden="true"
                        size={18}
                      />

                      نعم، حذف المنتج
                    </button>
                  </form>

                  <p className="mt-3 text-center text-xs text-white/35">
                    لإلغاء العملية أغلق قسم التأكيد بدون الضغط على
                    زر الحذف.
                  </p>
                </div>
              </details>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}