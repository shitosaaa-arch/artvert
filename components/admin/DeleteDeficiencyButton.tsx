"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

type DeleteDeficiencyButtonProps = {
  deficiencyId: string;
  deficiencyName: string;
  onDeleted?: (deficiencyId: string) => void;
};

type DeleteDeficiencyResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default function DeleteDeficiencyButton({
  deficiencyId,
  deficiencyName,
  onDeleted,
}: DeleteDeficiencyButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function deleteDeficiency() {
    if (deleting) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/deficiencies/${encodeURIComponent(
          deficiencyId,
        )}`,
        {
          method: "DELETE",
          cache: "no-store",
        },
      );

      const body = (await response
        .json()
        .catch(() => null)) as
        | DeleteDeficiencyResponse
        | null;

      if (!response.ok) {
        throw new Error(
          body?.message ||
            body?.error ||
            "تعذر حذف نقص العنصر.",
        );
      }

      setOpen(false);
      onDeleted?.(deficiencyId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء حذف نقص العنصر.",
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
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-400/[.07] px-4 text-sm font-black text-red-200 transition hover:bg-red-400/15"
      >
        <Trash2
          aria-hidden="true"
          size={16}
        />

        حذف
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-deficiency-title-${deficiencyId}`}
        >
          <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-[#0b2118] p-5 shadow-2xl sm:p-6">
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
                    id={`delete-deficiency-title-${deficiencyId}`}
                    className="text-xl font-black text-white"
                  >
                    تأكيد حذف نقص العنصر
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-white/55">
                    سيتم حذف سجل{" "}
                    <strong className="text-red-200">
                      {deficiencyName}
                    </strong>{" "}
                    وكل البيانات التابعة له التي تسمح قاعدة
                    البيانات بحذفها.
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
                <X
                  aria-hidden="true"
                  size={18}
                />
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
                onClick={deleteDeficiency}
                disabled={deleting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
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
                  ? "جاري الحذف..."
                  : "نعم، حذف السجل"}
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="min-h-12 rounded-xl border border-white/10 bg-white/[.04] px-5 text-sm font-bold text-white/65 transition hover:border-emerald-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
