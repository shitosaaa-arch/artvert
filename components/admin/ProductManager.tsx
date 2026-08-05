"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Archive,
  ArrowRight,
  Box,
  CheckCircle2,
  Loader2,
  Package,
  Search,
} from "lucide-react";

import DeleteProductButton from "@/components/admin/DeleteProductButton";

type ProductListItem = {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  entity: {
    publicationState: string;
  };
  syncState?: {
    status: string;
  } | null;
};

type ProductListResponse = {
  items?: ProductListItem[];
  error?: string;
  message?: string;
};

type Feedback =
  | {
      type: "success";
      message: string;
    }
  | {
      type: "error";
      message: string;
    }
  | null;

const publicationLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};

const syncLabels: Record<string, string> = {
  PENDING: "في انتظار المزامنة",
  SYNCED: "تمت المزامنة",
  FAILED: "فشلت المزامنة",
};

function useProductResults() {
  const [items, setItems] = useState<
    ProductListItem[]
  >([]);

  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(true);

  const [reloadToken, setReloadToken] =
    useState(0);

  const requestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest =
      ++requestId.current;

    async function fetchResults() {
      setLoading(true);

      try {
        const response = await fetch(
          "/api/admin/products",
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as ProductListResponse;

        if (
          controller.signal.aborted ||
          currentRequest !== requestId.current
        ) {
          return;
        }

        if (!response.ok) {
          setError(
            data.message ??
              data.error ??
              "تعذر تحميل المنتجات.",
          );
          return;
        }

        setItems(data.items ?? []);
        setError("");
      } catch (loadError) {
        if (
          controller.signal.aborted ||
          currentRequest !== requestId.current
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "تعذر تحميل المنتجات.",
        );
      } finally {
        if (
          !controller.signal.aborted &&
          currentRequest === requestId.current
        ) {
          setLoading(false);
        }
      }
    }

    void fetchResults();

    return () => {
      controller.abort();
    };
  }, [reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    items,
    setItems,
    error,
    loading,
    reload,
  };
}

function getPublicationClass(
  value: string,
) {
  switch (value) {
    case "PUBLISHED":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
    case "ARCHIVED":
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
    default:
      return "border-sky-400/25 bg-sky-400/10 text-sky-200";
  }
}

function getSyncClass(value: string) {
  switch (value) {
    case "SYNCED":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
    case "FAILED":
      return "border-red-400/25 bg-red-400/10 text-red-200";
    default:
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  }
}

