"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  PackageCheck,
  Save,
} from "lucide-react";

const ORDER_STATUSES = [
  {
    value: "PENDING",
    label: "قيد المراجعة",
  },
  {
    value: "CONFIRMED",
    label: "تم التأكيد",
  },
  {
    value: "PREPARING",
    label: "قيد التجهيز",
  },
  {
    value: "SHIPPED",
    label: "تم الشحن",
  },
  {
    value: "DELIVERED",
    label: "تم التسليم",
  },
  {
    value: "CANCELLED",
    label: "ملغي",
  },
] as const;

const PAYMENT_STATUSES = [
  {
    value: "PENDING",
    label: "في انتظار الدفع",
  },
  {
    value: "PAID",
    label: "مدفوع",
  },
  {
    value: "FAILED",
    label: "فشل الدفع",
  },
  {
    value: "REFUNDED",
    label: "تم رد المبلغ",
  },
  {
    value: "PARTIALLY_REFUNDED",
    label: "رد جزئي",
  },
] as const;

type OrderStatus =
  (typeof ORDER_STATUSES)[number]["value"];

type PaymentStatus =
  (typeof PAYMENT_STATUSES)[number]["value"];

type OrderStatusControlsProps = {
  orderId: string;
  initialStatus: string;
  initialPaymentStatus: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  order?: {
    status?: string;
    paymentStatus?: string;
  };
};

type FeedbackState =
  | {
      type: "success";
      message: string;
    }
  | {
      type: "error";
      message: string;
    }
  | null;

function isOrderStatus(
  value: string,
): value is OrderStatus {
  return ORDER_STATUSES.some(
    (status) => status.value === value,
  );
}

function isPaymentStatus(
  value: string,
): value is PaymentStatus {
  return PAYMENT_STATUSES.some(
    (status) => status.value === value,
  );
}

function getErrorMessage(
  response: ApiResponse | null,
  status: number,
) {
  if (
    response &&
    typeof response.message === "string" &&
    response.message.trim()
  ) {
    return response.message.trim();
  }

  if (status === 401) {
    return "انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى.";
  }

  if (status === 403) {
    return "ليس لديك صلاحية لتعديل الطلب.";
  }

  if (status === 404) {
    return "الطلب غير موجود.";
  }

  if (status >= 500) {
    return "حدث خطأ في الخادم أثناء تحديث الطلب.";
  }

  return "تعذر تحديث الطلب. حاول مرة أخرى.";
}

