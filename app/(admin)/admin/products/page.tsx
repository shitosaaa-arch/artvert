import Link from "next/link";
import { Prisma } from "@prisma/client";
import {
  Archive,
  Bot,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Clock3,
  Eye,
  FilePenLine,
  ImageIcon,
  Package,
  Search,
  Sparkles,
  Tags,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const PUBLICATION_STATES = [
  "ALL",
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;

const SYNC_STATUSES = [
  "ALL",
  "PENDING",
  "SYNCED",
  "FAILED",
  "NOT_CREATED",
] as const;

type PublicationStateFilter =
  (typeof PUBLICATION_STATES)[number];

type SyncStatusFilter =
  (typeof SYNC_STATUSES)[number];

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
    publicationState?: string;
    syncStatus?: string;
    page?: string;
  }>;
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
  NOT_CREATED: "لم تبدأ المزامنة",
};

function normalizePage(value: string | undefined) {
  const parsedPage = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsedPage) || parsedPage < 1) {
    return 1;
  }

  return parsedPage;
}

function normalizePublicationState(
  value: string | undefined,
): PublicationStateFilter {
  if (
    value &&
    PUBLICATION_STATES.includes(
      value as PublicationStateFilter,
    )
  ) {
    return value as PublicationStateFilter;
  }

  return "ALL";
}

function normalizeSyncStatus(
  value: string | undefined,
): SyncStatusFilter {
  if (
    value &&
    SYNC_STATUSES.includes(value as SyncStatusFilter)
  ) {
    return value as SyncStatusFilter;
  }

  return "ALL";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(date);
}

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

    case "PENDING":
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";

    default:
      return "border-white/10 bg-white/[.04] text-white/45";
  }
}

function getSyncStatus(
  syncState: {
    status: string;
  } | null,
) {
  return syncState?.status ?? "NOT_CREATED";
}

