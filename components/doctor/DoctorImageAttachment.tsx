"use client";

import { useEffect, useState } from "react";

type Props = { sessionId?: string; disabled: boolean; onReady: (reference: string) => void; onRemove: () => void };

export function DoctorImageAttachment({ sessionId, disabled, onReady, onRemove }: Props) {
  const [preview, setPreview] = useState<string>();
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function choose(file: File | undefined) {
    if (!file || !sessionId || disabled || uploading) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setMessage("جارٍ فحص الصورة…");
    const body = new FormData(); body.set("sessionId", sessionId); body.set("image", file);
    try {
      const response = await fetch("/api/doctor/images", { method: "POST", body });
      const result = await response.json() as { status?: string; imageRef?: string; recaptureGuidance?: string[] };
      if (!response.ok || !result.imageRef) throw new Error();
      onReady(result.imageRef);
      setMessage(result.recaptureGuidance?.join(" ") || "الصورة جاهزة للمراجعة عند إرسال رسالتك التالية.");
    } catch { setMessage("تعذر استخدام الصورة. تظل رسالتك النصية متاحة للإرسال."); setPreview(undefined); onRemove(); }
    finally { setUploading(false); }
  }
  if (!sessionId) return <p className="mt-4 text-xs leading-6 text-green-50/60">يمكن إضافة صورة واحدة بعد بدء الجلسة. الصور مؤقتة وخاصة ولا تُحفظ بشكل دائم.</p>;
  return <section className="mt-4 rounded-xl border border-green-700/60 p-3" aria-label="إرفاق صورة للنبات"><label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-lime-300/60 px-4 py-2 text-sm font-bold text-lime-100"><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={disabled || uploading} onChange={(event) => void choose(event.target.files?.[0])} className="sr-only" />التقاط أو اختيار صورة</label>{preview ? <div className="mt-3 flex items-center gap-3"><img src={preview} alt="معاينة صورة النبات المرفقة" className="h-16 w-16 rounded-lg object-cover" /><button type="button" onClick={() => { URL.revokeObjectURL(preview); setPreview(undefined); setMessage(""); onRemove(); }} disabled={uploading} className="min-h-11 rounded-xl px-3 text-sm text-amber-100 underline">إزالة الصورة</button></div> : null}{message ? <p role="status" className="mt-2 text-xs leading-6 text-green-50/75">{message}</p> : null}</section>;
}
