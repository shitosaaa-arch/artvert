"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Handshake,
  Leaf,
  Lightbulb,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Trophy,
  Users,
} from "lucide-react";

import AnimatedSection from "@/components/AnimatedSection";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const values = [
  {
    icon: Trophy,
    titleAr: "الجودة",
    titleEn: "Quality",
    textAr: "منتجات عالية الجودة لتحقيق أفضل نمو وإنتاج للنبات.",
    textEn: "High-quality products to support better plant growth and productivity.",
  },
  {
    icon: Lightbulb,
    titleAr: "الابتكار",
    titleEn: "Innovation",
    textAr: "نطور حلولًا زراعية حديثة تناسب احتياجات السوق.",
    textEn: "We develop modern agricultural solutions that meet market needs.",
  },
  {
    icon: Handshake,
    titleAr: "الثقة",
    titleEn: "Trust",
    textAr: "شراكة ودعم فني مستمر مع عملائنا.",
    textEn: "Long-term partnership and continuous technical support for our customers.",
  },
  {
    icon: Sprout,
    titleAr: "الاستدامة",
    titleEn: "Sustainability",
    textAr: "حلول زراعية تحافظ على النبات والبيئة.",
    textEn: "Agricultural solutions that support plants and the environment.",
  },
] as const;

const stats = [
  ["50+", "منتج", "Products"],
  ["10+", "حلول زراعية", "Agricultural Solutions"],
  ["1000+", "عميل", "Customers"],
  ["24/7", "دعم فني", "Technical Support"],
] as const;

const commitments = [
  {
    ar: "اختيار حلول مناسبة لاحتياجات النبات والمحصول.",
    en: "Choosing solutions suited to the needs of the plant and crop.",
  },
  {
    ar: "دعم فني وإرشاد قبل وبعد استخدام المنتج.",
    en: "Technical support and guidance before and after product use.",
  },
  {
    ar: "تطوير مستمر للمنتجات والخدمات الزراعية.",
    en: "Continuous development of agricultural products and services.",
  },
] as const;

const translations = {
  AR: {
    about: "من نحن",
    heroText:
      "حلول زراعية متكاملة تجمع بين جودة المنتج والخبرة الفنية لمساعدة المزارعين ومحبي النباتات على تحقيق أفضل النتائج.",
    browseProducts: "تصفح المنتجات",
    contactUs: "تواصل معنا",
    ourStory: "قصتنا",
    modernVision: "خبرة زراعية برؤية حديثة",
    storyText:
      "بدأت ArtVert Egypt بهدف تقديم حلول زراعية تجمع بين جودة المنتج والخبرة الفنية، لمساعدة المزارعين ومحبي النباتات على تحقيق أفضل النتائج. نسعى دائمًا لمواكبة التطور وتقديم منتجات تعزز من إنتاجية المحاصيل بطرق آمنة ومستدامة.",
    farmAlt: "مزارع ArtVert",
    trustedSolutions: "حلول زراعية موثوقة",
    fromFieldHome:
      "من الحقل إلى المنزل، نوفر منتجات ودعمًا يناسب احتياجات النبات.",
    ourValues: "قيمنا",
    principles: "المبادئ التي نبني عليها",
    valuesText: "قيم واضحة توجه كل منتج وخدمة نقدمها لعملائنا.",
    startNow: "ابدأ الآن",
    startJourney: "ابدأ رحلتك مع ArtVert",
    journeyText:
      "اكتشف منتجاتنا وحلولنا الزراعية المصممة لدعم نمو نباتاتك وتحسين الإنتاجية.",
    askDoctor: "اسأل دكتور ArtVert",
  },
  EN: {
    about: "About Us",
    heroText:
      "Integrated agricultural solutions combining product quality and technical expertise to help growers and plant lovers achieve better results.",
    browseProducts: "Browse Products",
    contactUs: "Contact Us",
    ourStory: "Our Story",
    modernVision: "Agricultural Expertise with a Modern Vision",
    storyText:
      "ArtVert Egypt was founded to provide agricultural solutions that combine product quality with technical expertise, helping growers and plant lovers achieve better results. We continuously keep pace with development and provide products that support crop productivity in safe and sustainable ways.",
    farmAlt: "ArtVert Farm",
    trustedSolutions: "Trusted Agricultural Solutions",
    fromFieldHome:
      "From the field to the home, we provide products and support tailored to plant needs.",
    ourValues: "Our Values",
    principles: "The Principles We Build On",
    valuesText: "Clear values guide every product and service we provide to our customers.",
    startNow: "Start Now",
    startJourney: "Start Your Journey with ArtVert",
    journeyText:
      "Discover our agricultural products and solutions designed to support plant growth and improve productivity.",
    askDoctor: "Ask Doctor ArtVert",
  },
} as const;

