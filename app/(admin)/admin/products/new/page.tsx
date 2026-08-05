"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CirclePlus,
  FileText,
  ImageIcon,
  Loader2,
  Package,
  Save,
  Sparkles,
  Tags,
  Trash2,
  WalletCards,
  Wheat,
} from "lucide-react";

type PublicationState =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

type ProductFormState = {
  slug: string;
  category: string;
  nameAr: string;
  nameEn: string;
  shortDescription: string;
  description: string;
  composition: string;
  dosage: string;
  packageSize: string;
  price: string;
  comparePrice: string;
  publicationState: PublicationState;
};

type ProductApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  product?: {
    id?: string;
    slug?: string;
    nameAr?: string;
  };
};

type FeedbackState =
  | {
      type: "success";
      message: string;
      productId?: string;
    }
  | {
      type: "error";
      message: string;
    }
  | null;

const INITIAL_FORM: ProductFormState = {
  slug: "",
  category: "",
  nameAr: "",
  nameEn: "",
  shortDescription: "",
  description: "",
  composition: "",
  dosage: "",
  packageSize: "",
  price: "",
  comparePrice: "",
  publicationState: "DRAFT",
};

const PRODUCT_CATEGORIES = [
  "أسمدة مركبة",
  "أسمدة ورقية",
  "محفزات نمو",
  "عناصر صغرى",
  "مبيدات حشرية",
  "مبيدات فطرية",
  "محسنات تربة",
  "تجذير",
  "زراعة منزلية",
  "نباتات زينة",
] as const;

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeMoneyInput(value: string) {
  const normalized = value
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1");

  const [whole = "", decimals] = normalized.split(".");

  const safeWhole = whole.slice(0, 8);

  if (decimals === undefined) {
    return safeWhole;
  }

  return `${safeWhole}.${decimals.slice(0, 2)}`;
}

