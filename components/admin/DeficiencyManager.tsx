"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FlaskConical,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import DeleteDeficiencyButton from "@/components/admin/DeleteDeficiencyButton";

type ValueItem = {
  value: string;
};

type DeficiencyItem = {
  id: string;
  nutrientCode: string;
  nutrientNameAr: string;
  nutrientNameEn: string;
  scientificName?: string | null;
  description?: string | null;
  classification: string;
  mobility: string;
  entity?: {
    slug: string;
    publicationState: string;
  };
  aliases?: ValueItem[];
  visualPatterns?: ValueItem[];
  causes?: ValueItem[];
  aggravatingConditions?: ValueItem[];
  symptoms?: Array<{
    value: string;
    locations?: string[];
  }>;
  syncState: {
    status: string;
  } | null;
};

type DeficiencyListResponse = {
  items?: DeficiencyItem[];
  pageCount?: number;
  error?: string;
  message?: string;
};

type DeficiencyForm = {
  nutrientCode: string;
  nutrientNameAr: string;
  nutrientNameEn: string;
  slug: string;
  scientificName: string;
  classification: string;
  mobility: string;
  description: string;
  aliases: string;
  visualPatterns: string;
  causes: string;
  aggravatingConditions: string;
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

const classifications = [
  "MACRONUTRIENT",
  "SECONDARY_NUTRIENT",
  "MICRONUTRIENT",
  "BENEFICIAL_ELEMENT",
  "OTHER",
] as const;

const mobilities = [
  "MOBILE",
  "IMMOBILE",
  "CONTEXT_DEPENDENT",
  "UNKNOWN",
] as const;

const syncStatuses = [
  "PENDING",
  "SYNCED",
  "FAILED",
] as const;

const classificationLabels: Record<string, string> = {
  MACRONUTRIENT: "عنصر كبرى",
  SECONDARY_NUTRIENT: "عنصر ثانوي",
  MICRONUTRIENT: "عنصر صغرى",
  BENEFICIAL_ELEMENT: "عنصر نافع",
  OTHER: "أخرى",
};

const mobilityLabels: Record<string, string> = {
  MOBILE: "متحرك",
  IMMOBILE: "غير متحرك",
  CONTEXT_DEPENDENT: "يعتمد على الظروف",
  UNKNOWN: "غير معروف",
};

const syncLabels: Record<string, string> = {
  PENDING: "في انتظار المزامنة",
  SYNCED: "تمت المزامنة",
  FAILED: "فشلت المزامنة",
};

const initialForm: DeficiencyForm = {
  nutrientCode: "",
  nutrientNameAr: "",
  nutrientNameEn: "",
  slug: "",
  scientificName: "",
  classification: "MACRONUTRIENT",
  mobility: "UNKNOWN",
  description: "",
  aliases: "",
  visualPatterns: "",
  causes: "",
  aggravatingConditions: "",
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
}

function csvToArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function valuesToText(
  values: ValueItem[] | undefined,
) {
  return (values ?? [])
    .map((item) => item.value)
    .join(", ");
}

function formFromItem(
  item: DeficiencyItem,
): DeficiencyForm {
  return {
    nutrientCode: item.nutrientCode,
    nutrientNameAr: item.nutrientNameAr,
    nutrientNameEn: item.nutrientNameEn,
    slug:
      item.entity?.slug ??
      normalizeSlug(item.nutrientNameEn),
    scientificName:
      item.scientificName ?? "",
    classification: item.classification,
    mobility: item.mobility,
    description: item.description ?? "",
    aliases: valuesToText(item.aliases),
    visualPatterns: valuesToText(
      item.visualPatterns,
    ),
    causes: valuesToText(item.causes),
    aggravatingConditions: valuesToText(
      item.aggravatingConditions,
    ),
  };
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

export default function DeficiencyManager() {
  const [items, setItems] = useState<
    DeficiencyItem[]
  >([]);

  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] =
    useState(1);

  const [query, setQuery] = useState("");
  const [classification, setClassification] =
    useState("");
  const [mobility, setMobility] =
    useState("");
  const [syncStatus, setSyncStatus] =
    useState("");

  const [selected, setSelected] =
    useState<DeficiencyItem | null>(null);

  const [form, setForm] =
    useState<DeficiencyForm>(initialForm);

  const [editing, setEditing] =
    useState(false);
  const [loading, setLoading] =
    useState(true);
  const [loadingDetails, setLoadingDetails] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [syncingId, setSyncingId] =
    useState<string | null>(null);

  const [feedback, setFeedback] =
    useState<Feedback>(null);

  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest =
      ++requestId.current;

    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "12",
        sort: "name",
        direction: "asc",
      });

      if (query.trim()) {
        params.set("q", query.trim());
      }

      if (classification) {
        params.set(
          "classification",
          classification,
        );
      }

      if (mobility) {
        params.set("mobility", mobility);
      }

      if (syncStatus) {
        params.set(
          "syncStatus",
          syncStatus,
        );
      }

      const response = await fetch(
        `/api/admin/deficiencies?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as DeficiencyListResponse;

      if (
        currentRequest !== requestId.current
      ) {
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "تعذر تحميل نواقص العناصر.",
        );
      }

      setItems(data.items ?? []);
      setPageCount(
        Math.max(1, data.pageCount ?? 1),
      );
    } catch (error) {
      if (
        currentRequest !== requestId.current
      ) {
        return;
      }

      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "تعذر تحميل نواقص العناصر.",
      });
    } finally {
      if (
        currentRequest === requestId.current
      ) {
        setLoading(false);
      }
    }
  }, [
    page,
    query,
    classification,
    mobility,
    syncStatus,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 250);

    return () =>
      window.clearTimeout(timer);
  }, [load]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      macro: items.filter(
        (item) =>
          item.classification ===
          "MACRONUTRIENT",
      ).length,
      micro: items.filter(
        (item) =>
          item.classification ===
          "MICRONUTRIENT",
      ).length,
      synced: items.filter(
        (item) =>
          (item.syncState?.status ??
            "PENDING") === "SYNCED",
      ).length,
    };
  }, [items]);

  function openCreate() {
    setForm(initialForm);
    setSelected(null);
    setEditing(true);
    setFeedback(null);
  }

  async function fetchDetails(
    item: DeficiencyItem,
  ) {
    setLoadingDetails(true);

    try {
      const response = await fetch(
        `/api/admin/deficiencies/${encodeURIComponent(
          item.id,
        )}`,
        {
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as
          | DeficiencyItem
          | {
              error?: string;
              message?: string;
            };

      if (!response.ok) {
        const errorData = data as {
          error?: string;
          message?: string;
        };

        throw new Error(
          errorData.message ||
            errorData.error ||
            "تعذر تحميل التفاصيل.",
        );
      }

      return data as DeficiencyItem;
    } finally {
      setLoadingDetails(false);
    }
  }

  async function openDetails(
    item: DeficiencyItem,
  ) {
    setFeedback(null);

    try {
      const fullItem =
        await fetchDetails(item);

      setSelected(fullItem);
      setForm(formFromItem(fullItem));
      setEditing(false);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "تعذر تحميل التفاصيل.",
      });
    }
  }

  async function openEdit(
    item: DeficiencyItem,
  ) {
    setFeedback(null);

    try {
      const fullItem =
        await fetchDetails(item);

      setSelected(fullItem);
      setForm(formFromItem(fullItem));
      setEditing(true);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "تعذر تحميل بيانات التعديل.",
      });
    }
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setSelected(null);
    setEditing(false);
  }

  function handleDeleted(
    deficiencyId: string,
  ) {
    setItems((current) =>
      current.filter(
        (item) => item.id !== deficiencyId,
      ),
    );

    setSelected((current) =>
      current?.id === deficiencyId
        ? null
        : current,
    );

    setFeedback({
      type: "success",
      message:
        "تم حذف نقص العنصر بنجاح.",
    });
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const slug = normalizeSlug(form.slug);

    if (
      !form.nutrientCode.trim() ||
      !form.nutrientNameAr.trim() ||
      !form.nutrientNameEn.trim()
    ) {
      setFeedback({
        type: "error",
        message:
          "كود العنصر والاسم العربي والاسم الإنجليزي مطلوبة.",
      });
      return;
    }

    if (!slug) {
      setFeedback({
        type: "error",
        message:
          "الرابط المختصر يجب أن يكون بالإنجليزية.",
      });
      return;
    }

    const payload = {
      nutrientCode:
        form.nutrientCode
          .trim()
          .toUpperCase(),
      nutrientNameAr:
        form.nutrientNameAr.trim(),
      nutrientNameEn:
        form.nutrientNameEn.trim(),
      slug,
      scientificName:
        form.scientificName.trim() ||
        null,
      classification:
        form.classification,
      mobility: form.mobility,
      description:
        form.description.trim() || null,
      aliases: csvToArray(form.aliases),
      visualPatterns: csvToArray(
        form.visualPatterns,
      ),
      causes: csvToArray(form.causes),
      aggravatingConditions: csvToArray(
        form.aggravatingConditions,
      ),
    };

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(
        selected
          ? `/api/admin/deficiencies/${selected.id}`
          : "/api/admin/deficiencies",
        {
          method: selected
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "تعذر حفظ نقص العنصر.",
        );
      }

      setSelected(null);
      setEditing(false);

      setFeedback({
        type: "success",
        message: selected
          ? "تم تعديل نقص العنصر بنجاح."
          : "تم إضافة نقص العنصر بنجاح.",
      });

      await load();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "تعذر حفظ نقص العنصر.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function retrySync(
    item: DeficiencyItem,
  ) {
    if (syncingId) {
      return;
    }

    setSyncingId(item.id);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/deficiencies/${item.id}/sync`,
        {
          method: "POST",
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "فشلت المزامنة.",
        );
      }

      setFeedback({
        type: "success",
        message:
          data?.message ||
          "تمت المزامنة بنجاح.",
      });

      await load();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "فشلت المزامنة.",
      });
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <main
      className="min-h-screen flex-1 bg-[#07140f] p-5 text-white lg:p-10"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-300">
              Doctor Knowledge Base
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              إدارة نواقص العناصر
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
              إدارة العناصر الغذائية وأعراض
              نقصها وحركتها داخل النبات وحالة
              مزامنتها مع قاعدة المعرفة.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-emerald-300 px-5 text-sm font-black text-[#082017]"
          >
            <Plus size={18} />
            إضافة نقص عنصر
          </button>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="المعروض حاليًا"
            value={stats.total}
          />
          <Metric
            label="عناصر كبرى"
            value={stats.macro}
          />
          <Metric
            label="عناصر صغرى"
            value={stats.micro}
          />
          <Metric
            label="تمت المزامنة"
            value={stats.synced}
          />
        </section>

        <section className="mt-7 rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_220px_220px]">
            <label className="relative block">
              <Search
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="ابحث بالعنصر أو العرض أو الاسم البديل"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pr-11 pl-4 outline-none"
              />
            </label>

            <select
              value={classification}
              onChange={(event) => {
                setClassification(
                  event.target.value,
                );
                setPage(1);
              }}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4"
            >
              <option value="">
                كل التصنيفات
              </option>

              {classifications.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {classificationLabels[value]}
                </option>
              ))}
            </select>

            <select
              value={mobility}
              onChange={(event) => {
                setMobility(event.target.value);
                setPage(1);
              }}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4"
            >
              <option value="">
                كل حالات الحركة
              </option>

              {mobilities.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {mobilityLabels[value]}
                </option>
              ))}
            </select>

            <select
              value={syncStatus}
              onChange={(event) => {
                setSyncStatus(
                  event.target.value,
                );
                setPage(1);
              }}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4"
            >
              <option value="">
                كل حالات المزامنة
              </option>

              {syncStatuses.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {syncLabels[value]}
                </option>
              ))}
            </select>
          </div>
        </section>

        {feedback ? (
          <div
            className={`mt-5 rounded-2xl border p-4 text-sm ${
              feedback.type === "success"
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                : "border-red-400/25 bg-red-400/10 text-red-100"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <section className="mt-7">
          {loading ? (
            <div className="grid min-h-64 place-items-center rounded-3xl border border-white/10 bg-[#0b2118]/90">
              <Loader2
                size={30}
                className="animate-spin text-emerald-300"
              />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#0b2118]/90 px-6 py-16 text-center">
              <FlaskConical
                size={38}
                className="mx-auto text-emerald-300"
              />

              <h2 className="mt-5 text-2xl font-black">
                لا توجد نواقص عناصر
              </h2>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((item) => {
                const syncValue =
                  item.syncState?.status ??
                  "PENDING";

                return (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-black">
                          {item.nutrientNameAr}
                        </h2>

                        <p className="mt-1 text-sm text-white/50">
                          {item.nutrientNameEn} ·{" "}
                          {item.nutrientCode}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs">
                          {classificationLabels[
                            item.classification
                          ] ??
                            item.classification}
                        </span>

                        <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs text-sky-200">
                          {mobilityLabels[
                            item.mobility
                          ] ?? item.mobility}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${getSyncClass(
                          syncValue,
                        )}`}
                      >
                        {syncLabels[syncValue] ??
                          syncValue}
                      </span>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void openDetails(item)
                          }
                          disabled={loadingDetails}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-[#082017]"
                        >
                          <Eye size={16} />
                          عرض
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void openEdit(item)
                          }
                          disabled={loadingDetails}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-400/[.08] px-4 text-sm font-black text-sky-200"
                        >
                          <Pencil size={16} />
                          تعديل
                        </button>

                        <DeleteDeficiencyButton
                          deficiencyId={item.id}
                          deficiencyName={
                            item.nutrientNameAr
                          }
                          onDeleted={
                            handleDeleted
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            void retrySync(item)
                          }
                          disabled={
                            syncingId === item.id
                          }
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold text-white/65 disabled:opacity-40"
                        >
                          <RefreshCcw
                            size={16}
                            className={
                              syncingId === item.id
                                ? "animate-spin"
                                : ""
                            }
                          />
                          مزامنة
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <nav className="mt-7 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0b2118]/90 p-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setPage((current) =>
                Math.max(1, current - 1),
              )
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-4 disabled:opacity-30"
          >
            <ChevronRight size={16} />
            السابق
          </button>

          <span className="text-sm text-white/50">
            الصفحة{" "}
            {page.toLocaleString("ar-EG")} من{" "}
            {pageCount.toLocaleString("ar-EG")}
          </span>

          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() =>
              setPage((current) =>
                Math.min(
                  pageCount,
                  current + 1,
                ),
              )
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-[#082017] disabled:opacity-30"
          >
            التالي
            <ChevronLeft size={16} />
          </button>
        </nav>

        {(editing || selected) ? (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
            <div className="mx-auto my-8 max-w-2xl rounded-3xl border border-white/10 bg-[#0b2118] p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-bold text-emerald-300">
                    {editing
                      ? selected
                        ? "تعديل نقص عنصر"
                        : "إضافة نقص عنصر"
                      : "تفاصيل نقص العنصر"}
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {editing
                      ? form.nutrientNameAr ||
                        "بيانات العنصر"
                      : selected?.nutrientNameAr}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {editing ? (
                <form
                  onSubmit={submit}
                  className="mt-6 grid gap-4"
                >
                  {[
                    [
                      "nutrientCode",
                      "كود العنصر *",
                    ],
                    [
                      "nutrientNameAr",
                      "الاسم العربي *",
                    ],
                    [
                      "nutrientNameEn",
                      "الاسم الإنجليزي *",
                    ],
                    [
                      "slug",
                      "الرابط المختصر *",
                    ],
                    [
                      "scientificName",
                      "الاسم العلمي",
                    ],
                  ].map(([key, label]) => (
                    <label key={key}>
                      <span className="mb-2 block text-sm font-bold text-white/70">
                        {label}
                      </span>

                      <input
                        value={
                          form[
                            key as keyof DeficiencyForm
                          ]
                        }
                        required={label.includes("*")}
                        disabled={saving}
                        dir={
                          key ===
                            "nutrientNameEn" ||
                          key === "slug" ||
                          key ===
                            "scientificName"
                            ? "ltr"
                            : "rtl"
                        }
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [key]:
                              key === "slug"
                                ? normalizeSlug(
                                    event.target
                                      .value,
                                  )
                                : event.target
                                    .value,
                          })
                        }
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none"
                      />
                    </label>
                  ))}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="التصنيف"
                      value={form.classification}
                      options={classifications}
                      labels={
                        classificationLabels
                      }
                      onChange={(value) =>
                        setForm({
                          ...form,
                          classification: value,
                        })
                      }
                    />

                    <SelectField
                      label="الحركة داخل النبات"
                      value={form.mobility}
                      options={mobilities}
                      labels={mobilityLabels}
                      onChange={(value) =>
                        setForm({
                          ...form,
                          mobility: value,
                        })
                      }
                    />
                  </div>

                  {[
                    [
                      "description",
                      "الوصف",
                    ],
                    [
                      "aliases",
                      "الأسماء البديلة",
                    ],
                    [
                      "visualPatterns",
                      "الأنماط البصرية",
                    ],
                    ["causes", "الأسباب"],
                    [
                      "aggravatingConditions",
                      "الظروف المساعدة",
                    ],
                  ].map(([key, label]) => (
                    <label key={key}>
                      <span className="mb-2 block text-sm font-bold text-white/70">
                        {label}
                      </span>

                      <textarea
                        rows={
                          key === "description"
                            ? 4
                            : 3
                        }
                        value={
                          form[
                            key as keyof DeficiencyForm
                          ]
                        }
                        disabled={saving}
                        placeholder={
                          key === "description"
                            ? "اكتب الوصف"
                            : "افصل بين القيم بفاصلة"
                        }
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [key]:
                              event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/[.04] p-4 leading-7 outline-none"
                      />
                    </label>
                  ))}

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 font-black text-[#082017] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Sparkles size={18} />
                    )}

                    {saving
                      ? "جاري الحفظ..."
                      : "حفظ نقص العنصر"}
                  </button>
                </form>
              ) : selected ? (
                <div className="mt-6 space-y-4">
                  <DetailRow
                    label="كود العنصر"
                    value={
                      selected.nutrientCode
                    }
                  />
                  <DetailRow
                    label="الاسم الإنجليزي"
                    value={
                      selected.nutrientNameEn
                    }
                  />
                  <DetailRow
                    label="التصنيف"
                    value={
                      classificationLabels[
                        selected.classification
                      ] ??
                      selected.classification
                    }
                  />
                  <DetailRow
                    label="الحركة"
                    value={
                      mobilityLabels[
                        selected.mobility
                      ] ?? selected.mobility
                    }
                  />
                  <DetailRow
                    label="الوصف"
                    value={
                      selected.description ??
                      "لا يوجد وصف."
                    }
                  />
                  <DetailRow
                    label="الأسماء البديلة"
                    value={
                      valuesToText(
                        selected.aliases,
                      ) ||
                      "لا توجد أسماء بديلة."
                    }
                  />
                  <DetailRow
                    label="الأنماط البصرية"
                    value={
                      valuesToText(
                        selected.visualPatterns,
                      ) ||
                      "لا توجد أنماط مسجلة."
                    }
                  />
                  <DetailRow
                    label="الأسباب"
                    value={
                      valuesToText(
                        selected.causes,
                      ) ||
                      "لا توجد أسباب مسجلة."
                    }
                  />
                  <DetailRow
                    label="الظروف المساعدة"
                    value={
                      valuesToText(
                        selected.aggravatingConditions,
                      ) ||
                      "لا توجد ظروف مسجلة."
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      void openEdit(selected)
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-400 px-5 text-sm font-black text-[#07140f]"
                  >
                    <Pencil size={17} />
                    تعديل نقص العنصر
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5">
      <p className="text-sm text-white/50">
        {label}
      </p>
      <strong className="mt-3 block text-3xl font-black">
        {value.toLocaleString("ar-EG")}
      </strong>
    </article>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
      <span className="block text-xs text-white/40">
        {label}
      </span>
      <p className="mt-2 leading-7 text-white/75">
        {value}
      </p>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  labels: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-white/70">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {labels[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}
