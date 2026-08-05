"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  Loader2,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

type AdminSettings = {
  platformName: string;
  companyName: string;
  whatsappNumber: string;
  defaultPageSize: number;
  autoRefresh: boolean;
  confirmBeforeDelete: boolean;
};

const STORAGE_KEY =
  "artvert-admin-settings-v1";

const defaultSettings: AdminSettings = {
  platformName: "ArtVert OS",
  companyName: "ArtVert Egypt",
  whatsappNumber: "201080040408",
  defaultPageSize: 20,
  autoRefresh: true,
  confirmBeforeDelete: true,
};

function readStoredSettings(): AdminSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    if (!stored) {
      return defaultSettings;
    }

    const parsed = JSON.parse(
      stored,
    ) as Partial<AdminSettings>;

    return {
      platformName:
        typeof parsed.platformName ===
        "string"
          ? parsed.platformName
          : defaultSettings.platformName,
      companyName:
        typeof parsed.companyName ===
        "string"
          ? parsed.companyName
          : defaultSettings.companyName,
      whatsappNumber:
        typeof parsed.whatsappNumber ===
        "string"
          ? parsed.whatsappNumber
          : defaultSettings.whatsappNumber,
      defaultPageSize:
        typeof parsed.defaultPageSize ===
          "number" &&
        [10, 20, 50, 100].includes(
          parsed.defaultPageSize,
        )
          ? parsed.defaultPageSize
          : defaultSettings.defaultPageSize,
      autoRefresh:
        typeof parsed.autoRefresh ===
        "boolean"
          ? parsed.autoRefresh
          : defaultSettings.autoRefresh,
      confirmBeforeDelete:
        typeof parsed.confirmBeforeDelete ===
        "boolean"
          ? parsed.confirmBeforeDelete
          : defaultSettings.confirmBeforeDelete,
    };
  } catch {
    return defaultSettings;
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] =
    useState<AdminSettings>(
      defaultSettings,
    );

  const [loaded, setLoaded] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    setSettings(readStoredSettings());
    setLoaded(true);
  }, []);

  async function saveSettings(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings),
      );

      await new Promise((resolve) =>
        window.setTimeout(resolve, 350),
      );

      setMessage(
        "تم حفظ إعدادات لوحة الإدارة على هذا الجهاز.",
      );
    } finally {
      setSaving(false);
    }
  }

  function resetSettings() {
    setSettings(defaultSettings);
    window.localStorage.removeItem(
      STORAGE_KEY,
    );
    setMessage(
      "تمت إعادة الإعدادات الافتراضية.",
    );
  }

  if (!loaded) {
    return (
      <main className="grid min-h-screen flex-1 place-items-center bg-[#061008] text-white">
        <Loader2
          size={30}
          className="animate-spin text-lime-300"
        />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex-1 bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
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

        <header className="mt-7">
          <span className="text-sm font-black text-lime-300">
            ArtVert Administration
          </span>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            إعدادات لوحة الإدارة
          </h1>

          <p className="mt-3 max-w-3xl leading-8 text-white/55">
            اضبط اسم المنصة وبيانات الشركة
            وتفضيلات العرض والتحديث والتأكيد قبل
            الحذف. يتم حفظ هذه الإعدادات محليًا
            على الجهاز الحالي.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "قاعدة البيانات",
              value: "PostgreSQL / Neon",
              icon: Database,
            },
            {
              label: "تخزين الملفات",
              value: "Vercel Blob",
              icon: RefreshCw,
            },
            {
              label: "دليل المستخدمين",
              value: "Prisma",
              icon: ShieldCheck,
            },
            {
              label: "كتالوج المنتجات",
              value: "Database",
              icon: SlidersHorizontal,
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

                    <strong className="mt-3 block text-base font-black">
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

        <form
          onSubmit={saveSettings}
          className="mt-8 grid gap-6"
        >
          <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                <Building2
                  aria-hidden="true"
                  size={23}
                />
              </div>

              <div>
                <h2 className="text-xl font-black">
                  هوية المنصة والشركة
                </h2>

                <p className="mt-2 text-sm leading-7 text-white/45">
                  هذه القيم مخصصة لواجهة الإدارة
                  على هذا الجهاز، ولا تغيّر بيانات
                  قاعدة البيانات أو ملفات البيئة.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-white/65">
                  اسم المنصة
                </span>

                <input
                  value={
                    settings.platformName
                  }
                  onChange={(event) =>
                    setSettings(
                      (current) => ({
                        ...current,
                        platformName:
                          event.target.value,
                      }),
                    )
                  }
                  maxLength={80}
                  required
                  className="h-12 rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-white/65">
                  اسم الشركة
                </span>

                <input
                  value={
                    settings.companyName
                  }
                  onChange={(event) =>
                    setSettings(
                      (current) => ({
                        ...current,
                        companyName:
                          event.target.value,
                      }),
                    )
                  }
                  maxLength={120}
                  required
                  className="h-12 rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="flex items-center gap-2 text-sm font-bold text-white/65">
                  <MessageCircle
                    size={17}
                    className="text-lime-300"
                  />
                  رقم واتساب
                </span>

                <input
                  value={
                    settings.whatsappNumber
                  }
                  onChange={(event) =>
                    setSettings(
                      (current) => ({
                        ...current,
                        whatsappNumber:
                          event.target.value.replace(
                            /\D/g,
                            "",
                          ),
                      }),
                    )
                  }
                  inputMode="numeric"
                  maxLength={20}
                  required
                  dir="ltr"
                  className="h-12 rounded-xl border border-white/10 bg-white/[.04] px-4 text-left outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                <Settings
                  aria-hidden="true"
                  size={23}
                />
              </div>

              <div>
                <h2 className="text-xl font-black">
                  تفضيلات الإدارة
                </h2>

                <p className="mt-2 text-sm leading-7 text-white/45">
                  تحكم في طريقة عرض البيانات
                  وسلوك صفحات الإدارة.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-white/65">
                  عدد العناصر الافتراضي في الصفحة
                </span>

                <select
                  value={
                    settings.defaultPageSize
                  }
                  onChange={(event) =>
                    setSettings(
                      (current) => ({
                        ...current,
                        defaultPageSize:
                          Number(
                            event.target.value,
                          ),
                      }),
                    )
                  }
                  className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
                >
                  {[10, 20, 50, 100].map(
                    (value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value.toLocaleString(
                          "ar-EG",
                        )}{" "}
                        عنصر
                      </option>
                    ),
                  )}
                </select>
              </label>

              <ToggleRow
                label="التحديث التلقائي للبيانات"
                description="تفعيل إعادة تحميل البيانات تلقائيًا في الصفحات التي تدعم ذلك."
                checked={
                  settings.autoRefresh
                }
                onChange={(checked) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      autoRefresh:
                        checked,
                    }),
                  )
                }
              />

              <ToggleRow
                label="التأكيد قبل الحذف"
                description="إظهار رسالة تأكيد قبل تنفيذ عمليات الحذف النهائية."
                checked={
                  settings.confirmBeforeDelete
                }
                onChange={(checked) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      confirmBeforeDelete:
                        checked,
                    }),
                  )
                }
              />
            </div>
          </section>

          {message ? (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[.08] p-4 text-emerald-100"
            >
              <CheckCircle2
                aria-hidden="true"
                size={21}
                className="mt-0.5 shrink-0 text-emerald-300"
              />

              <p className="text-sm leading-7">
                {message}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
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
                ? "جاري الحفظ..."
                : "حفظ الإعدادات"}
            </button>

            <button
              type="button"
              onClick={resetSettings}
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-6 font-bold text-white/65 transition hover:border-lime-300/30 hover:text-white disabled:opacity-40"
            >
              <RotateCcw
                aria-hidden="true"
                size={18}
              />
              استعادة الافتراضي
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 rounded-2xl border border-white/10 bg-white/[.03] p-4">
      <div>
        <strong className="block text-sm">
          {label}
        </strong>

        <p className="mt-1 text-xs leading-6 text-white/40">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked,
          )
        }
        className="mt-1 h-5 w-5 accent-lime-300"
      />
    </label>
  );
}
