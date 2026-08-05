"use client";

import DeleteDiseaseButton from "@/components/admin/DeleteDiseaseButton";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  ChevronLeft,
  Eye,
  ChevronRight,
  FlaskConical,
  Loader2,
  Microscope,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
  Stethoscope,
  X,
} from "lucide-react";

type Disease = {
  id: string;
  classification: string;
  severity: string;
  scientificName: string | null;
  entity: {
    name: string;
    slug: string;
  };
  symptoms: {
    value: string;
  }[];
  syncState: {
    status: string;
  } | null;
};

type ApiListResponse = {
  items?: Disease[];
  pageCount?: number;
  error?: string;
  message?: string;
};

type ApiMutationResponse = Disease & {
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

const CLASSIFICATIONS = [
  "FUNGAL",
  "BACTERIAL",
  "VIRAL",
  "OOMYCETE",
  "PHYSIOLOGICAL_DISORDER",
] as const;

const SEVERITIES = [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
] as const;

const SYNC_STATUSES = [
  "PENDING",
  "SYNCED",
  "FAILED",
] as const;

const SORT_OPTIONS = [
  {
    value: "updatedAt",
    label: "الأحدث تعديلًا",
  },
  {
    value: "createdAt",
    label: "الأحدث إنشاءً",
  },
  {
    value: "name",
    label: "الاسم",
  },
] as const;

const classificationLabels: Record<string, string> = {
  FUNGAL: "فطري",
  BACTERIAL: "بكتيري",
  VIRAL: "فيروسي",
  OOMYCETE: "أوميستي",
  PHYSIOLOGICAL_DISORDER: "اضطراب فسيولوجي",
};

const severityLabels: Record<string, string> = {
  LOW: "منخفض",
  MODERATE: "متوسط",
  HIGH: "مرتفع",
  CRITICAL: "حرج",
};

const syncLabels: Record<string, string> = {
  PENDING: "في انتظار المزامنة",
  SYNCED: "تمت المزامنة",
  FAILED: "فشلت المزامنة",
};

const blankForm = {
  name: "",
  slug: "",
  classification: "FUNGAL",
  severity: "MODERATE",
  scientificName: "",
  aliases: "",
  symptoms: "",
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06ff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
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

export default function DiseaseManager() {
  const [items, setItems] = useState<Disease[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [q, setQ] = useState("");
  const [classification, setClassification] =
    useState("");
  const [severity, setSeverity] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [sort, setSort] = useState("updatedAt");

  const [form, setForm] = useState(blankForm);
  const [selected, setSelected] =
    useState<Disease | null>(null);
  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] =
    useState<string | null>(null);
  const [feedback, setFeedback] =
    useState<Feedback>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "12",
        sort,
        direction: "desc",
      });

      if (q.trim()) {
        params.set("q", q.trim());
      }

      if (classification) {
        params.set(
          "classification",
          classification,
        );
      }

      if (severity) {
        params.set("severity", severity);
      }

      if (syncStatus) {
        params.set(
          "syncStatus",
          syncStatus,
        );
      }

      const response = await fetch(
        `/api/admin/diseases?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as ApiListResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "تعذر تحميل الأمراض.",
        );
      }

      setItems(data.items ?? []);
      setPages(
        Math.max(1, data.pageCount ?? 1),
      );
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "تعذر تحميل الأمراض.",
      });
    } finally {
      setLoading(false);
    }
  }, [
    page,
    q,
    classification,
    severity,
    syncStatus,
    sort,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [load]);

  const stats = useMemo(() => {
    const total = items.length;
    const critical = items.filter(
      (item) => item.severity === "CRITICAL",
    ).length;
    const failedSync = items.filter(
      (item) =>
        (item.syncState?.status ?? "PENDING") ===
        "FAILED",
    ).length;
    const synced = items.filter(
      (item) =>
        (item.syncState?.status ?? "PENDING") ===
        "SYNCED",
    ).length;

    return {
      total,
      critical,
      failedSync,
      synced,
    };
  }, [items]);

  function openCreate() {
    setForm(blankForm);
    setSelected(null);
    setEditing(true);
    setFeedback(null);
  }

  function openDetails(disease: Disease) {
    setSelected(disease);
    setEditing(false);
    setFeedback(null);
  }

  function openEdit(disease: Disease) {
    setSelected(disease);
    setForm({
      name: disease.entity.name,
      slug: disease.entity.slug,
      classification:
        disease.classification,
      severity: disease.severity,
      scientificName:
        disease.scientificName ?? "",
      aliases: "",
      symptoms: disease.symptoms
        .map((symptom) => symptom.value)
        .join(", "),
    });
    setEditing(true);
    setFeedback(null);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      slug: normalizeSlug(form.slug),
      scientificName:
        form.scientificName.trim() || null,
      aliases: form.aliases
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      symptoms: form.symptoms
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };

    if (!payload.name) {
      setFeedback({
        type: "error",
        message: "اسم المرض مطلوب.",
      });
      return;
    }

    if (!payload.slug) {
      setFeedback({
        type: "error",
        message:
          "الرابط المختصر مطلوب.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(
        selected
          ? `/api/admin/diseases/${selected.id}`
          : "/api/admin/diseases",
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

      const data =
        (await response.json()) as ApiMutationResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "تعذر حفظ المرض.",
        );
      }

      setEditing(false);
      setSelected(null);

      setFeedback({
        type: "success",
        message: selected
          ? "تم تعديل المرض بنجاح."
          : "تم إضافة المرض بنجاح.",
      });

      await load();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "تعذر حفظ المرض.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function retrySync(
    disease: Disease,
  ) {
    if (syncingId) {
      return;
    }

    setSyncingId(disease.id);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/diseases/${disease.id}/sync`,
        {
          method: "POST",
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as
        | {
            message?: string;
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "فشلت مزامنة قاعدة المعرفة.",
        );
      }

      setFeedback({
        type: "success",
        message:
          data?.message ||
          "تمت مزامنة المرض بنجاح.",
      });

      await load();
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

  function handleDiseaseDeleted(
    diseaseId: string,
  ) {
    setItems((current) =>
      current.filter(
        (disease) => disease.id !== diseaseId,
      ),
    );

    setSelected((current) =>
      current?.id === diseaseId
        ? null
        : current,
    );

    setFeedback({
      type: "success",
      message: "تم حذف المرض بنجاح.",
    });
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setSelected(null);
    setEditing(false);
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
              إدارة الأمراض
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
              إدارة الأمراض الزراعية وتصنيفاتها
              ودرجات الخطورة والأعراض وحالة
              مزامنتها مع قاعدة المعرفة.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-emerald-300 px-5 text-sm font-black text-[#082017] transition hover:bg-emerald-200"
          >
            <Plus
              aria-hidden="true"
              size={18}
            />
            إضافة مرض
          </button>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={Stethoscope}
            label="المعروض حاليًا"
            value={stats.total}
          />
          <Metric
            icon={ShieldAlert}
            label="خطورة حرجة"
            value={stats.critical}
          />
          <Metric
            icon={CheckCircle2}
            label="تمت المزامنة"
            value={stats.synced}
          />
          <Metric
            icon={AlertCircle}
            label="فشل المزامنة"
            value={stats.failedSync}
          />
        </section>

        <section className="mt-7 rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5 shadow-2xl">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_210px_180px_190px_190px]">
            <label className="relative block">
              <Search
                aria-hidden="true"
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setPage(1);
                }}
                placeholder="ابحث بالاسم أو العرض أو الاسم البديل"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pr-11 pl-4 outline-none placeholder:text-white/25 focus:border-emerald-300"
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
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
            >
              <option value="">
                كل التصنيفات
              </option>

              {CLASSIFICATIONS.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {classificationLabels[value]}
                </option>
              ))}
            </select>

            <select
              value={severity}
              onChange={(event) => {
                setSeverity(event.target.value);
                setPage(1);
              }}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
            >
              <option value="">
                كل درجات الخطورة
              </option>

              {SEVERITIES.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {severityLabels[value]}
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
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
            >
              <option value="">
                كل حالات المزامنة
              </option>

              {SYNC_STATUSES.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {syncLabels[value]}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {feedback ? (
          <div
            role={
              feedback.type === "error"
                ? "alert"
                : "status"
            }
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
                aria-hidden="true"
                size={30}
                className="animate-spin text-emerald-300"
              />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#0b2118]/90 px-6 py-16 text-center">
              <Microscope
                aria-hidden="true"
                size={38}
                className="mx-auto text-emerald-300"
              />

              <h2 className="mt-5 text-2xl font-black">
                لا توجد أمراض
              </h2>

              <p className="mt-3 text-white/50">
                لا توجد نتائج مطابقة للفلاتر
                الحالية.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((disease) => {
                const syncValue =
                  disease.syncState?.status ??
                  "PENDING";

                return (
                  <article
                    key={disease.id}
                    className="rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5 shadow-xl"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          openDetails(disease)
                        }
                        className="min-w-0 text-right"
                      >
                        <h2 className="truncate text-xl font-black transition hover:text-emerald-300">
                          {disease.entity.name}
                        </h2>

                        {disease.scientificName ? (
                          <p
                            className="mt-1 truncate text-sm italic text-white/40"
                            dir="ltr"
                          >
                            {disease.scientificName}
                          </p>
                        ) : null}

                        <p
                          className="mt-2 text-xs text-emerald-300"
                          dir="ltr"
                        >
                          /{disease.entity.slug}
                        </p>
                      </button>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-bold text-white/60">
                          {classificationLabels[
                            disease.classification
                          ] ??
                            disease.classification}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getSeverityClass(
                            disease.severity,
                          )}`}
                        >
                          {severityLabels[
                            disease.severity
                          ] ?? disease.severity}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-white/40">
                          الأعراض المسجلة
                        </span>

                        <strong className="text-sm text-emerald-300">
                          {disease.symptoms.length.toLocaleString(
                            "ar-EG",
                          )}
                        </strong>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-7 text-white/55">
                        {disease.symptoms.length > 0
                          ? disease.symptoms
                              .slice(0, 4)
                              .map(
                                (symptom) =>
                                  symptom.value,
                              )
                              .join("، ")
                          : "لا توجد أعراض مسجلة."}
                      </p>
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
                            openDetails(disease)
                          }
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-[#082017]"
                        >
                          <Eye
                            aria-hidden="true"
                            size={16}
                          />
                          عرض
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(disease)
                          }
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-400/[.08] px-4 text-sm font-black text-sky-200"
                        >
                          <Pencil
                            aria-hidden="true"
                            size={16}
                          />
                          تعديل
                        </button>

                        <DeleteDiseaseButton
                          diseaseId={disease.id}
                          diseaseName={disease.entity.name}
                          onDeleted={handleDiseaseDeleted}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            void retrySync(disease)
                          }
                          disabled={
                            syncingId === disease.id
                          }
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold text-white/65 disabled:opacity-40"
                        >
                          <RefreshCcw
                            aria-hidden="true"
                            size={16}
                            className={
                              syncingId === disease.id
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
              setPage((current) =>
                Math.max(1, current - 1),
              )
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold disabled:opacity-30"
          >
            <ChevronRight
              aria-hidden="true"
              size={16}
            />
            السابق
          </button>

          <span className="text-sm text-white/50">
            الصفحة{" "}
            {page.toLocaleString("ar-EG")} من{" "}
            {pages.toLocaleString("ar-EG")}
          </span>

          <button
            type="button"
            disabled={page >= pages || loading}
            onClick={() =>
              setPage((current) =>
                Math.min(pages, current + 1),
              )
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-[#082017] disabled:opacity-30"
          >
            التالي
            <ChevronLeft
              aria-hidden="true"
              size={16}
            />
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
                        ? "تعديل مرض"
                        : "إضافة مرض"
                      : "تفاصيل المرض"}
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {editing
                      ? form.name ||
                        "بيانات المرض"
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
                  <X
                    aria-hidden="true"
                    size={18}
                  />
                </button>
              </div>

              {editing ? (
                <form
                  onSubmit={submit}
                  className="mt-6 grid gap-4"
                >
                  <label>
                    <span className="mb-2 block text-sm font-bold text-white/70">
                      اسم المرض *
                    </span>

                    <input
                      required
                      value={form.name}
                      disabled={saving}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          name: event.target.value,
                        })
                      }
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none focus:border-emerald-300"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-white/70">
                      الرابط المختصر *
                    </span>

                    <input
                      required
                      dir="ltr"
                      value={form.slug}
                      disabled={saving}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          slug: normalizeSlug(
                            event.target.value,
                          ),
                        })
                      }
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left outline-none focus:border-emerald-300"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm font-bold text-white/70">
                        التصنيف
                      </span>

                      <select
                        value={
                          form.classification
                        }
                        disabled={saving}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            classification:
                              event.target.value,
                          })
                        }
                        className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
                      >
                        {CLASSIFICATIONS.map(
                          (value) => (
                            <option
                              key={value}
                              value={value}
                            >
                              {
                                classificationLabels[
                                  value
                                ]
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 block text-sm font-bold text-white/70">
                        الخطورة
                      </span>

                      <select
                        value={form.severity}
                        disabled={saving}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            severity:
                              event.target.value,
                          })
                        }
                        className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
                      >
                        {SEVERITIES.map(
                          (value) => (
                            <option
                              key={value}
                              value={value}
                            >
                              {severityLabels[value]}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  </div>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-white/70">
                      الاسم العلمي
                    </span>

                    <input
                      dir="ltr"
                      value={
                        form.scientificName
                      }
                      disabled={saving}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          scientificName:
                            event.target.value,
                        })
                      }
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left italic outline-none focus:border-emerald-300"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-white/70">
                      الأسماء البديلة
                    </span>

                    <textarea
                      rows={3}
                      value={form.aliases}
                      disabled={saving}
                      placeholder="افصل بين الأسماء بفاصلة"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          aliases:
                            event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[.04] p-4 leading-7 outline-none focus:border-emerald-300"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-white/70">
                      الأعراض
                    </span>

                    <textarea
                      rows={4}
                      value={form.symptoms}
                      disabled={saving}
                      placeholder="افصل بين الأعراض بفاصلة"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          symptoms:
                            event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[.04] p-4 leading-7 outline-none focus:border-emerald-300"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 font-black text-[#082017] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2
                        aria-hidden="true"
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <FlaskConical
                        aria-hidden="true"
                        size={18}
                      />
                    )}

                    {saving
                      ? "جاري الحفظ..."
                      : "حفظ المرض"}
                  </button>
                </form>
              ) : selected ? (
                <div className="mt-6 space-y-5">
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
                    label="الاسم العلمي"
                    value={
                      selected.scientificName ??
                      "غير مسجل"
                    }
                  />

                  <DetailRow
                    label="الأعراض"
                    value={
                      selected.symptoms.length > 0
                        ? selected.symptoms
                            .map(
                              (symptom) =>
                                symptom.value,
                            )
                            .join("، ")
                        : "لا توجد أعراض مسجلة."
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      openEdit(selected)
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 text-sm font-black text-[#07140f]"
                  >
                    <Pencil
                      aria-hidden="true"
                      size={17}
                    />
                    تعديل المرض
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
          <Icon
            aria-hidden="true"
            size={21}
          />
        </div>
      </div>
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