function buildPageUrl({
  search,
  category,
  publicationState,
  syncStatus,
  page,
}: {
  search: string;
  category: string;
  publicationState: PublicationStateFilter;
  syncStatus: SyncStatusFilter;
  page: number;
}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (category !== "ALL") {
    params.set("category", category);
  }

  if (publicationState !== "ALL") {
    params.set("publicationState", publicationState);
  }

  if (syncStatus !== "ALL") {
    params.set("syncStatus", syncStatus);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `/admin/products?${query}`
    : "/admin/products";
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;

  const search = (params.search ?? "").trim();
  const category = (params.category ?? "ALL").trim() || "ALL";

  const publicationState = normalizePublicationState(
    params.publicationState,
  );

  const syncStatus = normalizeSyncStatus(params.syncStatus);
  const requestedPage = normalizePage(params.page);

  const categoriesResult = await prisma.product.findMany({
    distinct: ["category"],
    orderBy: {
      category: "asc",
    },
    select: {
      category: true,
    },
  });

  const categories = categoriesResult
    .map((item) => item.category)
    .filter(Boolean);

  const where: Prisma.ProductWhereInput = {
    ...(category !== "ALL"
      ? {
          category,
        }
      : {}),
    ...(publicationState !== "ALL"
      ? {
          entity: {
            publicationState,
          },
        }
      : {}),
    ...(syncStatus === "NOT_CREATED"
      ? {
          syncState: null,
        }
      : syncStatus !== "ALL"
        ? {
            syncState: {
              is: {
                status: syncStatus,
              },
            },
          }
        : {}),
    ...(search
      ? {
          OR: [
            {
              nameAr: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              nameEn: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              category: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              shortDescription: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              entity: {
                slug: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
            {
              aliases: {
                some: {
                  value: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [
    totalProducts,
    publishedProducts,
    draftProducts,
    archivedProducts,
    syncedProducts,
    failedSyncProducts,
    filteredCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({
      where: {
        entity: {
          publicationState: "PUBLISHED",
        },
      },
    }),
    prisma.product.count({
      where: {
        entity: {
          publicationState: "DRAFT",
        },
      },
    }),
    prisma.product.count({
      where: {
        entity: {
          publicationState: "ARCHIVED",
        },
      },
    }),
    prisma.product.count({
      where: {
        syncState: {
          is: {
            status: "SYNCED",
          },
        },
      },
    }),
    prisma.product.count({
      where: {
        syncState: {
          is: {
            status: "FAILED",
          },
        },
      },
    }),
    prisma.product.count({
      where,
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCount / PAGE_SIZE),
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const products = await prisma.product.findMany({
    where,
    orderBy: {
      updatedAt: "desc",
    },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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
      benefits: true,
      crops: true,
      createdAt: true,
      updatedAt: true,
      entity: {
        select: {
          slug: true,
          publicationState: true,
          schemaVersion: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
        select: {
          id: true,
          url: true,
          alt: true,
          ownership: true,
        },
      },
      aliases: {
        orderBy: {
          value: "asc",
        },
        select: {
          id: true,
          value: true,
        },
      },
      syncState: {
        select: {
          status: true,
          lastSyncedAt: true,
          diagnosticCode: true,
        },
      },
      _count: {
        select: {
          recommendations: true,
          favoritedByCustomers: true,
          orderItems: true,
          images: true,
          aliases: true,
        },
      },
    },
  });

  const stats = [
    {
      label: "إجمالي المنتجات",
      value: totalProducts,
      icon: Package,
    },
    {
      label: "المنتجات المنشورة",
      value: publishedProducts,
      icon: Eye,
    },
    {
      label: "المسودات",
      value: draftProducts,
      icon: FilePenLine,
    },
    {
      label: "متزامن مع Doctor",
      value: syncedProducts,
      icon: Bot,
    },
  ];

  const hasFilters =
    Boolean(search) ||
    category !== "ALL" ||
    publicationState !== "ALL" ||
    syncStatus !== "ALL";

  return (
    <main
      className="min-h-screen bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1600px]">
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/10 px-4 text-sm font-black text-lime-300 transition hover:border-lime-300/40 hover:bg-lime-300/15"
        >
          <ChevronRight
            aria-hidden="true"
            size={18}
          />

          الرجوع إلى لوحة التحكم
        </Link>

        <header className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-sm font-black text-lime-300">
              إدارة المتجر وقاعدة المعرفة
            </span>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              إدارة المنتجات
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-white/55">
              عرض وإدارة منتجات ArtVert المخزنة داخل PostgreSQL،
              ومتابعة حالة نشرها ومزامنتها مع قاعدة معرفة Doctor.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-lime-300 px-6 font-black text-[#071109] transition hover:bg-lime-200"
          >
            <CirclePlus
              aria-hidden="true"
              size={20}
            />

            إضافة منتج جديد
          </Link>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white/45">
                      {stat.label}
                    </p>

                    <strong className="mt-3 block text-3xl font-black">
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

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/50">
                منتجات مؤرشفة
              </span>

              <strong className="text-lg font-black">
                {archivedProducts.toLocaleString("ar-EG")}
              </strong>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/50">
                أخطاء مزامنة Doctor
              </span>

              <strong className="text-lg font-black text-red-300">
                {failedSyncProducts.toLocaleString("ar-EG")}
              </strong>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[.025] p-4 sm:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/50">
                عدد التصنيفات
              </span>

              <strong className="text-lg font-black text-lime-300">
                {categories.length.toLocaleString("ar-EG")}
              </strong>
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
          <form
            method="GET"
            action="/admin/products"
            className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_210px_210px_210px_auto]"
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
                placeholder="اسم المنتج، التصنيف، الرابط أو الاسم البديل"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pr-11 pl-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
              />
            </label>

            <select
              name="category"
              defaultValue={category}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
            >
              <option value="ALL">
                كل التصنيفات
              </option>

              {categories.map((currentCategory) => (
                <option
                  key={currentCategory}
                  value={currentCategory}
                >
                  {currentCategory}
                </option>
              ))}
            </select>

            <select
              name="publicationState"
              defaultValue={publicationState}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
            >
              <option value="ALL">
                كل حالات النشر
              </option>

              {PUBLICATION_STATES.filter(
                (state) => state !== "ALL",
              ).map((state) => (
                <option
                  key={state}
                  value={state}
                >
                  {publicationStateLabels[state]}
                </option>
              ))}
            </select>

            <select
              name="syncStatus"
              defaultValue={syncStatus}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
            >
              <option value="ALL">
                كل حالات المزامنة
              </option>

              {SYNC_STATUSES.filter(
                (status) => status !== "ALL",
              ).map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {syncStatusLabels[status]}
                </option>
              ))}
            </select>

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
          </form>

          {hasFilters ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-sm text-white/50">
                تم العثور على{" "}
                <strong className="text-lime-300">
                  {filteredCount.toLocaleString("ar-EG")}
                </strong>{" "}
                منتج
              </p>

              <Link
                href="/admin/products"
                className="text-sm font-bold text-white/60 transition hover:text-lime-300"
              >
                مسح البحث والفلاتر
              </Link>
            </div>
          ) : null}
        </section>

        <section className="mt-8">
          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#0b1a0e] px-6 py-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime-300/10 text-lime-300">
                <Package
                  aria-hidden="true"
                  size={30}
                />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                لا توجد منتجات
              </h2>

              <p className="mt-3 text-white/50">
                لا توجد منتجات مطابقة للبحث والفلاتر الحالية.
              </p>

              <Link
                href="/admin/products/new"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-[#071109]"
              >
                <CirclePlus
                  aria-hidden="true"
                  size={18}
                />

                إضافة أول منتج
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {products.map((product) => {
                const primaryImage = product.images[0] ?? null;
                const currentSyncStatus = getSyncStatus(
                  product.syncState,
                );

                return (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1a0e] shadow-2xl"
                  >
                    <div className="relative aspect-[16/8] overflow-hidden border-b border-white/10 bg-white/[.025]">
                      {primaryImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={primaryImage.url}
                          alt={primaryImage.alt || product.nameAr}
                          className="h-full w-full object-contain p-5"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-white/20">
                          <ImageIcon
                            aria-hidden="true"
                            size={44}
                          />
                        </div>
                      )}

                      <div className="absolute right-4 top-4 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black backdrop-blur ${getPublicationStateClass(
                            product.entity.publicationState,
                          )}`}
                        >
                          {publicationStateLabels[
                            product.entity.publicationState
                          ] ?? product.entity.publicationState}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black backdrop-blur ${getSyncStatusClass(
                            currentSyncStatus,
                          )}`}
                        >
                          {syncStatusLabels[currentSyncStatus] ??
                            currentSyncStatus}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-lime-300">
                            {product.category}
                          </span>

                          <h2 className="mt-2 truncate text-xl font-black">
                            {product.nameAr}
                          </h2>

                          <p className="mt-1 truncate text-sm text-white/40">
                            {product.nameEn}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-black text-white/55">
                          V{product.entity.schemaVersion}
                        </span>
                      </div>

                      <p className="mt-4 line-clamp-3 min-h-[72px] text-sm leading-6 text-white/55">
                        {product.shortDescription}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-white/55">
                          <ImageIcon
                            aria-hidden="true"
                            size={13}
                          />

                          {product._count.images.toLocaleString(
                            "ar-EG",
                          )}{" "}
                          صورة
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-white/55">
                          <Tags
                            aria-hidden="true"
                            size={13}
                          />

                          {product._count.aliases.toLocaleString(
                            "ar-EG",
                          )}{" "}
                          اسم بديل
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-white/55">
                          <Sparkles
                            aria-hidden="true"
                            size={13}
                          />

                          {product._count.recommendations.toLocaleString(
                            "ar-EG",
                          )}{" "}
                          توصية
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                          <span className="block text-xs text-white/40">
                            حجم العبوة
                          </span>

                          <strong className="mt-2 block text-sm">
                            {product.packageSize}
                          </strong>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                          <span className="block text-xs text-white/40">
                            مرات الطلب
                          </span>

                          <strong className="mt-2 block text-sm">
                            {product._count.orderItems.toLocaleString(
                              "ar-EG",
                            )}
                          </strong>
                        </div>
                      </div>

                      {product.aliases.length > 0 ? (
                        <div className="mt-5">
                          <span className="text-xs font-bold text-white/40">
                            الأسماء البديلة
                          </span>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {product.aliases
                              .slice(0, 4)
                              .map((alias) => (
                                <span
                                  key={alias.id}
                                  className="rounded-full bg-lime-300/[.07] px-3 py-1 text-xs text-lime-100"
                                >
                                  {alias.value}
                                </span>
                              ))}

                            {product.aliases.length > 4 ? (
                              <span className="rounded-full bg-white/[.05] px-3 py-1 text-xs text-white/45">
                                +
                                {(
                                  product.aliases.length - 4
                                ).toLocaleString("ar-EG")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-5 flex items-center gap-2 text-xs text-white/35">
                        <Clock3
                          aria-hidden="true"
                          size={14}
                        />

                        آخر تحديث: {formatDate(product.updatedAt)}
                      </div>

                      {product.syncState?.diagnosticCode ? (
                        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[.07] p-3 text-xs leading-6 text-red-100">
                          كود خطأ المزامنة:{" "}
                          {product.syncState.diagnosticCode}
                        </div>
                      ) : null}

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <Link
                          href={`/products/${product.entity.slug}`}
                          target="_blank"
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm font-bold text-white/65 transition hover:border-lime-300/30 hover:text-white"
                        >
                          <Eye
                            aria-hidden="true"
                            size={17}
                          />

                          عرض
                        </Link>

                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/[.07] px-3 text-sm font-black text-lime-200 transition hover:bg-lime-300/[.12]"
                        >
                          <FilePenLine
                            aria-hidden="true"
                            size={17}
                          />

                          تعديل
                        </Link>

                        <Link
                          href={`/admin/products/${product.id}`}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lime-300 px-3 text-sm font-black text-[#071109] transition hover:bg-lime-200"
                        >
                          التفاصيل

                          <ChevronLeft
                            aria-hidden="true"
                            size={17}
                          />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {filteredCount > 0 && totalPages > 1 ? (
          <nav
            className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b1a0e] p-4"
            aria-label="صفحات المنتجات"
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
                    category,
                    publicationState,
                    syncStatus,
                    page: currentPage - 1,
                  })}
                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold text-white/70 transition hover:border-lime-300/35 hover:text-white"
                >
                  <ChevronRight
                    aria-hidden="true"
                    size={17}
                  />

                  السابق
                </Link>
              ) : (
                <span className="flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[.02] px-4 text-sm font-bold text-white/25">
                  <ChevronRight
                    aria-hidden="true"
                    size={17}
                  />

                  السابق
                </span>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={buildPageUrl({
                    search,
                    category,
                    publicationState,
                    syncStatus,
                    page: currentPage + 1,
                  })}
                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-black text-[#071109] transition hover:bg-lime-200"
                >
                  التالي

                  <ChevronLeft
                    aria-hidden="true"
                    size={17}
                  />
                </Link>
              ) : (
                <span className="flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-lime-300/30 px-4 text-sm font-black text-[#071109]/50">
                  التالي

                  <ChevronLeft
                    aria-hidden="true"
                    size={17}
                  />
                </span>
              )}
            </div>
          </nav>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm text-white/45">
          <span>
            المنتجات مرتبطة بقاعدة معرفة Doctor ولا يتم تعديلها
            باستخدام localStorage.
          </span>

          <Link
            href="/admin"
            className="font-bold text-white/65 transition hover:text-lime-300"
          >
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    </main>
  );
}