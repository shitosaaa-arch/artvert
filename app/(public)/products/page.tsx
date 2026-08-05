"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Search,
  ShoppingBag,
} from "lucide-react";

import AnimatedSection from "@/components/AnimatedSection";
import type {
  CatalogProduct,
} from "@/lib/products/product-catalog";

/* =========================================================
   إعدادات صور كروت صفحة المنتجات

   PRODUCT_CARD_IMAGE_HEIGHT
   ارتفاع مساحة الصورة داخل الكارت.

   PRODUCT_CARD_IMAGE_SCALE
   حجم الصورة نفسها:
   0.75 = أصغر
   0.90 = أصغر قليلًا
   1.00 = طبيعي
   1.10 = أكبر
   1.20 = أكبر بوضوح

   PRODUCT_CARD_IMAGE_PADDING
   المسافة حول الصورة:
   p-2  = الصورة أكبر
   p-6  = متوسطة
   p-10 = أصغر
   ========================================================= */

const PRODUCT_CARD_IMAGE_HEIGHT =
  "h-[280px]";

const PRODUCT_CARD_IMAGE_SCALE =
  1;

const PRODUCT_CARD_IMAGE_PADDING =
  "p-4";

const categories = [
  "الكل",
  "المنشطات الحيوية",
  "الأحماض الأمينية",
  "المبيدات الحشرية",
  "الأسمدة المتخصصة",
  "محسنات التربة",
  "الزراعة المنزلية",
  "العناصر الصغرى",
  "الأسمدة العضوية",
  "أسمدة الكالسيوم",
  "محسنات الامتصاص",
  "العناصر الكبرى والصغرى",
  "الأسمدة المركبة",
  "منشطات الجذور",
  "منظمات النمو",
] as const;

export default function ProductsPage() {
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
      className="relative min-h-screen overflow-hidden bg-[#061008] py-14 text-white font-sans"
      dir="rtl"
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

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <section className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
              <ShoppingBag
                aria-hidden="true"
                size={16}
              />
              كتالوج ArtVert
            </span>

            <h1 className="mt-6 text-4xl font-black text-white sm:text-5xl lg:text-6xl">
              منتجات{" "}
              <span className="text-lime-300 drop-shadow-[0_0_25px_rgba(200,243,63,0.3)]">
                ArtVert Egypt
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80">
              حلول زراعية متخصصة
              لتغذية النبات، تحسين
              النمو، حماية المحاصيل،
              ورفع الإنتاجية.
            </p>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <div className="relative mt-10">
            <Search
              aria-hidden="true"
              size={20}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-lime-300"
            />

            <input
              type="search"
              placeholder="ابحث باسم المنتج أو الوصف..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              className="h-14 w-full rounded-2xl border border-lime-300/20 bg-[#0b1a0e]/90 pr-12 pl-5 text-base text-white outline-none backdrop-blur-xl transition placeholder:text-white/40 focus:border-lime-300/60 focus:ring-4 focus:ring-lime-300/10 shadow-lg"
            />
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {categories.map(
              (item) => {
                const active =
                  category ===
                  item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setCategory(
                        item,
                      )
                    }
                    className={[
                      "min-h-10 rounded-full border px-4 py-2 text-sm font-bold transition-all duration-300",
                      active
                        ? "border-lime-300 bg-lime-300 text-[#071109] shadow-[0_0_15px_rgba(200,243,63,0.3)]"
                        : "border-white/10 bg-[#0b1a0e]/60 text-white/75 hover:border-lime-300/40 hover:bg-lime-300/10 hover:text-white backdrop-blur-md",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                );
              },
            )}
          </div>
        </AnimatedSection>

        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-white/60">
            عدد المنتجات:
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
              مسح التصفية
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
                تعذر تحميل المنتجات
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/60">
                تأكد أن مسار
                <span className="mx-1 font-bold text-lime-300">
                  /api/products
                </span>
                يعمل ثم أعد تحميل
                الصفحة.
              </p>
            </div>
          )}

        {!loading &&
          !loadError &&
          filteredProducts.length ===
            0 && (
            <div className="mt-10 rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/80 p-10 text-center shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl">
              <h2 className="text-xl font-black text-white">
                لا توجد منتجات مطابقة
              </h2>

              <p className="mt-3 text-sm text-white/60">
                جرّب كلمة بحث مختلفة
                أو اختر قسمًا آخر.
              </p>
            </div>
          )}

        {!loading &&
          !loadError &&
          filteredProducts.length >
            0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map(
                (product) => (
                  <AnimatedSection
                    key={product.id}
                    className="group flex flex-col overflow-hidden rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/80 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-lime-300/40 hover:shadow-[0_15px_30px_rgba(200,243,63,0.15)]"
                  >
                    <Link
                      href={`/products/${product.slug}`}
                      className="flex h-full flex-col"
                    >
                      <div
                        className={[
                          "relative overflow-hidden border-b border-white/5 bg-white/[.02] transition-colors group-hover:bg-white/[.04]",
                          PRODUCT_CARD_IMAGE_HEIGHT,
                          PRODUCT_CARD_IMAGE_PADDING,
                        ].join(" ")}
                      >
                        <Image
                          src={
                            product.image
                          }
                          alt={
                            product.nameAr
                          }
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-contain transition duration-500 group-hover:scale-105"
                          style={{
                            transform: `scale(${PRODUCT_CARD_IMAGE_SCALE})`,
                          }}
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <span className="inline-flex w-fit items-center rounded-full bg-lime-300/10 px-3 py-1 text-xs font-bold text-lime-300">
                          {
                            product.category
                          }
                        </span>

                        <h2 className="mt-3 text-xl font-black text-white transition group-hover:text-lime-300">
                          {
                            product.nameAr
                          }
                        </h2>

                        <p
                          className="mt-1 text-xs font-bold uppercase tracking-widest text-white/40"
                          dir="ltr"
                        >
                          {
                            product.nameEn
                          }
                        </p>

                        <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-white/60">
                          {
                            product.shortDescription
                          }
                        </p>

                        <div className="mt-auto pt-5">
                          <div className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-lime-300 px-6 text-sm font-black text-[#071109] shadow-[0_5px_15px_rgba(200,243,63,0.2)] transition duration-300 group-hover:scale-[1.02] group-hover:bg-lime-200">
                            تفاصيل المنتج
                          </div>
                        </div>
                      </div>
                    </Link>
                  </AnimatedSection>
                ),
              )}
            </div>
          )}
      </div>
    </main>
  );
}