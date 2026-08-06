"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Leaf,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";

const mobileServices = [
  {
    title: "تشخيص مشاكل",
    description: "تشخيص سريع",
    href: "/doctor",
    icon: MessageCircle,
  },
  {
    title: "برامج زراعية",
    description: "برامج رعاية متخصصة",
    href: "/plant-care",
    icon: Leaf,
  }
] as const;

export function HomeHeroMobile() {
  return (
    <section
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden font-sans lg:hidden"
      dir="rtl"
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
        
        {/* صورة الدكتور: تم إنزاله للأسفل (-bottom-20) */}
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

        {/* فقاعة الدكتور: تم تنزيلها للأسفل (top-[58%]) وأقصى اليمين (right-2) لتكون فوق الشكارة الزرقاء */}
        <div className="absolute right-2 top-[58%] z-30 w-[55%] max-w-[210px] rounded-[24px] bg-[#0f1a11]/85 px-4 py-3 text-right shadow-2xl backdrop-blur-md border border-white/10">
          <p className="text-[11px] text-white/80">مرحباً بك</p>
          <strong className="mt-0.5 block text-[15px] font-black text-[#8cd234]">
            أنا دكتور ArtVert
          </strong>
          <p className="mt-1 text-[11px] leading-5 text-white/80">
            سألني عن مشكلة نباتك وسأساعدك في<br />العلاج.
          </p>
        </div>
      </div>

      {/* القسم السفلي: الأزرار والخدمات (بدون أي تغيير) */}
      <div className="relative z-30 flex flex-col gap-4 px-4 pb-12">
        
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/doctor"
            className="flex h-[64px] flex-row items-center justify-center gap-2 rounded-[16px] bg-[#0e4813] text-white shadow-lg transition active:scale-[.98]"
          >
            <MessageCircle size={20} className="text-white" strokeWidth={2} />
            <span className="text-[14px] font-bold">اسأل دكتور ArtVert</span>
          </Link>

          <Link
            href="/products"
            className="flex h-[64px] flex-row items-center justify-center gap-2 rounded-[16px] bg-[#141f16]/90 border border-white/5 text-white shadow-lg backdrop-blur-md transition active:scale-[.98]"
          >
            <ShoppingBag size={20} className="text-white/80" strokeWidth={2} />
            <span className="text-[14px] font-bold">تصفح المنتجات</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3" aria-label="خدمات ArtVert">
          {mobileServices.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={`${service.href}-${service.title}`}
                href={service.href}
                className="flex min-h-[96px] flex-row items-center justify-between rounded-[20px] bg-[#0c140f]/90 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.3)] border border-white/5 backdrop-blur-md transition active:scale-[.98]"
              >
                <div className="flex flex-col text-right">
                  <span className="text-[14px] font-bold text-white/95">
                    {service.title}
                  </span>
                  <small className="mt-0.5 text-[11px] text-white/50">
                    {service.description}
                  </small>
                </div>
                <Icon className="text-[#8cd234] opacity-90" size={26} strokeWidth={1.5} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* الزر العائم (FAB) */}
      <button 
        aria-label="محادثة الدكتور"
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