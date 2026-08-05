"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bug,
  Database,
  FileJson,
  FlaskConical,
  Leaf,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
} from "lucide-react";

type GenerateKnowledgeResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  release?: {
    version: string;
    contentChecksum: string;
    generatedAt: string;
  };
};

type GenerationResult = {
  version: string;
  contentChecksum: string;
  generatedAt: string;
};

const managementItems = [
  {
    label: "إدارة النباتات",
    description:
      "إضافة النباتات والمحاصيل والأسماء البديلة والصور والبيانات الأساسية.",
    href: "/admin/plants",
    icon: Sprout,
  },
  {
    label: "إدارة الأمراض",
    description:
      "إضافة الأمراض والأعراض والمسببات والارتباطات بالنباتات.",
    href: "/admin/diseases",
    icon: FlaskConical,
  },
  {
    label: "إدارة الآفات",
    description:
      "إضافة الحشرات والأكاروسات والنيماتودا وأنماط الضرر.",
    href: "/admin/pests",
    icon: Bug,
  },
  {
    label: "إدارة نواقص العناصر",
    description:
      "إضافة أعراض النقص ومكان ظهورها والأسباب والظروف المساعدة.",
    href: "/admin/deficiencies",
    icon: Leaf,
  },
  {
    label: "إدارة المنتجات",
    description:
      "إدارة منتجات ArtVert وربطها بالتوصيات داخل قاعدة المعرفة.",
    href: "/admin/products",
    icon: Package,
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Africa/Cairo",
  }).format(new Date(value));
}

