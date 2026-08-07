"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Leaf,
  MessageCircle,
  Package,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Sprout,
  Wheat,
} from "lucide-react";

import AddToCartButton from "@/components/cart/AddToCartButton";
import AnimatedSection from "@/components/AnimatedSection";
import ProductGallery from "@/components/products/ProductGallery";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { CatalogProductImage } from "@/lib/products/product-catalog";


type ProductDetailsClientProps = {
  product: {
    id: string | number;
    slug: string;
    nameAr: string;
    nameEn: string;
    image: string;
    category: string;
    categoryEn: string;
    description: string;
    descriptionEn: string;
    benefits: string[];
    benefitsEn: string[];
    composition: string;
    compositionEn: string;
    dosage: string;
    dosageEn: string;
    packageSize: string;
    crops: string[];
    cropsEn: string[];
    images: CatalogProductImage[];
  };
  price: number | null;
  comparePrice: number | null;
  discount: number;
  hasDiscount: boolean;
  primaryImageUrl: string;
};

const translations = {
  AR: {
    back: "العودة لكل المنتجات",
    original: "منتج أصلي",
    safePacking: "تعبئة آمنة",
    agriculturalSupport: "دعم زراعي",
    discount: "خصم",
    price: "السعر",
    priceOnRequest: "يُحدد عند الطلب",
    packageSize: "حجم العبوة",
    whatsappOrder: "اطلب المنتج عبر واتساب",
    quality: "جودة مضمونة",
    originalArtVert: "منتج ArtVert أصلي",
    specialistGuidance: "إرشاد متخصص",
    beforeAfterSupport: "دعم قبل وبعد الشراء",
    benefits: "مميزات المنتج",
    benefitsSub: "أهم الفوائد المسجلة للمنتج",
    composition: "التركيب",
    compositionSub: "بيانات تركيب المنتج",
    dosage: "طريقة الاستخدام",
    dosageSub: "الجرعة وطريقة التطبيق",
    crops: "المحاصيل والاستخدامات",
    cropsSub: "الاستخدامات المسجلة للمنتج",
    needHelp: "محتاج مساعدة قبل الطلب؟",
    helpText:
      "تواصل مع فريق ArtVert لمساعدتك في اختيار الجرعة والاستخدام المناسب حسب المحصول والحالة.",
    contactNow: "تواصل معنا الآن",
  },
  EN: {
    back: "Back to all products",
    original: "Original Product",
    safePacking: "Safe Packaging",
    agriculturalSupport: "Agricultural Support",
    discount: "Save",
    price: "Price",
    priceOnRequest: "Price on request",
    packageSize: "Package Size",
    whatsappOrder: "Order via WhatsApp",
    quality: "Guaranteed Quality",
    originalArtVert: "Original ArtVert product",
    specialistGuidance: "Specialist Guidance",
    beforeAfterSupport: "Support before and after purchase",
    benefits: "Product Benefits",
    benefitsSub: "Key registered product benefits",
    composition: "Composition",
    compositionSub: "Product composition details",
    dosage: "How to Use",
    dosageSub: "Dosage and application method",
    crops: "Crops & Uses",
    cropsSub: "Registered product uses",
    needHelp: "Need help before ordering?",
    helpText:
      "Contact the ArtVert team for help choosing the right dosage and use for your crop and situation.",
    contactNow: "Contact Us Now",
  },
} as const;

