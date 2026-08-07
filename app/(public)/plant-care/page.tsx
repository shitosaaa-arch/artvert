"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bug,
  Camera,
  CheckCircle2,
  CircleDot,
  Droplets,
  Flower2,
  Leaf,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Sprout,
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const problems = [
  {
    icon: Leaf,
    titleAr: "اصفرار الأوراق",
    titleEn: "Yellowing Leaves",
    textAr: "قد يكون بسبب نقص العناصر أو زيادة الري أو مشاكل الجذور.",
    textEn: "It may be caused by nutrient deficiency, overwatering, or root problems.",
    treatmentAr:
      "فحص الري والتربة، واستخدام برنامج تغذية مناسب يحتوي على العناصر الصغرى.",
    treatmentEn:
      "Check irrigation and soil conditions, and use a suitable nutrition program containing micronutrients.",
  },
  {
    icon: Droplets,
    titleAr: "ذبول النبات",
    titleEn: "Plant Wilting",
    textAr: "غالبًا بسبب مشاكل الجذور أو نقص المياه أو حرارة زائدة.",
    textEn: "Often caused by root problems, lack of water, or excessive heat.",
    treatmentAr:
      "فحص الجذور وتقليل الإجهاد وتحسين التهوية واستخدام منشطات جذور.",
    treatmentEn:
      "Check the roots, reduce stress, improve aeration, and use root stimulants.",
  },
  {
    icon: Bug,
    titleAr: "إصابات الحشرات",
    titleEn: "Insect Infestations",
    textAr: "مثل المن والذبابة البيضاء والعناكب.",
    textEn: "Such as aphids, whiteflies, and mites.",
    treatmentAr:
      "تحديد نوع الحشرة واختيار المبيد المناسب حسب الإصابة.",
    treatmentEn:
      "Identify the insect and choose the appropriate pesticide according to the infestation.",
  },
  {
    icon: CircleDot,
    titleAr: "بقع على الأوراق",
    titleEn: "Leaf Spots",
    textAr: "قد تكون إصابة فطرية أو نقص عنصر غذائي.",
    textEn: "They may be caused by a fungal infection or nutrient deficiency.",
    treatmentAr:
      "تشخيص السبب أولًا ثم استخدام المعاملة المناسبة.",
    treatmentEn:
      "Diagnose the cause first, then use the appropriate treatment.",
  },
  {
    icon: Sprout,
    titleAr: "ضعف النمو",
    titleEn: "Weak Growth",
    textAr: "النبات لا ينمو بشكل طبيعي أو الأوراق صغيرة.",
    textEn: "The plant is not growing normally or its leaves are small.",
    treatmentAr:
      "تحسين التغذية واستخدام منشطات النمو والعناصر المطلوبة.",
    treatmentEn:
      "Improve nutrition and use growth stimulants and the required nutrients.",
  },
  {
    icon: Flower2,
    titleAr: "مشاكل نباتات المنزل",
    titleEn: "Houseplant Problems",
    textAr: "مثل سقوط الأوراق وضعف النباتات الداخلية.",
    textEn: "Such as leaf drop and weak indoor plants.",
    treatmentAr:
      "ضبط الإضاءة والري واستخدام التغذية المناسبة للنباتات المنزلية.",
    treatmentEn:
      "Adjust lighting and watering, and use suitable nutrition for houseplants.",
  },
] as const;

const careSteps = [
  {
    ar: "صورة واضحة للأوراق أو الجزء المصاب.",
    en: "A clear photo of the leaves or affected part.",
  },
  {
    ar: "اسم النبات أو المحصول وعمره التقريبي.",
    en: "The plant or crop name and its approximate age.",
  },
  {
    ar: "وصف الري والتسميد والأعراض التي ظهرت.",
    en: "A description of watering, fertilization, and the symptoms that appeared.",
  },
] as const;

const translations = {
  AR: {
    careDiagnosis: "{t.careDiagnosis}",
    title: "{t.title}",
    intro:
      "{t.intro}",
    diagnoseNow: "{t.diagnoseNow}",
    browseProducts: "{t.browseProducts}",
    suitableStep: "{t.suitableStep}",
    beforePhoto: "{t.beforePhoto}",
    prepareInfo: "{t.prepareInfo}",
    imageDiagnosis: "{t.imageDiagnosis}",
    haveProblem: "{t.haveProblem}",
    uploadText:
      "{t.uploadText}",
    openDoctor: "{t.openDoctor}",
    sendWhatsapp: "{t.sendWhatsapp}",
  },
  EN: {
    careDiagnosis: "Care & Diagnosis",
    title: "Diagnose Plant Problems",
    intro:
      "Learn about common plant problems and send a photo of the condition for clearer assistance from Doctor ArtVert.",
    diagnoseNow: "Diagnose Your Plant Now",
    browseProducts: "Browse Products",
    suitableStep: "Recommended Step",
    beforePhoto: "Before Sending the Photo",
    prepareInfo: "Prepare this information for a better diagnosis",
    imageDiagnosis: "Image Diagnosis",
    haveProblem: "Having a problem with your plant?",
    uploadText:
      "Upload a clear photo and talk to Doctor ArtVert for a direct response and practical steps.",
    openDoctor: "Open Doctor ArtVert",
    sendWhatsapp: "Send Photo via WhatsApp",
  },
} as const;

