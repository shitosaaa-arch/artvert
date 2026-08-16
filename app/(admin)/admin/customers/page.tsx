import Link from "next/link";
import { Prisma } from "@prisma/client";
import {
  BadgeCheck,
  Ban,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Heart,
  Leaf,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  UserCheck,
  UsersRound,
  MessageCircle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const ACCOUNT_STATES = [
  "ALL",
  "ACTIVE",
  "INACTIVE",
] as const;

const VERIFICATION_STATES = [
  "ALL",
  "VERIFIED",
  "UNVERIFIED",
] as const;

const MARKETING_STATES = [
  "ALL",
  "OPTED_IN",
  "OPTED_OUT",
] as const;

type AccountState =
  (typeof ACCOUNT_STATES)[number];

type VerificationState =
  (typeof VERIFICATION_STATES)[number];

type MarketingState =
  (typeof MARKETING_STATES)[number];

type CustomersPageProps = {
  searchParams: Promise<{
    search?: string;
    accountState?: string;
    verificationState?: string;
    marketingState?: string;
    page?: string;
  }>;
};

function normalizePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function normalizeAccountState(
  value: string | undefined,
): AccountState {
  if (
    value &&
    ACCOUNT_STATES.includes(value as AccountState)
  ) {
    return value as AccountState;
  }

  return "ALL";
}

function normalizeVerificationState(
  value: string | undefined,
): VerificationState {
  if (
    value &&
    VERIFICATION_STATES.includes(
      value as VerificationState,
    )
  ) {
    return value as VerificationState;
  }

  return "ALL";
}

function normalizeMarketingState(
  value: string | undefined,
): MarketingState {
  if (
    value &&
    MARKETING_STATES.includes(
      value as MarketingState,
    )
  ) {
    return value as MarketingState;
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

function buildPageUrl({
  search,
  accountState,
  verificationState,
  marketingState,
  page,
}: {
  search: string;
  accountState: AccountState;
  verificationState: VerificationState;
  marketingState: MarketingState;
  page: number;
}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (accountState !== "ALL") {
    params.set("accountState", accountState);
  }

  if (verificationState !== "ALL") {
    params.set(
      "verificationState",
      verificationState,
    );
  }

  if (marketingState !== "ALL") {
    params.set("marketingState", marketingState);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `/admin/customers?${query}`
    : "/admin/customers";
}

function getAccountStateClass(active: boolean) {
  return active
    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
    : "border-red-400/25 bg-red-400/10 text-red-200";
}

function getVerificationClass(
  emailVerifiedAt: Date | null,
) {
  return emailVerifiedAt
    ? "border-sky-400/25 bg-sky-400/10 text-sky-200"
    : "border-amber-400/25 bg-amber-400/10 text-amber-200";
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = await searchParams;

  const search = (params.search ?? "").trim();

  const accountState = normalizeAccountState(
    params.accountState,
  );

  const verificationState =
    normalizeVerificationState(
      params.verificationState,
    );

  const marketingState = normalizeMarketingState(
    params.marketingState,
  );

  const requestedPage = normalizePage(params.page);

  const where: Prisma.CustomerWhereInput = {
    ...(accountState === "ACTIVE"
      ? {
          active: true,
        }
      : accountState === "INACTIVE"
        ? {
            active: false,
          }
        : {}),
    ...(verificationState === "VERIFIED"
      ? {
          emailVerifiedAt: {
            not: null,
          },
        }
      : verificationState === "UNVERIFIED"
        ? {
            emailVerifiedAt: null,
          }
        : {}),
    ...(marketingState === "OPTED_IN"
      ? {
          marketingOptIn: true,
        }
      : marketingState === "OPTED_OUT"
        ? {
            marketingOptIn: false,
          }
        : {}),
    ...(search
      ? {
          OR: [
            {
              displayName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              addresses: {
                some: {
                  OR: [
                    {
                      phone: {
                        contains: search,
                      },
                    },
                    {
                      alternativePhone: {
                        contains: search,
                      },
                    },
                    {
                      governorate: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                    {
                      city: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              },
            },
            {
              orders: {
                some: {
                  OR: [
                    {
                      phone: {
                        contains: search,
                      },
                    },
                    {
                      customerName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                    {
                      orderNumber: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
    verifiedCustomers,
    marketingCustomers,
    deletionRequests,
    filteredCount,
    whatsappInterestedCount,
  ] = await Promise.all([
    prisma.customer.count(),

    prisma.customer.count({
      where: {
        active: true,
      },
    }),

    prisma.customer.count({
      where: {
        active: false,
      },
    }),

    prisma.customer.count({
      where: {
        emailVerifiedAt: {
          not: null,
        },
      },
    }),

    prisma.customer.count({
      where: {
        marketingOptIn: true,
      },
    }),

    prisma.customer.count({
      where: {
        deletionRequestedAt: {
          not: null,
        },
      },
    }),

    prisma.customer.count({
      where,
    }),

    prisma.customerAuditLog.count({
      where: {
        action: "WHATSAPP_INTERESTED",
      },
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

  const customers = await prisma.customer.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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

      sessions: {
        where: {
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          lastSeenAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          lastSeenAt: true,
          expiresAt: true,
        },
      },

      addresses: {
        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: 1,
        select: {
          id: true,
          phone: true,
          alternativePhone: true,
          governorate: true,
          city: true,
          addressLine: true,
          isDefault: true,
        },
      },

      orders: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          orderNumber: true,
          status: true,
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

  const whatsappInterested = await prisma.customerAuditLog.findMany({
    where: {
      action: "WHATSAPP_INTERESTED",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    select: {
      id: true,
      customerId: true,
      createdAt: true,
      metadata: true,
      customer: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },
  });

  const stats = [
    {
      label: "إجمالي العملاء",
      value: totalCustomers,
      icon: UsersRound,
    },
    {
      label: "الحسابات النشطة",
      value: activeCustomers,
      icon: UserCheck,
    },
    {
      label: "البريد الموثق",
      value: verifiedCustomers,
      icon: ShieldCheck,
    },
    {
      label: "مشتركو التسويق",
      value: marketingCustomers,
      icon: Mail,
    },
  ];

  const hasFilters =
    Boolean(search) ||
    accountState !== "ALL" ||
    verificationState !== "ALL" ||
    marketingState !== "ALL";

  return (
    <main
      className="min-h-screen bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-sm font-black text-lime-300">
              إدارة المتجر والحسابات
            </span>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              إدارة العملاء
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-white/55">
              عرض حسابات العملاء وطلباتهم وعناوينهم
              وتفضيلات الخصوصية ونشاط Doctor من قاعدة
              PostgreSQL.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/70 transition hover:border-lime-300/30 hover:text-white"
          >
            <ShoppingBag
              aria-hidden="true"
              size={19}
            />

            إدارة الطلبات
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
              <span className="flex items-center gap-2 text-sm text-white/50">
                <Ban
                  aria-hidden="true"
                  size={17}
                />

                الحسابات غير النشطة
              </span>

              <strong className="text-lg font-black text-red-200">
                {inactiveCustomers.toLocaleString("ar-EG")}
              </strong>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/50">
                طلبات حذف الحساب
              </span>

              <strong className="text-lg font-black text-amber-200">
                {deletionRequests.toLocaleString("ar-EG")}
              </strong>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[.025] p-4 sm:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/50">
                غير موثقي البريد
              </span>

              <strong className="text-lg font-black">
                {(
                  totalCustomers - verifiedCustomers
                ).toLocaleString("ar-EG")}
              </strong>
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
          <form
            method="GET"
            action="/admin/customers"
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
                placeholder="الاسم، البريد، الهاتف، المدينة أو رقم الطلب"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pr-11 pl-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
              />
            </label>

            <select
              name="accountState"
              defaultValue={accountState}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
            >
              <option value="ALL">
                كل حالات الحساب
              </option>

              <option value="ACTIVE">
                الحسابات النشطة
              </option>

              <option value="INACTIVE">
                الحسابات المعطلة
              </option>
            </select>

            <select
              name="verificationState"
              defaultValue={verificationState}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
            >
              <option value="ALL">
                كل حالات التوثيق
              </option>

              <option value="VERIFIED">
                البريد موثق
              </option>

              <option value="UNVERIFIED">
                البريد غير موثق
              </option>
            </select>

            <select
              name="marketingState"
              defaultValue={marketingState}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
            >
              <option value="ALL">
                كل تفضيلات التسويق
              </option>

              <option value="OPTED_IN">
                مشترك في التسويق
              </option>

              <option value="OPTED_OUT">
                غير مشترك
              </option>
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
                عميل
              </p>

              <Link
                href="/admin/customers"
                className="text-sm font-bold text-white/60 transition hover:text-lime-300"
              >
                مسح البحث والفلاتر
              </Link>
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-3xl border border-emerald-400/20 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="flex items-center gap-2 text-sm font-black text-emerald-300">
                <MessageCircle aria-hidden="true" size={18} />
                ردود واتساب
              </span>
              <h2 className="mt-2 text-2xl font-black">العملاء المهتمون</h2>
              <p className="mt-2 text-sm leading-7 text-white/50">
                آخر العملاء الذين ضغطوا على زر «مهتم» في رسائل واتساب.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-center">
              <span className="block text-xs text-white/45">إجمالي الردود</span>
              <strong className="mt-1 block text-2xl font-black text-emerald-200">
                {whatsappInterestedCount.toLocaleString("ar-EG")}
              </strong>
            </div>
          </div>

          {whatsappInterested.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-white/40">
              لا توجد ردود «مهتم» مسجلة حتى الآن.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[760px] text-right">
                <thead className="bg-white/[.04] text-xs text-white/45">
                  <tr>
                    <th className="px-4 py-3 font-bold">رقم واتساب</th>
                    <th className="px-4 py-3 font-bold">الحالة</th>
                    <th className="px-4 py-3 font-bold">تاريخ الرد</th>
                    <th className="px-4 py-3 font-bold">الربط بالعميل</th>
                    <th className="px-4 py-3 font-bold">العميل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {whatsappInterested.map((item) => {
                    const metadata =
                      item.metadata &&
                      typeof item.metadata === "object" &&
                      !Array.isArray(item.metadata)
                        ? (item.metadata as Prisma.JsonObject)
                        : null;
                    const phone =
                      metadata && typeof metadata.phone === "string"
                        ? metadata.phone
                        : "غير متاح";

                    return (
                      <tr key={item.id} className="text-sm">
                        <td className="px-4 py-4 font-bold" dir="ltr">{phone}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
                            مهتم
                          </span>
                        </td>
                        <td className="px-4 py-4 text-white/60">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-4">
                          {item.customer ? (
                            <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-black text-sky-200">
                              مرتبط بحساب
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-200">
                              غير مرتبط
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {item.customer ? (
                            <Link
                              href={`/admin/customers/${item.customer.id}`}
                              className="font-black text-lime-300 transition hover:text-lime-200"
                            >
                              {item.customer.displayName || item.customer.email}
                            </Link>
                          ) : (
                            <span className="text-white/35">جهة اتصال واتساب فقط</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8">
          {customers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#0b1a0e] px-6 py-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime-300/10 text-lime-300">
                <UsersRound
                  aria-hidden="true"
                  size={30}
                />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                لا يوجد عملاء
              </h2>

              <p className="mt-3 text-white/50">
                لا توجد حسابات عملاء مطابقة للفلاتر الحالية.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {customers.map((customer) => {
                const address =
                  customer.addresses[0] ?? null;

                const lastOrder =
                  customer.orders[0] ?? null;

                const activeSession =
                  customer.sessions[0] ?? null;

                return (
                  <article
                    key={customer.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1a0e] shadow-2xl"
                  >
                    <div className="border-b border-white/10 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                            <CircleUserRound
                              aria-hidden="true"
                              size={27}
                            />
                          </div>

                          <div className="min-w-0">
                            <h2 className="truncate text-xl font-black">
                              {customer.displayName}
                            </h2>

                            <p
                              className="mt-1 truncate text-sm text-white/45"
                              dir="ltr"
                            >
                              {customer.email}
                            </p>
                          </div>
                        </div>

                        {customer.emailVerifiedAt ? (
                          <BadgeCheck
                            aria-label="البريد موثق"
                            size={22}
                            className="shrink-0 text-sky-300"
                          />
                        ) : null}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getAccountStateClass(
                            customer.active,
                          )}`}
                        >
                          {customer.active
                            ? "حساب نشط"
                            : "حساب معطل"}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getVerificationClass(
                            customer.emailVerifiedAt,
                          )}`}
                        >
                          {customer.emailVerifiedAt
                            ? "البريد موثق"
                            : "غير موثق"}
                        </span>

                        {customer.deletionRequestedAt ? (
                          <span className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1 text-xs font-black text-red-200">
                            طلب حذف الحساب
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                          <span className="block text-xs text-white/40">
                            الطلبات
                          </span>

                          <strong className="mt-2 block text-xl font-black">
                            {customer._count.orders.toLocaleString(
                              "ar-EG",
                            )}
                          </strong>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                          <span className="block text-xs text-white/40">
                            تشخيصات Doctor
                          </span>

                          <strong className="mt-2 block text-xl font-black">
                            {customer._count.diagnoses.toLocaleString(
                              "ar-EG",
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/[.02] p-3 text-center">
                          <Leaf
                            aria-hidden="true"
                            size={17}
                            className="mx-auto text-lime-300"
                          />

                          <strong className="mt-2 block">
                            {customer._count.savedPlants.toLocaleString(
                              "ar-EG",
                            )}
                          </strong>

                          <span className="mt-1 block text-[11px] text-white/35">
                            نباتات
                          </span>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[.02] p-3 text-center">
                          <Heart
                            aria-hidden="true"
                            size={17}
                            className="mx-auto text-lime-300"
                          />

                          <strong className="mt-2 block">
                            {customer._count.productFavorites.toLocaleString(
                              "ar-EG",
                            )}
                          </strong>

                          <span className="mt-1 block text-[11px] text-white/35">
                            مفضلة
                          </span>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[.02] p-3 text-center">
                          <MapPin
                            aria-hidden="true"
                            size={17}
                            className="mx-auto text-lime-300"
                          />

                          <strong className="mt-2 block">
                            {customer._count.addresses.toLocaleString(
                              "ar-EG",
                            )}
                          </strong>

                          <span className="mt-1 block text-[11px] text-white/35">
                            عناوين
                          </span>
                        </div>
                      </div>

                      {address ? (
                        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4">
                          <span className="flex items-center gap-2 text-xs text-white/40">
                            <MapPin
                              aria-hidden="true"
                              size={14}
                            />

                            العنوان الرئيسي
                          </span>

                          <p className="mt-2 text-sm leading-7 text-white/65">
                            {address.governorate}،{" "}
                            {address.city}
                          </p>

                          <p
                            className="mt-1 text-sm text-white/45"
                            dir="ltr"
                          >
                            {address.phone}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/35">
                          لا يوجد عنوان محفوظ.
                        </div>
                      )}

                      {lastOrder ? (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] p-4">
                          <span className="flex items-center gap-2 text-xs text-white/40">
                            <ShoppingBag
                              aria-hidden="true"
                              size={14}
                            />

                            آخر طلب
                          </span>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <Link
                              href={`/admin/orders/${lastOrder.id}`}
                              className="font-black text-lime-300 transition hover:text-lime-200"
                              dir="ltr"
                            >
                              {lastOrder.orderNumber}
                            </Link>

                            <span className="text-xs text-white/40">
                              {formatDate(lastOrder.createdAt)}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/10 bg-white/[.02] p-3">
                          <span className="block text-xs text-white/35">
                            تاريخ التسجيل
                          </span>

                          <strong className="mt-2 block text-xs">
                            {formatDate(customer.createdAt)}
                          </strong>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[.02] p-3">
                          <span className="block text-xs text-white/35">
                            آخر نشاط
                          </span>

                          <strong className="mt-2 block text-xs">
                            {activeSession
                              ? formatDate(
                                  activeSession.lastSeenAt,
                                )
                              : "لا توجد جلسة نشطة"}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {customer.historyOptIn ? (
                          <span className="rounded-full bg-lime-300/[.06] px-3 py-1 text-xs text-lime-100">
                            حفظ السجل
                          </span>
                        ) : null}

                        {customer.imageSavingOptIn ? (
                          <span className="rounded-full bg-lime-300/[.06] px-3 py-1 text-xs text-lime-100">
                            حفظ الصور
                          </span>
                        ) : null}

                        {customer.analyticsOptIn ? (
                          <span className="rounded-full bg-lime-300/[.06] px-3 py-1 text-xs text-lime-100">
                            التحليلات
                          </span>
                        ) : null}

                        {customer.marketingOptIn ? (
                          <span className="rounded-full bg-lime-300/[.06] px-3 py-1 text-xs text-lime-100">
                            التسويق
                          </span>
                        ) : null}
                      </div>

                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-black text-[#071109] transition hover:bg-lime-200"
                      >
                        فتح ملف العميل

                        <ChevronLeft
                          aria-hidden="true"
                          size={17}
                        />
                      </Link>
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
            aria-label="صفحات العملاء"
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
                    accountState,
                    verificationState,
                    marketingState,
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
                    accountState,
                    verificationState,
                    marketingState,
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

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm leading-7 text-white/45">
          <Stethoscope
            aria-hidden="true"
            size={18}
            className="mt-1 shrink-0 text-lime-300"
          />

          بيانات العملاء منفصلة عن حسابات موظفي الإدارة، ويتم
          قراءتها من PostgreSQL بدون استخدام localStorage.
        </div>
      </div>
    </main>
  );
}