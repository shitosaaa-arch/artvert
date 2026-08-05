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

type Product = {
  slug: string;
  nameAr: string;
  nameEn: string;
  image: string;
};

type HomeHeroProps = {
  products?: Product[];
};

const services = [
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

const trustCards = [
  {
    title: "جودة مضمونة",
    description: "منتجات عالية الجودة مضمونة الفعالية",
    icon: ShieldCheck,
    type: "standard",
  },
  {
    title: "آمنة على النباتات",
    description: "تركيبات متوازنة وآمنة على المحاصيل والبيئة",
    icon: Leaf,
    type: "standard",
  },
  {
    title: "تكنولوجيا متقدمة",
    description: "أحدث التقنيات العالمية في خدمة الزراعة",
    icon: Sprout,
    type: "standard",
  },
  {
    title: "أكثر من 10,000 مزارع",
    description: "يثقون بدكتور ArtVert وخبرائنا الزراعيين",
    icon: Users,
    type: "farmers",
  },
] as const;

export function HomeHero({
  products: _products,
}: HomeHeroProps) {
  return (
    <main
      className="relative w-full overflow-hidden bg-[#061008] font-sans text-white"
      dir="rtl"
    >
      <section className="relative isolate min-h-[670px] overflow-hidden border-b border-white/10 lg:min-h-[calc(100vh-52px)]">
        {/* الخلفية بدون بلور أو تعتيم، وتظهر كاملة بدون فراغات */}
        <div
          className="absolute inset-0 -z-40 bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/images/artvert-home-background.jpg'), url('/hero.jpeg')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center center",
          }}
          aria-hidden="true"
        />

        {/* الحاوية الرئيسية للمحتوى */}
        <div
          className="relative mx-auto grid min-h-[570px] w-full max-w-[1480px] gap-4 px-4 pb-24 pt-4 sm:px-6 lg:grid-cols-[300px_minmax(500px,1fr)_130px] lg:items-center lg:px-7 xl:grid-cols-[320px_minmax(570px,1fr)_140px]"
          dir="ltr"
        >
          {/* قسم دكتور ArtVert */}
          <div className="relative order-2 mx-auto h-[390px] w-full max-w-[280px] self-end lg:order-1 lg:h-[490px] lg:max-w-[320px]">
            <div
              className="absolute bottom-0 left-1/2 h-8 w-[62%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl"
              aria-hidden="true"
            />

            <div
              className="absolute right-[-26px] top-12 z-30 w-[165px] rounded-2xl border border-lime-300/15 bg-[#0b1a0e]/90 px-4 py-3 text-right shadow-[0_0_20px_rgba(200,243,63,0.15)] backdrop-blur-md lg:right-[-42px] lg:top-16"
              dir="rtl"
            >
              <p className="text-[10px] font-bold text-white/80">
                مرحبًا بك
              </p>

              <strong className="mt-1 block text-[13px] font-black text-lime-300 drop-shadow-[0_0_10px_rgba(200,243,63,0.3)]">
                أنا دكتور ArtVert
              </strong>

              <p className="mt-1.5 text-[9px] leading-[17px] text-white/60">
                اسألني عن مشكلة نباتك وسأساعدك في التشخيص والعلاج.
              </p>

              <span
                aria-hidden="true"
                className="absolute -left-2 top-[54px] h-4 w-4 rotate-45 border-b border-l border-lime-300/15 bg-[#0b1a0e]"
              />
            </div>

            <Link
              href="/doctor"
              aria-label="افتح دكتور ArtVert"
              className="absolute inset-x-0 bottom-0 z-20 block h-[375px] rounded-[2rem] outline-none focus-visible:ring-4 focus-visible:ring-lime-300/50 lg:h-[470px]"
            >
              <Image
                src="/images/artvert-doctor-approved.png"
                alt="دكتور ArtVert الخبير الزراعي"
                fill
                priority
                sizes="(max-width: 1024px) 280px, 320px"
                className="object-contain object-bottom drop-shadow-[0_22px_25px_rgba(0,0,0,.8)] transition-transform duration-500 hover:scale-[1.02]"
              />
            </Link>
          </div>

          {/* قسم الأزرار المركزية */}
          <div
            className="relative order-1 min-h-[410px] self-center lg:order-2 lg:min-h-[485px]"
            dir="rtl"
          >
            <div className="absolute inset-x-0 top-[40%] z-30 flex -translate-y-1/2 flex-wrap items-center justify-center gap-3 lg:top-[41%]">
              <Link
                href="/doctor"
                className="flex min-h-[48px] min-w-[180px] items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 text-xs font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.25)] transition duration-300 hover:scale-105 hover:bg-lime-200"
              >
                <MessageCircle aria-hidden="true" size={17} />
                اسأل دكتور ArtVert
              </Link>

              <Link
                href="/products"
                className="flex min-h-[48px] min-w-[165px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-6 text-xs font-bold text-white/80 backdrop-blur-md transition duration-300 hover:border-lime-300/40 hover:bg-white/[.08] hover:text-white"
              >
                <ShoppingBag aria-hidden="true" size={17} />
                تصفح المنتجات
              </Link>
            </div>
          </div>

          {/* قسم الخدمات الجانبية */}
          <aside
            className="order-3 grid grid-cols-2 gap-2 self-center lg:grid-cols-1"
            aria-label="خدمات ArtVert"
            dir="rtl"
          >
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <Link
                  key={service.href}
                  href={service.href}
                  className="group flex min-h-[72px] items-center gap-2 rounded-2xl border border-white/5 bg-white/[.02] px-3 text-right backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-lime-300/30 hover:bg-white/[.04] hover:shadow-[0_10px_20px_rgba(200,243,63,0.1)] lg:min-h-[84px] lg:flex-col lg:justify-center lg:text-center"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300 transition duration-300 group-hover:scale-110 group-hover:bg-lime-300/20">
                    <Icon
                      aria-hidden="true"
                      size={20}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] font-black leading-4 text-white">
                      {service.title}
                    </span>

                    <small className="mt-0.5 hidden text-[8px] leading-3 text-white/50 xl:block">
                      {service.description}
                    </small>
                  </div>
                </Link>
              );
            })}
          </aside>
        </div>

        {/* قسم بطاقات الثقة السفلية */}
        <div className="relative z-30 mx-auto grid w-full max-w-[1220px] gap-2 px-4 pb-3 sm:grid-cols-2 sm:px-6 lg:absolute lg:inset-x-0 lg:bottom-0 lg:grid-cols-4 lg:px-7">
          {trustCards.map((card) => {
            const Icon = card.icon;
            const featured = card.type === "farmers";

            return (
              <article
                key={card.title}
                className={[
                  "flex min-h-[74px] items-center gap-3 rounded-[18px] border px-3 py-3 backdrop-blur-xl transition duration-300",
                  featured
                    ? "border-lime-300/40 bg-lime-300/10 shadow-[0_0_20px_rgba(200,243,63,0.15)]"
                    : "border-white/10 bg-[#0b1a0e]/60 hover:border-lime-300/20",
                ].join(" ")}
                dir="rtl"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Icon
                    aria-hidden="true"
                    size={20}
                    strokeWidth={1.7}
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="text-[11px] font-black leading-4 text-white">
                    {card.title}
                  </h2>

                  <p className="mt-0.5 text-[8px] leading-3.5 text-white/60">
                    {card.description}
                  </p>

                  {featured && (
                    <div
                      className="mt-1 flex items-center gap-0.5 text-lime-300"
                      aria-label="تقييم خمس نجوم"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          aria-hidden="true"
                          size={9}
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
    </main>
  );
}
