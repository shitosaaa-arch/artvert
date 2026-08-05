import {
  MessageCircle,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
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

export default function ReturnsPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#061008] py-16 text-white font-sans"
      dir="rtl"
    >
      {/* شبكة الخلفية الخفيفة المدمجة مع التصميم (Subtle Grid Overlay) */}
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

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <RefreshCw size={16} />
            خدمة ما بعد البيع
          </span>

          <h1 className="mt-6 text-4xl font-black text-lime-300 drop-shadow-[0_0_25px_rgba(200,243,63,0.3)] sm:text-5xl">
            سياسة الاستبدال والاسترجاع
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80">
            توضح هذه الصفحة الحالات والشروط الخاصة باستبدال أو استرجاع منتجات
            ArtVert Egypt.
          </p>
        </section>

        <div className="mt-12 rounded-[32px] border border-lime-300/15 bg-[#0b1a0e]/80 p-6 shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl sm:p-10">
          <div className="grid gap-5">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <section
                  key={section.title}
                  className="rounded-2xl border border-white/5 bg-white/[.02] p-5 backdrop-blur-md transition duration-300 hover:border-lime-300/20 sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300 transition-transform duration-300 hover:scale-110">
                      <Icon size={21} />
                    </div>

                    <div>
                      <h2 className="text-2xl font-black text-white">
                        {section.title}
                      </h2>

                      <p className="mt-4 leading-9 text-white/60">
                        {section.text}
                      </p>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          <a
            href="https://wa.me/201080040408?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A7%D8%B3%D8%AA%D8%A8%D8%AF%D8%A7%D9%84%20%D8%A3%D9%88%20%D8%A7%D8%B3%D8%AA%D8%B1%D8%AC%D8%A7%D8%B9%20%D8%B7%D9%84%D8%A8%20%D9%85%D9%86%20ArtVert."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#21a366] px-6 font-black text-white shadow-[0_8px_25px_rgba(33,163,102,0.25)] transition hover:scale-[1.02] hover:bg-[#27b875]"
          >
            <MessageCircle size={18} />
            تواصل مع خدمة العملاء
          </a>
        </div>
      </div>
    </main>
  );
}