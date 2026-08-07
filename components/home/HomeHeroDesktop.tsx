"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Headphones,
  Leaf,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Star,
  Users,
} from "lucide-react";

import { useLanguage } from "@/components/i18n/LanguageProvider";

const services = [
  {
    titleAr: "تشخيص المشاكل",
    titleEn: "Problem Diagnosis",
    descriptionAr: "تشخيص ذكي وسريع",
    descriptionEn: "Smart and fast diagnosis",
    href: "/doctor",
    icon: Sprout,
  },
  {
    titleAr: "برامج زراعية",
    titleEn: "Plant Care",
    descriptionAr: "برامج رعاية متخصصة",
    descriptionEn: "Specialized care programs",
    href: "/plant-care",
    icon: Leaf,
  },
  {
    titleAr: "منتجات مضمونة",
    titleEn: "Trusted Products",
    descriptionAr: "حلول ArtVert الأصلية",
    descriptionEn: "Original ArtVert solutions",
    href: "/products",
    icon: ShoppingBag,
  },
  {
    titleAr: "دعم فني",
    titleEn: "Technical Support",
    descriptionAr: "خبراؤنا معك دائمًا",
    descriptionEn: "Our experts are always with you",
    href: "/contact",
    icon: Headphones,
  },
] as const;

const trustCards = [
  {
    titleAr: "جودة مضمونة",
    titleEn: "Guaranteed Quality",
    descriptionAr: "منتجات عالية الجودة مضمونة الفعالية",
    descriptionEn: "High-quality products with reliable performance",
    icon: ShieldCheck,
    type: "standard",
  },
  {
    titleAr: "آمنة على النباتات",
    titleEn: "Plant Safe",
    descriptionAr: "تركيبات متوازنة وآمنة على المحاصيل والبيئة",
    descriptionEn: "Balanced formulas designed for crops and the environment",
    icon: Leaf,
    type: "standard",
  },
  {
    titleAr: "تكنولوجيا متقدمة",
    titleEn: "Advanced Technology",
    descriptionAr: "أحدث التقنيات العالمية في خدمة الزراعة",
    descriptionEn: "Modern technologies serving agriculture",
    icon: Sprout,
    type: "standard",
  },
  {
    titleAr: "أكثر من 10,000 مزارع",
    titleEn: "Trusted by 10,000+ Growers",
    descriptionAr: "يثقون بدكتور ArtVert وخبرائنا الزراعيين",
    descriptionEn: "Trust Doctor ArtVert and our agricultural experts",
    icon: Users,
    type: "farmers",
  },
] as const;

const translations = {
  AR: {
    welcome: "مرحبًا بك",
    doctorIntro: "أنا دكتور ArtVert",
    doctorDescription:
      "اسألني عن مشكلة نباتك وسأساعدك في التشخيص والعلاج.",
    doctorAria: "افتح دكتور ArtVert",
    doctorImageAlt: "دكتور ArtVert الخبير الزراعي",
    servicesAria: "خدمات ArtVert",
    askDoctor: "اسأل دكتور ArtVert",
    browseProducts: "تصفح المنتجات",
    fiveStars: "تقييم خمس نجوم",
  },
  EN: {
    welcome: "Welcome",
    doctorIntro: "I’m Doctor ArtVert",
    doctorDescription:
      "Ask me about your plant problem and I’ll help you with diagnosis and treatment.",
    doctorAria: "Open Doctor ArtVert",
    doctorImageAlt: "Doctor ArtVert agricultural expert",
    servicesAria: "ArtVert Services",
    askDoctor: "Ask Doctor ArtVert",
    browseProducts: "Browse Products",
    fiveStars: "Five-star rating",
  },
} as const;