export default function AboutPage() {
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#061008] text-white font-sans"
    >
      <section className="relative min-h-[520px] overflow-hidden border-b border-lime-300/10 sm:min-h-[600px] lg:min-h-[640px]">
        <Image
          src="/images/about-hero.jpg"
          alt="ArtVert Egypt"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,21,13,.88)_0%,rgba(2,21,13,.66)_48%,rgba(6,16,8,1)_100%)]" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        <AnimatedSection className="relative z-10 flex min-h-[520px] items-center justify-center px-3 text-center sm:min-h-[600px] sm:px-6 lg:min-h-[640px]">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300 backdrop-blur-xl">
              <Leaf size={16} />
              {t.about}
            </span>

            <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
              ArtVert Egypt
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white/75 sm:text-xl sm:leading-9">
              {t.heroText}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 text-sm font-black text-[#071109] shadow-[0_8px_24px_rgba(200,243,63,.22)] transition hover:-translate-y-0.5 hover:bg-lime-200"
              >
                <ShoppingBag size={18} />
                {t.browseProducts}
              </Link>

              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[.05] px-6 text-sm font-black text-white/85 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-lime-300/35 hover:bg-white/[.09]"
              >
                <MessageCircle size={18} />
                {t.contactUs}
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <AnimatedSection>
        <section className="mx-auto grid max-w-7xl gap-4 px-3 py-10 sm:grid-cols-2 sm:px-6 sm:py-14 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={isArabic ? item[1] : item[2]}
              className="rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/92 p-6 text-center shadow-[0_16px_36px_rgba(0,0,0,.22)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-lime-300/35 hover:shadow-[0_18px_38px_rgba(200,243,63,.10)]"
            >
              <h2 className="text-4xl font-black text-lime-300 sm:text-5xl">
                {item[0]}
              </h2>

              <p className="mt-3 text-base font-bold text-white/72 sm:text-lg">
                {isArabic ? item[1] : item[2]}
              </p>
            </div>
          ))}
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-3 py-8 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/18 bg-lime-300/[.06] px-4 py-2 text-sm font-bold text-lime-300">
              <Sprout size={16} />
              {t.ourStory}
            </span>

            <h2 className="mt-5 text-3xl font-black leading-tight text-white sm:text-5xl">
              {t.modernVision}
            </h2>

            <p className="mt-6 text-sm leading-8 text-white/64 sm:text-lg sm:leading-9">
              {t.storyText}
            </p>

            <div className="mt-6 grid gap-3">
              {commitments.map((item) => (
                <div
                  key={item.ar}
                  className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-4"
                >
                  <CheckCircle2
                    size={18}
                    className="mt-1 shrink-0 text-lime-300"
                  />
                  <p className="text-sm leading-7 text-white/68">
                    {isArabic ? item.ar : item.en}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[320px] overflow-hidden rounded-[28px] border border-lime-300/15 shadow-[0_0_30px_rgba(200,243,63,0.08)] sm:h-[420px]">
            <Image
              src="/images/farm.jpg"
              alt={t.farmAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-[1.04]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,21,13,.78)] via-transparent to-transparent" />

            <div className="absolute bottom-4 right-4 left-4 rounded-2xl border border-white/10 bg-[#07150d]/72 p-4 backdrop-blur-xl sm:bottom-6 sm:right-6 sm:left-6">
              <p className="text-sm font-black text-white">
                {t.trustedSolutions}
              </p>
              <p className="mt-1 text-xs leading-6 text-white/55">
                {t.fromFieldHome}
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="mx-auto max-w-7xl px-3 py-14 sm:px-6 sm:py-20">
          <div className="text-center">
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-lime-300/18 bg-lime-300/[.06] px-4 py-2 text-sm font-bold text-lime-300">
              <ShieldCheck size={16} />
              {t.ourValues}
            </span>

            <h2 className="mt-5 text-3xl font-black text-white sm:text-5xl">
              {t.principles}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/52 sm:text-base">
              {t.valuesText}
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {values.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.titleAr}
                  className="rounded-[26px] border border-lime-300/15 bg-[#0b1a0e]/92 p-6 text-center shadow-[0_16px_36px_rgba(0,0,0,.22)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-lime-300/35 hover:shadow-[0_18px_38px_rgba(200,243,63,.10)]"
                >
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-lime-300/15 bg-lime-300/10 text-lime-300">
                    <Icon size={28} />
                  </div>

                  <h3 className="mt-6 text-2xl font-black text-white">
                    {isArabic ? item.titleAr : item.titleEn}
                  </h3>

                  <p className="mt-4 text-sm leading-8 text-white/58">
                    {isArabic ? item.textAr : item.textEn}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="mx-auto max-w-5xl px-3 pb-14 sm:px-6 sm:pb-20">
          <div className="rounded-[28px] border border-lime-300/20 bg-[linear-gradient(135deg,rgba(200,243,63,.08),rgba(11,26,14,.92))] px-5 py-10 text-center shadow-[0_0_40px_rgba(200,243,63,0.10)] backdrop-blur-xl sm:px-10 sm:py-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
              <Sparkles size={15} />
              {t.startNow}
            </span>

            <h2 className="mt-6 text-3xl font-black text-white sm:text-5xl">
              {t.startJourney}
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-white/66 sm:text-base">
              {t.journeyText}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-7 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200"
              >
                <ShoppingBag size={18} />
                {t.browseProducts}
              </Link>

              <Link
                href="/doctor"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-7 text-sm font-black text-white/78 transition hover:border-lime-300/35 hover:bg-white/[.08] hover:text-white"
              >
                <Users size={18} />
                {t.askDoctor}
                <ArrowLeft size={16} />
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
}