export default function KnowledgePage() {
  const [generating, setGenerating] =
    useState(false);
  const [result, setResult] =
    useState<GenerationResult | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function generateKnowledge() {
    if (generating) {
      return;
    }

    setGenerating(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/admin/knowledge/generate",
        {
          method: "POST",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const body = (await response
        .json()
        .catch(
          () => null,
        )) as GenerateKnowledgeResponse | null;

      if (
        !response.ok ||
        !body?.success ||
        !body.release
      ) {
        throw new Error(
          body?.message ||
            body?.error ||
            "تعذر توليد قاعدة المعرفة.",
        );
      }

      setResult({
        version: body.release.version,
        contentChecksum:
          body.release.contentChecksum,
        generatedAt:
          body.release.generatedAt,
      });

      setMessage(
        body.message ||
          "تم توليد قاعدة المعرفة بنجاح.",
      );
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "تعذر توليد قاعدة المعرفة.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main
      className="min-h-screen flex-1 bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/10 px-4 text-sm font-black text-lime-300 transition hover:border-lime-300/40 hover:bg-lime-300/15"
        >
          <ArrowRight
            aria-hidden="true"
            size={18}
          />
          الرجوع إلى لوحة التحكم
        </Link>

        <header className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-sm font-black text-lime-300">
              Doctor Knowledge Base
            </span>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              إدارة ومولد المعرفة
            </h1>

            <p className="mt-3 max-w-3xl leading-8 text-white/55">
              أدخل بيانات الدكتور من أقسام النباتات
              والأمراض والآفات ونواقص العناصر
              والمنتجات، ثم ولّد نسخة معرفة جديدة
              وفعّلها على Vercel Blob.
            </p>
          </div>

          <button
            type="button"
            onClick={generateKnowledge}
            disabled={generating}
            className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-lime-300 px-6 text-sm font-black text-[#071109] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {generating ? (
              <Loader2
                aria-hidden="true"
                size={19}
                className="animate-spin"
              />
            ) : (
              <Sparkles
                aria-hidden="true"
                size={19}
              />
            )}

            {generating
              ? "جاري توليد المعرفة..."
              : "توليد نسخة جديدة"}
          </button>
        </header>

        <section className="mt-8 rounded-3xl border border-lime-300/15 bg-lime-300/[.04] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
              <Search
                aria-hidden="true"
                size={22}
              />
            </div>

            <div>
              <h2 className="text-xl font-black">
                أين تدخل داتا الدكتور؟
              </h2>

              <p className="mt-2 leading-8 text-white/55">
                استخدم الأقسام التالية لإضافة
                المحتوى الفعلي. زر التوليد لا ينشئ
                بيانات من نفسه؛ هو يجمع البيانات
                المنشورة الموجودة داخل PostgreSQL
                ويحّولها إلى ملفات معرفة جاهزة
                للدكتور.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">
                إدارة محتوى الدكتور
              </h2>

              <p className="mt-2 text-sm leading-7 text-white/45">
                ادخل إلى كل قسم لإضافة أو تعديل
                البيانات التي يعتمد عليها Doctor
                ArtVert.
              </p>
            </div>

            <BookOpen
              aria-hidden="true"
              size={30}
              className="text-lime-300"
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {managementItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-xl transition hover:-translate-y-1 hover:border-lime-300/30 hover:bg-lime-300/[.04]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                      <Icon
                        aria-hidden="true"
                        size={23}
                      />
                    </div>

                    <ArrowRight
                      aria-hidden="true"
                      size={19}
                      className="rotate-180 text-white/25 transition group-hover:text-lime-300"
                    />
                  </div>

                  <h3 className="mt-5 text-lg font-black">
                    {item.label}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-white/45">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "مصدر البيانات",
              value: "PostgreSQL",
              icon: Database,
            },
            {
              label: "مكان التصدير",
              value: "Vercel Blob",
              icon: FileJson,
            },
            {
              label: "حالة التفعيل",
              value: result
                ? "مفعلة"
                : "في انتظار التوليد",
              icon: ShieldCheck,
            },
            {
              label: "صيغة المعرفة",
              value: "JSON Releases",
              icon: BookOpen,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5 shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-sm text-white/40">
                      {item.label}
                    </span>

                    <strong className="mt-3 block text-lg font-black">
                      {item.value}
                    </strong>
                  </div>

                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                    <Icon
                      aria-hidden="true"
                      size={21}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
              <RefreshCw
                aria-hidden="true"
                size={23}
                className={
                  generating
                    ? "animate-spin"
                    : ""
                }
              />
            </div>

            <div>
              <h2 className="text-xl font-black">
                ماذا يحدث عند التوليد؟
              </h2>

              <p className="mt-2 leading-8 text-white/50">
                يتم جمع الكيانات المنشورة، ترتيبها
                وحساب Checksum لكل ملف، إنشاء
                Manifest وإصدار جديد، رفع الملفات
                إلى Blob، ثم تحديث current.json
                لتفعيل النسخة الجديدة.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "قراءة Snapshot ثابت من PostgreSQL",
              "توليد ملفات JSON حسب نوع الكيان",
              "حساب Checksums والتحقق من الملفات",
              "رفع الإصدار إلى Vercel Blob",
              "تفعيل الإصدار وتحديث Current Pointer",
              "إرجاع رقم الإصدار وتاريخ التوليد",
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-4"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-lime-300/10 text-sm font-black text-lime-300">
                  {(index + 1).toLocaleString(
                    "ar-EG",
                  )}
                </span>

                <span className="text-sm leading-6 text-white/65">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </section>

        {message ? (
          <section
            role="status"
            className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/[.08] p-5"
          >
            <div className="flex items-start gap-3">
              <BadgeCheck
                aria-hidden="true"
                size={22}
                className="mt-0.5 shrink-0 text-emerald-300"
              />

              <div>
                <strong className="block text-emerald-100">
                  تم التوليد بنجاح
                </strong>

                <p className="mt-1 text-sm leading-7 text-emerald-100/70">
                  {message}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {error ? (
          <section
            role="alert"
            className="mt-6 rounded-2xl border border-red-400/25 bg-red-400/[.08] p-5"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                aria-hidden="true"
                size={22}
                className="mt-0.5 shrink-0 text-red-300"
              />

              <div>
                <strong className="block text-red-100">
                  فشل توليد المعرفة
                </strong>

                <p className="mt-1 text-sm leading-7 text-red-100/70">
                  {error}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
          <h2 className="text-xl font-black">
            آخر نتيجة في هذه الجلسة
          </h2>

          {!result ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[.02] px-6 py-12 text-center">
              <BookOpen
                aria-hidden="true"
                size={34}
                className="mx-auto text-lime-300/60"
              />

              <p className="mt-4 text-white/45">
                لم يتم توليد نسخة جديدة من هذه
                الصفحة حتى الآن.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ResultField
                  label="رقم الإصدار"
                  value={result.version}
                />

                <ResultField
                  label="وقت التوليد"
                  value={formatDate(
                    result.generatedAt,
                  )}
                />
              </div>

              <ResultField
                label="Content Checksum"
                value={
                  result.contentChecksum
                }
                mono
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ResultField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
      <span className="text-xs font-bold text-white/35">
        {label}
      </span>

      <strong
        className={`mt-2 block break-all text-sm text-white/80 ${
          mono ? "font-mono" : ""
        }`}
        dir={mono ? "ltr" : undefined}
      >
        {value}
      </strong>
    </div>
  );
}