export default function PlantCarePage() {
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
            <Leaf size={16} />
            {t.careDiagnosis}
          </span>

          <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:mt-6 sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-8 text-white/68 sm:mt-6 sm:text-lg">
            {t.intro}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/doctor"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-7 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200"
            >
              <Camera size={18} />
              {t.diagnoseNow}
            </Link>

            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-7 text-sm font-black text-white/78 transition hover:border-lime-300/35 hover:bg-white/[.08] hover:text-white"
            >
              <Sprout size={18} />
              {t.browseProducts}
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-2 xl:grid-cols-3">
          {problems.map((problem, index) => {
            const Icon = problem.icon;

            return (
              <article
                key={problem.titleAr}
                className="group overflow-hidden rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/84 shadow-[0_16px_38px_rgba(0,0,0,.22)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-lime-300/35 hover:shadow-[0_18px_42px_rgba(200,243,63,.10)]"
              >
                <div className="relative border-b border-white/[.06] bg-[radial-gradient(circle_at_85%_10%,rgba(200,243,63,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.03),rgba(255,255,255,.01))] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-lime-300/15 bg-lime-300/10 text-lime-300 transition duration-300 group-hover:scale-105 group-hover:bg-lime-300/15">
                      <Icon size={25} />
                    </div>

                    <span className="text-3xl font-black text-white/[.08]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h2 className="mt-5 text-xl font-black text-white sm:text-2xl">
                    {isArabic ? problem.titleAr : problem.titleEn}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-white/56">
                    {isArabic ? problem.textAr : problem.textEn}
                  </p>
                </div>

                <div className="p-5">
                  <div className="rounded-2xl border border-lime-300/12 bg-lime-300/[.045] p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={17}
                        className="text-lime-300"
                      />
                      <h3 className="text-sm font-black text-lime-300">
                        {t.suitableStep}
                      </h3>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-white/68">
                      {isArabic ? problem.treatmentAr : problem.treatmentEn}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mx-auto mt-10 grid max-w-5xl gap-5 rounded-[28px] border border-white/10 bg-[#0b1a0e]/80 p-5 shadow-xl backdrop-blur-xl sm:mt-16 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/18 bg-lime-300/[.06] px-4 py-2 text-xs font-black text-lime-300">
              <ShieldCheck size={15} />
              {t.beforePhoto}
            </span>

            <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
              {t.prepareInfo}
            </h2>

            <div className="mt-5 grid gap-3">
              {careSteps.map((item) => (
                <div
                  key={item.ar}
                  className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-4"
                >
                  <CheckCircle2
                    size={18}
                    className="mt-1 shrink-0 text-lime-300"
                  />
                  <p className="text-sm leading-7 text-white/64">
                    {isArabic ? item.ar : item.en}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid h-32 w-full place-items-center rounded-[24px] border border-lime-300/15 bg-[radial-gradient(circle_at_50%_40%,rgba(200,243,63,.12),rgba(200,243,63,.02)_70%)] text-lime-300 lg:h-56 lg:w-56">
            <Camera size={56} />
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-5xl rounded-[28px] border border-lime-300/20 bg-[linear-gradient(135deg,rgba(200,243,63,.08),rgba(11,26,14,.92))] px-5 py-10 text-center shadow-[0_0_40px_rgba(200,243,63,0.10)] backdrop-blur-xl sm:mt-16 sm:px-10 sm:py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <Sparkles size={15} />
            {t.imageDiagnosis}
          </span>

          <h2 className="mt-6 text-3xl font-black text-white sm:text-5xl">
            {t.haveProblem}
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-white/66 sm:text-base">
            {t.uploadText}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/doctor"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-7 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200"
            >
              <MessageCircle size={18} />
              {t.openDoctor}
            </Link>

            <a
              href="https://wa.me/201080040408?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A5%D8%B1%D8%B3%D8%A7%D9%84%20%D8%B5%D9%88%D8%B1%D8%A9%20%D9%84%D9%86%D8%A8%D8%A7%D8%AA%D9%8A%20%D9%84%D9%84%D8%AA%D8%B4%D8%AE%D9%8A%D8%B5."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-7 text-sm font-black text-white/78 transition hover:border-lime-300/35 hover:bg-white/[.08] hover:text-white"
            >
              <Camera size={18} />
              {t.sendWhatsapp}
              <ArrowLeft size={16} />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