function parseMoney(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getApiErrorMessage(
  response: ProductApiResponse | null,
  status: number,
) {
  if (
    response &&
    typeof response.message === "string" &&
    response.message.trim()
  ) {
    return response.message.trim();
  }

  if (
    response &&
    typeof response.error === "string" &&
    response.error.trim()
  ) {
    return response.error.trim();
  }

  if (status === 400) {
    return "راجع بيانات المنتج وتأكد من استكمال الحقول المطلوبة.";
  }

  if (status === 401) {
    return "انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى.";
  }

  if (status === 403) {
    return "ليس لديك صلاحية لإضافة المنتجات.";
  }

  if (status === 409) {
    return "يوجد منتج آخر بنفس الرابط أو المعرّف.";
  }

  if (status >= 500) {
    return "تعذر حفظ المنتج بسبب مشكلة في الخادم.";
  }

  return "تعذر إضافة المنتج. حاول مرة أخرى.";
}

export default function NewProductPage() {
  const [form, setForm] =
    useState<ProductFormState>(INITIAL_FORM);

  const [aliasesText, setAliasesText] = useState("");
  const [benefitsText, setBenefitsText] = useState("");
  const [cropsText, setCropsText] = useState("");
  const [imagesText, setImagesText] = useState("");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] =
    useState<FeedbackState>(null);

  const aliases = useMemo(
    () => splitLines(aliasesText),
    [aliasesText],
  );

  const benefits = useMemo(
    () => splitLines(benefitsText),
    [benefitsText],
  );

  const crops = useMemo(
    () => splitLines(cropsText),
    [cropsText],
  );

  const images = useMemo(
    () => splitLines(imagesText),
    [imagesText],
  );

  const parsedPrice = useMemo(
    () => parseMoney(form.price),
    [form.price],
  );

  const parsedComparePrice = useMemo(
    () => parseMoney(form.comparePrice),
    [form.comparePrice],
  );

  function updateField<K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFeedback(null);
  }

  function resetForm() {
    if (saving) {
      return;
    }

    setForm(INITIAL_FORM);
    setAliasesText("");
    setBenefitsText("");
    setCropsText("");
    setImagesText("");
    setFeedback(null);
  }

  async function submitProduct(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const normalizedSlug = normalizeSlug(form.slug);

    if (!normalizedSlug) {
      setFeedback({
        type: "error",
        message:
          "اكتب رابطًا إنجليزيًا صحيحًا للمنتج مثل plant-grow.",
      });
      return;
    }

    if (parsedPrice === null || parsedPrice <= 0) {
      setFeedback({
        type: "error",
        message:
          "اكتب سعرًا أساسيًا صحيحًا أكبر من صفر.",
      });
      return;
    }

    if (
      form.comparePrice.trim() &&
      (parsedComparePrice === null ||
        parsedComparePrice <= 0)
    ) {
      setFeedback({
        type: "error",
        message:
          "السعر قبل الخصم غير صحيح.",
      });
      return;
    }

    if (
      parsedComparePrice !== null &&
      parsedComparePrice <= parsedPrice
    ) {
      setFeedback({
        type: "error",
        message:
          "السعر قبل الخصم يجب أن يكون أكبر من السعر الأساسي.",
      });
      return;
    }

    if (benefits.length === 0) {
      setFeedback({
        type: "error",
        message:
          "أضف فائدة واحدة على الأقل، وكل فائدة في سطر منفصل.",
      });
      return;
    }

    if (crops.length === 0) {
      setFeedback({
        type: "error",
        message:
          "أضف محصولًا أو استخدامًا واحدًا على الأقل.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          slug: normalizedSlug,
          category: form.category.trim(),
          nameAr: form.nameAr.trim(),
          nameEn: form.nameEn.trim(),
          shortDescription:
            form.shortDescription.trim(),
          description: form.description.trim(),
          composition: form.composition.trim(),
          dosage: form.dosage.trim(),
          packageSize: form.packageSize.trim(),
          price: parsedPrice,
          comparePrice: parsedComparePrice,
          publicationState: form.publicationState,
          aliases,
          benefits,
          crops,
          images: images.map((url, index) => ({
            url,
            alt:
              index === 0
                ? form.nameAr.trim()
                : `${form.nameAr.trim()} - ${index + 1}`,
            sortOrder: index,
          })),
        }),
      });

      const responseBody = (await response
        .json()
        .catch(() => null)) as ProductApiResponse | null;

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            responseBody,
            response.status,
          ),
        );
      }

      const productId =
        responseBody?.product?.id;

      setFeedback({
        type: "success",
        message:
          responseBody?.message ||
          "تم إضافة المنتج بنجاح.",
        productId:
          typeof productId === "string"
            ? productId
            : undefined,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء إضافة المنتج.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
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

            <span className="mt-5 block text-sm font-black text-lime-300">
              إدارة المنتجات
            </span>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              إضافة منتج جديد
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-white/55">
              أضف بيانات المنتج وسعره وصوره وفوائده ومحاصيله،
              ليتم حفظه داخل PostgreSQL وربطه بقاعدة معرفة
              Doctor.
            </p>
          </div>

          <div className="rounded-2xl border border-lime-300/15 bg-lime-300/[.05] px-5 py-4 text-sm text-white/60">
            لا يتم استخدام localStorage
          </div>
        </header>

        <form
          onSubmit={submitProduct}
          className="mt-8 space-y-8"
        >
          {feedback ? (
            <section
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
                  size={22}
                  className="mt-1 shrink-0 text-emerald-300"
                />
              ) : (
                <AlertCircle
                  aria-hidden="true"
                  size={22}
                  className="mt-1 shrink-0 text-red-300"
                />
              )}

              <div className="flex-1">
                <strong className="font-black">
                  {feedback.type === "success"
                    ? "تم الحفظ"
                    : "لم يتم الحفظ"}
                </strong>

                <p className="mt-1">
                  {feedback.message}
                </p>

                {feedback.type === "success" &&
                feedback.productId ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/products/${feedback.productId}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-300 px-4 font-black text-[#071109]"
                    >
                      فتح المنتج
                    </Link>

                    <Link
                      href="/admin/products"
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 px-4 font-bold"
                    >
                      قائمة المنتجات
                    </Link>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <Package
                  aria-hidden="true"
                  size={22}
                />
              </div>

              <div>
                <h2 className="text-xl font-black">
                  البيانات الأساسية
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  اسم المنتج وتصنيفه ورابط صفحة العرض
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/75">
                  اسم المنتج بالعربية *
                </span>

                <input
                  required
                  value={form.nameAr}
                  disabled={saving}
                  maxLength={200}
                  onChange={(event) =>
                    updateField(
                      "nameAr",
                      event.target.value,
                    )
                  }
                  placeholder="مثال: بلانت جرو"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/75">
                  اسم المنتج بالإنجليزية *
                </span>

                <input
                  required
                  value={form.nameEn}
                  disabled={saving}
                  maxLength={200}
                  dir="ltr"
                  onChange={(event) =>
                    updateField(
                      "nameEn",
                      event.target.value,
                    )
                  }
                  placeholder="Plant Grow"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/75">
                  رابط المنتج Slug *
                </span>

                <input
                  required
                  value={form.slug}
                  disabled={saving}
                  maxLength={160}
                  dir="ltr"
                  onChange={(event) =>
                    updateField(
                      "slug",
                      event.target.value,
                    )
                  }
                  onBlur={() =>
                    updateField(
                      "slug",
                      normalizeSlug(form.slug),
                    )
                  }
                  placeholder="plant-grow"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                />

                <span className="mt-2 block text-xs text-white/35">
                  استخدم حروفًا إنجليزية وأرقامًا وشرطة فقط.
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/75">
                  التصنيف *
                </span>

                <input
                  required
                  list="product-categories"
                  value={form.category}
                  disabled={saving}
                  maxLength={120}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value,
                    )
                  }
                  placeholder="اختر أو اكتب تصنيفًا"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                />

                <datalist id="product-categories">
                  {PRODUCT_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      />
                    ),
                  )}
                </datalist>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/75">
                  حجم العبوة *
                </span>

                <input
                  required
                  value={form.packageSize}
                  disabled={saving}
                  maxLength={120}
                  onChange={(event) =>
                    updateField(
                      "packageSize",
                      event.target.value,
                    )
                  }
                  placeholder="مثال: 500 مل"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                />
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
                  <option value="DRAFT">
                    مسودة
                  </option>

                  <option value="PUBLISHED">
                    منشور
                  </option>

                  <option value="ARCHIVED">
                    مؤرشف
                  </option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-white/75">
                  الوصف المختصر *
                </span>

                <textarea
                  required
                  rows={3}
                  value={form.shortDescription}
                  disabled={saving}
                  maxLength={500}
                  onChange={(event) =>
                    updateField(
                      "shortDescription",
                      event.target.value,
                    )
                  }
                  placeholder="وصف قصير يظهر في بطاقة المنتج"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[.04] p-4 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <WalletCards
                  aria-hidden="true"
                  size={22}
                />
              </div>

              <div>
                <h2 className="text-xl font-black">
                  السعر
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  السعر الحالي والسعر قبل الخصم
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/75">
                  السعر الأساسي بالجنيه *
                </span>

                <div className="relative">
                  <input
                    required
                    value={form.price}
                    disabled={saving}
                    type="text"
                    inputMode="decimal"
                    dir="ltr"
                    onChange={(event) =>
                      updateField(
                        "price",
                        normalizeMoneyInput(
                          event.target.value,
                        ),
                      )
                    }
                    placeholder="150.00"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 pl-16 text-left outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                  />

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-lime-300">
                    EGP
                  </span>
                </div>

                {parsedPrice !== null &&
                parsedPrice > 0 ? (
                  <span className="mt-2 block text-xs text-lime-200">
                    {formatMoney(parsedPrice)}
                  </span>
                ) : (
                  <span className="mt-2 block text-xs text-white/35">
                    السعر المطلوب من العميل.
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/75">
                  السعر قبل الخصم
                </span>

                <div className="relative">
                  <input
                    value={form.comparePrice}
                    disabled={saving}
                    type="text"
                    inputMode="decimal"
                    dir="ltr"
                    onChange={(event) =>
                      updateField(
                        "comparePrice",
                        normalizeMoneyInput(
                          event.target.value,
                        ),
                      )
                    }
                    placeholder="200.00"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 pl-16 text-left outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                  />

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-lime-300">
                    EGP
                  </span>
                </div>

                {parsedComparePrice !== null &&
                parsedComparePrice > 0 ? (
                  <span className="mt-2 block text-xs text-white/50">
                    {formatMoney(parsedComparePrice)}
                  </span>
                ) : (
                  <span className="mt-2 block text-xs text-white/35">
                    اختياري، ويجب أن يكون أكبر من السعر الأساسي.
                  </span>
                )}
              </label>
            </div>

            {parsedPrice !== null &&
            parsedPrice > 0 &&
            parsedComparePrice !== null &&
            parsedComparePrice > parsedPrice ? (
              <div className="mt-5 rounded-2xl border border-lime-300/15 bg-lime-300/[.05] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-white/45">
                      قيمة الخصم
                    </span>

                    <strong className="mt-1 block text-lg font-black text-lime-300">
                      {formatMoney(
                        parsedComparePrice -
                          parsedPrice,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span className="text-xs text-white/45">
                      نسبة الخصم
                    </span>

                    <strong className="mt-1 block text-lg font-black text-lime-300">
                      {Math.round(
                        ((parsedComparePrice -
                          parsedPrice) /
                          parsedComparePrice) *
                          100,
                      ).toLocaleString("ar-EG")}
                      %
                    </strong>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <FileText
                  aria-hidden="true"
                  size={22}
                />
              </div>

              <div>
                <h2 className="text-xl font-black">
                  تفاصيل المنتج
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  الوصف والتركيب والجرعة
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/75">
                  الوصف الكامل *
                </span>

                <textarea
                  required
                  rows={7}
                  value={form.description}
                  disabled={saving}
                  maxLength={5000}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="اكتب وصف المنتج وطريقة عمله واستخداماته"
                  className="w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-8 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-white/75">
                    التركيب *
                  </span>

                  <textarea
                    required
                    rows={5}
                    value={form.composition}
                    disabled={saving}
                    maxLength={3000}
                    onChange={(event) =>
                      updateField(
                        "composition",
                        event.target.value,
                      )
                    }
                    placeholder="اكتب التركيب والنسب"
                    className="w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-7 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-white/75">
                    الجرعة وطريقة الاستخدام *
                  </span>

                  <textarea
                    required
                    rows={5}
                    value={form.dosage}
                    disabled={saving}
                    maxLength={3000}
                    onChange={(event) =>
                      updateField(
                        "dosage",
                        event.target.value,
                      )
                    }
                    placeholder="اكتب الجرعة وطريقة التكرار"
                    className="w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-7 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
              <div className="flex items-center gap-3">
                <Sparkles
                  aria-hidden="true"
                  size={22}
                  className="text-lime-300"
                />

                <div>
                  <h2 className="text-xl font-black">
                    الفوائد
                  </h2>

                  <p className="mt-1 text-sm text-white/45">
                    اكتب كل فائدة في سطر منفصل
                  </p>
                </div>
              </div>

              <textarea
                required
                rows={10}
                value={benefitsText}
                disabled={saving}
                onChange={(event) => {
                  setBenefitsText(event.target.value);
                  setFeedback(null);
                }}
                placeholder={
                  "تحفيز النمو الخضري\nزيادة قوة الجذور\nتحسين لون الأوراق"
                }
                className="mt-5 w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-8 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
              />

              <p className="mt-3 text-xs text-white/40">
                عدد الفوائد:{" "}
                <strong className="text-lime-300">
                  {benefits.length.toLocaleString("ar-EG")}
                </strong>
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
              <div className="flex items-center gap-3">
                <Wheat
                  aria-hidden="true"
                  size={22}
                  className="text-lime-300"
                />

                <div>
                  <h2 className="text-xl font-black">
                    المحاصيل والاستخدامات
                  </h2>

                  <p className="mt-1 text-sm text-white/45">
                    اكتب كل محصول أو استخدام في سطر
                  </p>
                </div>
              </div>

              <textarea
                required
                rows={10}
                value={cropsText}
                disabled={saving}
                onChange={(event) => {
                  setCropsText(event.target.value);
                  setFeedback(null);
                }}
                placeholder={
                  "النباتات المنزلية\nنباتات الزينة\nالخضروات\nأشجار الفاكهة"
                }
                className="mt-5 w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-8 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
              />

              <p className="mt-3 text-xs text-white/40">
                عدد الاستخدامات:{" "}
                <strong className="text-lime-300">
                  {crops.length.toLocaleString("ar-EG")}
                </strong>
              </p>
            </section>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
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
                    تساعد Doctor والبحث في التعرف على المنتج
                  </p>
                </div>
              </div>

              <textarea
                rows={8}
                value={aliasesText}
                disabled={saving}
                onChange={(event) => {
                  setAliasesText(event.target.value);
                  setFeedback(null);
                }}
                placeholder={
                  "بلانت جرو\nPlantGrow\nسماد بلانت جرو"
                }
                className="mt-5 w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-8 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
              />

              <p className="mt-3 text-xs text-white/40">
                عدد الأسماء البديلة:{" "}
                <strong className="text-lime-300">
                  {aliases.length.toLocaleString("ar-EG")}
                </strong>
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
              <div className="flex items-center gap-3">
                <ImageIcon
                  aria-hidden="true"
                  size={22}
                  className="text-lime-300"
                />

                <div>
                  <h2 className="text-xl font-black">
                    صور المنتج
                  </h2>

                  <p className="mt-1 text-sm text-white/45">
                    اكتب رابط كل صورة في سطر منفصل
                  </p>
                </div>
              </div>

              <textarea
                rows={8}
                value={imagesText}
                disabled={saving}
                dir="ltr"
                onChange={(event) => {
                  setImagesText(event.target.value);
                  setFeedback(null);
                }}
                placeholder={
                  "/products/plant-grow.jpeg\nhttps://example.com/image-2.jpg"
                }
                className="mt-5 w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 text-left leading-8 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
              />

              <p className="mt-3 text-xs text-white/40">
                عدد الصور:{" "}
                <strong className="text-lime-300">
                  {images.length.toLocaleString("ar-EG")}
                </strong>
              </p>
            </section>
          </div>

          <section className="sticky bottom-4 z-20 rounded-2xl border border-lime-300/20 bg-[#0b1a0e]/95 p-4 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <strong className="block font-black">
                  حفظ المنتج داخل PostgreSQL
                </strong>

                <p className="mt-1 text-sm text-white/45">
                  بعد الحفظ سيتم إنشاء Product وKnowledgeEntity
                  والصور والأسماء البديلة والسعر.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/65 transition hover:border-red-300/30 hover:text-red-200 disabled:opacity-50"
                >
                  <Trash2
                    aria-hidden="true"
                    size={18}
                  />

                  مسح النموذج
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 font-black text-[#071109] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
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
                    ? "جاري حفظ المنتج..."
                    : "حفظ المنتج"}
                </button>
              </div>
            </div>
          </section>
        </form>

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm text-white/45">
          <CirclePlus
            aria-hidden="true"
            size={18}
            className="shrink-0 text-lime-300"
          />

          تم تجهيز نموذج السعر. الخطوة التالية تعديل API لحفظ
          السعر فعليًا داخل Prisma.
        </div>
      </div>
    </main>
  );
}