export default function OrderStatusControls({
  orderId,
  initialStatus,
  initialPaymentStatus,
}: OrderStatusControlsProps) {
  const router = useRouter();

  const normalizedInitialStatus = isOrderStatus(
    initialStatus,
  )
    ? initialStatus
    : "PENDING";

  const normalizedInitialPaymentStatus =
    isPaymentStatus(initialPaymentStatus)
      ? initialPaymentStatus
      : "PENDING";

  const [status, setStatus] = useState<OrderStatus>(
    normalizedInitialStatus,
  );

  const [savedStatus, setSavedStatus] =
    useState<OrderStatus>(
      normalizedInitialStatus,
    );

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>(
      normalizedInitialPaymentStatus,
    );

  const [
    savedPaymentStatus,
    setSavedPaymentStatus,
  ] = useState<PaymentStatus>(
    normalizedInitialPaymentStatus,
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] =
    useState<FeedbackState>(null);

  const hasChanges =
    status !== savedStatus ||
    paymentStatus !== savedPaymentStatus;

  async function saveChanges() {
    if (saving || !hasChanges) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payload: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
    } = {};

    if (status !== savedStatus) {
      payload.status = status;
    }

    if (
      paymentStatus !== savedPaymentStatus
    ) {
      payload.paymentStatus = paymentStatus;
    }

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(
          orderId,
        )}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify(payload),
        },
      );

      const responseBody = (await response
        .json()
        .catch(() => null)) as ApiResponse | null;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            responseBody,
            response.status,
          ),
        );
      }

      const updatedStatus =
        responseBody?.order?.status;

      const updatedPaymentStatus =
        responseBody?.order?.paymentStatus;

      const nextSavedStatus =
        typeof updatedStatus === "string" &&
        isOrderStatus(updatedStatus)
          ? updatedStatus
          : status;

      const nextSavedPaymentStatus =
        typeof updatedPaymentStatus ===
          "string" &&
        isPaymentStatus(updatedPaymentStatus)
          ? updatedPaymentStatus
          : paymentStatus;

      setStatus(nextSavedStatus);
      setSavedStatus(nextSavedStatus);

      setPaymentStatus(
        nextSavedPaymentStatus,
      );
      setSavedPaymentStatus(
        nextSavedPaymentStatus,
      );

      setFeedback({
        type: "success",
        message:
          responseBody?.message ||
          "تم تحديث الطلب بنجاح.",
      });

      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء تحديث الطلب.",
      });
    } finally {
      setSaving(false);
    }
  }

  function resetChanges() {
    if (saving) {
      return;
    }

    setStatus(savedStatus);
    setPaymentStatus(
      savedPaymentStatus,
    );
    setFeedback(null);
  }

  return (
    <section className="rounded-3xl border border-lime-300/15 bg-lime-300/[.05] p-5 shadow-2xl sm:p-6">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
          <PackageCheck
            aria-hidden="true"
            size={22}
          />
        </div>

        <div>
          <h2 className="text-xl font-black">
            إدارة الطلب
          </h2>

          <p className="mt-2 text-sm leading-7 text-white/50">
            حدّث حالة تنفيذ الطلب وحالة الدفع،
            ثم اضغط حفظ التغييرات.
          </p>
        </div>
      </div>

      {feedback ? (
        <div
          role={
            feedback.type === "error"
              ? "alert"
              : "status"
          }
          aria-live="polite"
          className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm leading-7 ${
            feedback.type === "success"
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/25 bg-red-400/10 text-red-100"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2
              aria-hidden="true"
              size={20}
              className="mt-1 shrink-0 text-emerald-300"
            />
          ) : (
            <AlertCircle
              aria-hidden="true"
              size={20}
              className="mt-1 shrink-0 text-red-300"
            />
          )}

          <p>{feedback.message}</p>
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-black text-white/75">
            <PackageCheck
              aria-hidden="true"
              size={16}
              className="text-lime-300"
            />

            حالة الطلب
          </span>

          <select
            value={status}
            disabled={saving}
            onChange={(event) => {
              const value = event.target.value;

              if (isOrderStatus(value)) {
                setStatus(value);
                setFeedback(null);
              }
            }}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ORDER_STATUSES.map(
              (orderStatus) => (
                <option
                  key={orderStatus.value}
                  value={orderStatus.value}
                >
                  {orderStatus.label}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-black text-white/75">
            <CreditCard
              aria-hidden="true"
              size={16}
              className="text-lime-300"
            />

            حالة الدفع
          </span>

          <select
            value={paymentStatus}
            disabled={saving}
            onChange={(event) => {
              const value = event.target.value;

              if (
                isPaymentStatus(value)
              ) {
                setPaymentStatus(value);
                setFeedback(null);
              }
            }}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {PAYMENT_STATUSES.map(
              (currentPaymentStatus) => (
                <option
                  key={
                    currentPaymentStatus.value
                  }
                  value={
                    currentPaymentStatus.value
                  }
                >
                  {
                    currentPaymentStatus.label
                  }
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {hasChanges ? (
        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/[.07] p-4 text-sm leading-7 text-amber-100">
          توجد تغييرات لم يتم حفظها بعد.
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={saveChanges}
          disabled={saving || !hasChanges}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-black text-[#071109] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <Loader2
              aria-hidden="true"
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save
              aria-hidden="true"
              size={18}
            />
          )}

          {saving
            ? "جاري الحفظ..."
            : "حفظ التغييرات"}
        </button>

        <button
          type="button"
          onClick={resetChanges}
          disabled={saving || !hasChanges}
          className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold text-white/65 transition hover:border-lime-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          إلغاء التغييرات
        </button>
      </div>
    </section>
  );
}