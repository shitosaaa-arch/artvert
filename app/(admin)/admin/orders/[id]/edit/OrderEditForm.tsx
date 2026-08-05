"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  UserRound,
} from "lucide-react";

const ORDER_STATUSES = [
  { value: "PENDING", label: "قيد المراجعة" },
  { value: "CONFIRMED", label: "تم التأكيد" },
  { value: "PREPARING", label: "قيد التجهيز" },
  { value: "SHIPPED", label: "تم الشحن" },
  { value: "DELIVERED", label: "تم التسليم" },
  { value: "CANCELLED", label: "ملغي" },
] as const;

const PAYMENT_METHODS = [
  {
    value: "CASH_ON_DELIVERY",
    label: "الدفع عند الاستلام",
  },
  { value: "VODAFONE_CASH", label: "فودافون كاش" },
  { value: "INSTAPAY", label: "إنستاباي" },
  { value: "BANK_TRANSFER", label: "تحويل بنكي" },
  { value: "ONLINE_PAYMENT", label: "دفع إلكتروني" },
  { value: "OTHER", label: "طريقة أخرى" },
] as const;

const PAYMENT_STATUSES = [
  { value: "PENDING", label: "في انتظار الدفع" },
  { value: "PAID", label: "مدفوع" },
  { value: "FAILED", label: "فشل الدفع" },
  { value: "REFUNDED", label: "تم رد المبلغ" },
  {
    value: "PARTIALLY_REFUNDED",
    label: "رد جزئي",
  },
] as const;

type OrderStatus =
  (typeof ORDER_STATUSES)[number]["value"];

type PaymentMethod =
  (typeof PAYMENT_METHODS)[number]["value"];

type PaymentStatus =
  (typeof PAYMENT_STATUSES)[number]["value"];

type InitialOrderItem = {
  id: string;
  productSlug: string;
  productNameAr: string;
  productNameEn: string;
  packageSize: string | null;
  quantity: number;
};

type ProductOption = {
  slug: string;
  nameAr: string;
  nameEn: string;
  packageSize: string | null;
};

type InitialOrderData = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  alternativePhone: string | null;
  governorate: string;
  city: string;
  addressLine: string;
  notes: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: InitialOrderItem[];
};

type OrderEditFormProps = {
  order: InitialOrderData;
  products?: ProductOption[];
};

type FormState = {
  customerName: string;
  phone: string;
  alternativePhone: string;
  governorate: string;
  city: string;
  addressLine: string;
  notes: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
};

type EditableItem = {
  clientKey: string;
  id: string | null;
  productSlug: string;
  productNameAr: string;
  productNameEn: string;
  packageSize: string | null;
  quantity: number;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
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

function normalizePhoneInput(value: string) {
  return value.replace(/[^\d+]/g, "").slice(0, 20);
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
    return "راجع بيانات الطلب وتأكد من صحة الحقول.";
  }

  if (status === 401) {
    return "انتهت جلسة تسجيل الدخول.";
  }

  if (status === 403) {
    return "ليس لديك صلاحية لتعديل الطلب.";
  }

  if (status === 404) {
    return "الطلب غير موجود.";
  }

  if (status >= 500) {
    return "حدث خطأ في الخادم أثناء تعديل الطلب.";
  }

  return "تعذر تعديل الطلب.";
}

function createInitialForm(
  order: InitialOrderData,
): FormState {
  return {
    customerName: order.customerName,
    phone: order.phone,
    alternativePhone:
      order.alternativePhone ?? "",
    governorate: order.governorate,
    city: order.city,
    addressLine: order.addressLine,
    notes: order.notes ?? "",
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  };
}

function createClientKey() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function toEditableItems(
  items: InitialOrderItem[],
): EditableItem[] {
  return items.map((item) => ({
    clientKey: item.id,
    id: item.id,
    productSlug: item.productSlug,
    productNameAr: item.productNameAr,
    productNameEn: item.productNameEn,
    packageSize: item.packageSize,
    quantity: item.quantity,
  }));
}

