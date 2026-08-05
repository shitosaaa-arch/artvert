import {
  Bug,
  Camera,
  CircleDot,
  Droplets,
  Flower2,
  Leaf,
  MessageCircle,
  Sprout,
} from "lucide-react";

const problems = [
  {
    icon: Leaf,
    title: "اصفرار الأوراق",
    text: "قد يكون بسبب نقص العناصر أو زيادة الري أو مشاكل الجذور.",
    treatment:
      "فحص الري والتربة، واستخدام برنامج تغذية مناسب يحتوي على العناصر الصغرى.",
  },
  {
    icon: Droplets,
    title: "ذبول النبات",
    text: "غالبًا بسبب مشاكل الجذور أو نقص المياه أو حرارة زائدة.",
    treatment:
      "فحص الجذور وتقليل الإجهاد وتحسين التهوية واستخدام منشطات جذور.",
  },
  {
    icon: Bug,
    title: "إصابات الحشرات",
    text: "مثل المن والذبابة البيضاء والعناكب.",
    treatment:
      "تحديد نوع الحشرة واختيار المبيد المناسب حسب الإصابة.",
  },
  {
    icon: CircleDot,
    title: "بقع على الأوراق",
    text: "قد تكون إصابة فطرية أو نقص عنصر غذائي.",
    treatment:
      "تشخيص السبب أولًا ثم استخدام المعاملة المناسبة.",
  },
  {
    icon: Sprout,
    title: "ضعف النمو",
    text: "النبات لا ينمو بشكل طبيعي أو الأوراق صغيرة.",
    treatment:
      "تحسين التغذية واستخدام منشطات النمو والعناصر المطلوبة.",
  },
  {
    icon: Flower2,
    title: "مشاكل نباتات المنزل",
    text: "مثل سقوط الأوراق وضعف النباتات الداخلية.",
    treatment:
      "ضبط الإضاءة والري واستخدام التغذية المناسبة للنباتات المنزلية.",
  },
] as const;

export default function PlantCarePage() {
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

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* قسم الهيدر (العنوان الرئيسي) */}
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <Leaf size={16} />
            الرعاية والتشخيص
          </span>

          <h1 className="mt-6 text-4xl font-black text-lime-300 drop-shadow-[0_0_25px_rgba(200,243,63,0.3)] sm:text-5xl lg:text-6xl">
            تشخيص مشاكل النبات
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/80">
            تعرف على أشهر مشاكل النباتات وأسبابها وطرق العلاج المناسبة مع فريق
            ArtVert.
          </p>
        </section>

        {/* شبكة المشاكل والعلاجات */}
        <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {problems.map((problem) => {
            const Icon = problem.icon;

            return (
              <article
                key={problem.title}
                className="group rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/80 p-7 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-lime-300/40 hover:shadow-[0_15px_30px_rgba(200,243,63,0.15)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300 transition duration-300 group-hover:scale-110 group-hover:bg-lime-300/20">
                  <Icon size={25} />
                </div>

                <h2 className="mt-6 text-2xl font-black text-white">
                  {problem.title}
                </h2>

                <p className="mt-4 leading-8 text-white/60">
                  {problem.text}
                </p>

                <div className="mt-6 rounded-2xl border border-white/5 bg-white/[.02] p-5 backdrop-blur-md">
                  <h3 className="text-sm font-black text-lime-300">
                    العلاج
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-white/70">
                    {problem.treatment}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        {/* قسم CTA (التشخيص بالصور) */}
        <section className="mx-auto mt-20 max-w-5xl rounded-[32px] border border-lime-300/20 bg-[#0b1a0e]/95 px-6 py-12 text-center shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl sm:px-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <Camera size={16} />
            تشخيص بالصور
          </span>

          <h2 className="mt-6 text-4xl font-black text-white sm:text-5xl">
            عندك مشكلة في نباتك؟
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/70">
            ابعت صورة النبات لفريق ArtVert واحصل على التشخيص المناسب.
          </p>

          <a
            href="https://wa.me/201080040408?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A5%D8%B1%D8%B3%D8%A7%D9%84%20%D8%B5%D9%88%D8%B1%D8%A9%20%D9%84%D9%86%D8%A8%D8%A7%D8%AA%D9%8A%20%D9%84%D9%84%D8%AA%D8%B4%D8%AE%D9%8A%D8%B5."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-lime-300 px-10 text-base font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.25)] transition hover:scale-105 hover:bg-lime-200"
          >
            <MessageCircle size={18} />
            ابعت صورة النبات
          </a>
        </section>
      </div>
    </main>
  );
}