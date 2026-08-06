"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Leaf,
  MessageCircle,
  ShoppingBag,
  Sprout,
} from "lucide-react"; // تم إزالة Headphones لعدم ظهورها في الجزء المرئي من الصورة

const mobileServices = [
  {
    title: "تشخيص المشاكل",
    description: "تشخيص ذكي وسريع",
    href: "/doctor",
    icon: MessageCircle, // تم تعديل الأيقونة لتطابق الصورة
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
      className="relative flex min-h-screen w-full flex-col bg-[#080d09] pb-24 lg:hidden font-sans"
      dir="rtl"
    >
      {/* 
        القسم العلوي: البانر الرئيسي (Hero)
        نفترض أن الخلفية (home-bg-mobile.png) تحتوي على الحقل والمنتجات والنصوص العلوية،
        وسنقوم بتركيب صورة الدكتور والفقاعة فوقها.
      */}
      <div className="relative w-full h-[550px] overflow-hidden shrink-0">
        {/* خلفية الحقل والمنتجات */}
        <div aria-hidden="true" className="absolute inset-0 z-0">
          <Image
            src="/images/home-bg-mobile.png"
            alt="خلفية ArtVert"
            fill
            priority
            sizes="100vw"
            className="object-cover object-bottom"
          />
        </div>

        {/* تدرج لوني خفيف من الأسفل لدمج الصورة مع لون خلفية الموقع */}
        <div className="absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[#080d09] to-transparent" />

        {/* صورة الدكتور */}
        <div className="absolute bottom-4 left-[-10px] z-20 w-[48%] h-[75%]">
          <Image
            src="/images/artvert-doctor-approved.png"
            alt="دكتور ArtVert الخبير الزراعي"
            fill
            priority
            sizes="50vw"
            className="object-contain object-bottom drop-shadow-2xl"
          />
        </div>

        {/* فقاعة الدكتور - مطابقة تماماً للنص والشكل في الصورة */}
        <div className="absolute right-4 top-[40%] z-30 w-[55%] max-w-[220px] rounded-3xl bg-[#132015]/85 px-4 py-3 text-right shadow-2xl backdrop-blur-md border border-white/5">
          <p className="text-[11px] text-white/80">مرحباً بك</p>
          <strong className="mt-0.5 block text-[15px] font-black text-[#94d538]">
            أنا دكتور ArtVert
          </strong>
          <p className="mt-1 text-[11px] leading-5 text-white/80">
            سألني عن مشكلة نباتك وسأساعدك في<br />العلاج.
          </p>
        </div>
      </div>

      {/* 
        القسم السفلي: الأزرار والخدمات
      */}
      <div className="relative z-40 -mt-2 flex flex-col gap-4 px-4">
        
        {/* أزرار الإجراء (Action Buttons) - مطابقة لترتيب وألوان الصورة */}
        <div className="grid grid-cols-2 gap-3">
          {/* الزر الأيمن (تصفح المنتجات) - داكن */}
          <Link
            href="/products"
            className="flex h-[72px] flex-row items-center justify-center gap-2.5 rounded-[20px] bg-[#162018] text-white shadow-lg border border-white/5 transition active:scale-[.98]"
          >
            <span className="text-[14px] font-bold">تصفح المنتجات</span>
            <ShoppingBag size={20} className="text-white/70" strokeWidth={1.8} />
          </Link>

          {/* الزر الأيسر (اسأل دكتور) - أخضر */}
          <Link
            href="/doctor"
            className="flex h-[72px] flex-row items-center justify-center gap-2.5 rounded-[20px] bg-[#165a18] text-white shadow-lg transition active:scale-[.98]"
          >
            <span className="text-[14px] font-bold">اسأل دكتور ArtVert</span>
            <MessageCircle size={20} className="text-white/90" strokeWidth={1.8} />
          </Link>
        </div>

        {/* الخدمات (Services Grid) */}
        <div className="grid grid-cols-2 gap-3 mt-2" aria-label="خدمات ArtVert">
          {mobileServices.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={`${service.href}-${service.title}`}
                href={service.href}
                className="flex min-h-[110px] flex-row items-center justify-between rounded-[24px] bg-[#121c15] p-5 shadow-lg border border-white/5 transition active:scale-[.98]"
              >
                <div className="flex flex-col text-right">
                  <span className="text-[15px] font-bold text-white/90">
                    {service.title}
                  </span>
                  <small className="mt-1 text-[11px] text-white/50">
                    {service.description}
                  </small>
                </div>
                {/* الأيقونة تظهر بدون خلفية مربعة كما في الصورة */}
                <Icon className="text-[#8cd234] opacity-80 mr-2" size={26} strokeWidth={1.5} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* الزر العائم الثابت (Floating Action Button) الموجود أسفل يسار الصورة */}
      <button 
        aria-label="محادثة الدكتور"
        className="fixed bottom-6 right-6 z-50 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#18231a] shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10 transition active:scale-95"
      >
        <div className="relative h-[56px] w-[56px] overflow-hidden rounded-full bg-black/20">
          <Image 
            src="/images/artvert-doctor-approved.png" 
            alt="Doctor Avatar" 
            fill 
            className="object-cover object-top" 
          />
        </div>
        {/* أيقونة المحادثة الصغيرة فوق الزر */}
        <div className="absolute -bottom-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#1c2920] border border-white/10 text-white shadow-md">
          <MessageCircle size={14} className="text-white/80" />
        </div>
      </button>
    </section>
  );
}