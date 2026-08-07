"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  BadgePercent,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import AddToCartButton from "@/components/cart/AddToCartButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import AnimatedSection from "@/components/AnimatedSection";
import type {
  CatalogProduct,
  CatalogProductImage,
} from "@/lib/products/product-catalog";

type ProductWithCardData =
  CatalogProduct & {
    price?: string | number | null;
    comparePrice?: string | number | null;
    images?: CatalogProductImage[];
  };

function toNumber(
  value: string | number | null | undefined,
) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(value: number, isArabic: boolean) {
  return new Intl.NumberFormat(isArabic ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value);
}

function getPrimaryImage(
  product: ProductWithCardData,
): CatalogProductImage | null {
  const images = product.images ?? [];

  return (
    images.find((image) => image.isPrimary) ??
    images
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)[0] ??
    null
  );
}

function ProductCard({
  product,
}: {
  product: ProductWithCardData;
}) {
  const { isArabic } = useLanguage();

  const image = getPrimaryImage(product);
  const imageUrl = image?.url ?? product.image;
  const price = toNumber(product.price);
  const comparePrice = toNumber(product.comparePrice);

  const hasDiscount =
    price !== null &&
    comparePrice !== null &&
    comparePrice > price;

  const discount = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  return (
    <AnimatedSection className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-lime-300/15 bg-[#0b1a0e]/88 shadow-[0_18px_45px_rgba(0,0,0,.24)] backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-lime-300/35 hover:shadow-[0_24px_60px_rgba(200,243,63,.12)]">
      <div className="relative">
        <Link
          href={`/products/${product.slug}`}
          className="block"
          aria-label={`${isArabic ? "عرض" : "View"} ${isArabic ? product.nameAr : product.nameEn}`}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-white/[.06] bg-[#102819]">
            <Image
              src={imageUrl}
              alt={image?.alt || (isArabic ? product.nameAr : product.nameEn)}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover object-center transition duration-500 group-hover:scale-[1.03] group-hover:brightness-105"
            />

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(2,14,8,.24),transparent_45%)]" />
          </div>
        </Link>

        <div className="pointer-events-none absolute right-4 top-4 flex max-w-[70%] flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-lime-300/25 bg-[#07140b]/85 px-3 py-1.5 text-[11px] font-black text-lime-300 shadow-lg backdrop-blur-md">
            {product.category}
          </span>

          {hasDiscount ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-lime-300 px-3 py-1.5 text-[11px] font-black text-[#071109] shadow-lg">
              <BadgePercent aria-hidden="true" size={13} />
              {isArabic ? "خصم" : "Save"} {discount}%
            </span>
          ) : null}
        </div>

        <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] font-bold text-white/80 backdrop-blur-md">
          <Sparkles
            aria-hidden="true"
            size={12}
            className="text-lime-300"
          />
          ArtVert Original
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={`/products/${product.slug}`} className="block">
          <h2 className="text-xl font-black leading-8 text-white transition group-hover:text-lime-300">
            {isArabic ? product.nameAr : product.nameEn}
          </h2>

          <p
            className="mt-1 truncate text-xs font-bold uppercase tracking-[.13em] text-white/38"
            dir={isArabic ? "ltr" : "rtl"}
          >
            {isArabic ? product.nameEn : product.nameAr}
          </p>
        </Link>

        <p className="mt-3 line-clamp-2 min-h-[48px] text-sm leading-6 text-white/58">
          {product.shortDescription}
        </p>

        <div className="mt-5 flex min-h-[52px] items-end justify-between gap-3 border-t border-white/[.07] pt-4">
          {price !== null && price > 0 ? (
            <div>
              <p className="text-[10px] font-bold text-white/38">
                {isArabic ? "السعر" : "Price"}
              </p>

              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <strong className="text-lg font-black text-lime-300">
                  {formatMoney(price, isArabic)}
                </strong>

                {hasDiscount && comparePrice !== null ? (
                  <span className="text-xs font-bold text-white/32 line-through">
                    {formatMoney(comparePrice, isArabic)}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-bold text-white/38">
                {isArabic ? "السعر" : "Price"}
              </p>

              <strong className="mt-1 block text-sm font-black text-lime-300">
                {isArabic ? "يُحدد عند الطلب" : "Price on request"}
              </strong>
            </div>
          )}

          <Link
            href={`/products/${product.slug}`}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/10 px-4 text-xs font-black text-lime-300 transition hover:border-lime-300/50 hover:bg-lime-300/15"
          >
            {isArabic ? "عرض" : "View"}
            <ArrowLeft aria-hidden="true" size={15} />
          </Link>
        </div>

        <div className="mt-4">
          <AddToCartButton
            product={{
              id: product.id,
              slug: product.slug,
              nameAr: product.nameAr,
              nameEn: product.nameEn,
              image: imageUrl,
              category: product.category,
            }}
          />
        </div>
      </div>
    </AnimatedSection>
  );
}

const categories = [
  { ar: "الكل", en: "All" },
  { ar: "المنشطات الحيوية", en: "Biostimulants" },
  { ar: "الأحماض الأمينية", en: "Amino Acids" },
  { ar: "المبيدات الحشرية", en: "Insecticides" },
  { ar: "الأسمدة المتخصصة", en: "Specialty Fertilizers" },
  { ar: "محسنات التربة", en: "Soil Improvers" },
  { ar: "الزراعة المنزلية", en: "Home Gardening" },
  { ar: "العناصر الصغرى", en: "Micronutrients" },
  { ar: "الأسمدة العضوية", en: "Organic Fertilizers" },
  { ar: "أسمدة الكالسيوم", en: "Calcium Fertilizers" },
  { ar: "محسنات الامتصاص", en: "Absorption Enhancers" },
  { ar: "العناصر الكبرى والصغرى", en: "Macro & Micronutrients" },
  { ar: "الأسمدة المركبة", en: "Compound Fertilizers" },
  { ar: "منشطات الجذور", en: "Root Stimulants" },
  { ar: "منظمات النمو", en: "Growth Regulators" },
] as const;

const translations = {
  AR: {
    catalog: "كتالوج ArtVert",
    products: "منتجات",
    intro: "حلول زراعية متخصصة لتغذية النبات، تحسين النمو، حماية المحاصيل، ورفع الإنتاجية.",
    searchPlaceholder: "ابحث باسم المنتج أو الوصف...",
    productCount: "عدد المنتجات:",
    clearFilters: "مسح التصفية",
    loadErrorTitle: "تعذر تحميل المنتجات",
    loadErrorText: "تأكد أن مسار /api/products يعمل ثم أعد تحميل الصفحة.",
    noProductsTitle: "لا توجد منتجات مطابقة",
    noProductsText: "جرّب كلمة بحث مختلفة أو اختر قسمًا آخر.",
  },
  EN: {
    catalog: "ArtVert Catalog",
    products: "Products",
    intro: "Specialized agricultural solutions for plant nutrition, improved growth, crop protection, and higher productivity.",
    searchPlaceholder: "Search by product name or description...",
    productCount: "Products:",
    clearFilters: "Clear filters",
    loadErrorTitle: "Unable to load products",
    loadErrorText: "Make sure /api/products is working, then reload the page.",
    noProductsTitle: "No matching products",
    noProductsText: "Try a different search term or choose another category.",
  },
} as const;

export default function ProductsPage() {
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

  const [
    products,
    setProducts,
  ] =
    useState<CatalogProduct[]>(
      [],
    );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("الكل");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setLoadError(false);

        const response =
          await fetch(
            "/api/products",
            {
              cache:
                "no-store",
            },
          );

        if (!response.ok) {
          throw new Error(
            "Catalog unavailable",
          );
        }

        const data =
          (await response.json()) as CatalogProduct[];

        if (active) {
          setProducts(
            Array.isArray(data)
              ? data
              : [],
          );
        }
      } catch {
        if (active) {
          setProducts([]);
          setLoadError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const searchMatch =
            normalizedSearch.length ===
              0 ||
            product.nameAr
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            product.nameEn
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            product.shortDescription
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const categoryMatch =
            category ===
              "الكل" ||
            product.category ===
              category;

          return (
            searchMatch &&
            categoryMatch
          );
        },
      );
    }, [
      products,
      search,
      category,
    ]);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#061008] py-10 text-white font-sans sm:py-14"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* شبكة الخلفية الخفيفة المدمجة مع التصميم (Subtle Grid Overlay) */}
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
        <AnimatedSection>
          <section className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
              <ShoppingBag
                aria-hidden="true"
                size={16}
              />
              {t.catalog}
            </span>

            <h1 className="mt-6 text-4xl font-black text-white sm:text-5xl lg:text-6xl">
              {t.products}{" "}
              <span className="text-lime-300 drop-shadow-[0_0_25px_rgba(200,243,63,0.3)]">
                ArtVert Egypt
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80">
              {t.intro}
            </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <div className="relative mt-10">
            <Search
              aria-hidden="true"
              size={20}
              className={[
                "absolute top-1/2 -translate-y-1/2 text-lime-300",
                isArabic ? "right-5" : "left-5",
              ].join(" ")}
            />

            <input
              type="search"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              className={[
                "h-14 w-full rounded-2xl border border-lime-300/20 bg-[#0b1a0e]/90 text-base text-white outline-none backdrop-blur-xl transition placeholder:text-white/40 focus:border-lime-300/60 focus:ring-4 focus:ring-lime-300/10 shadow-lg",
                isArabic ? "pr-12 pl-5" : "pl-12 pr-5",
              ].join(" ")}
            />
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 sm:mt-7 sm:flex-wrap sm:justify-center sm:overflow-visible">
            {categories.map(
              (item) => {
                const active =
                  category ===
                  item.ar;

                return (
                  <button
                    key={item.ar}
                    type="button"
                    onClick={() =>
                      setCategory(
                        item.ar,
                      )
                    }
                    className={[
                      "min-h-10 shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300 sm:text-sm",
                      active
                        ? "border-lime-300 bg-lime-300 text-[#071109] shadow-[0_0_15px_rgba(200,243,63,0.3)]"
                        : "border-white/10 bg-[#0b1a0e]/60 text-white/75 hover:border-lime-300/40 hover:bg-lime-300/10 hover:text-white backdrop-blur-md",
                    ].join(" ")}
                  >
                    {isArabic ? item.ar : item.en}
                  </button>
                );
              },
            )}
          </div>
        </AnimatedSection>

        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-white/60">
            {t.productCount}
            <span className="mr-2 text-lg font-black text-lime-300">
              {
                filteredProducts.length
              }
            </span>
          </p>

          {(search ||
            category !==
              "الكل") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory(
                  "الكل",
                );
              }}
              className="text-sm font-bold text-lime-300 underline underline-offset-4 transition hover:text-white"
            >
              {t.clearFilters}
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[
              1, 2, 3, 4, 5, 6,
              7, 8,
            ].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/50 backdrop-blur-xl"
              >
                <div className="h-[280px] animate-pulse bg-white/[.04]" />

                <div className="space-y-3 p-5">
                  <div className="h-4 w-24 animate-pulse rounded bg-white/[.06]" />
                  <div className="h-6 w-3/4 animate-pulse rounded bg-white/[.06]" />
                  <div className="h-4 w-full animate-pulse rounded bg-white/[.06]" />
                  <div className="h-11 animate-pulse rounded-xl bg-white/[.06]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading &&
          loadError && (
            <div className="mt-10 rounded-[24px] border border-rose-400/25 bg-rose-400/10 p-8 text-center backdrop-blur-xl">
              <h2 className="text-xl font-black text-white">
                {t.loadErrorTitle}
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/60">
                {t.loadErrorText}
              </p>
            </div>
          )}

        {!loading &&
          !loadError &&
          filteredProducts.length ===
            0 && (
            <div className="mt-10 rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/80 p-10 text-center shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl">
              <h2 className="text-xl font-black text-white">
                {t.noProductsTitle}
              </h2>

              <p className="mt-3 text-sm text-white/60">
                {t.noProductsText}
              </p>
            </div>
          )}

        {!loading &&
          !loadError &&
          filteredProducts.length >
            0 && (
            <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={
                      product as ProductWithCardData
                    }
                  />
                ),
              )}
            </div>
          )}
      </div>
    </main>
  );
}