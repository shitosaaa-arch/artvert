"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Customer = { email: string; displayName: string; emailVerifiedAt: Date | string | null; historyOptIn: boolean; imageSavingOptIn: boolean; analyticsOptIn: boolean; marketingOptIn: boolean };
export default function CustomerAccount({ customer }: { customer: Customer }) {
  const router = useRouter(); const [state, setState] = useState(customer); const [notice, setNotice] = useState("");
  async function save() { const response = await fetch("/api/customer/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(state) }); setNotice(response.ok ? "تم حفظ إعدادات الحساب والخصوصية." : "تعذّر حفظ التغييرات."); if (response.ok) router.refresh(); }
  async function action(url: string, body?: object) { const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); setNotice(response.ok ? "تم استلام طلبك بشكل آمن." : "تعذّر إتمام الطلب."); }
  return <section className="mx-auto my-10 grid max-w-3xl gap-6 rounded-2xl bg-white p-6 text-slate-900 shadow-lg" dir="rtl">
    <header><h1 className="text-3xl font-black">حسابي</h1><p className="mt-2 text-slate-600">إدارة ملفك وخصوصيتك. لا تُحفظ محادثات الطبيب أو الصور المؤقتة تلقائياً.</p></header>
    <label className="grid gap-1 font-bold">الاسم الظاهر<input value={state.displayName} onChange={(event) => setState({ ...state, displayName: event.target.value })} className="rounded border p-3" /></label>
    <p className="text-sm">{state.email} {state.emailVerifiedAt ? "• البريد مُتحقّق" : "• البريد غير مُتحقّق"}</p>
    <fieldset className="grid gap-3 rounded border p-4"><legend className="px-1 font-black">الخصوصية والموافقات</legend>
      <label><input type="checkbox" checked={state.historyOptIn} onChange={(event) => setState({ ...state, historyOptIn: event.target.checked, imageSavingOptIn: event.target.checked ? state.imageSavingOptIn : false })} /> حفظ ملخصات التشخيص اختيارياً</label>
      <label><input type="checkbox" disabled={!state.historyOptIn} checked={state.imageSavingOptIn} onChange={(event) => setState({ ...state, imageSavingOptIn: event.target.checked })} /> حفظ الصور الخاصة لفترة محدودة (يتطلب حفظ السجل)</label>
      <label><input type="checkbox" checked={state.analyticsOptIn} onChange={(event) => setState({ ...state, analyticsOptIn: event.target.checked })} /> المساهمة في إحصاءات مجهّلة</label>
      <label><input type="checkbox" checked={state.marketingOptIn} onChange={(event) => setState({ ...state, marketingOptIn: event.target.checked })} /> رسائل المنتجات الاختيارية</label>
    </fieldset>
    <div className="flex flex-wrap gap-3"><button onClick={save} className="rounded bg-green-700 px-4 py-2 font-bold text-white">حفظ</button><button onClick={() => action("/api/customer/sessions/revoke")} className="rounded border border-slate-400 px-4 py-2">إنهاء الجلسات الأخرى</button><button onClick={() => action("/api/customer/jobs", { type: "DATA_EXPORT" })} className="rounded border border-slate-400 px-4 py-2">طلب نسخة من بياناتي</button><button onClick={() => action("/api/customer/jobs", { type: "ACCOUNT_DELETION" })} className="rounded border border-red-500 px-4 py-2 text-red-700">طلب حذف الحساب</button></div>
    {notice && <p role="status" className="font-bold text-green-800">{notice}</p>}
  </section>;
}