export default function OrderEditForm({
  order,
  products = [],
}: OrderEditFormProps) {
  const router = useRouter();

  const initialForm = useMemo(
    () => createInitialForm(order),
    [order],
  );

  const initialItems = useMemo(
    () => toEditableItems(order.items),
    [order.items],
  );

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [items, setItems] =
    useState<EditableItem[]>(initialItems);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] =
    useState<Feedback>(null);
  const safeProducts = useMemo(
    () => products ?? [],
    [products],
  );


  const totalItems = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
    [items],
  );

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        form: initialForm,
        items: initialItems.map((item) => ({
          id: item.id,
          productSlug: item.productSlug,
          quantity: item.quantity,
        })),
      }),
    [initialForm, initialItems],
  );

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        form,
        items: items.map((item) => ({
          id: item.id,
          productSlug: item.productSlug,
          quantity: item.quantity,
        })),
      }),
    [form, items],
  );

  const hasChanges =
    currentSnapshot !== initialSnapshot;

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

  function updateItemQuantity(
    clientKey: string,
    quantity: number,
  ) {
    const safeQuantity = Math.min(
      100,
      Math.max(1, quantity || 1),
    );

    setItems((current) =>
      current.map((item) =>
        item.clientKey === clientKey
          ? {
              ...item,
              quantity: safeQuantity,
            }
          : item,
      ),
    );

    setFeedback(null);
  }

  function updateItemProduct(
    clientKey: string,
    productSlug: string,
  ) {
    const product = safeProducts.find(
      (option) => option.slug === productSlug,
    );

    if (!product) {
      return;
    }

    const duplicate = items.some(
      (item) =>
        item.clientKey !== clientKey &&
        item.productSlug === productSlug,
    );

    if (duplicate) {
      setFeedback({
        type: "error",
        message:
          "هذا المنتج موجود بالفعل داخل الطلب.",
      });
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.clientKey === clientKey
          ? {
              ...item,
              productSlug: product.slug,
              productNameAr: product.nameAr,
              productNameEn: product.nameEn,
              packageSize: product.packageSize,
            }
          : item,
      ),
    );

    setFeedback(null);
  }

  function addProduct() {
    const usedSlugs = new Set(
      items.map((item) => item.productSlug),
    );

    const availableProduct = safeProducts.find(
      (product) => !usedSlugs.has(product.slug),
    );

    if (!availableProduct) {
      setFeedback({
        type: "error",
        message:
          "تمت إضافة كل المنتجات المتاحة بالفعل.",
      });
      return;
    }

    setItems((current) => [
      ...current,
      {
        clientKey: createClientKey(),
        id: null,
        productSlug: availableProduct.slug,
        productNameAr: availableProduct.nameAr,
        productNameEn: availableProduct.nameEn,
        packageSize:
          availableProduct.packageSize,
        quantity: 1,
      },
    ]);

    setFeedback(null);
  }

  function removeProduct(clientKey: string) {
    if (items.length <= 1) {
      setFeedback({
        type: "error",
        message:
          "لا يمكن حفظ طلب بدون منتج واحد على الأقل.",
      });
      return;
    }

    setItems((current) =>
      current.filter(
        (item) => item.clientKey !== clientKey,
      ),
    );

    setFeedback(null);
  }

  function resetChanges() {
    if (saving) {
      return;
    }

    setForm(initialForm);
    setItems(initialItems);
    setFeedback(null);
  }

  async function saveOrder(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving || !hasChanges) {
      return;
    }

    if (!form.customerName.trim()) {
      setFeedback({
        type: "error",
        message: "اسم العميل مطلوب.",
      });
      return;
    }

    if (!form.phone.trim()) {
      setFeedback({
        type: "error",
        message: "رقم الهاتف مطلوب.",
      });
      return;
    }

    if (
      !form.governorate.trim() ||
      !form.city.trim() ||
      !form.addressLine.trim()
    ) {
      setFeedback({
        type: "error",
        message:
          "المحافظة والمدينة والعنوان مطلوبة.",
      });
      return;
    }

    if (items.length === 0) {
      setFeedback({
        type: "error",
        message:
          "لا يمكن حفظ طلب بدون منتج واحد على الأقل.",
      });
      return;
    }

    const invalidItem = items.find(
      (item) => !item.productSlug.trim(),
    );

    if (invalidItem) {
      setFeedback({
        type: "error",
        message:
          "اختر منتجًا صحيحًا لكل عنصر داخل الطلب.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(
          order.id,
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            customerName:
              form.customerName.trim(),
            phone: form.phone.trim(),
            alternativePhone:
              form.alternativePhone.trim() ||
              null,
            governorate:
              form.governorate.trim(),
            city: form.city.trim(),
            addressLine:
              form.addressLine.trim(),
            notes: form.notes.trim() || null,
            status: form.status,
            paymentMethod:
              form.paymentMethod,
            paymentStatus:
              form.paymentStatus,
            items: items.map((item) => ({
              id: item.id,
              productSlug: item.productSlug,
              quantity: item.quantity,
            })),
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
          "تم تعديل الطلب بنجاح.",
      });

      router.refresh();
      router.push(`/admin/orders/${order.id}`);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={saveOrder}
      className="space-y-8"
    >
      {feedback ? (
        <div
          role={
            feedback.type === "error"
              ? "alert"
              : "status"
          }
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
          <UserRound
            aria-hidden="true"
            size={22}
            className="text-lime-300"
          />

          <div>
            <h2 className="text-xl font-black">
              بيانات العميل
            </h2>

            <p className="mt-1 text-sm text-white/45">
              الاسم وأرقام الهاتف
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-white/75">
              اسم العميل *
            </span>

            <input
              required
              value={form.customerName}
              disabled={saving}
              maxLength={120}
              onChange={(event) =>
                updateField(
                  "customerName",
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/75">
              <Phone
                aria-hidden="true"
                size={16}
                className="text-lime-300"
              />
              رقم الهاتف *
            </span>

            <input
              required
              value={form.phone}
              disabled={saving}
              dir="ltr"
              inputMode="tel"
              onChange={(event) =>
                updateField(
                  "phone",
                  normalizePhoneInput(
                    event.target.value,
                  ),
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              رقم بديل
            </span>

            <input
              value={form.alternativePhone}
              disabled={saving}
              dir="ltr"
              inputMode="tel"
              onChange={(event) =>
                updateField(
                  "alternativePhone",
                  normalizePhoneInput(
                    event.target.value,
                  ),
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <MapPin
            aria-hidden="true"
            size={22}
            className="text-lime-300"
          />

          <div>
            <h2 className="text-xl font-black">
              عنوان التوصيل
            </h2>

            <p className="mt-1 text-sm text-white/45">
              المحافظة والمدينة والعنوان
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              المحافظة *
            </span>

            <input
              required
              value={form.governorate}
              disabled={saving}
              maxLength={100}
              onChange={(event) =>
                updateField(
                  "governorate",
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              المدينة أو المنطقة *
            </span>

            <input
              required
              value={form.city}
              disabled={saving}
              maxLength={120}
              onChange={(event) =>
                updateField(
                  "city",
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-white/75">
              العنوان بالتفصيل *
            </span>

            <textarea
              required
              rows={4}
              value={form.addressLine}
              disabled={saving}
              maxLength={500}
              onChange={(event) =>
                updateField(
                  "addressLine",
                  event.target.value,
                )
              }
              className="w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-8 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-white/75">
              ملاحظات الطلب
            </span>

            <textarea
              rows={4}
              value={form.notes}
              disabled={saving}
              maxLength={1000}
              onChange={(event) =>
                updateField(
                  "notes",
                  event.target.value,
                )
              }
              className="w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-8 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <CreditCard
            aria-hidden="true"
            size={22}
            className="text-lime-300"
          />

          <div>
            <h2 className="text-xl font-black">
              حالة الطلب والدفع
            </h2>

            <p className="mt-1 text-sm text-white/45">
              تحديث التنفيذ وطريقة وحالة الدفع
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              حالة الطلب
            </span>

            <select
              value={form.status}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target
                    .value as OrderStatus,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            >
              {ORDER_STATUSES.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              طريقة الدفع
            </span>

            <select
              value={form.paymentMethod}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "paymentMethod",
                  event.target
                    .value as PaymentMethod,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            >
              {PAYMENT_METHODS.map((method) => (
                <option
                  key={method.value}
                  value={method.value}
                >
                  {method.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              حالة الدفع
            </span>

            <select
              value={form.paymentStatus}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "paymentStatus",
                  event.target
                    .value as PaymentStatus,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            >
              {PAYMENT_STATUSES.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Package
              aria-hidden="true"
              size={22}
              className="text-lime-300"
            />

            <div>
              <h2 className="text-xl font-black">
                منتجات الطلب
              </h2>

              <p className="mt-1 text-sm text-white/45">
                إضافة أو حذف منتج وتعديل النوع والكمية
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-lime-300/10 px-4 py-2 text-sm font-black text-lime-300">
              الإجمالي:{" "}
              {totalItems.toLocaleString("ar-EG")} قطعة
            </span>

            <button
              type="button"
              onClick={addProduct}
              disabled={saving || safeProducts.length === 0}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 text-sm font-black text-[#061008] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus
                aria-hidden="true"
                size={17}
              />

              إضافة منتج
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {items.map((item, index) => (
            <article
              key={item.clientKey}
              className="rounded-2xl border border-white/10 bg-white/[.025] p-4"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_150px_52px] lg:items-end">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-white/45">
                    المنتج رقم{" "}
                    {(index + 1).toLocaleString("ar-EG")}
                  </span>

                  <select
                    value={item.productSlug}
                    disabled={saving}
                    onChange={(event) =>
                      updateItemProduct(
                        item.clientKey,
                        event.target.value,
                      )
                    }
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
                  >
                    {safeProducts.map((product) => (
                      <option
                        key={product.slug}
                        value={product.slug}
                        disabled={items.some(
                          (currentItem) =>
                            currentItem.clientKey !==
                              item.clientKey &&
                            currentItem.productSlug ===
                              product.slug,
                        )}
                      >
                        {product.nameAr}
                        {product.packageSize
                          ? ` - ${product.packageSize}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  <div className="mt-2 text-xs text-white/40">
                    {item.productNameEn}
                    {item.packageSize
                      ? ` · العبوة: ${item.packageSize}`
                      : ""}
                  </div>
                </label>

                <label>
                  <span className="mb-2 block text-xs font-bold text-white/45">
                    الكمية
                  </span>

                  <div className="grid grid-cols-[42px_minmax(0,1fr)_42px] overflow-hidden rounded-xl border border-white/10">
                    <button
                      type="button"
                      disabled={saving || item.quantity <= 1}
                      onClick={() =>
                        updateItemQuantity(
                          item.clientKey,
                          item.quantity - 1,
                        )
                      }
                      className="grid h-12 place-items-center bg-white/[.04] text-white/70 transition hover:bg-white/[.08] disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="تقليل الكمية"
                    >
                      <Minus
                        aria-hidden="true"
                        size={17}
                      />
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={item.quantity}
                      disabled={saving}
                      onChange={(event) =>
                        updateItemQuantity(
                          item.clientKey,
                          Number.parseInt(
                            event.target.value,
                            10,
                          ),
                        )
                      }
                      className="h-12 w-full border-x border-white/10 bg-white/[.02] px-2 text-center font-black outline-none"
                    />

                    <button
                      type="button"
                      disabled={saving || item.quantity >= 100}
                      onClick={() =>
                        updateItemQuantity(
                          item.clientKey,
                          item.quantity + 1,
                        )
                      }
                      className="grid h-12 place-items-center bg-white/[.04] text-white/70 transition hover:bg-white/[.08] disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="زيادة الكمية"
                    >
                      <Plus
                        aria-hidden="true"
                        size={17}
                      />
                    </button>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={() =>
                    removeProduct(item.clientKey)
                  }
                  disabled={saving || items.length <= 1}
                  className="grid h-12 w-full place-items-center rounded-xl border border-red-400/25 bg-red-400/[.07] text-red-200 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-35 lg:w-12"
                  aria-label={`حذف ${item.productNameAr} من الطلب`}
                  title="حذف المنتج من الطلب"
                >
                  <Trash2
                    aria-hidden="true"
                    size={18}
                  />
                </button>
              </div>
            </article>
          ))}
        </div>

        {safeProducts.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/[.07] p-4 text-sm leading-7 text-amber-100">
            لا توجد منتجات متاحة لإضافتها حاليًا.
          </div>
        ) : null}
      </section>

      <section className="sticky bottom-4 z-20 rounded-2xl border border-lime-300/20 bg-[#0b1a0e]/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <strong className="block font-black">
              {hasChanges
                ? "توجد تغييرات لم يتم حفظها"
                : "لا توجد تغييرات جديدة"}
            </strong>

            <p className="mt-1 text-sm text-white/45">
              رقم الطلب:{" "}
              <span dir="ltr">
                {order.orderNumber}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/65 transition hover:border-lime-300/30 hover:text-white"
            >
              <ArrowRight
                aria-hidden="true"
                size={18}
              />
              إلغاء
            </Link>

            <button
              type="button"
              onClick={resetChanges}
              disabled={saving || !hasChanges}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/65 transition hover:border-amber-300/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw
                aria-hidden="true"
                size={18}
              />
              استرجاع
            </button>

            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 font-black text-[#071109] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40"
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
                ? "جاري حفظ التعديلات..."
                : "حفظ التعديلات"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
