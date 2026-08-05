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
  Bug,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gauge,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import DeletePestButton from "@/components/admin/DeletePestButton";

type Pest = {
  id: string;
  classification: string;
  severity: string;
  economicImpact: string;
  scientificName: string | null;
  description?: string | null;
  entity: {
    name: string;
    slug: string;
    publicationState: string;
  };
  aliases?: { value: string }[];
  symptoms: { value: string }[];
  damagePatterns: { value: string }[];
  lifecycleStages: { value: string }[];
  syncState: { status: string } | null;
};

type PestForm = {
  name: string;
  slug: string;
  classification: string;
  severity: string;
  economicImpact: string;
  scientificName: string;
  description: string;
  aliases: string;
  symptoms: string;
  damagePatterns: string;
  lifecycleStages: string;
};

type Query = {
  page: number;
  q: string;
  classification: string;
  severity: string;
  impact: string;
  sync: string;
  sort: string;
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

const blank: PestForm = {
  name: "",
  slug: "",
  classification: "INSECT",
  severity: "MODERATE",
  economicImpact: "MODERATE",
  scientificName: "",
  description: "",
  aliases: "",
  symptoms: "",
  damagePatterns: "",
  lifecycleStages: "",
};

const classifications = [
  "INSECT",
  "MITE",
  "NEMATODE",
  "MOLLUSK",
  "RODENT",
  "OTHER",
] as const;

const severities = [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
] as const;

const impacts = [
  "LOW",
  "MODERATE",
  "HIGH",
  "SEVERE",
] as const;

const syncStates = [
  "PENDING",
  "SYNCED",
  "FAILED",
] as const;

const classificationLabels: Record<string, string> = {
  INSECT: "حشرة",
  MITE: "أكاروس",
  NEMATODE: "نيماتودا",
  MOLLUSK: "رخوي",
  RODENT: "قارض",
  OTHER: "أخرى",
};

const severityLabels: Record<string, string> = {
  LOW: "منخفض",
  MODERATE: "متوسط",
  HIGH: "مرتفع",
  CRITICAL: "حرج",
};

const impactLabels: Record<string, string> = {
  LOW: "منخفض",
  MODERATE: "متوسط",
  HIGH: "مرتفع",
  SEVERE: "شديد",
};

const syncLabels: Record<string, string> = {
  PENDING: "في انتظار المزامنة",
  SYNCED: "تمت المزامنة",
  FAILED: "فشلت المزامنة",
};

const arrayFields = new Set<keyof PestForm>([
  "aliases",
  "symptoms",
  "damagePatterns",
  "lifecycleStages",
]);

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

function buildSearchParams(query: Query) {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: "12",
    sort: query.sort,
    direction: "desc",
  });

  const filters = {
    q: query.q,
    classification: query.classification,
    severity: query.severity,
    economicImpact: query.impact,
    syncStatus: query.sync,
  };

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

function usePestResults(query: Query) {
  const [items, setItems] = useState<Pest[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = ++requestId.current;

    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/admin/pests?${buildSearchParams(query)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const data = await response.json();

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
              "تعذر تحميل الآفات.",
          );
          return;
        }

        setItems(data.items ?? []);
        setPageCount(
          Math.max(1, data.pageCount ?? 1),
        );
        setError("");
      } catch (error) {
        if (
          controller.signal.aborted ||
          currentRequest !== requestId.current
        ) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "تعذر تحميل الآفات.",
        );
      } finally {
        if (
          !controller.signal.aborted &&
          currentRequest === requestId.current
        ) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, reloadToken]);

  const reload = useCallback(
    () =>
      setReloadToken((token) => token + 1),
    [],
  );

  return {
    items,
    setItems,
    pageCount,
    error,
    loading,
    reload,
  };
}