export function HomeHeroDesktop() {
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

  return (
    <section className="relative isolate hidden min-h-[calc(100vh-62px)] overflow-hidden border-b border-white/10 lg:block">
      <div aria-hidden="true" className="absolute inset-0 -z-40">
        <Image
          src="/images/home-bg-desktop.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-30 bg-[linear-gradient(90deg,rgba(3,19,12,.18)_0%,rgba(3,19,12,.02)_42%,rgba(3,19,12,.20)_100%)]"
      />

      <div
        className="relative mx-auto grid min-h-[650px] w-full max-w-[1480px] grid-cols-[320px_minmax(500px,1fr)_150px] items-center gap-5 px-7 pb-24 pt-5 xl:grid-cols-[340px_minmax(600px,1fr)_160px]"
        dir="ltr"
      >
        <div className="relative order-1 mx-auto h-[520px] w-full max-w-[340px] self-end">
          <div
            className="absolute bottom-0 left-1/2 h-8 w-[62%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl"
            aria-hidden="true"
          />

          <div
            className="absolute right-[-42px] top-16 z-30 w-[190px] rounded-2xl border border-lime-300/20 bg-[#0b1a0e]/92 px-4 py-3 text-right shadow-[0_0_24px_rgba(200,243,63,0.16)] backdrop-blur-xl"
            dir="rtl"
          >
            <p className="text-[10px] font-bold text-white/75">{t.welcome}</p>
            <strong className="mt-1 block text-[13px] font-black text-lime-300">
              {t.doctorIntro}
            </strong>
            <p className="mt-1.5 text-[9px] leading-[17px] text-white/60">
              {t.doctorDescription}
            </p>
            <span
              aria-hidden="true"
              className="absolute -left-2 top-[54px] h-4 w-4 rotate-45 border-b border-l border-lime-300/20 bg-[#0b1a0e]"
            />
          </div>

          <Link
            href="/doctor"
            aria-label={t.doctorAria}
            className="absolute inset-x-0 bottom-0 z-20 block h-[500px] rounded-[2rem] outline-none focus-visible:ring-4 focus-visible:ring-lime-300/50"
          >
            <Image
              src="/images/artvert-doctor-approved.png"
              alt={t.doctorImageAlt}
              fill
              priority
              sizes="340px"
              className="object-contain object-bottom drop-shadow-[0_22px_25px_rgba(0,0,0,.8)] transition-transform duration-500 hover:scale-[1.02]"
            />
          </Link>
        </div>

        <div className="relative order-2 min-h-[500px]" aria-hidden="true" />

        <aside
          className="order-3 grid grid-cols-1 gap-2 self-center"
          aria-label={t.servicesAria}
          dir="rtl"
        >
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <Link
                key={`${service.href}-${service.titleAr}`}
                href={service.href}
                className="group flex min-h-[92px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/8 bg-[#0b1a0e]/58 px-3 text-center backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-lime-300/30 hover:bg-[#0b1a0e]/75 hover:shadow-[0_10px_20px_rgba(200,243,63,0.1)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300 transition duration-300 group-hover:scale-110 group-hover:bg-lime-300/20">
                  <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
                </div>
                <div>
                  <span className="block text-[12px] font-black leading-4 text-white">
                    {isArabic ? service.titleAr : service.titleEn}
                  </span>
                  <small className="mt-1 block text-[9px] leading-4 text-white/48">
                    {isArabic ? service.descriptionAr : service.descriptionEn}
                  </small>
                </div>
              </Link>
            );
          })}
        </aside>
      </div>

      {/* منطقة الأزرار: تم جعل الزرين بجوار بعضهما، بنفس الحجم، ومسافة بسيطة بينهما */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[96px] z-40 mx-auto flex w-full items-center justify-center gap-4"
        dir="rtl"
      >
        <Link
          href="/doctor"
          className="pointer-events-auto flex h-[40px] w-[195px] items-center justify-center gap-2 rounded-full bg-[#8cd234] px-4 text-[12px] font-black text-[#071109] shadow-[0_12px_32px_rgba(140,210,52,0.35)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#7bc02a]"
        >
          <MessageCircle aria-hidden="true" size={17} strokeWidth={1.8} />
          {t.askDoctor}
        </Link>

        <Link
          href="/products"
          className="pointer-events-auto flex h-[40px] w-[195px] items-center justify-center gap-2 rounded-full border border-white/20 bg-[#121c15]/85 px-4 text-[12px] font-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-lime-300/40 hover:bg-[#18261b]"
        >
          <ShoppingBag aria-hidden="true" size={16} strokeWidth={1.8} />
          {t.browseProducts}
        </Link>
      </div>
      {/* نهاية منطقة الأزرار */}

      <div className="absolute inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-[1220px] grid-cols-4 gap-2 px-7 pb-4">
        {trustCards.map((card) => {
          const Icon = card.icon;
          const featured = card.type === "farmers";

          return (
            <article
              key={card.titleAr}
              className={[
                "flex min-h-[82px] items-center gap-3 rounded-[18px] border px-4 py-3 backdrop-blur-xl transition duration-300",
                featured
                  ? "border-lime-300/40 bg-lime-300/10 shadow-[0_0_20px_rgba(200,243,63,0.15)]"
                  : "border-white/10 bg-[#0b1a0e]/70 hover:border-lime-300/20",
              ].join(" ")}
              dir="rtl"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                <Icon aria-hidden="true" size={20} strokeWidth={1.7} />
              </div>
              <div className="min-w-0">
                <h2 className="text-[12px] font-black leading-5 text-white">
                  {isArabic ? card.titleAr : card.titleEn}
                </h2>
                <p className="mt-0.5 text-[9px] leading-4 text-white/58">
                  {isArabic ? card.descriptionAr : card.descriptionEn}
                </p>
                {featured && (
                  <div
                    className="mt-1 flex items-center gap-0.5 text-lime-300"
                    aria-label={t.fiveStars}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        aria-hidden="true"
                        size={10}
                        fill="currentColor"
                      />
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
