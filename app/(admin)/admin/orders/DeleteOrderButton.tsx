"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

type DeleteOrderButtonProps = {
  orderId: string;
  orderNumber: string;
  customerName: string;
};

type DeleteOrderResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default function DeleteOrderButton({
  orderId,
  orderNumber,
  customerName,
}: DeleteOrderButtonProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function deleteOrder() {
    if (deleting) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}`,
        {
          method: "DELETE",
          cache: "no-store",
        },
      );

      const responseBody = (await response
        .json()
        .catch(() => null)) as DeleteOrderResponse | null;

      if (!response.ok) {
        throw new Error(
          responseBody?.message ||
            responseBody?.error ||
            "تعذر حذف الطلب.",
        );
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء حذف الطلب.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorMessage("");
          setOpen(true);
        }}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-400/[.07] px-4 text-sm font-black text-red-200 transition hover:bg-red-400/15"
      >
        <Trash2 aria-hidden="true" size={17} />
        حذف الطلب
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-order-title-${orderId}`}
        >
          <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-400/10 text-red-300">
                  <AlertTriangle
                    aria-hidden="true"
                    size={22}
                  />
                </div>

                <div>
                  <h2
                    id={`delete-order-title-${orderId}`}
                    className="text-xl font-black text-white"
                  >
                    تأكيد حذف الطلب
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-white/55">
                    سيتم حذف الطلب{" "}
                    <strong
                      className="text-red-200"
                      dir="ltr"
                    >
                      {orderNumber}
                    </strong>{" "}
                    الخاص بالعميل{" "}
                    <strong className="text-white">
                      {customerName}
                    </strong>{" "}
                    مع جميع المنتجات المرتبطة به.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!deleting) {
                    setOpen(false);
                  }
                }}
                disabled={deleting}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="إغلاق"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-red-400/15 bg-red-400/[.05] p-4 text-sm leading-7 text-red-100/75">
              عملية الحذف نهائية ولا يمكن التراجع عنها.
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm leading-7 text-red-100"
              >
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={deleteOrder}
                disabled={deleting}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2
                    aria-hidden="true"
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    aria-hidden="true"
                    size={18}
                  />
                )}

                {deleting
                  ? "جاري حذف الطلب..."
                  : "نعم، حذف الطلب"}
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="min-h-12 rounded-xl border border-white/10 bg-white/[.04] px-5 text-sm font-bold text-white/65 transition hover:border-lime-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}