"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { HomeHeroDesktop } from "./HomeHeroDesktop";
import { HomeHeroMobile } from "./HomeHeroMobile";

export type Product = {
  slug: string;
  nameAr: string;
  nameEn: string;
  image: string;
};

type HomeHeroProps = {
  products?: Product[];
};

const translations = {
  AR: {
    selectedProducts: "منتجات مختارة",
    featuredProducts: "منتجات ArtVert المميزة",
    description:
      "مجموعة مختارة من منتجاتنا الأكثر استخدامًا للعناية بالنباتات والمحاصيل.",
    viewAll: "عرض كل المنتجات",
    viewProduct: "عرض المنتج",
  },
  EN: {
    selectedProducts: "Selected Products",
    featuredProducts: "Featured ArtVert Products",
    description:
      "A selection of our most popular products for plant and crop care.",
    viewAll: "View All Products",
    viewProduct: "View Product",
  },
} as const;

export function HomeHero({ products = [] }: HomeHeroProps) {
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

  return (
    <main
      className="relative w-full overflow-hidden bg-[#061008] font-sans text-white"
      dir="rtl"
    >
      <HomeHeroMobile />
      <HomeHeroDesktop />

      {products.length > 0 && (
        <section className="relative border-b border-white/8 bg-[#07130a] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
                  <ShoppingBag size={15} />
                  {t.selectedProducts}
                </span>

                <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                  {t.featuredProducts}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                  {t.description}
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/10 px-5 text-sm font-black text-lime-300 transition hover:border-lime-300/45 hover:bg-lime-300/15"
              >
                {t.viewAll}
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
                      alt={isArabic ? product.nameAr : product.nameEn}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-black text-white transition group-hover:text-lime-300">
                      {isArabic ? product.nameAr : product.nameEn}
                    </h3>

                    <p
                      dir="ltr"
                      className="mt-1 truncate text-xs font-bold uppercase tracking-[.12em] text-white/35"
                    >
                      {isArabic ? product.nameEn : product.nameAr}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-lime-300">
                      {t.viewProduct}
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
