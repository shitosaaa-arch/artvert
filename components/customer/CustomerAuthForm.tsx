"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    const body = mode === "register" ? { email: form.get("email"), password: form.get("password"), displayName: form.get("displayName"), locale: "ar-EG" } : { email: form.get("email"), password: form.get("password") };
    const response = await fetch(`/api/customer/auth/${mode === "register" ? "register" : "login"}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) { setError("تعذّر إتمام الطلب. تحقّق من البيانات ثم حاول مرة أخرى."); setLoading(false); return; }
    router.push("/account"); router.refresh();
  }
  return <form onSubmit={submit} className="mx-auto grid max-w-md gap-4 rounded-2xl bg-white p-7 text-slate-900 shadow-xl" dir="rtl">
    <h1 className="text-2xl font-black">{mode === "register" ? "إنشاء حساب العميل" : "تسجيل الدخول"}</h1>
    {mode === "register" && <label className="grid gap-1 font-bold">الاسم الظاهر<input required name="displayName" maxLength={100} className="rounded border p-3" /></label>}
    <label className="grid gap-1 font-bold">البريد الإلكتروني<input required name="email" type="email" autoComplete="email" className="rounded border p-3" /></label>
    <label className="grid gap-1 font-bold">كلمة المرور<input required name="password" type="password" minLength={12} autoComplete={mode === "register" ? "new-password" : "current-password"} className="rounded border p-3" /></label>
    {mode === "register" && <p className="text-sm text-slate-600">كلمة المرور يجب أن تكون 12 حرفاً على الأقل.</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={loading} className="rounded bg-green-700 px-4 py-3 font-bold text-white disabled:opacity-50">{loading ? "جارٍ المعالجة…" : mode === "register" ? "إنشاء الحساب" : "دخول"}</button>
  </form>;
}
