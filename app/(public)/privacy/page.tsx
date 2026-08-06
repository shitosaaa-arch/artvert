import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

const sections = [
  {
    icon: ShieldCheck,
    title: "مقدمة",
    text: "تحرص ArtVert Egypt على حماية خصوصية عملائها وزوار الموقع، ونلتزم باستخدام البيانات بطريقة آمنة لتحسين تجربة المستخدم وتقديم أفضل خدمة.",
  },
  {
    icon: Database,
    title: "البيانات التي يتم جمعها",
    text: "قد يتم جمع بيانات التواصل مثل الاسم ورقم الهاتف عند طلب المنتجات أو التواصل مع فريق الدعم.",
  },
  {
    icon: UserRoundCheck,
    title: "استخدام البيانات",
    text: "تستخدم البيانات للرد على الاستفسارات، متابعة الطلبات، وتحسين خدمات ومنتجات الشركة.",
  },
  {
    icon: LockKeyhole,
    title: "حماية المعلومات",
    text: "نحرص على حماية معلومات العملاء وعدم مشاركتها مع أي جهة خارجية بدون موافقة.",
  },
] as const;

const commitments = [
  "استخدام البيانات فقط للأغراض المرتبطة بالخدمة والطلب.",
  "اتخاذ إجراءات مناسبة لحماية المعلومات من الوصول غير المصرح به.",
  "عدم بيع بيانات العملاء أو مشاركتها لأغراض تسويقية خارجية.",
] as const;

export default function PrivacyPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#061008] py-10 text-white font-sans sm:py-14 lg:py-16"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_15%_6%,rgba(143,202,45,.12),transparent_25%),radial-gradient(circle_at_88%_18%,rgba(38,164,83,.12),transparent_27%),linear-gradient(145deg,#02150d_0%,#063220_48%,#02180f_100%)]" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-3 sm:px-6">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <ShieldCheck size={16} />
            الخصوصية والأمان
          </span>

          <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:mt-6 sm:text-5xl">
            سياسة الخصوصية
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-white/68 sm:mt-6 sm:text-lg">
            نوضح هنا كيفية التعامل مع بيانات العملاء وزوار موقع ArtVert Egypt وحمايتها.
          </p>
        </section>

        <section className="mt-8 rounded-[28px] border border-lime-300/15 bg-[#0b1a0e]/86 p-4 shadow-[0_18px_45px_rgba(0,0,0,.22)] backdrop-blur-xl sm:mt-12 sm:p-7">
          <div className="grid gap-4">
            {sections.map((section, index) => {
              const Icon = section.icon;

              return (
                <article
                  key={section.title}
                  className="group rounded-[22px] border border-white/[.06] bg-white/[.025] p-4 transition duration-300 hover:border-lime-300/20 hover:bg-white/[.04] sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-lime-300/15 bg-lime-300/10 text-lime-300 transition group-hover:scale-105">
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-black text-white sm:text-2xl">
                          {section.title}
                        </h2>

                        <span className="text-2xl font-black text-white/[.07]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-8 text-white/60 sm:text-base">
                        {section.text}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-[#0b1a0e]/72 p-5 shadow-xl backdrop-blur-xl sm:mt-8 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
              <Sparkles size={20} />
            </div>

            <div>
              <h2 className="text-xl font-black text-white sm:text-2xl">
                التزاماتنا تجاه بياناتك
              </h2>
              <p className="mt-1 text-xs text-white/40">
                مبادئ أساسية نتبعها في التعامل مع المعلومات
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {commitments.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-4"
              >
                <CheckCircle2
                  size={18}
                  className="mt-1 shrink-0 text-lime-300"
                />

                <p className="text-sm leading-7 text-white/64">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-lime-300/20 bg-[linear-gradient(135deg,rgba(200,243,63,.08),rgba(11,26,14,.92))] p-5 text-center shadow-[0_0_40px_rgba(200,243,63,.10)] backdrop-blur-xl sm:mt-8 sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <Mail size={15} />
            لديك استفسار؟
          </span>

          <h2 className="mt-5 text-2xl font-black text-white sm:text-3xl">
            تواصل معنا بخصوص الخصوصية
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/60">
            لو عندك سؤال عن بياناتك أو طريقة استخدامها، تقدر تتواصل مع فريق ArtVert مباشرة.
          </p>

          <Link
            href="/contact"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-7 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200"
          >
            تواصل معنا
            <ArrowLeft size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}