export default function ProductManager() {
  const {
    items,
    setItems,
    error,
    loading,
  } = useProductResults();

  const [query, setQuery] = useState("");
  const [feedback, setFeedback] =
    useState<Feedback>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLocaleLowerCase("ar-EG");

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((product) => {
      return [
        product.nameAr,
        product.nameEn,
        product.category,
      ].some((value) =>
        value
          .toLocaleLowerCase("ar-EG")
          .includes(normalizedQuery),
      );
    });
  }, [items, query]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      published: items.filter(
        (item) =>
          item.entity.publicationState ===
          "PUBLISHED",
      ).length,
      archived: items.filter(
        (item) =>
          item.entity.publicationState ===
          "ARCHIVED",
      ).length,
      synced: items.filter(
        (item) =>
          (item.syncState?.status ??
            "PENDING") === "SYNCED",
      ).length,
    };
  }, [items]);

  function handleDeleteCompleted(result: {
    action: "DELETED" | "ARCHIVED";
    productId: string;
    message: string;
  }) {
    if (result.action === "DELETED") {
      setItems((current) =>
        current.filter(
          (product) =>
            product.id !== result.productId,
        ),
      );
    } else {
      setItems((current) =>
        current.map((product) =>
          product.id === result.productId
            ? {
                ...product,
                entity: {
                  ...product.entity,
                  publicationState:
                    "ARCHIVED",
                },
                syncState: {
                  status: "PENDING",
                },
              }
            : product,
        ),
      );
    }

    setFeedback({
      type: "success",
      message: result.message,
    });
  }

  return (
    <main
      className="min-h-screen flex-1 bg-[#07140f] p-5 text-white lg:p-10"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 text-sm font-black text-emerald-300 transition hover:border-emerald-300/40 hover:bg-emerald-300/15"
        >
          <ArrowRight
            aria-hidden="true"
            size={18}
          />
          الرجوع إلى لوحة التحكم
        </Link>

        <header className="mt-7 border-b border-white/10 pb-7">
          <p className="text-sm font-bold text-emerald-300">
            Store Management
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            إدارة المنتجات
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
            إدارة منتجات المتجر وحالة النشر
            والمزامنة، مع حذف المنتج أو أرشفته
            تلقائيًا لو كان مرتبطًا بطلبات سابقة.
          </p>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={Package}
            label="إجمالي المنتجات"
            value={stats.total}
          />

          <Metric
            icon={CheckCircle2}
            label="المنتجات المنشورة"
            value={stats.published}
          />

          <Metric
            icon={Archive}
            label="المنتجات المؤرشفة"
            value={stats.archived}
          />

          <Metric
            icon={Box}
            label="تمت المزامنة"
            value={stats.synced}
          />
        </section>

        <section className="mt-7 rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5">
          <label className="relative block max-w-xl">
            <Search
              aria-hidden="true"
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="ابحث باسم المنتج أو التصنيف"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pr-11 pl-4 outline-none placeholder:text-white/25 focus:border-emerald-300"
            />
          </label>
        </section>

        {feedback ? (
          <div
            role="status"
            className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100"
          >
            {feedback.message}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100"
          >
            {error}
          </div>
        ) : null}

        <section className="mt-7">
          {loading ? (
            <div className="grid min-h-64 place-items-center rounded-3xl border border-white/10 bg-[#0b2118]/90">
              <Loader2
                aria-hidden="true"
                size={30}
                className="animate-spin text-emerald-300"
              />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#0b2118]/90 px-6 py-16 text-center">
              <Package
                aria-hidden="true"
                size={40}
                className="mx-auto text-emerald-300"
              />

              <h2 className="mt-5 text-2xl font-black">
                لا توجد منتجات
              </h2>

              <p className="mt-3 text-white/50">
                لا توجد نتائج مطابقة للبحث الحالي.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0b2118]/90">
              <table className="w-full min-w-[850px] text-right">
                <thead className="bg-white/[.04]">
                  <tr>
                    <th className="p-4 text-sm text-white/55">
                      المنتج
                    </th>
                    <th className="p-4 text-sm text-white/55">
                      التصنيف
                    </th>
                    <th className="p-4 text-sm text-white/55">
                      حالة النشر
                    </th>
                    <th className="p-4 text-sm text-white/55">
                      المزامنة
                    </th>
                    <th className="p-4 text-sm text-white/55">
                      الإجراءات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map(
                    (product) => {
                      const publicationState =
                        product.entity
                          .publicationState;

                      const syncStatus =
                        product.syncState
                          ?.status ?? "PENDING";

                      return (
                        <tr
                          key={product.id}
                          className="border-t border-white/10"
                        >
                          <td className="p-4">
                            <strong className="block font-black">
                              {product.nameAr}
                            </strong>

                            <span
                              className="mt-1 block text-sm text-white/40"
                              dir="ltr"
                            >
                              {product.nameEn}
                            </span>
                          </td>

                          <td className="p-4 text-sm text-white/65">
                            {product.category}
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPublicationClass(
                                publicationState,
                              )}`}
                            >
                              {publicationLabels[
                                publicationState
                              ] ??
                                publicationState}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getSyncClass(
                                syncStatus,
                              )}`}
                            >
                              {syncLabels[
                                syncStatus
                              ] ?? syncStatus}
                            </span>
                          </td>

                          <td className="p-4">
                            <DeleteProductButton
                              productId={
                                product.id
                              }
                              productName={
                                product.nameAr
                              }
                              onCompleted={
                                handleDeleteCompleted
                              }
                            />
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/50">
            {label}
          </p>

          <strong className="mt-3 block text-3xl font-black">
            {value.toLocaleString("ar-EG")}
          </strong>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300">
          <Icon
            aria-hidden="true"
            size={21}
          />
        </div>
      </div>
    </article>
  );
}