function formatMoney(value: number, isArabic: boolean) {
  return new Intl.NumberFormat(isArabic ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProductDetailsClient({
  product,
  price,
  comparePrice,
  discount,
  hasDiscount,
  primaryImageUrl,
}: ProductDetailsClientProps) {
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

  const productName = isArabic ? product.nameAr : product.nameEn;
  const secondaryName = isArabic ? product.nameEn : product.nameAr;
  const category = isArabic ? product.category : product.categoryEn;
  const description = isArabic ? product.description : product.descriptionEn;
  const benefits = isArabic ? product.benefits : product.benefitsEn;
  const composition = isArabic ? product.composition : product.compositionEn;
  const dosage = isArabic ? product.dosage : product.dosageEn;
  const crops = isArabic ? product.crops : product.cropsEn;

  const whatsappMessage = encodeURIComponent(
    isArabic
      ? `السلام عليكم، أريد طلب منتج ${product.nameAr} من ArtVert Egypt.`
      : `Hello, I would like to order ${product.nameEn} from ArtVert Egypt.`,
  );

  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#061008] py-8 text-white font-sans sm:py-12 lg:py-14"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_15%_6%,rgba(143,202,45,.12),transparent_25%),radial-gradient(circle_at_88%_18%,rgba(38,164,83,.12),transparent_27%),linear-gradient(145deg,#02150d_0%,#063220_48%,#02180f_100%)]" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6">
        <Link
          href="/products"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold text-white/75 transition hover:border-lime-300/35 hover:bg-white/[.08] hover:text-white sm:px-5"
        >
          <BackArrow size={18} />
          {t.back}
        </Link>

        <div className="mt-6 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)] lg:items-start lg:gap-10">
          <AnimatedSection>
            <div className="lg:sticky lg:top-24">
              <ProductGallery
                images={product.images}
                productName={productName}
              />

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3 text-center backdrop-blur-xl">
                  <ShieldCheck
                    size={20}
                    className="mx-auto text-lime-300"
                  />
                  <p className="mt-2 text-[11px] font-black text-white/75">
                    {t.original}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3 text-center backdrop-blur-xl">
                  <Package
                    size={20}
                    className="mx-auto text-lime-300"
                  />
                  <p className="mt-2 text-[11px] font-black text-white/75">
                    {t.safePacking}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3 text-center backdrop-blur-xl">
                  <Sprout
                    size={20}
                    className="mx-auto text-lime-300"
                  />
                  <p className="mt-2 text-[11px] font-black text-white/75">
                    {t.agriculturalSupport}
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="rounded-[28px] border border-lime-300/15 bg-[#0b1a0e]/88 p-5 shadow-[0_22px_70px_rgba(0,0,0,.28)] backdrop-blur-xl sm:p-7 lg:rounded-[32px] lg:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
                  <PackageCheck size={16} />
                  {category}
                </span>

                {hasDiscount ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-lime-300 px-4 py-2 text-xs font-black text-[#071109]">
                    <BadgePercent size={15} />
                    {t.discount} {discount}%
                  </span>
                ) : null}
              </div>

              <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:mt-6 sm:text-5xl">
                {productName}
              </h1>

              <h2
                className="mt-2 text-sm font-bold uppercase tracking-[.14em] text-white/45 sm:text-lg"
                dir={isArabic ? "ltr" : "rtl"}
              >
                {secondaryName}
              </h2>

              <p className="mt-5 text-sm leading-8 text-white/68 sm:text-base sm:leading-9">
                {description}
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-white/40">
                      {t.price}
                    </p>

                    {price !== null && price > 0 ? (
                      <div className="mt-1 flex flex-wrap items-baseline gap-3">
                        <strong className="text-2xl font-black text-lime-300 sm:text-3xl">
                          {formatMoney(price, isArabic)}
                        </strong>

                        {hasDiscount && comparePrice !== null ? (
                          <span className="text-sm font-bold text-white/30 line-through">
                            {formatMoney(comparePrice, isArabic)}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <strong className="mt-1 block text-lg font-black text-lime-300">
                        {t.priceOnRequest}
                      </strong>
                    )}
                  </div>

                  <div className="rounded-xl border border-lime-300/20 bg-lime-300/[.06] px-4 py-3 text-left">
                    <p className="text-[10px] font-bold text-white/35">
                      {t.packageSize}
                    </p>
                    <strong className="mt-1 block text-sm font-black text-white">
                      {product.packageSize}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <AddToCartButton
                  product={{
                    id: product.id,
                    slug: product.slug,
                    nameAr: product.nameAr,
                    nameEn: product.nameEn,
                    image: primaryImageUrl,
                    category: product.category,
                    price,
                    comparePrice,
                  }}
                />
              </div>

              <a
                href={`https://wa.me/201080040408?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl border border-[#36cf7c]/30 bg-[#21a366] px-6 text-sm font-black text-white shadow-[0_8px_25px_rgba(33,163,102,0.22)] transition hover:-translate-y-0.5 hover:bg-[#27b875] sm:text-base"
              >
                <MessageCircle size={20} />
                {t.whatsappOrder}
              </a>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
                  <CheckCircle2
                    size={19}
                    className="shrink-0 text-lime-300"
                  />
                  <div>
                    <p className="text-xs font-black text-white">
                      {t.quality}
                    </p>
                    <p className="mt-1 text-[11px] text-white/40">
                      {t.originalArtVert}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
                  <Leaf
                    size={19}
                    className="shrink-0 text-lime-300"
                  />
                  <div>
                    <p className="text-xs font-black text-white">
                      {t.specialistGuidance}
                    </p>
                    <p className="mt-1 text-[11px] text-white/40">
                      {t.beforeAfterSupport}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>

        <div className="mt-8 grid gap-6 lg:mt-12 lg:grid-cols-2">
          <AnimatedSection>
            <section className="h-full rounded-[26px] border border-white/10 bg-[#0b1a0e]/78 p-5 shadow-xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                  <Sparkles size={20} />
                </div>

                <div>
                  <h3 className="text-xl font-black text-white sm:text-2xl">
                    {t.benefits}
                  </h3>
                  <p className="mt-1 text-xs text-white/40">
                    {t.benefitsSub}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {benefits.map((item, index) => (
                  <div
                    key={`${product.slug}-benefit-${index}`}
                    className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-4 text-sm leading-7 text-white/75 transition hover:border-lime-300/20 hover:bg-white/[.04]"
                  >
                    <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime-300 text-[11px] font-black text-[#071109]">
                      {index + 1}
                    </span>

                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          </AnimatedSection>

          <AnimatedSection>
            <section className="h-full rounded-[26px] border border-white/10 bg-[#0b1a0e]/78 p-5 shadow-xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                  <PackageCheck size={20} />
                </div>

                <div>
                  <h3 className="text-xl font-black text-white sm:text-2xl">
                    {t.composition}
                  </h3>
                  <p className="mt-1 text-xs text-white/40">
                    {t.compositionSub}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/[.06] bg-white/[.025] p-5">
                <p className="whitespace-pre-line text-sm leading-8 text-white/70 sm:text-base">
                  {composition}
                </p>
              </div>
            </section>
          </AnimatedSection>

          <AnimatedSection>
            <section className="h-full rounded-[26px] border border-white/10 bg-[#0b1a0e]/78 p-5 shadow-xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                  <MessageCircle size={20} />
                </div>

                <div>
                  <h3 className="text-xl font-black text-white sm:text-2xl">
                    {t.dosage}
                  </h3>
                  <p className="mt-1 text-xs text-white/40">
                    {t.dosageSub}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/[.06] bg-white/[.025] p-5">
                <p className="whitespace-pre-line text-sm leading-8 text-white/70 sm:text-base">
                  {dosage}
                </p>
              </div>
            </section>
          </AnimatedSection>

          <AnimatedSection>
            <section className="h-full rounded-[26px] border border-white/10 bg-[#0b1a0e]/78 p-5 shadow-xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                  <Wheat size={20} />
                </div>

                <div>
                  <h3 className="text-xl font-black text-white sm:text-2xl">
                    {t.crops}
                  </h3>
                  <p className="mt-1 text-xs text-white/40">
                    {t.cropsSub}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {crops.map((crop, index) => (
                  <span
                    key={`${product.slug}-crop-${index}`}
                    className="inline-flex items-center gap-2 rounded-full border border-lime-300/15 bg-lime-300/[.06] px-4 py-2 text-xs font-bold text-white/70"
                  >
                    <Leaf size={13} className="text-lime-300" />
                    {crop}
                  </span>
                ))}
              </div>
            </section>
          </AnimatedSection>
        </div>

        <AnimatedSection>
          <section className="mt-8 rounded-[26px] border border-lime-300/15 bg-[linear-gradient(135deg,rgba(200,243,63,.08),rgba(11,26,14,.82))] p-5 text-center shadow-xl backdrop-blur-xl sm:p-8 lg:mt-12">
            <h3 className="text-2xl font-black text-white sm:text-3xl">
              {t.needHelp}
            </h3>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
              {t.helpText}
            </p>

            <a
              href={`https://wa.me/201080040408?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 text-sm font-black text-[#071109] transition hover:bg-lime-200"
            >
              <MessageCircle size={18} />
              {t.contactNow}
            </a>
          </section>
        </AnimatedSection>
      </div>
    </main>
  );
}
