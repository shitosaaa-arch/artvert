import Link from "next/link";
import {
  BookOpen,
  Droplets,
  Flower2,
  Leaf,
  MessageCircle,
  Sprout,
  Sun,
} from "lucide-react";

const articles = [
  {
    title: "طريقة العناية بالنباتات المنزلية",
    icon: Flower2,
    description:
      "أهم النصائح للحفاظ على نباتات المنزل قوية وصحية من حيث الإضاءة والري والتغذية.",
  },
  {
    title: "أسباب اصفرار أوراق النباتات وعلاجها",
    icon: Leaf,
    description:
      "تعرف على أسباب اصفرار الأوراق وكيفية تحديد المشكلة واختيار العلاج المناسب.",
  },
  {
    title: "برنامج تغذية النبات للحصول على نمو قوي",
    icon: Sprout,
    description:
      "أهمية العناصر الكبرى والصغرى ومراحل استخدام الأسمدة والمنشطات.",
  },
  {
    title: "مشاكل زيادة الري وطرق علاجها",
    icon: Droplets,
    description:
      "كيف تؤثر زيادة المياه على الجذور وكيف تحافظ على توازن الري.",
  },
  {
    title: "أفضل وقت لرش النباتات",
    icon: Sun,
    description:
      "تعرف على الوقت المناسب للرش لتحقيق أفضل امتصاص وتقليل الإجهاد.",
  },
  {
    title: "العناية بالنباتات في فصل الصيف",
    icon: Sun,
    description:
      "طرق حماية النباتات من الحرارة والجفاف وتحسين مقاومتها.",
  },
] as const;

export default function BlogPage() {
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
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <BookOpen size={16} />
            الإرشادات الزراعية
          </span>

          <h1 className="mt-6 text-4xl font-black text-lime-300 drop-shadow-[0_0_25px_rgba(200,243,63,0.3)] sm:text-5xl lg:text-6xl">
            معلومات ونصائح زراعية
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/80">
            معلومات ونصائح زراعية تساعدك على العناية بالنباتات وتحقيق أفضل نمو
            وإنتاج.
          </p>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => {
            const Icon = article.icon;

            return (
              <article
                key={article.title}
                className="group flex h-full flex-col rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/80 p-7 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-lime-300/40 hover:shadow-[0_15px_30px_rgba(200,243,63,0.15)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300 transition duration-300 group-hover:scale-110 group-hover:bg-lime-300/20">
                  <Icon size={25} />
                </div>

                <h2 className="mt-6 text-2xl font-black text-white">
                  {article.title}
                </h2>

                <p className="mt-4 leading-8 text-white/60">
                  {article.description}
                </p>

                <button
                  type="button"
                  className="mt-auto flex w-fit items-center gap-2 pt-8 text-sm font-bold text-lime-300 transition hover:text-lime-200 group-hover:translate-x-[-4px]"
                >
                  <BookOpen size={17} />
                  اقرأ المزيد
                </button>
              </article>
            );
          })}
        </section>

        {/* CTA Section (تحتاج استشارة لنباتك) */}
        <section className="mx-auto mt-20 max-w-5xl rounded-[32px] border border-lime-300/20 bg-[#0b1a0e]/95 px-6 py-12 text-center shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl sm:px-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <MessageCircle size={16} />
            مساعدة زراعية
          </span>

          <h2 className="mt-6 text-4xl font-black text-white sm:text-5xl">
            تحتاج استشارة لنباتك؟
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/70">
            تواصل معنا واحصل على نصيحة زراعية مناسبة.
          </p>

          <Link
            href="/plant-care"
            className="mt-8 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-lime-300 px-10 text-base font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.25)] transition hover:scale-105 hover:bg-lime-200"
          >
            <Leaf size={18} />
            تشخيص النبات
          </Link>
        </section>
      </div>
    </main>
  );
}