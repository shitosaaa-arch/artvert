import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const sections = [
  {
    icon: PackageCheck,
    title: "استلام المنتجات",
    text: "يتم التأكد من سلامة المنتج عند الاستلام، وفي حالة وجود أي مشكلة يتم التواصل مع فريق ArtVert Egypt في أسرع وقت.",
  },
  {
    icon: RefreshCw,
    title: "حالات الاستبدال",
    text: "يتم النظر في طلبات الاستبدال في حالة وجود عيب في المنتج أو وصول منتج غير مطابق للطلب.",
  },
  {
    icon: ShieldCheck,
    title: "شروط الاستبدال",
    text: "يجب أن يكون المنتج بحالته الأصلية وغير مستخدم، مع التواصل خلال المدة المحددة من تاريخ الاستلام.",
  },
  {
    icon: MessageCircle,
    title: "التواصل",
    text: "لأي استفسارات خاصة بالطلبات أو المنتجات، يرجى التواصل مع خدمة العملاء عبر واتساب.",
  },
] as const;

const replacementSteps = [
  "تواصل مع خدمة العملاء مع توضيح رقم الطلب والمشكلة.",
  "أرسل صورًا واضحة للمنتج والعبوة عند وجود تلف أو عدم مطابقة.",
  "انتظر مراجعة الطلب وتأكيد الإجراء المناسب من فريق ArtVert.",
] as const;

export default function ReturnsPage() {
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
            <RefreshCw size={16} />
            خدمة ما بعد البيع
          </span>

          <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:mt-6 sm:text-5xl">
            سياسة الاستبدال والاسترجاع
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-white/68 sm:mt-6 sm:text-lg">
            توضح هذه الصفحة الحالات والشروط الخاصة باستبدال أو استرجاع منتجات ArtVert Egypt.
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
                خطوات طلب الاستبدال
              </h2>
              <p className="mt-1 text-xs text-white/40">
                اتبع الخطوات التالية لتسريع مراجعة طلبك
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {replacementSteps.map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-4"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime-300 text-xs font-black text-[#071109]">
                  {index + 1}
                </span>

                <p className="text-sm leading-7 text-white/64">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-lime-300/20 bg-[linear-gradient(135deg,rgba(200,243,63,.08),rgba(11,26,14,.92))] p-5 text-center shadow-[0_0_40px_rgba(200,243,63,0.10)] backdrop-blur-xl sm:mt-8 sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <CheckCircle2 size={15} />
            خدمة العملاء
          </span>

          <h2 className="mt-5 text-2xl font-black text-white sm:text-3xl">
            تحتاج مساعدة بخصوص طلبك؟
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/60">
            تواصل معنا عبر واتساب مع رقم الطلب وصور المنتج، وسيتولى فريق ArtVert مراجعة الحالة.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="https://wa.me/201080040408?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A7%D8%B3%D8%AA%D8%A8%D8%AF%D8%A7%D9%84%20%D8%A3%D9%88%20%D8%A7%D8%B3%D8%AA%D8%B1%D8%AC%D8%A7%D8%B9%20%D8%B7%D9%84%D8%A8%20%D9%85%D9%86%20ArtVert."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#21a366] px-7 text-sm font-black text-white shadow-[0_8px_25px_rgba(33,163,102,0.22)] transition hover:-translate-y-0.5 hover:bg-[#27b875]"
            >
              <MessageCircle size={18} />
              تواصل عبر واتساب
            </a>

            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-7 text-sm font-black text-white/78 transition hover:border-lime-300/35 hover:bg-white/[.08] hover:text-white"
            >
              صفحة التواصل
              <ArrowLeft size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
