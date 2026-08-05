"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import {
  useCart,
} from "@/components/cart/CartProvider";

export default function CartPage() {
  const {
    items,
    totalItems,
    isReady,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  // حالة التحميل
  if (!isReady) {
    return (
      <main
        className="relative min-h-screen overflow-hidden bg-[#061008] px-4 py-16 text-white font-sans"
        dir="rtl"
      >
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="h-10 w-56 animate-pulse rounded-full bg-white/[.06]" />

          <div className="mt-10 grid gap-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-[24px] border border-lime-300/10 bg-[#0b1a0e]/50 backdrop-blur-md"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // حالة السلة فارغة
  if (items.length === 0) {
    return (
      <main
        className="relative grid min-h-[calc(100vh-76px)] place-items-center overflow-hidden bg-[#061008] px-4 py-16 text-white font-sans"
        dir="rtl"
      >
        {/* تأثيرات الخلفية الزجاجية الخفيفة */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(200,243,63,.05),transparent_50%)]" />

        <section className="relative z-10 w-full max-w-xl rounded-[32px] border border-lime-300/20 bg-[#0b1a0e]/80 p-8 text-center shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-lime-300/10 text-lime-300 shadow-[0_0_20px_rgba(200,243,63,0.2)]">
            <ShoppingBag
              aria-hidden="true"
              size={38}
            />
          </div>

          <h1 className="mt-6 text-3xl font-black text-white">
            سلة التسوق فارغة
          </h1>

          <p className="mt-3 leading-7 text-white/60">
            أضف المنتجات التي تحتاجها، ثم ارجع هنا لإتمام الطلب.
          </p>

          <Link
            href="/products"
            className="mt-7 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-lime-300 px-8 font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.25)] transition hover:scale-105 hover:bg-lime-200"
          >
            تصفح المنتجات
            <ArrowLeft
              aria-hidden="true"
              size={18}
            />
          </Link>
        </section>
      </main>
    );
  }

  // حالة وجود منتجات في السلة
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#061008] px-4 py-14 text-white font-sans"
      dir="rtl"
    >
      {/* شبكة الخلفية الفسفورية الخفيفة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* الهيدر وزر التفريغ */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
              <ShoppingBag size={16} />
              سلة ArtVert
            </span>

            <h1 className="mt-4 text-4xl font-black text-white">
              سلة التسوق
            </h1>

            <p className="mt-2 text-sm text-white/60">
              إجمالي عدد القطع: {totalItems}
            </p>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 text-sm font-black text-rose-200 transition hover:bg-rose-400/20"
          >
            <Trash2
              aria-hidden="true"
              size={17}
            />
            تفريغ السلة
          </button>
        </div>

        {/* محتوى السلة وملخص الطلب */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* المنتجات */}
          <section className="grid gap-5">
            {items.map((item) => (
              <article
                key={item.slug}
                className="grid gap-5 rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/80 p-4 shadow-xl backdrop-blur-xl transition duration-300 hover:border-lime-300/30 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center"
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative h-40 min-h-0 overflow-hidden rounded-2xl border border-white/5 bg-white/[.02]"
                >
                  <Image
                    src={item.image}
                    alt={item.nameAr}
                    fill
                    sizes="150px"
                    className="object-contain p-3 transition-transform duration-500 hover:scale-105"
                  />
                </Link>

                <div className="min-w-0">
                  {item.category && (
                    <span className="inline-flex rounded-full bg-lime-300/10 px-3 py-1 text-xs font-bold text-lime-300">
                      {item.category}
                    </span>
                  )}

                  <Link
                    href={`/products/${item.slug}`}
                    className="mt-3 block text-xl font-black text-white transition hover:text-lime-300"
                  >
                    {item.nameAr}
                  </Link>

                  <p
                    className="mt-1 text-xs font-bold uppercase tracking-widest text-white/40"
                    dir="ltr"
                  >
                    {item.nameEn}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    {/* التحكم في الكمية */}
                    <div className="flex h-11 items-center rounded-xl border border-white/10 bg-white/[.04]">
                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.slug)}
                        className="grid h-11 w-11 place-items-center text-lime-300 transition hover:bg-lime-300/10"
                        aria-label={`زيادة كمية ${item.nameAr}`}
                      >
                        <Plus
                          aria-hidden="true"
                          size={17}
                        />
                      </button>

                      <span className="min-w-12 text-center font-black text-white">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.slug)}
                        className="grid h-11 w-11 place-items-center text-lime-300 transition hover:bg-lime-300/10"
                        aria-label={`تقليل كمية ${item.nameAr}`}
                      >
                        <Minus
                          aria-hidden="true"
                          size={17}
                        />
                      </button>
                    </div>

                    {/* زر الحذف */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.slug)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-300/15 bg-rose-400/10 px-4 text-sm font-bold text-rose-200 transition hover:bg-rose-400/20"
                    >
                      <Trash2
                        aria-hidden="true"
                        size={16}
                      />
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {/* ملخص الطلب الجانبي */}
          <aside className="h-fit rounded-[32px] border border-lime-300/20 bg-[#0b1a0e]/90 p-6 shadow-[0_0_30px_rgba(200,243,63,0.15)] backdrop-blur-xl lg:sticky lg:top-24">
            <h2 className="text-2xl font-black text-white">
              ملخص الطلب
            </h2>

            <div className="mt-6 space-y-4 border-b border-white/10 pb-6">
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>عدد أنواع المنتجات</span>
                <strong className="text-white">
                  {items.length}
                </strong>
              </div>

              <div className="flex items-center justify-between text-sm text-white/60">
                <span>إجمالي القطع</span>
                <strong className="text-lime-300 text-lg">
                  {totalItems}
                </strong>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-white/50">
              سيتم تأكيد الأسعار وتكلفة الشحن عند إتمام الطلب، لأن بعض المنتجات قد تختلف حسب العبوة والكمية ومكان التوصيل.
            </p>

            <Link
              href="/checkout"
              className="mt-6 flex min-h-[56px] w-full items-center justify-center rounded-xl bg-lime-300 px-6 font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.25)] transition hover:scale-[1.02] hover:bg-lime-200"
            >
              إتمام الطلب
            </Link>

            <Link
              href="/products"
              className="mt-3 flex min-h-[56px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-5 text-sm font-bold text-white/75 transition hover:border-lime-300/35 hover:text-white"
            >
              إضافة منتجات أخرى
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}