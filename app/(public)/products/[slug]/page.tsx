import type {
  Metadata,
} from "next";
import Link from "next/link";
import {
  notFound,
} from "next/navigation";
import {
  ArrowRight,
  Leaf,
  MessageCircle,
  PackageCheck,
  Sparkles,
} from "lucide-react";

import AddToCartButton from "@/components/cart/AddToCartButton";
import AnimatedSection from "@/components/AnimatedSection";
import ProductGallery from "@/components/products/ProductGallery";
import {
  getProductCatalog,
} from "@/lib/products/product-catalog";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } =
    await params;

  const product =
    await getProductCatalog().findBySlug(
      slug,
    );

  return {
    title: product
      ? `${product.nameAr} | ArtVert Egypt`
      : "ArtVert Egypt",

    description:
      product?.description ||
      "حلول زراعية متكاملة",
  };
}

export default async function ProductPage({
  params,
}: Props) {
  const { slug } =
    await params;

  const product =
    await getProductCatalog().findBySlug(
      slug,
    );

  if (!product) {
    notFound();
  }

  const primaryImage =
    product.images.find(
      (image) =>
        image.isPrimary,
    ) ??
    product.images[0];

  const whatsappMessage =
    encodeURIComponent(
      `السلام عليكم، أريد طلب منتج ${product.nameAr} من ArtVert Egypt.`,
    );

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
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-5 py-3 text-sm font-bold text-white/75 transition hover:border-lime-300/35 hover:bg-white/[.08] hover:text-white"
        >
          <ArrowRight
            size={18}
          />
          العودة لكل المنتجات
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
          <AnimatedSection>
            <ProductGallery
              images={
                product.images
              }
              productName={
                product.nameAr
              }
            />
          </AnimatedSection>

          <AnimatedSection>
            <div className="rounded-[32px] border border-lime-300/15 bg-[#0b1a0e]/80 p-6 shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
                <PackageCheck
                  size={16}
                />
                {
                  product.category
                }
              </span>

              <h1 className="mt-6 text-4xl font-black text-white sm:text-5xl">
                {
                  product.nameAr
                }
              </h1>

              <h2
                className="mt-2 text-lg font-bold uppercase tracking-widest text-white/50 sm:text-xl"
                dir="ltr"
              >
                {
                  product.nameEn
                }
              </h2>

              <p className="mt-6 text-base leading-8 text-white/70 sm:text-lg sm:leading-9">
                {
                  product.description
                }
              </p>

              <div className="mt-8">
                <AddToCartButton
                  product={{
                    id: product.id,
                    slug:
                      product.slug,
                    nameAr:
                      product.nameAr,
                    nameEn:
                      product.nameEn,
                    image:
                      primaryImage?.url ??
                      product.image,
                    category:
                      product.category,
                  }}
                />
              </div>

              {/* قسم المميزات */}
              <section className="mt-12">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300 shadow-[0_0_15px_rgba(200,243,63,0.2)]">
                    <Sparkles
                      size={20}
                    />
                  </div>

                  <h3 className="text-2xl font-black text-white sm:text-3xl">
                    مميزات المنتج
                  </h3>
                </div>

                <div className="mt-6 grid gap-3">
                  {product.benefits.map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={`${product.slug}-benefit-${index}`}
                        className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[.02] p-4 text-sm leading-7 text-white/80 backdrop-blur-md transition duration-300 hover:border-lime-300/20 hover:bg-white/[.04] sm:text-base"
                      >
                        <Leaf
                          size={18}
                          className="mt-1 shrink-0 text-lime-300"
                        />

                        <span>
                          {item}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </section>

              {/* قسم التركيب */}
              <section className="mt-12">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300 shadow-[0_0_15px_rgba(200,243,63,0.2)]">
                    <PackageCheck
                      size={20}
                    />
                  </div>

                  <h3 className="text-2xl font-black text-white sm:text-3xl">
                    التركيب
                  </h3>
                </div>

                <div className="mt-6 rounded-2xl border border-white/5 bg-white/[.02] p-5 backdrop-blur-md">
                  <p className="whitespace-pre-line text-sm leading-8 text-white/70 sm:text-base">
                    {
                      product.composition
                    }
                  </p>
                </div>
              </section>

              {/* قسم طريقة الاستخدام */}
              <section className="mt-12">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300 shadow-[0_0_15px_rgba(200,243,63,0.2)]">
                    <MessageCircle
                      size={20}
                    />
                  </div>

                  <h3 className="text-2xl font-black text-white sm:text-3xl">
                    طريقة الاستخدام
                  </h3>
                </div>

                <div className="mt-6 rounded-2xl border border-white/5 bg-white/[.02] p-5 backdrop-blur-md">
                  <p className="whitespace-pre-line text-sm leading-8 text-white/70 sm:text-base">
                    {
                      product.dosage
                    }
                  </p>
                </div>
              </section>

              <a
                href={`https://wa.me/201080040408?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#21a366] px-6 text-base font-black text-white shadow-[0_8px_25px_rgba(33,163,102,0.25)] transition hover:scale-[1.02] hover:bg-[#27b875]"
              >
                <MessageCircle
                  size={20}
                />
                اطلب المنتج عبر واتساب
              </a>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </main>
  );
}