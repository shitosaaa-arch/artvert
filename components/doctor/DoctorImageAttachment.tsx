"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  sessionId?: string;
  disabled: boolean;
  onReady: (
    reference: string,
    sessionId: string,
  ) => void;
  onRemove: () => void;
};

type ImageUploadResponse = {
  status?: string;
  sessionId?: string;
  imageRef?: string;
  qualityFindings?: string[];
  recaptureGuidance?: string[];
  error?: string;
};

export function DoctorImageAttachment({
  sessionId,
  disabled,
  onReady,
  onRemove,
}: Props) {
  const [
    preview,
    setPreview,
  ] = useState<string>();

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(
          preview,
        );
      }
    };
  }, [preview]);

  function clearPreview() {
    if (preview) {
      URL.revokeObjectURL(
        preview,
      );
    }

    setPreview(undefined);
    setMessage("");
    onRemove();

    if (inputRef.current) {
      inputRef.current.value =
        "";
    }
  }

  async function choose(
    file: File | undefined,
  ) {
    if (
      !file ||
      disabled ||
      uploading
    ) {
      return;
    }

    if (preview) {
      URL.revokeObjectURL(
        preview,
      );
    }

    const nextPreview =
      URL.createObjectURL(file);

    setPreview(nextPreview);
    setUploading(true);
    setMessage(
      "جارٍ تجهيز الصورة…",
    );

    const body =
      new FormData();

    if (sessionId) {
      body.set(
        "sessionId",
        sessionId,
      );
    }

    body.set(
      "image",
      file,
    );

    try {
      const response =
        await fetch(
          "/api/doctor/images",
          {
            method: "POST",
            body,
          },
        );

      const result =
        (await response.json()) as
          ImageUploadResponse;

      if (
        !response.ok ||
        !result.imageRef ||
        !result.sessionId
      ) {
        throw new Error(
          result.error ||
            "IMAGE_UPLOAD_FAILED",
        );
      }

      onReady(
        result.imageRef,
        result.sessionId,
      );

      const guidance =
        result.recaptureGuidance
          ?.filter(Boolean)
          .join(" ");

      const quality =
        result.qualityFindings
          ?.filter(Boolean)
          .join(" ");

      if (
        result.status ===
        "image_quality_insufficient"
      ) {
        setMessage(
          guidance ||
            quality ||
            "الصورة وصلت، لكن الأفضل إرسال صورة أوضح قبل التشخيص.",
        );
      } else {
        setMessage(
          guidance ||
            "الصورة جاهزة للتحليل عند إرسال رسالتك.",
        );
      }
    } catch {
      URL.revokeObjectURL(
        nextPreview,
      );

      setPreview(undefined);
      setMessage(
        "تعذر رفع الصورة. جرّب صورة أوضح أو أصغر حجمًا.",
      );

      onRemove();

      if (inputRef.current) {
        inputRef.current.value =
          "";
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <section
      className="mt-4 rounded-xl border border-green-700/60 p-3"
      aria-label="إرفاق صورة للنبات"
    >
      <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-lime-300/60 px-4 py-2 text-sm font-bold text-lime-100 transition hover:bg-lime-300/10">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          disabled={
            disabled ||
            uploading
          }
          onChange={(event) => {
            const file =
              event.target
                .files?.[0];

            void choose(file);
          }}
          className="sr-only"
        />

        {uploading
          ? "جارٍ رفع الصورة…"
          : "التقاط أو اختيار صورة"}
      </label>

      {preview ? (
        <div className="mt-3 flex items-center gap-3">
          <img
            src={preview}
            alt="معاينة صورة النبات المرفقة"
            className="h-20 w-20 rounded-xl object-cover"
          />

          <button
            type="button"
            onClick={
              clearPreview
            }
            disabled={
              uploading
            }
            className="min-h-11 rounded-xl px-3 text-sm text-amber-100 underline disabled:opacity-50"
          >
            إزالة الصورة
          </button>
        </div>
      ) : null}

      {message ? (
        <p
          role="status"
          className="mt-2 text-xs leading-6 text-green-50/75"
        >
          {message}
        </p>
      ) : (
        <p className="mt-2 text-xs leading-6 text-green-50/55">
          يمكنك إرسال الصورة من أول رسالة. الصور مؤقتة ولا تُحفظ بشكل دائم.
        </p>
      )}
    </section>
  );
}
