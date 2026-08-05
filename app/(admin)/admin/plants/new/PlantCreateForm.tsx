"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Leaf,
  Loader2,
  Plus,
  Save,
  Tags,
  Trash2,
} from "lucide-react";

const PLANT_CATEGORIES = [
  {
    value: "CROP",
    label: "محصول زراعي",
  },
  {
    value: "HOME_PLANT",
    label: "نبات منزلي",
  },
  {
    value: "ORNAMENTAL",
    label: "نبات زينة",
  },
] as const;

const PUBLICATION_STATES = [
  {
    value: "DRAFT",
    label: "مسودة",
  },
  {
    value: "PUBLISHED",
    label: "منشور",
  },
  {
    value: "ARCHIVED",
    label: "مؤرشف",
  },
] as const;

type PlantCategory =
  (typeof PLANT_CATEGORIES)[number]["value"];

type PublicationState =
  (typeof PUBLICATION_STATES)[number]["value"];

type FormState = {
  name: string;
  slug: string;
  category: PlantCategory;
  scientificName: string;
  description: string;
  publicationState: PublicationState;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  plant?: {
    id?: string;
  };
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

const INITIAL_FORM: FormState = {
  name: "",
  slug: "",
  category: "CROP",
  scientificName: "",
  description: "",
  publicationState: "DRAFT",
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

function getErrorMessage(
  body: ApiResponse | null,
  status: number,
) {
  if (body?.message?.trim()) {
    return body.message.trim();
  }

  if (body?.error?.trim()) {
    return body.error.trim();
  }

  if (status === 400) {
    return "راجع بيانات النبات وتأكد من صحة الحقول.";
  }

  if (status === 401) {
    return "انتهت جلسة تسجيل الدخول.";
  }

  if (status === 403) {
    return "ليس لديك صلاحية لإضافة نباتات.";
  }

  if (status === 409) {
    return "يوجد نبات بنفس الرابط المختصر.";
  }

  if (status >= 500) {
    return "حدث خطأ في الخادم أثناء حفظ النبات.";
  }

  return "تعذر حفظ النبات.";
}

export default function PlantCreateForm() {
  const router = useRouter();

  const [form, setForm] =
    useState<FormState>(INITIAL_FORM);

  const [aliases, setAliases] = useState<string[]>([
    "",
  ]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] =
    useState<Feedback>(null);

  const cleanedAliases = useMemo(
    () =>
      aliases
        .map((alias) => alias.trim())
        .filter(Boolean),
    [aliases],
  );

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFeedback(null);
  }

  function updateAlias(
    index: number,
    value: string,
  ) {
    setAliases((current) =>
      current.map((alias, aliasIndex) =>
        aliasIndex === index ? value : alias,
      ),
    );

    setFeedback(null);
  }

  function addAlias() {
    setAliases((current) => [...current, ""]);
  }

  function removeAlias(index: number) {
    setAliases((current) => {
      if (current.length === 1) {
        return [""];
      }

      return current.filter(
        (_, aliasIndex) => aliasIndex !== index,
      );
    });
  }

  async function submitPlant(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const name = form.name.trim();
    const slug = normalizeSlug(form.slug);
    const scientificName =
      form.scientificName.trim();
    const description =
      form.description.trim();

    if (!name) {
      setFeedback({
        type: "error",
        message: "اسم النبات مطلوب.",
      });
      return;
    }

    if (!slug) {
      setFeedback({
        type: "error",
        message: "الرابط المختصر مطلوب.",
      });
      return;
    }

    const uniqueAliases = Array.from(
      new Set(
        cleanedAliases.map((alias) =>
          alias.toLocaleLowerCase("ar-EG"),
        ),
      ),
    );

    if (
      uniqueAliases.length !==
      cleanedAliases.length
    ) {
      setFeedback({
        type: "error",
        message:
          "يوجد اسم بديل مكرر داخل القائمة.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(
        "/api/admin/plants",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            name,
            slug,
            category: form.category,
            scientificName:
              scientificName || null,
            description:
              description || null,
            publicationState:
              form.publicationState,
            aliases: cleanedAliases,
          }),
        },
      );

      const body = (await response
        .json()
        .catch(() => null)) as ApiResponse | null;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(body, response.status),
        );
      }

      setFeedback({
        type: "success",
        message:
          body?.message ||
          "تم إضافة النبات بنجاح.",
      });

      router.push("/admin/plants");
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء حفظ النبات.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submitPlant}
      className="space-y-8"
    >
      {feedback ? (
        <div
          role={
            feedback.type === "error"
              ? "alert"
              : "status"
          }
          aria-live="polite"
          className={`flex items-start gap-3 rounded-2xl border p-5 text-sm leading-7 ${
            feedback.type === "success"
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/25 bg-red-400/10 text-red-100"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2
              aria-hidden="true"
              size={21}
              className="mt-1 shrink-0"
            />
          ) : (
            <AlertCircle
              aria-hidden="true"
              size={21}
              className="mt-1 shrink-0"
            />
          )}

          <p>{feedback.message}</p>
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <Leaf
            aria-hidden="true"
            size={22}
            className="text-lime-300"
          />

          <div>
            <h2 className="text-xl font-black">
              البيانات الأساسية
            </h2>

            <p className="mt-1 text-sm text-white/45">
              الاسم والتصنيف وحالة النشر
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-white/75">
              اسم النبات *
            </span>

            <input
              required
              value={form.name}
              disabled={saving}
              maxLength={200}
              placeholder="مثال: المانجو"
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-white/75">
              الرابط المختصر Slug *
            </span>

            <input
              required
              dir="ltr"
              value={form.slug}
              disabled={saving}
              maxLength={160}
              placeholder="mango"
              onChange={(event) =>
                updateField(
                  "slug",
                  normalizeSlug(
                    event.target.value,
                  ),
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />

            <span
              className="mt-2 block text-xs text-white/35"
              dir="ltr"
            >
              /plants/{form.slug || "plant-slug"}
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              التصنيف *
            </span>

            <select
              value={form.category}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "category",
                  event.target
                    .value as PlantCategory,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            >
              {PLANT_CATEGORIES.map(
                (category) => (
                  <option
                    key={category.value}
                    value={category.value}
                  >
                    {category.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              حالة النشر *
            </span>

            <select
              value={form.publicationState}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "publicationState",
                  event.target
                    .value as PublicationState,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            >
              {PUBLICATION_STATES.map(
                (state) => (
                  <option
                    key={state.value}
                    value={state.value}
                  >
                    {state.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-white/75">
              الاسم العلمي
            </span>

            <input
              dir="ltr"
              value={form.scientificName}
              disabled={saving}
              maxLength={220}
              placeholder="Mangifera indica"
              onChange={(event) =>
                updateField(
                  "scientificName",
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left italic outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <FileText
            aria-hidden="true"
            size={22}
            className="text-lime-300"
          />

          <div>
            <h2 className="text-xl font-black">
              الوصف
            </h2>

            <p className="mt-1 text-sm text-white/45">
              وصف مختصر وواضح للنبات
            </p>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-bold text-white/75">
            وصف النبات
          </span>

          <textarea
            rows={7}
            value={form.description}
            disabled={saving}
            maxLength={5000}
            placeholder="اكتب وصفًا للنبات، طبيعته، استخداماته وبيئته المناسبة..."
            onChange={(event) =>
              updateField(
                "description",
                event.target.value,
              )
            }
            className="w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-8 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
          />
        </label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Tags
              aria-hidden="true"
              size={22}
              className="text-lime-300"
            />

            <div>
              <h2 className="text-xl font-black">
                الأسماء البديلة
              </h2>

              <p className="mt-1 text-sm text-white/45">
                أسماء شائعة تساعد Doctor في التعرف على النبات
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addAlias}
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-400/[.08] px-4 text-sm font-black text-sky-200 transition hover:bg-sky-400/15 disabled:opacity-40"
          >
            <Plus
              aria-hidden="true"
              size={17}
            />
            إضافة اسم بديل
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {aliases.map((alias, index) => (
            <div
              key={index}
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_48px]"
            >
              <input
                value={alias}
                disabled={saving}
                maxLength={200}
                placeholder={`الاسم البديل رقم ${
                  index + 1
                }`}
                onChange={(event) =>
                  updateAlias(
                    index,
                    event.target.value,
                  )
                }
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  removeAlias(index)
                }
                disabled={saving}
                className="grid h-12 place-items-center rounded-xl border border-red-400/25 bg-red-400/[.07] text-red-200 transition hover:bg-red-400/15 disabled:opacity-40"
                aria-label="حذف الاسم البديل"
              >
                <Trash2
                  aria-hidden="true"
                  size={18}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="sticky bottom-4 z-20 rounded-2xl border border-lime-300/20 bg-[#0b1a0e]/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <strong className="block font-black">
              إضافة نبات جديد
            </strong>

            <p className="mt-1 text-sm text-white/45">
              يمكن إضافة الصور والروابط العلمية بعد إنشاء النبات.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/plants"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/65 transition hover:border-lime-300/30 hover:text-white"
            >
              <ArrowRight
                aria-hidden="true"
                size={18}
              />
              إلغاء
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 font-black text-[#071109] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  aria-hidden="true"
                  size={19}
                  className="animate-spin"
                />
              ) : (
                <Save
                  aria-hidden="true"
                  size={19}
                />
              )}

              {saving
                ? "جاري حفظ النبات..."
                : "حفظ النبات"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