function formForPest(pest: Pest): PestForm {
  return {
    name: pest.entity.name,
    slug: pest.entity.slug,
    classification: pest.classification,
    severity: pest.severity,
    economicImpact: pest.economicImpact,
    scientificName:
      pest.scientificName ?? "",
    description: pest.description ?? "",
    aliases: (pest.aliases ?? [])
      .map((value) => value.value)
      .join(", "),
    symptoms: pest.symptoms
      .map((value) => value.value)
      .join(", "),
    damagePatterns: pest.damagePatterns
      .map((value) => value.value)
      .join(", "),
    lifecycleStages: pest.lifecycleStages
      .map((value) => value.value)
      .join(", "),
  };
}

function getSeverityClass(value: string) {
  switch (value) {
    case "CRITICAL":
      return "border-red-400/25 bg-red-400/10 text-red-200";
    case "HIGH":
      return "border-orange-400/25 bg-orange-400/10 text-orange-200";
    case "MODERATE":
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
    default:
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  }
}

function getImpactClass(value: string) {
  switch (value) {
    case "SEVERE":
      return "border-red-400/25 bg-red-400/10 text-red-200";
    case "HIGH":
      return "border-orange-400/25 bg-orange-400/10 text-orange-200";
    case "MODERATE":
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

export default function PestManager() {
  const [query, setQuery] = useState<Query>({
    page: 1,
    q: "",
    classification: "",
    severity: "",
    impact: "",
    sync: "",
    sort: "updatedAt",
  });

  const [form, setForm] =
    useState<PestForm>(blank);

  const [selected, setSelected] =
    useState<Pest | null>(null);

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [syncingId, setSyncingId] =
    useState<string | null>(null);

  const [feedback, setFeedback] =
    useState<Feedback>(null);

  const {
    items,
    setItems,
    pageCount,
    error,
    loading,
    reload,
  } = usePestResults(query);

  const page = query.page;

  const stats = useMemo(() => {
    const total = items.length;
    const critical = items.filter(
      (item) => item.severity === "CRITICAL",
    ).length;
    const severeImpact = items.filter(
      (item) =>
        item.economicImpact === "SEVERE",
    ).length;
    const synced = items.filter(
      (item) =>
        (item.syncState?.status ??
          "PENDING") === "SYNCED",
    ).length;

    return {
      total,
      critical,
      severeImpact,
      synced,
    };
  }, [items]);

  function updateQuery(
    update: Partial<Query>,
    resetPage = false,
  ) {
    setQuery((current) => ({
      ...current,
      ...update,
      page: resetPage
        ? 1
        : update.page ?? current.page,
    }));
  }

  function openNewPest() {
    setForm(blank);
    setSelected(null);
    setEditing(true);
    setFeedback(null);
  }

  function openDetails(pest: Pest) {
    setSelected(pest);
    setForm(formForPest(pest));
    setEditing(false);
    setFeedback(null);
  }

  function openEdit(pest: Pest) {
    setSelected(pest);
    setForm(formForPest(pest));
    setEditing(true);
    setFeedback(null);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setSelected(null);
    setEditing(false);
  }

  function handlePestDeleted(pestId: string) {
    setItems((current) =>
      current.filter(
        (pest) => pest.id !== pestId,
      ),
    );

    setSelected((current) =>
      current?.id === pestId ? null : current,
    );

    setFeedback({
      type: "success",
      message: "تم حذف الآفة بنجاح.",
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

    if (!form.name.trim()) {
      setFeedback({
        type: "error",
        message: "اسم الآفة مطلوب.",
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

    const payload = Object.fromEntries(
      Object.entries({
        ...form,
        slug,
      }).map(([key, value]) => [
        key,
        arrayFields.has(key as keyof PestForm)
          ? String(value)
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean)
          : value,
      ]),
    );

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(
        selected
          ? `/api/admin/pests/${selected.id}`
          : "/api/admin/pests",
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            data.error ??
            "تعذر حفظ الآفة.",
        );
      }

      setEditing(false);
      setSelected(null);

      setFeedback({
        type: "success",
        message: selected
          ? "تم تعديل الآفة بنجاح."
          : "تم إضافة الآفة بنجاح.",
      });

      await reload();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "تعذر حفظ الآفة.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function retry(pest: Pest) {
    if (syncingId) {
      return;
    }

    setSyncingId(pest.id);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/pests/${pest.id}/sync`,
        {
          method: "POST",
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ??
            data?.error ??
            "فشلت مزامنة قاعدة المعرفة.",
        );
      }

      setFeedback({
        type: "success",
        message:
          data?.message ??
          "تمت مزامنة الآفة بنجاح.",
      });

      await reload();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "فشلت مزامنة قاعدة المعرفة.",
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
              إدارة الآفات
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
              إدارة الآفات الزراعية وتصنيفاتها
              ودرجات الخطورة والتأثير الاقتصادي
              والأعراض وأنماط الضرر ودورة الحياة.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewPest}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-emerald-300 px-5 text-sm font-black text-[#082017] transition hover:bg-emerald-200"
          >
            <Plus size={18} />
            إضافة آفة
          </button>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={Bug}
            label="المعروض حاليًا"
            value={stats.total}
          />
          <Metric
            icon={ShieldAlert}
            label="خطورة حرجة"
            value={stats.critical}
          />
          <Metric
            icon={Gauge}
            label="تأثير اقتصادي شديد"
            value={stats.severeImpact}
          />
          <Metric
            icon={CheckCircle2}
            label="تمت المزامنة"
            value={stats.synced}
          />
        </section>

        <section className="mt-7 rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5 shadow-2xl">
          <div className="grid gap-3 xl:grid-cols-[minmax(250px,1fr)_180px_170px_170px_190px_190px]">
            <label className="relative block">
              <Search
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                value={query.q}
                onChange={(event) =>
                  updateQuery(
                    {
                      q: event.target.value,
                    },
                    true,
                  )
                }
                placeholder="ابحث بالاسم أو العرض أو الضرر"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pr-11 pl-4 outline-none placeholder:text-white/25 focus:border-emerald-300"
              />
            </label>

            <select
              value={query.classification}
              onChange={(event) =>
                updateQuery(
                  {
                    classification:
                      event.target.value,
                  },
                  true,
                )
              }
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
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
              value={query.severity}
              onChange={(event) =>
                updateQuery(
                  {
                    severity:
                      event.target.value,
                  },
                  true,
                )
              }
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
            >
              <option value="">
                كل الخطورة
              </option>

              {severities.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {severityLabels[value]}
                </option>
              ))}
            </select>

            <select
              value={query.impact}
              onChange={(event) =>
                updateQuery(
                  {
                    impact:
                      event.target.value,
                  },
                  true,
                )
              }
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
            >
              <option value="">
                كل التأثيرات
              </option>

              {impacts.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {impactLabels[value]}
                </option>
              ))}
            </select>

            <select
              value={query.sync}
              onChange={(event) =>
                updateQuery(
                  {
                    sync:
                      event.target.value,
                  },
                  true,
                )
              }
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
            >
              <option value="">
                كل حالات المزامنة
              </option>

              {syncStates.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {syncLabels[value]}
                </option>
              ))}
            </select>

            <select
              value={query.sort}
              onChange={(event) =>
                updateQuery({
                  sort: event.target.value,
                })
              }
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
            >
              <option value="updatedAt">
                الأحدث تعديلًا
              </option>
              <option value="createdAt">
                الأحدث إنشاءً
              </option>
              <option value="name">
                الاسم
              </option>
            </select>
          </div>
        </section>

        {(feedback || error) ? (
          <div
            role={
              feedback?.type === "error" || error
                ? "alert"
                : "status"
            }
            className={`mt-5 rounded-2xl border p-4 text-sm ${
              feedback?.type === "success" &&
              !error
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                : "border-red-400/25 bg-red-400/10 text-red-100"
            }`}
          >
            {error || feedback?.message}
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
              <Bug
                size={38}
                className="mx-auto text-emerald-300"
              />

              <h2 className="mt-5 text-2xl font-black">
                لا توجد آفات
              </h2>

              <p className="mt-3 text-white/50">
                لا توجد نتائج مطابقة للفلاتر
                الحالية.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((pest) => {
                const syncValue =
                  pest.syncState?.status ??
                  "PENDING";

                return (
                  <article
                    key={pest.id}
                    className="rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5 shadow-xl"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-black">
                          {pest.entity.name}
                        </h2>

                        {pest.scientificName ? (
                          <p
                            className="mt-1 truncate text-sm italic text-white/40"
                            dir="ltr"
                          >
                            {pest.scientificName}
                          </p>
                        ) : null}

                        <p
                          className="mt-2 text-xs text-emerald-300"
                          dir="ltr"
                        >
                          /{pest.entity.slug}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-bold text-white/60">
                          {classificationLabels[
                            pest.classification
                          ] ??
                            pest.classification}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getSeverityClass(
                            pest.severity,
                          )}`}
                        >
                          {severityLabels[
                            pest.severity
                          ] ?? pest.severity}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getImpactClass(
                            pest.economicImpact,
                          )}`}
                        >
                          تأثير{" "}
                          {impactLabels[
                            pest.economicImpact
                          ] ??
                            pest.economicImpact}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <MiniStat
                        label="الأعراض"
                        value={pest.symptoms.length}
                      />
                      <MiniStat
                        label="أنماط الضرر"
                        value={
                          pest.damagePatterns.length
                        }
                      />
                      <MiniStat
                        label="مراحل الحياة"
                        value={
                          pest.lifecycleStages.length
                        }
                      />
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
                            openDetails(pest)
                          }
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-[#082017]"
                        >
                          <Eye size={16} />
                          عرض
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(pest)
                          }
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-400/[.08] px-4 text-sm font-black text-sky-200"
                        >
                          <Pencil size={16} />
                          تعديل
                        </button>

                        <DeletePestButton
                          pestId={pest.id}
                          pestName={pest.entity.name}
                          onDeleted={
                            handlePestDeleted
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            void retry(pest)
                          }
                          disabled={
                            syncingId === pest.id
                          }
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold text-white/65 disabled:opacity-40"
                        >
                          <RefreshCcw
                            size={16}
                            className={
                              syncingId === pest.id
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
            disabled={page <= 1 || loading}
            onClick={() =>
              updateQuery({
                page: Math.max(1, page - 1),
              })
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold disabled:opacity-30"
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
            disabled={
              page >= pageCount || loading
            }
            onClick={() =>
              updateQuery({
                page: Math.min(
                  pageCount,
                  page + 1,
                ),
              })
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-[#082017] disabled:opacity-30"
          >
            التالي
            <ChevronLeft size={16} />
          </button>
        </nav>

        {(editing || selected) ? (
          <div
            className="fixed inset-0 z-[100] overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto my-8 max-w-2xl rounded-3xl border border-white/10 bg-[#0b2118] p-5 shadow-2xl sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-bold text-emerald-300">
                    {editing
                      ? selected
                        ? "تعديل آفة"
                        : "إضافة آفة"
                      : "تفاصيل الآفة"}
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {editing
                      ? form.name || "بيانات الآفة"
                      : selected?.entity.name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/55"
                  aria-label="إغلاق"
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
                    ["name", "اسم الآفة *"],
                    ["slug", "الرابط المختصر *"],
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
                        required={
                          key === "name" ||
                          key === "slug"
                        }
                        dir={
                          key === "slug" ||
                          key === "scientificName"
                            ? "ltr"
                            : "rtl"
                        }
                        value={
                          form[
                            key as keyof PestForm
                          ]
                        }
                        disabled={saving}
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
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none focus:border-emerald-300"
                      />
                    </label>
                  ))}

                  <div className="grid gap-4 sm:grid-cols-3">
                    <SelectField
                      label="التصنيف"
                      value={form.classification}
                      options={classifications}
                      labels={
                        classificationLabels
                      }
                      disabled={saving}
                      onChange={(value) =>
                        setForm({
                          ...form,
                          classification: value,
                        })
                      }
                    />

                    <SelectField
                      label="الخطورة"
                      value={form.severity}
                      options={severities}
                      labels={severityLabels}
                      disabled={saving}
                      onChange={(value) =>
                        setForm({
                          ...form,
                          severity: value,
                        })
                      }
                    />

                    <SelectField
                      label="التأثير الاقتصادي"
                      value={form.economicImpact}
                      options={impacts}
                      labels={impactLabels}
                      disabled={saving}
                      onChange={(value) =>
                        setForm({
                          ...form,
                          economicImpact: value,
                        })
                      }
                    />
                  </div>

                  {[
                    [
                      "description",
                      "الوصف",
                      "اكتب وصفًا للآفة",
                    ],
                    [
                      "aliases",
                      "الأسماء البديلة",
                      "افصل بين القيم بفاصلة",
                    ],
                    [
                      "symptoms",
                      "الأعراض",
                      "افصل بين القيم بفاصلة",
                    ],
                    [
                      "damagePatterns",
                      "أنماط الضرر",
                      "افصل بين القيم بفاصلة",
                    ],
                    [
                      "lifecycleStages",
                      "مراحل دورة الحياة",
                      "افصل بين المراحل بفاصلة",
                    ],
                  ].map(
                    ([key, label, placeholder]) => (
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
                              key as keyof PestForm
                            ]
                          }
                          disabled={saving}
                          placeholder={placeholder}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              [key]:
                                event.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/[.04] p-4 leading-7 outline-none focus:border-emerald-300"
                        />
                      </label>
                    ),
                  )}

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
                      : "حفظ الآفة"}
                  </button>
                </form>
              ) : selected ? (
                <div className="mt-6 space-y-4">
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
                    label="درجة الخطورة"
                    value={
                      severityLabels[
                        selected.severity
                      ] ?? selected.severity
                    }
                  />

                  <DetailRow
                    label="التأثير الاقتصادي"
                    value={
                      impactLabels[
                        selected.economicImpact
                      ] ??
                      selected.economicImpact
                    }
                  />

                  <DetailRow
                    label="الاسم العلمي"
                    value={
                      selected.scientificName ??
                      "غير مسجل"
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
                    label="الأعراض"
                    value={
                      selected.symptoms.length > 0
                        ? selected.symptoms
                            .map(
                              (item) =>
                                item.value,
                            )
                            .join("، ")
                        : "لا توجد أعراض."
                    }
                  />

                  <DetailRow
                    label="أنماط الضرر"
                    value={
                      selected.damagePatterns
                        .length > 0
                        ? selected.damagePatterns
                            .map(
                              (item) =>
                                item.value,
                            )
                            .join("، ")
                        : "لا توجد أنماط ضرر."
                    }
                  />

                  <DetailRow
                    label="مراحل دورة الحياة"
                    value={
                      selected.lifecycleStages
                        .length > 0
                        ? selected.lifecycleStages
                            .map(
                              (item) =>
                                item.value,
                            )
                            .join(" ← ")
                        : "لا توجد مراحل مسجلة."
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      openEdit(selected)
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 text-sm font-black text-[#07140f]"
                  >
                    <Pencil size={17} />
                    تعديل الآفة
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
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bug;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5 shadow-xl">
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
          <Icon size={21} />
        </div>
      </div>
    </article>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <span className="text-xs text-white/40">
        {label}
      </span>

      <strong className="mt-2 block text-xl text-emerald-300">
        {value.toLocaleString("ar-EG")}
      </strong>
    </div>
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
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  labels: Record<string, string>;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-white/70">
        {label}
      </span>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
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
