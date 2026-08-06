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
    <section
      className="relative isolate block h-[1155px] w-full overflow-hidden border-b border-white/10 bg-[#061008] lg:hidden"
      dir="rtl"
    >
      {/* الخلفية الطولية الخاصة بالموبايل — تظهر بالكامل بنفس تكوين الصورة */}
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

      {/* تظليل خفيف في الجزء السفلي فقط لرفع وضوح الأزرار والكروت */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-30 bg-[linear-gradient(180deg,transparent_0%,transparent_70%,rgba(2,13,8,.12)_82%,rgba(2,13,8,.56)_100%)]"
      />

      <div className="relative mx-auto h-full w-full max-w-[520px]">
        {/* الدكتور */}
        <div className="absolute inset-x-0 top-[185px] h-[665px]">
          <div
            aria-hidden="true"
            className="absolute bottom-3 left-[19%] h-8 w-[38%] rounded-[50%] bg-black/50 blur-xl"
          />

          <Link
            href="/doctor"
            aria-label="افتح دكتور ArtVert"
            className="absolute bottom-0 left-[-3%] h-[625px] w-[57%] rounded-[2rem] outline-none focus-visible:ring-4 focus-visible:ring-lime-300/50"
          >
            <Image
              src="/images/artvert-doctor-approved.png"
              alt="دكتور ArtVert الخبير الزراعي"
              fill
              priority
              sizes="57vw"
              className="object-contain object-bottom drop-shadow-[0_20px_22px_rgba(0,0,0,.72)]"
            />
          </Link>

          {/* فقاعة الدكتور */}
          <div
            className="absolute right-[-20px] top-[145px] z-30 w-[248px] rounded-[22px] border border-lime-300/15 bg-[#07130a]/91 px-5 py-4 text-right shadow-[0_14px_34px_rgba(0,0,0,.38)] backdrop-blur-md"
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

        {/* أزرار الإجراء — بنفس مكان وترتيب الصورة المرجعية */}
        <div className="absolute inset-x-0 top-[850px] z-30 grid grid-cols-2 gap-3 px-3">
          <Link
            href="/doctor"
            className="flex min-h-[90px] items-center justify-center gap-2 rounded-[22px] bg-[#12620e]/96 px-3 text-center text-[15px] font-black text-white shadow-[0_10px_26px_rgba(0,0,0,.28)] backdrop-blur-sm transition active:scale-[.98]"
          >
            <MessageCircle aria-hidden="true" size={27} strokeWidth={1.8} />
            <span>اسأل دكتور ArtVert</span>
          </Link>

          <Link
            href="/products"
            className="flex min-h-[90px] items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-[#0b1a0e]/95 px-3 text-center text-[15px] font-black text-white shadow-[0_10px_26px_rgba(0,0,0,.28)] backdrop-blur-sm transition active:scale-[.98]"
          >
            <ShoppingBag aria-hidden="true" size={26} strokeWidth={1.8} />
            <span>تصفح المنتجات</span>
          </Link>
        </div>

        {/* كروت الخدمات الظاهرة أسفل الهيرو */}
        <aside
          className="absolute inset-x-0 top-[985px] z-30 grid grid-cols-2 gap-3 px-3"
          aria-label="خدمات ArtVert"
        >
          {mobileServices.map((service) => {
            const Icon = service.icon;

            return (
              <Link
                key={`${service.href}-${service.title}`}
                href={service.href}
                className="flex min-h-[150px] items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-[#0b1a0e]/89 px-5 text-right shadow-[0_12px_30px_rgba(0,0,0,.28)] backdrop-blur-md transition active:scale-[.98]"
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
