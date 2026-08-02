import type { DoctorCandidate, DoctorChatResponse } from "@/lib/doctor/chat-contract";

const confidenceCopy = { HIGH: "مرجح", MODERATE: "محتمل", LOW: "أقل احتمالاً", INSUFFICIENT: "معلومات غير كافية" } as const;
const confidenceStyle = { HIGH: "bg-green-500/20 text-green-100 border-green-300/50", MODERATE: "bg-amber-500/20 text-amber-100 border-amber-300/50", LOW: "bg-slate-500/30 text-slate-100 border-slate-300/50", INSUFFICIENT: "bg-slate-500/30 text-slate-100 border-slate-300/50" } as const;

function List({ title, items, tone = "text-green-50/85" }: { title: string; items: string[]; tone?: string }) {
  if (items.length === 0) return null;
  return <section className="mt-4"><h4 className="text-sm font-black text-lime-200">{title}</h4><ul className={`mt-2 space-y-2 text-sm leading-6 ${tone}`}>{items.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}</ul></section>;
}

function CandidateCard({ candidate, primary = false }: { candidate: DoctorCandidate; primary?: boolean }) {
  return <article className={`rounded-2xl border p-5 ${primary ? "border-lime-300/60 bg-green-950/45" : "border-green-700/60 bg-black/15"}`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-black text-white"><bdi>{candidate.name}</bdi></h3><span className={`rounded-full border px-3 py-1 text-xs font-black ${confidenceStyle[candidate.confidence]}`}>{confidenceCopy[candidate.confidence]}</span></div>
    <p className="mt-3 text-sm leading-7 text-green-50/85">{candidate.explanation}</p>
    <List title="الأدلة المتوافقة" items={candidate.matchedEvidence.map((item) => item.detail)} />
    <List title="معلومات ما زالت مطلوبة" items={candidate.missingEvidence} />
    <List title="تناقضات يجب التحقق منها" items={candidate.contradictions} tone="text-amber-100" />
    <List title="أدلة لا تدعم هذا الاحتمال" items={candidate.excludedEvidence} tone="text-green-50/65" />
  </article>;
}

function Treatment({ result }: { result: DoctorChatResponse }) {
  const treatment = result.treatment;
  return <section className="mt-6 space-y-4" aria-label="الإرشادات والتوصيات">
    <List title="إجراءات فورية غير متعلقة بالمنتجات" items={treatment.immediateActions} />
    <List title="خطوات المتابعة" items={treatment.monitoringSteps} />
    <List title="إرشادات العلاج" items={treatment.treatmentGuidance} />
    {treatment.products.length > 0 ? <section><h3 className="text-base font-black text-lime-200">توصيات منتجات ArtVert</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{treatment.products.map((product) => <article key={product.productId} className="rounded-2xl border border-green-600/60 bg-green-900/20 p-4"><h4 className="font-black text-white"><bdi>{product.name}</bdi></h4><p className="mt-2 text-sm leading-6 text-green-50/80">{product.reason}</p>{product.compatibilityWarning ? <p role="note" className="mt-3 rounded-lg bg-amber-400/15 p-2 text-xs leading-5 text-amber-100">تنبيه توافق: {product.compatibilityWarning}</p> : null}</article>)}</div></section> : null}
    <List title="تحذيرات وموانع الاستخدام" items={[...treatment.contraindications, ...treatment.unknownCompatibilityWarnings]} tone="text-amber-100" />
  </section>;
}

export function DoctorResult({ result }: { result: DoctorChatResponse }) {
  const leader = result.candidates[0];
  const isUnavailable = result.status === "unavailable" || result.status === "session_expired" || result.status === "knowledge_release_unavailable";
  if (isUnavailable) return <p className="text-sm leading-7 text-amber-100">{result.error || "لا يمكن متابعة التشخيص في هذه الجلسة حالياً."}</p>;
  return <div className="space-y-5">
    {result.plant.resolved ? <section className="rounded-2xl border border-green-700/60 bg-green-900/20 p-4"><h3 className="font-black text-lime-200">النبات المحدد</h3><p className="mt-2 text-white"><bdi>{result.plant.resolved.name}</bdi></p></section> : null}
    {leader ? <section><h2 className="text-xl font-black text-lime-200">{result.status === "insufficient_information" ? "ما زلنا نحتاج معلومات" : "الاحتمال الأرجح"}</h2><div className="mt-3"><CandidateCard candidate={leader} primary /></div></section> : <p className="rounded-2xl border border-green-700/60 p-4 text-sm leading-7 text-green-50/80">صف ما تراه على النبات لنبدأ بفهم الحالة.</p>}
    {result.candidates.length > 1 ? <section><h2 className="text-xl font-black text-lime-200">احتمالات أخرى</h2><div className="mt-3 space-y-3">{result.candidates.slice(1).map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}</div></section> : null}
    {result.emergencyFlags.length > 0 ? <section role="alert" className="rounded-2xl border border-amber-300/60 bg-amber-500/15 p-4"><h3 className="font-black text-amber-100">تنبيه عاجل</h3><List title="" items={result.emergencyFlags} tone="text-amber-50" /></section> : null}
    <Treatment result={result} />
    {result.disclaimer ? <p role="note" className="border-t border-green-700/50 pt-4 text-xs leading-6 text-green-50/60">{result.disclaimer}</p> : null}
    {result.knowledgeRelease.version ? <details className="text-xs text-green-50/60"><summary className="cursor-pointer font-bold text-green-50/80">مصدر المعرفة المستخدم</summary><p className="mt-2" dir="ltr">{result.knowledgeRelease.version} · {result.knowledgeRelease.manifestChecksum}</p></details> : null}
  </div>;
}
