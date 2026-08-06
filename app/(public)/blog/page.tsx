import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Droplets,
  Flower2,
  Leaf,
  MessageCircle,
  Search,
  Sparkles,
  Sprout,
  Sun,
} from "lucide-react";

const articles = [
  {
    slug: "home-plant-care",
    title: "طريقة العناية بالنباتات المنزلية",
    icon: Flower2,
    category: "نباتات منزلية",
    description:
      "أهم النصائح للحفاظ على نباتات المنزل قوية وصحية من حيث الإضاءة والري والتغذية.",
  },
  {
    slug: "yellow-leaves",
    title: "أسباب اصفرار أوراق النباتات وعلاجها",
    icon: Leaf,
    category: "تشخيص",
    description:
      "تعرف على أسباب اصفرار الأوراق وكيفية تحديد المشكلة واختيار العلاج المناسب.",
  },
  {
    slug: "plant-nutrition",
    title: "برنامج تغذية النبات للحصول على نمو قوي",
    icon: Sprout,
    category: "تغذية النبات",
    description:
      "أهمية العناصر الكبرى والصغرى ومراحل استخدام الأسمدة والمنشطات.",
  },
  {
    slug: "overwatering",
    title: "مشاكل زيادة الري وطرق علاجها",
    icon: Droplets,
    category: "الري",
    description:
      "كيف تؤثر زيادة المياه على الجذور وكيف تحافظ على توازن الري.",
  },
  {
    slug: "best-spray-time",
    title: "أفضل وقت لرش النباتات",
    icon: Sun,
    category: "الرش",
    description:
      "تعرف على الوقت المناسب للرش لتحقيق أفضل امتصاص وتقليل الإجهاد.",
  },
  {
    slug: "summer-care",
    title: "العناية بالنباتات في فصل الصيف",
    icon: Sun,
    category: "العناية الموسمية",
    description:
      "طرق حماية النباتات من الحرارة والجفاف وتحسين مقاومتها.",
  },
] as const;

export default function BlogPage() {
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

      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <BookOpen size={16} />
            الإرشادات الزراعية
          </span>

          <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:mt-6 sm:text-5xl lg:text-6xl">
            معلومات ونصائح زراعية
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-8 text-white/68 sm:mt-6 sm:text-lg">
            محتوى مبسط يساعدك على فهم احتياجات النبات، تشخيص المشكلات الشائعة، وتحسين الرعاية اليومية.
          </p>

          <div className="mx-auto mt-7 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-[#0b1a0e]/72 p-2 backdrop-blur-xl">
            <Search
              size={18}
              className="mr-2 shrink-0 text-lime-300"
            />

            <input
              type="search"
              placeholder="ابحث في الإرشادات الزراعية..."
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/35"
            />

            <button
              type="button"
              className="min-h-10 rounded-xl bg-lime-300 px-4 text-xs font-black text-[#071109] sm:px-5 sm:text-sm"
            >
              بحث
            </button>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article, index) => {
            const Icon = article.icon;

            return (
              <article
                key={article.title}
                className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/84 shadow-[0_16px_38px_rgba(0,0,0,.22)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-lime-300/35 hover:shadow-[0_18px_42px_rgba(200,243,63,.10)]"
              >
                <div className="relative min-h-[145px] border-b border-white/[.06] bg-[radial-gradient(circle_at_75%_20%,rgba(200,243,63,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.03),rgba(255,255,255,.01))] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full border border-lime-300/18 bg-lime-300/[.08] px-3 py-1 text-[11px] font-black text-lime-300">
                      {article.category}
                    </span>

                    <span className="text-3xl font-black text-white/[.08]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="mt-5 grid h-14 w-14 place-items-center rounded-2xl border border-lime-300/15 bg-lime-300/10 text-lime-300 transition duration-300 group-hover:scale-105 group-hover:bg-lime-300/15">
                    <Icon size={25} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h2 className="text-xl font-black leading-8 text-white sm:text-2xl">
                    {article.title}
                  </h2>

                  <p className="mt-4 text-sm leading-8 text-white/58">
                    {article.description}
                  </p>

                  <Link
                    href={`/blog/${article.slug}`}
                    className="mt-auto inline-flex w-fit items-center gap-2 pt-7 text-sm font-black text-lime-300 transition group-hover:-translate-x-1"
                  >
                    <BookOpen size={17} />
                    اقرأ المزيد
                    <ArrowLeft size={15} />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mx-auto mt-10 max-w-5xl rounded-[28px] border border-lime-300/20 bg-[linear-gradient(135deg,rgba(200,243,63,.08),rgba(11,26,14,.92))] px-5 py-10 text-center shadow-[0_0_40px_rgba(200,243,63,0.10)] backdrop-blur-xl sm:mt-16 sm:px-10 sm:py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <Sparkles size={15} />
            مساعدة زراعية
          </span>

          <h2 className="mt-6 text-3xl font-black text-white sm:text-5xl">
            تحتاج استشارة لنباتك؟
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-white/66 sm:text-base">
            دكتور ArtVert يساعدك في فهم المشكلة واختيار الخطوة التالية بشكل أوضح.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/doctor"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-7 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200"
            >
              <MessageCircle size={18} />
              اسأل دكتور ArtVert
            </Link>

            <Link
              href="/plant-care"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-7 text-sm font-black text-white/78 transition hover:border-lime-300/35 hover:bg-white/[.08] hover:text-white"
            >
              <Leaf size={18} />
              الرعاية الزراعية
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
