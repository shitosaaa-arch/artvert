"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Headphones,
  Leaf,
  MessageCircle,
  ShoppingBag,
  Sprout,
} from "lucide-react";

const mobileServices = [
  {
    title: "تشخيص المشاكل",
    description: "تشخيص ذكي وسريع",
    href: "/doctor",
    icon: Sprout,
  },
  {
    title: "برامج زراعية",
    description: "برامج رعاية متخصصة",
    href: "/plant-care",
    icon: Leaf,
  },
  {
    title: "منتجات مضمونة",
    description: "حلول ArtVert الأصلية",
    href: "/products",
    icon: ShoppingBag,
  },
  {
    title: "دعم فني",
    description: "خبراؤنا معك دائمًا",
    href: "/contact",
    icon: Headphones,
  },
] as const;

export function HomeHeroMobile() {
  return (
    <section
      className="relative isolate block min-h-[1510px] w-full overflow-hidden border-b border-white/10 bg-[#061008] lg:hidden"
      dir="rtl"
    >
      {/* خلفية الموبايل الطولية */}
      <div aria-hidden="true" className="absolute inset-0 -z-40">
        <Image
          src="/images/home-bg-mobile.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
      </div>

      {/* تظليل خفيف لضمان وضوح العناصر */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-30 bg-[linear-gradient(180deg,rgba(2,13,8,.02)_0%,rgba(2,13,8,.02)_63%,rgba(2,13,8,.20)_78%,rgba(2,13,8,.76)_100%)]"
      />

      <div className="relative mx-auto min-h-[1510px] w-full max-w-[520px]">
        {/* الدكتور */}
        <Link
          href="/doctor"
          aria-label="افتح دكتور ArtVert"
          className="absolute left-[-8px] top-[250px] z-20 h-[780px] w-[54%] rounded-[2rem] outline-none focus-visible:ring-4 focus-visible:ring-lime-300/50"
        >
          <Image
            src="/images/artvert-doctor-approved.png"
            alt="دكتور ArtVert الخبير الزراعي"
            fill
            priority
            sizes="54vw"
            className="object-contain object-bottom drop-shadow-[0_24px_28px_rgba(0,0,0,.72)]"
          />
        </Link>

        {/* ظل أسفل الدكتور */}
        <div
          aria-hidden="true"
          className="absolute left-[7%] top-[972px] z-10 h-8 w-[38%] rounded-[50%] bg-black/50 blur-xl"
        />

        {/* فقاعة الدكتور */}
        <div className="absolute right-[-8px] top-[390px] z-30 w-[58%] max-w-[305px] rounded-[24px] border border-lime-300/15 bg-[#07130a]/94 px-5 py-4 text-right shadow-[0_18px_40px_rgba(0,0,0,.42)] backdrop-blur-md">
          <p className="text-[12px] font-bold text-white/78">مرحبًا بك</p>

          <strong className="mt-1 block text-[18px] font-black text-lime-300">
            أنا دكتور ArtVert
          </strong>

          <p className="mt-2 text-[12px] leading-6 text-white/70">
            اسألني عن مشكلة نباتك وسأساعدك في التشخيص والعلاج.
          </p>

          <span
            aria-hidden="true"
            className="absolute -left-3 top-[74px] h-6 w-6 rotate-45 border-b border-l border-lime-300/15 bg-[#07130a]"
          />
        </div>

        {/* أزرار الإجراء */}
        <div className="absolute inset-x-0 top-[1015px] z-40 grid grid-cols-2 gap-3 px-3">
          <Link
            href="/doctor"
            className="flex h-[92px] items-center justify-center gap-3 rounded-[22px] bg-[#12620e]/97 px-3 text-center text-[16px] font-black text-white shadow-[0_12px_30px_rgba(0,0,0,.30)] backdrop-blur-sm transition active:scale-[.98]"
          >
            <MessageCircle aria-hidden="true" size={29} strokeWidth={1.8} />
            <span>اسأل دكتور ArtVert</span>
          </Link>

          <Link
            href="/products"
            className="flex h-[92px] items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-[#0b1a0e]/96 px-3 text-center text-[16px] font-black text-white shadow-[0_12px_30px_rgba(0,0,0,.30)] backdrop-blur-sm transition active:scale-[.98]"
          >
            <ShoppingBag aria-hidden="true" size={28} strokeWidth={1.8} />
            <span>تصفح المنتجات</span>
          </Link>
        </div>

        {/* الخدمات */}
        <aside
          className="absolute inset-x-0 top-[1125px] z-40 grid grid-cols-2 gap-3 px-3 pb-7"
          aria-label="خدمات ArtVert"
        >
          {mobileServices.map((service) => {
            const Icon = service.icon;

            return (
              <Link
                key={`${service.href}-${service.title}`}
                href={service.href}
                className="group flex min-h-[162px] items-center justify-between gap-3 rounded-[25px] border border-white/8 bg-[#0b1a0e]/91 px-5 text-right shadow-[0_14px_34px_rgba(0,0,0,.32)] backdrop-blur-md transition active:scale-[.98]"
              >
                <div className="min-w-0">
                  <span className="block text-[17px] font-black leading-7 text-white">
                    {service.title}
                  </span>

                  <small className="mt-2 block text-[11px] leading-5 text-white/52">
                    {service.description}
                  </small>
                </div>

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300 transition group-active:scale-95">
                  <Icon aria-hidden="true" size={29} strokeWidth={1.7} />
                </div>
              </Link>
            );
          })}
        </aside>
      </div>
    </section>
  );
}
