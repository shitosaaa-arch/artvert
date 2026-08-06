"use client";

import Image from "next/image";
import Link from "next/link";
import { Leaf, MessageCircle, ShoppingBag, Sprout } from "lucide-react";

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
] as const;

export function HomeHeroMobile() {
  return (
    <section className="relative isolate block min-h-[1160px] overflow-hidden border-b border-white/10 lg:hidden">
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

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-30 bg-[linear-gradient(180deg,rgba(2,13,8,.03)_0%,rgba(2,13,8,.01)_68%,rgba(2,13,8,.66)_100%)]"
      />

      <div className="relative mx-auto min-h-[1160px] w-full max-w-[520px]" dir="rtl">
        <div className="absolute left-0 right-0 top-[155px] h-[650px]">
          <div
            className="absolute bottom-4 left-[22%] h-8 w-[38%] rounded-[50%] bg-black/45 blur-xl"
            aria-hidden="true"
          />

          <Link
            href="/doctor"
            aria-label="افتح دكتور ArtVert"
            className="absolute bottom-0 left-[-4%] h-[600px] w-[58%] rounded-[2rem] outline-none focus-visible:ring-4 focus-visible:ring-lime-300/50"
          >
            <Image
              src="/images/artvert-doctor-approved.png"
              alt="دكتور ArtVert الخبير الزراعي"
              fill
              priority
              sizes="58vw"
              className="object-contain object-bottom drop-shadow-[0_20px_22px_rgba(0,0,0,.72)]"
            />
          </Link>

          <div
            className="absolute right-[-18px] top-[220px] z-30 w-[245px] rounded-[22px] border border-lime-300/15 bg-[#07130a]/90 px-5 py-4 text-right shadow-[0_14px_34px_rgba(0,0,0,.38)] backdrop-blur-md"
            dir="rtl"
          >
            <p className="text-[11px] font-bold text-white/75">مرحبًا بك</p>
            <strong className="mt-1 block text-[17px] font-black text-lime-300">
              أنا دكتور ArtVert
            </strong>
            <p className="mt-2 text-[11px] leading-5 text-white/65">
              اسألني عن مشكلة نباتك وسأساعدك في التشخيص والعلاج.
            </p>
            <span
              aria-hidden="true"
              className="absolute -left-3 top-[70px] h-6 w-6 rotate-45 border-b border-l border-lime-300/15 bg-[#07130a]"
            />
          </div>
        </div>

        <div className="absolute inset-x-0 top-[820px] z-30 grid grid-cols-2 gap-3 px-3">
          <Link
            href="/doctor"
            className="flex min-h-[88px] items-center justify-center gap-2 rounded-[22px] bg-[#12620e]/95 px-3 text-[15px] font-black text-white shadow-[0_10px_26px_rgba(0,0,0,.28)] backdrop-blur-sm"
          >
            <MessageCircle aria-hidden="true" size={26} strokeWidth={1.8} />
            اسأل دكتور ArtVert
          </Link>

          <Link
            href="/products"
            className="flex min-h-[88px] items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-[#0b1a0e]/94 px-3 text-[15px] font-black text-white shadow-[0_10px_26px_rgba(0,0,0,.28)] backdrop-blur-sm"
          >
            <ShoppingBag aria-hidden="true" size={25} strokeWidth={1.8} />
            تصفح المنتجات
          </Link>
        </div>

        <aside
          className="absolute inset-x-0 top-[930px] z-30 grid grid-cols-2 gap-3 px-3 pb-5"
          aria-label="خدمات ArtVert"
          dir="rtl"
        >
          {mobileServices.map((service) => {
            const Icon = service.icon;

            return (
              <Link
                key={`${service.href}-${service.title}`}
                href={service.href}
                className="flex min-h-[150px] items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-[#0b1a0e]/88 px-5 text-right shadow-[0_12px_30px_rgba(0,0,0,.28)] backdrop-blur-md"
              >
                <div className="min-w-0">
                  <span className="block text-[17px] font-black leading-6 text-white">
                    {service.title}
                  </span>
                  <small className="mt-2 block text-[11px] leading-5 text-white/48">
                    {service.description}
                  </small>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300">
                  <Icon aria-hidden="true" size={27} strokeWidth={1.7} />
                </div>
              </Link>
            );
          })}
        </aside>
      </div>
    </section>
  );
}
