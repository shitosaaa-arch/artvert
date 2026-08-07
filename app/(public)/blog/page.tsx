"use client";

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

import { useLanguage } from "@/components/i18n/LanguageProvider";

const articles = [
  {
    slug: "home-plant-care",
    titleAr: "طريقة العناية بالنباتات المنزلية",
    titleEn: "How to Care for Houseplants",
    icon: Flower2,
    categoryAr: "نباتات منزلية",
    categoryEn: "Houseplants",
    descriptionAr:
      "أهم النصائح للحفاظ على نباتات المنزل قوية وصحية من حيث الإضاءة والري والتغذية.",
    descriptionEn:
      "Essential tips to keep houseplants strong and healthy through proper lighting, watering, and nutrition.",
  },
  {
    slug: "yellow-leaves",
    titleAr: "أسباب اصفرار أوراق النباتات وعلاجها",
    titleEn: "Causes and Treatment of Yellowing Leaves",
    icon: Leaf,
    categoryAr: "تشخيص",
    categoryEn: "Diagnosis",
    descriptionAr:
      "تعرف على أسباب اصفرار الأوراق وكيفية تحديد المشكلة واختيار العلاج المناسب.",
    descriptionEn:
      "Learn the causes of yellowing leaves, how to identify the problem, and choose the appropriate treatment.",
  },
  {
    slug: "plant-nutrition",
    titleAr: "برنامج تغذية النبات للحصول على نمو قوي",
    titleEn: "Plant Nutrition Program for Strong Growth",
    icon: Sprout,
    categoryAr: "تغذية النبات",
    categoryEn: "Plant Nutrition",
    descriptionAr:
      "أهمية العناصر الكبرى والصغرى ومراحل استخدام الأسمدة والمنشطات.",
    descriptionEn:
      "The importance of macro- and micronutrients and the stages of using fertilizers and biostimulants.",
  },
  {
    slug: "overwatering",
    titleAr: "مشاكل زيادة الري وطرق علاجها",
    titleEn: "Overwatering Problems and How to Treat Them",
    icon: Droplets,
    categoryAr: "الري",
    categoryEn: "Watering",
    descriptionAr:
      "كيف تؤثر زيادة المياه على الجذور وكيف تحافظ على توازن الري.",
    descriptionEn:
      "How excess water affects roots and how to maintain balanced irrigation.",
  },
  {
    slug: "best-spray-time",
    titleAr: "أفضل وقت لرش النباتات",
    titleEn: "Best Time to Spray Plants",
    icon: Sun,
    categoryAr: "الرش",
    categoryEn: "Spraying",
    descriptionAr:
      "تعرف على الوقت المناسب للرش لتحقيق أفضل امتصاص وتقليل الإجهاد.",
    descriptionEn:
      "Learn the best time to spray for better absorption and reduced plant stress.",
  },
  {
    slug: "summer-care",
    titleAr: "العناية بالنباتات في فصل الصيف",
    titleEn: "Plant Care During Summer",
    icon: Sun,
    categoryAr: "العناية الموسمية",
    categoryEn: "Seasonal Care",
    descriptionAr:
      "طرق حماية النباتات من الحرارة والجفاف وتحسين مقاومتها.",
    descriptionEn:
      "Ways to protect plants from heat and drought and improve their tolerance.",
  },
] as const;

const translations = {
  AR: {
    guides: "الإرشادات الزراعية",
    title: "معلومات ونصائح زراعية",
    intro:
      "محتوى مبسط يساعدك على فهم احتياجات النبات، تشخيص المشكلات الشائعة، وتحسين الرعاية اليومية.",
    searchPlaceholder: "ابحث في الإرشادات الزراعية...",
    search: "بحث",
    readMore: "اقرأ المزيد",
    agriculturalHelp: "مساعدة زراعية",
    needConsultation: "تحتاج استشارة لنباتك؟",
    helpText:
      "دكتور ArtVert يساعدك في فهم المشكلة واختيار الخطوة التالية بشكل أوضح.",
    askDoctor: "اسأل دكتور ArtVert",
    plantCare: "الرعاية الزراعية",
  },
  EN: {
    guides: "Agricultural Guides",
    title: "Agricultural Information & Tips",
    intro:
      "Simple content to help you understand plant needs, diagnose common problems, and improve daily care.",
    searchPlaceholder: "Search agricultural guides...",
    search: "Search",
    readMore: "Read More",
    agriculturalHelp: "Agricultural Help",
    needConsultation: "Need Advice for Your Plant?",
    helpText:
      "Doctor ArtVert helps you understand the problem and choose the next step more clearly.",
    askDoctor: "Ask Doctor ArtVert",
    plantCare: "Plant Care",
  },
} as const;

export default function BlogPage() {
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

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
            {t.guides}
          </span>

          <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:mt-6 sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-8 text-white/68 sm:mt-6 sm:text-lg">
            {t.intro}
          </p>

          <div className="mx-auto mt-7 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-[#0b1a0e]/72 p-2 backdrop-blur-xl">
            <Search
              size={18}
              className="mr-2 shrink-0 text-lime-300"
            />

            <input
              type="search"
              placeholder={t.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/35"
            />

            <button
              type="button"
              className="min-h-10 rounded-xl bg-lime-300 px-4 text-xs font-black text-[#071109] sm:px-5 sm:text-sm"
            >
              {t.search}
            </button>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article, index) => {
            const Icon = article.icon;

            return (
              <article
                key={article.titleAr}
                className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/84 shadow-[0_16px_38px_rgba(0,0,0,.22)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-lime-300/35 hover:shadow-[0_18px_42px_rgba(200,243,63,.10)]"
              >
                <div className="relative min-h-[145px] border-b border-white/[.06] bg-[radial-gradient(circle_at_75%_20%,rgba(200,243,63,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.03),rgba(255,255,255,.01))] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full border border-lime-300/18 bg-lime-300/[.08] px-3 py-1 text-[11px] font-black text-lime-300">
                      {isArabic ? article.categoryAr : article.categoryEn}
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
                    {isArabic ? article.titleAr : article.titleEn}
                  </h2>

                  <p className="mt-4 text-sm leading-8 text-white/58">
                    {isArabic ? article.descriptionAr : article.descriptionEn}
                  </p>

                  <Link
                    href={`/blog/${article.slug}`}
                    className="mt-auto inline-flex w-fit items-center gap-2 pt-7 text-sm font-black text-lime-300 transition group-hover:-translate-x-1"
                  >
                    <BookOpen size={17} />
                    {t.readMore}
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
            {t.agriculturalHelp}
          </span>

          <h2 className="mt-6 text-3xl font-black text-white sm:text-5xl">
            {t.needConsultation}
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-white/66 sm:text-base">
            {t.helpText}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/doctor"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-7 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200"
            >
              <MessageCircle size={18} />
              {t.askDoctor}
            </Link>

            <Link
              href="/plant-care"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-7 text-sm font-black text-white/78 transition hover:border-lime-300/35 hover:bg-white/[.08] hover:text-white"
            >
              <Leaf size={18} />
              {t.plantCare}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
