import type { DoctorCharacterState } from "@/lib/doctor/chat-contract";

const copy: Record<DoctorCharacterState, { title: string; detail: string; icon: string }> = {
  WELCOME: { title: "دكتور ArtVert", detail: "ابدأ بوصف النبات والأعراض الظاهرة.", icon: "🌿" },
  THINKING: { title: "أرتّب الملاحظات", detail: "أراجع المعلومات المتاحة بأمان.", icon: "🔎" },
  ASKING: { title: "أحتاج ملاحظة إضافية", detail: "إجابتك تساعد في تضييق الاحتمالات.", icon: "💬" },
  DIAGNOSIS_READY: { title: "ملخص التشخيص", detail: "هذه إرشادات مساعدة وليست تشخيصاً مؤكداً.", icon: "🌱" },
  WARNING: { title: "انتبه للنبات", detail: "توجد ملاحظة تتطلب فحصاً أسرع أو استشارة مختص.", icon: "⚠️" },
  UNAVAILABLE: { title: "الخدمة غير متاحة الآن", detail: "يمكنك المحاولة مرة أخرى بعد قليل.", icon: "⏳" },
  SESSION_EXPIRED: { title: "انتهت الجلسة", detail: "سيبقى الملخص ظاهراً، لكن يلزم بدء جلسة جديدة للمتابعة.", icon: "🔒" },
};

export function DoctorCharacter({ state }: { state: DoctorCharacterState }) {
  const current = copy[state];
  return (
    <aside aria-label={current.title} className="relative overflow-hidden rounded-3xl border border-green-700/60 bg-gradient-to-br from-[#173625] via-[#1d2c20] to-[#141414] p-6 shadow-2xl shadow-black/20">
      <div aria-hidden="true" className="absolute -left-8 -top-10 h-32 w-32 rounded-full bg-lime-300/10 blur-2xl" />
      <div className="relative flex items-center gap-4 lg:block lg:text-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-green-300/30 bg-green-900/50 text-4xl lg:mx-auto lg:h-28 lg:w-28 lg:text-5xl">{current.icon}</div>
        <div className={state === "THINKING" ? "motion-safe:animate-pulse" : ""}>
          <p className="text-xl font-black text-lime-300">{current.title}</p>
          <p className="mt-2 text-sm leading-7 text-green-50/80">{current.detail}</p>
        </div>
      </div>
    </aside>
  );
}
