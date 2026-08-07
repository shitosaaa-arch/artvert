"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Leaf,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";

import { useLanguage } from "@/components/i18n/LanguageProvider";

const mobileServices = [
  {
    titleAr: "تشخيص مشاكل",
    titleEn: "Problem Diagnosis",
    descriptionAr: "تشخيص سريع",
    descriptionEn: "Fast Diagnosis",
    href: "/doctor",
    icon: MessageCircle,
  },
  {
    titleAr: "برامج زراعية",
    titleEn: "Plant Care",
    descriptionAr: "برامج رعاية متخصصة",
    descriptionEn: "Specialized Care Programs",
    href: "/plant-care",
    icon: Leaf,
  },
] as const;

const translations = {
  AR: {
    welcome: "مرحباً بك",
    doctorIntro: "أنا دكتور ArtVert",
    doctorDescription: "سألني عن مشكلة نباتك وسأساعدك في العلاج.",
    doctorAlt: "دكتور ArtVert الخبير الزراعي",
    askDoctor: "اسأل دكتور ArtVert",
    browseProducts: "تصفح المنتجات",
    servicesAria: "خدمات ArtVert",
    doctorChatAria: "محادثة الدكتور",
  },
  EN: {
    welcome: "Welcome",
    doctorIntro: "I’m Doctor ArtVert",
    doctorDescription: "Ask me about your plant problem and I’ll help you with treatment.",
    doctorAlt: "Doctor ArtVert agricultural expert",
    askDoctor: "Ask Doctor ArtVert",
    browseProducts: "Browse Products",
    servicesAria: "ArtVert Services",
    doctorChatAria: "Doctor Chat",
  },
} as const;

export function HomeHeroMobile() {
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

  return (
    <section
      className="relative flex min-h-[760px] flex-col overflow-hidden bg-[#07130a] lg:hidden"
      dir="rtl"
    >
      {/* الخلفية */}
      <div className="absolute inset-0 z-10 bg-black/10 pointer-events-none" />

      {/* القسم العلوي (الدكتور والفقاعة) */}
      <div className="relative z-20 flex-1 w-full min-h-[480px]">
        {/* صورة الدكتور */}
        <div className="absolute -bottom-20 left-[-15px] z-20 w-[50%] max-w-[220px] h-[75%]">
          <Image
            src="/images/artvert-doctor-approved.png"
            alt={t.doctorAlt}
            fill
            priority
            sizes="50vw"
            className="object-contain object-bottom drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* فقاعة الدكتور: تم تطبيق تأثير الزجاج الشفاف (Glassmorphism) مع الحفاظ على المكان */}
        <div className="absolute right-0 top-[54%] z-30 w-[55%] max-w-[210px] rounded-[24px] bg-[#0f1a11]/30 px-4 py-3 text-right shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-lg border border-white/20">
          <p className="text-[11px] text-white/90 drop-shadow-md">
            {t.welcome}
          </p>
          <strong className="mt-0.5 block text-[15px] font-black text-[#8cd234] drop-shadow-md">
            {t.doctorIntro}
          </strong>
          <p className="mt-1 text-[11px] leading-5 text-white/90 drop-shadow-md">
            {t.doctorDescription}
          </p>
        </div>
      </div>

      {/* القسم السفلي: الأزرار والخدمات */}
      <div className="relative z-30 flex flex-col gap-4 px-4 pb-12">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/doctor"
            className="flex h-[64px] flex-row items-center justify-center gap-2 rounded-[16px] bg-[#0e4813] text-white shadow-lg transition active:scale-[.98]"
          >
            <MessageCircle size={20} className="text-white" strokeWidth={2} />
            <span className="text-[14px] font-bold">{t.askDoctor}</span>
          </Link>

          <Link
            href="/products"
            className="flex h-[64px] flex-row items-center justify-center gap-2 rounded-[16px] bg-[#141f16]/90 border border-white/5 text-white shadow-lg backdrop-blur-md transition active:scale-[.98]"
          >
            <ShoppingBag size={20} className="text-white/80" strokeWidth={2} />
            <span className="text-[14px] font-bold">{t.browseProducts}</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3" aria-label={t.servicesAria}>
          {mobileServices.map((service) => {
            const Icon = service.icon;

            return (
              <Link
                key={`${service.href}-${service.titleAr}`}
                href={service.href}
                className="flex min-h-[96px] flex-row items-center justify-between rounded-[20px] bg-[#0c140f]/90 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.3)] border border-white/5 backdrop-blur-md transition active:scale-[.98]"
              >
                <div className="flex flex-col text-right">
                  <span className="text-[14px] font-bold text-white/95">
                    {isArabic ? service.titleAr : service.titleEn}
                  </span>
                  <small className="mt-0.5 text-[11px] text-white/50">
                    {isArabic ? service.descriptionAr : service.descriptionEn}
                  </small>
                </div>
                <Icon
                  className="text-[#8cd234] opacity-90"
                  size={26}
                  strokeWidth={1.5}
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* الزر العائم (FAB) */}
      <button
        aria-label={t.doctorChatAria}
        className="fixed bottom-[32px] right-4 z-50 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#18231a] shadow-[0_8px_30px_rgba(0,0,0,0.6)] border border-white/10 transition active:scale-95"
      >
        <div className="relative h-[56px] w-[56px] overflow-hidden rounded-full">
          <Image
            src="/images/artvert-doctor-approved.png"
            alt="Doctor Avatar"
            fill
            className="object-cover object-top scale-[1.3] translate-y-2"
          />
        </div>
        <div className="absolute -top-0 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#1e2e21] border border-[#18231a] text-white shadow-md">
          <MessageCircle size={14} className="text-[#8cd234]" strokeWidth={2.5} />
        </div>
      </button>
    </section>
  );
}
