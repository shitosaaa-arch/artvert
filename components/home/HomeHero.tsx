"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Headphones,
  Leaf,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
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
  products = [],
}: HomeHeroProps) {
  return (
    <main
      className="relative w-full overflow-hidden bg-[#061008] font-sans text-white"
      dir="rtl"
    >
      <section className="relative isolate min-h-[760px] overflow-hidden border-b border-white/10 sm:min-h-[820px] lg:min-h-[calc(100vh-62px)]">
        <div
          className="absolute inset-0 -z-40 bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/images/artvert-home-background.jpg'), url('/hero.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
          aria-hidden="true"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-30 bg-[linear-gradient(180deg,rgba(2,13,8,.18)_0%,rgba(2,13,8,.08)_42%,rgba(2,13,8,.74)_100%)] lg:bg-[linear-gradient(90deg,rgba(3,19,12,.18)_0%,rgba(3,19,12,.02)_42%,rgba(3,19,12,.20)_100%)]"
        />

        <div
          className="relative mx-auto grid min-h-[660px] w-full max-w-[1480px] gap-5 px-3 pb-32 pt-5 sm:px-6 lg:min-h-[650px] lg:grid-cols-[320px_minmax(500px,1fr)_150px] lg:items-center lg:px-7 lg:pb-24 xl:grid-cols-[340px_minmax(600px,1fr)_160px]"
          dir="ltr"
        >
          <div className="relative order-2 mx-auto h-[390px] w-full max-w-[290px] self-end sm:h-[430px] sm:max-w-[320px] lg:order-1 lg:h-[520px] lg:max-w-[340px]">
            <div
              className="absolute bottom-0 left-1/2 h-8 w-[62%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl"
              aria-hidden="true"
            />

            <div
              className="absolute right-[-4px] top-8 z-30 w-[170px] rounded-2xl border border-lime-300/20 bg-[#0b1a0e]/92 px-4 py-3 text-right shadow-[0_0_24px_rgba(200,243,63,0.16)] backdrop-blur-xl sm:right-[-18px] lg:right-[-42px] lg:top-16"
              dir="rtl"
            >
              <p className="text-[10px] font-bold text-white/75">
                مرحبًا بك
              </p>

              <strong className="mt-1 block text-[13px] font-black text-lime-300">
                أنا دكتور ArtVert
              </strong>

              <p className="mt-1.5 text-[9px] leading-[17px] text-white/60">
                اسألني عن مشكلة نباتك وسأساعدك في التشخيص والعلاج.
              </p>

              <span
                aria-hidden="true"
                className="absolute -left-2 top-[54px] h-4 w-4 rotate-45 border-b border-l border-lime-300/20 bg-[#0b1a0e]"
              />
            </div>

            <Link
              href="/doctor"
              aria-label="افتح دكتور ArtVert"
              className="absolute inset-x-0 bottom-0 z-20 block h-[375px] rounded-[2rem] outline-none focus-visible:ring-4 focus-visible:ring-lime-300/50 sm:h-[420px] lg:h-[500px]"
            >
              <Image
                src="/images/artvert-doctor-approved.png"
                alt="دكتور ArtVert الخبير الزراعي"
                fill
                priority
                sizes="(max-width: 640px) 290px, (max-width: 1024px) 320px, 340px"
                className="object-contain object-bottom drop-shadow-[0_22px_25px_rgba(0,0,0,.8)] transition-transform duration-500 hover:scale-[1.02]"
              />
            </Link>
          </div>

          <div
            className="relative order-1 flex min-h-[270px] items-center justify-center self-center sm:min-h-[320px] lg:order-2 lg:min-h-[500px]"
            dir="rtl"
          >
            <div className="w-full max-w-[760px] text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-[#0b1a0e]/70 px-4 py-2 text-xs font-black text-lime-300 backdrop-blur-xl">
                <Sparkles size={15} />
                حلول زراعية ذكية من ArtVert Egypt
              </span>

              <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-[1.25] text-white sm:text-5xl lg:text-6xl">
                رعاية أقوى لنباتاتك
                <span className="mt-2 block text-lime-300">
                  وتشخيص أسرع لمشكلتك
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-white/72 sm:text-base lg:text-lg">
                دكتور ArtVert ومنتجاتنا الزراعية المتخصصة يساعدوك في التشخيص، الرعاية، التغذية والحماية بخطوات واضحة.
              </p>

              <div className="mt-7 flex flex-col items-stretch justify-center gap-3 px-3 sm:flex-row sm:items-center sm:px-0">
                <Link
                  href="/doctor"
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-lime-300 px-7 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.25)] transition duration-300 hover:-translate-y-0.5 hover:bg-lime-200"
                >
                  <MessageCircle aria-hidden="true" size={18} />
                  اسأل دكتور ArtVert
                </Link>

                <Link
                  href="/products"
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[.05] px-7 text-sm font-black text-white/88 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-lime-300/40 hover:bg-white/[.09] hover:text-white"
                >
                  <ShoppingBag aria-hidden="true" size={18} />
                  تصفح المنتجات
                </Link>
              </div>
            </div>
          </div>

          <aside
            className="order-3 grid grid-cols-2 gap-2 self-center lg:grid-cols-1"
            aria-label="خدمات ArtVert"
            dir="rtl"
          >
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <Link
                  key={`${service.href}-${service.title}`}
                  href={service.href}
                  className="group flex min-h-[82px] items-center gap-3 rounded-2xl border border-white/8 bg-[#0b1a0e]/58 px-3 text-right backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-lime-300/30 hover:bg-[#0b1a0e]/75 hover:shadow-[0_10px_20px_rgba(200,243,63,0.1)] lg:min-h-[92px] lg:flex-col lg:justify-center lg:text-center"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300 transition duration-300 group-hover:scale-110 group-hover:bg-lime-300/20">
                    <Icon
                      aria-hidden="true"
                      size={21}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <span className="block text-[12px] font-black leading-4 text-white">
                      {service.title}
                    </span>

                    <small className="mt-1 block text-[9px] leading-4 text-white/48">
                      {service.description}
                    </small>
                  </div>
                </Link>
              );
            })}
          </aside>
        </div>

        <div className="relative z-30 mx-auto grid w-full max-w-[1220px] gap-2 px-3 pb-4 sm:grid-cols-2 sm:px-6 lg:absolute lg:inset-x-0 lg:bottom-0 lg:grid-cols-4 lg:px-7">
          {trustCards.map((card) => {
            const Icon = card.icon;
            const featured = card.type === "farmers";

            return (
              <article
                key={card.title}
                className={[
                  "flex min-h-[82px] items-center gap-3 rounded-[18px] border px-4 py-3 backdrop-blur-xl transition duration-300",
                  featured
                    ? "border-lime-300/40 bg-lime-300/10 shadow-[0_0_20px_rgba(200,243,63,0.15)]"
                    : "border-white/10 bg-[#0b1a0e]/70 hover:border-lime-300/20",
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
                  <h2 className="text-[12px] font-black leading-5 text-white">
                    {card.title}
                  </h2>

                  <p className="mt-0.5 text-[9px] leading-4 text-white/58">
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

      {products.length > 0 && (
        <section className="relative border-b border-white/8 bg-[#07130a] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
                  <ShoppingBag size={15} />
                  منتجات مختارة
                </span>

                <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                  منتجات ArtVert المميزة
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                  مجموعة مختارة من منتجاتنا الأكثر استخدامًا للعناية بالنباتات والمحاصيل.
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/10 px-5 text-sm font-black text-lime-300 transition hover:border-lime-300/45 hover:bg-lime-300/15"
              >
                عرض كل المنتجات
                <ArrowLeft size={17} />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <Link
                  key={product.slug}
                  href={`/products/${product.slug}`}
                  className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1a0e] shadow-[0_14px_38px_rgba(0,0,0,.24)] transition duration-300 hover:-translate-y-1.5 hover:border-lime-300/30"
                >
                  <div className="relative h-[230px] overflow-hidden border-b border-white/[.06] bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,.10),rgba(255,255,255,.02)_68%)] sm:h-[250px]">
                    <Image
                      src={product.image}
                      alt={product.nameAr}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-black text-white transition group-hover:text-lime-300">
                      {product.nameAr}
                    </h3>

                    <p
                      dir="ltr"
                      className="mt-1 truncate text-xs font-bold uppercase tracking-[.12em] text-white/35"
                    >
                      {product.nameEn}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-lime-300">
                      عرض المنتج
                      <ArrowLeft size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
