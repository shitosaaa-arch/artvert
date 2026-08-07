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
    titleEn: "Diagnose Problems",
    descriptionAr: "تشخيص سريع",
    descriptionEn: "Quick Diagnosis",
    href: "/doctor",
    icon: MessageCircle,
  },
  {
    titleAr: "برامج زراعية",
    titleEn: "Agri Programs",
    descriptionAr: "برامج رعاية متخصصة",
    descriptionEn: "Specialized Care",
    href: "/plant-care",
    icon: Leaf,
  }
] as const;

const translations = {
  AR: {
    welcome: "مرحباً بك",
    drName: "أنا دكتور ArtVert",
    descLine1: "سألني عن مشكلة نباتك وسأساعدك في",
    descLine2: "العلاج.",
    askDr: "اسأل دكتور ArtVert",
    browse: "تصفح المنتجات",
    fabAria: "محادثة الدكتور",
  },
  EN: {
    welcome: "Welcome",
    drName: "I am Dr. ArtVert",
    descLine1: "Ask me about your plant's problem",
    descLine2: "and I will help you with treatment.",
    askDr: "Ask Dr. ArtVert",
    browse: "Browse Products",
    fabAria: "Chat with Doctor",
  },
} as const;

export function HomeHeroMobile() {
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

  return (
    <section
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden font-sans lg:hidden"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* الخلفية */}
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <Image
          src="/images/home-bg-mobile.png"
          alt="خلفية ArtVert"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="absolute inset-0 z-10 bg-black/10 pointer-events-none" />

      {/* القسم العلوي (الدكتور والفقاعة) */}
      <div className="relative z-20 flex-1 w-full min-h-[480px]">
        
        {/* صورة الدكتور */}
        <div className="absolute -bottom-20 left-[-15px] z-20 w-[50%] max-w-[220px] h-[75%]">
          <Image
            src="/images/artvert-doctor-approved.png"
            alt="دكتور ArtVert الخبير الزراعي"
            fill
            priority
            sizes="50vw"
            className="object-contain object-bottom drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* فقاعة الدكتور: تأثير الزجاج الشفاف مع دعم محاذاة اللغتين (text-start) */}
        <div className="absolute right-0 top-[54%] z-30 w-[55%] max-w-[210px] rounded-[24px] bg-[#0f1a11]/30 px-4 py-3 text-start shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-lg border border-white/20">
          <p className="text-[11px] text-white/90 drop-shadow-md">{t.welcome}</p>
          <strong className="mt-0.5 block text-[15px] font-black text-[#8cd234] drop-shadow-md">
            {t.drName}
          </strong>
          <p className="mt-1 text-[11px] leading-5 text-white/90 drop-shadow-md">
            {t.descLine1}<br />{t.descLine2}
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
            <MessageCircle size={20} className="text-white shrink-0" strokeWidth={2} />
            <span className="text-[14px] font-bold">{t.askDr}</span>
          </Link>

          <Link
            href="/products"
            className="flex h-[64px] flex-row items-center justify-center gap-2 rounded-[16px] bg-[#141f16]/90 border border-white/5 text-white shadow-lg backdrop-blur-md transition active:scale-[.98]"
          >
            <ShoppingBag size={20} className="text-white/80 shrink-0" strokeWidth={2} />
            <span className="text-[14px] font-bold">{t.browse}</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3" aria-label="خدمات ArtVert">
          {mobileServices.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={`${service.href}-${service.titleAr}`}
                href={service.href}
                className="flex min-h-[96px] flex-row items-center justify-between rounded-[20px] bg-[#0c140f]/90 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.3)] border border-white/5 backdrop-blur-md transition active:scale-[.98]"
              >
                <div className="flex flex-col text-start">
                  <span className="text-[14px] font-bold text-white/95">
                    {isArabic ? service.titleAr : service.titleEn}
                  </span>
                  <small className="mt-0.5 text-[11px] text-white/50">
                    {isArabic ? service.descriptionAr : service.descriptionEn}
                  </small>
                </div>
                <Icon className="text-[#8cd234] opacity-90 shrink-0" size={26} strokeWidth={1.5} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* الزر العائم (FAB) */}
      <button 
        aria-label={t.fabAria}
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
        {/* استخدمنا [inset-inline-start] بدلاً من left ليتماشى مع تغيير الاتجاه RTL/LTR */}
        <div className="absolute -top-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#1e2e21] border border-[#18231a] text-white shadow-md [inset-inline-start:-0.25rem]">
          <MessageCircle size={14} className="text-[#8cd234]" strokeWidth={2.5} />
        </div>
      </button>
    </section>
  );
}