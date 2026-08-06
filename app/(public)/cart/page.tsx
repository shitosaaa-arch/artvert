"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
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

  if (!isReady) {
    return (
      <main
        className="relative min-h-screen overflow-hidden bg-[#061008] px-3 py-10 text-white font-sans sm:px-6 sm:py-16"
        dir="rtl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(200,243,63,.06),transparent_40%)]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="h-10 w-52 animate-pulse rounded-full bg-white/[.06]" />

          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-44 animate-pulse rounded-[24px] border border-lime-300/10 bg-[#0b1a0e]/50 backdrop-blur-md sm:h-40"
                />
              ))}
            </div>

            <div className="h-80 animate-pulse rounded-[28px] border border-lime-300/10 bg-[#0b1a0e]/50 backdrop-blur-md" />
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main
        className="relative grid min-h-[calc(100vh-76px)] place-items-center overflow-hidden bg-[#061008] px-3 py-12 text-white font-sans sm:px-6 sm:py-16"
        dir="rtl"
      >
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(200,243,63,.08),transparent_50%)]" />

        <section className="relative z-10 w-full max-w-xl rounded-[28px] border border-lime-300/20 bg-[#0b1a0e]/84 p-6 text-center shadow-[0_0_45px_rgba(200,243,63,0.12)] backdrop-blur-xl sm:rounded-[32px] sm:p-9">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-lime-300/20 bg-lime-300/10 text-lime-300 shadow-[0_0_20px_rgba(200,243,63,0.16)]">
            <ShoppingBag
              aria-hidden="true"
              size={38}
            />
          </div>

          <h1 className="mt-6 text-2xl font-black text-white sm:text-3xl">
            سلة التسوق فارغة
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/58 sm:text-base">
            أضف المنتجات التي تحتاجها، ثم ارجع هنا لإتمام الطلب بسهولة.
          </p>

          <Link
            href="/products"
            className="mt-7 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-7 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200 sm:w-auto sm:text-base"
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

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#061008] px-3 py-10 text-white font-sans sm:px-6 sm:py-14"
      dir="rtl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize:
            "50px 50px",
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_15%_8%,rgba(200,243,63,.07),transparent_28%),radial-gradient(circle_at_88%_15%,rgba(38,164,83,.08),transparent_30%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
              <ShoppingBag size={16} />
              سلة ArtVert
            </span>

            <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
              سلة التسوق
            </h1>

            <p className="mt-2 text-sm text-white/55">
              إجمالي عدد القطع:{" "}
              <strong className="text-lime-300">
                {totalItems}
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 text-sm font-black text-rose-200 transition hover:bg-rose-400/18 sm:w-auto"
          >
            <Trash2
              aria-hidden="true"
              size={17}
            />
            تفريغ السلة
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <section className="grid gap-4 sm:gap-5">
            {items.map((item) => (
              <article
                key={item.slug}
                className="grid gap-4 rounded-[24px] border border-lime-300/15 bg-[#0b1a0e]/84 p-3 shadow-[0_16px_38px_rgba(0,0,0,.22)] backdrop-blur-xl transition duration-300 hover:border-lime-300/30 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-5 sm:p-4"
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative h-[220px] overflow-hidden rounded-2xl border border-white/[.06] bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,.09),rgba(255,255,255,.015)_70%)] sm:h-40"
                >
                  <Image
                    src={item.image}
                    alt={item.nameAr}
                    fill
                    sizes="(max-width: 640px) 100vw, 160px"
                    className="object-contain p-3 transition-transform duration-500 hover:scale-[1.04]"
                  />
                </Link>

                <div className="min-w-0">
                  {item.category && (
                    <span className="inline-flex rounded-full border border-lime-300/15 bg-lime-300/10 px-3 py-1 text-[11px] font-bold text-lime-300">
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
                    className="mt-1 truncate text-xs font-bold uppercase tracking-[.12em] text-white/38"
                    dir="ltr"
                  >
                    {item.nameEn}
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex h-12 w-full items-center justify-between overflow-hidden rounded-xl border border-white/10 bg-white/[.04] sm:w-auto">
                      <button
                        type="button"
                        onClick={() =>
                          increaseQuantity(
                            item.slug,
                          )
                        }
                        className="grid h-12 w-12 place-items-center text-lime-300 transition hover:bg-lime-300/10"
                        aria-label={`زيادة كمية ${item.nameAr}`}
                      >
                        <Plus
                          aria-hidden="true"
                          size={18}
                        />
                      </button>

                      <span className="min-w-14 text-center text-lg font-black text-white">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          decreaseQuantity(
                            item.slug,
                          )
                        }
                        className="grid h-12 w-12 place-items-center text-lime-300 transition hover:bg-lime-300/10"
                        aria-label={`تقليل كمية ${item.nameAr}`}
                      >
                        <Minus
                          aria-hidden="true"
                          size={18}
                        />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(
                          item.slug,
                        )
                      }
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-300/15 bg-rose-400/10 px-4 text-sm font-bold text-rose-200 transition hover:bg-rose-400/20 sm:w-auto"
                    >
                      <Trash2
                        aria-hidden="true"
                        size={16}
                      />
                      حذف المنتج
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="h-fit rounded-[28px] border border-lime-300/20 bg-[#0b1a0e]/92 p-5 shadow-[0_0_32px_rgba(200,243,63,0.11)] backdrop-blur-xl sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                <PackageCheck size={21} />
              </div>

              <div>
                <h2 className="text-xl font-black text-white sm:text-2xl">
                  ملخص الطلب
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  راجع محتويات السلة قبل المتابعة
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 border-b border-white/10 pb-6">
              <div className="flex items-center justify-between text-sm text-white/58">
                <span>عدد أنواع المنتجات</span>
                <strong className="text-white">
                  {items.length}
                </strong>
              </div>

              <div className="flex items-center justify-between text-sm text-white/58">
                <span>إجمالي القطع</span>
                <strong className="text-lg text-lime-300">
                  {totalItems}
                </strong>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
                <Truck
                  size={18}
                  className="mt-0.5 shrink-0 text-lime-300"
                />
                <p className="text-xs leading-6 text-white/52">
                  سيتم تأكيد تكلفة الشحن حسب المحافظة ومكان التوصيل.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-lime-300"
                />
                <p className="text-xs leading-6 text-white/52">
                  جميع المنتجات أصلية ومعبأة من ArtVert Egypt.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-lime-300"
                />
                <p className="text-xs leading-6 text-white/52">
                  يتم تأكيد الأسعار والعبوات النهائية قبل تجهيز الطلب.
                </p>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 flex min-h-[54px] w-full items-center justify-center rounded-xl bg-lime-300 px-6 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200 sm:text-base"
            >
              إتمام الطلب
            </Link>

            <Link
              href="/products"
              className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-5 text-sm font-bold text-white/72 transition hover:border-lime-300/35 hover:text-white"
            >
              إضافة منتجات أخرى
              <ArrowLeft size={17} />
            </Link>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-lime-300/15 bg-[#03170e]/96 p-3 shadow-[0_-12px_35px_rgba(0,0,0,.35)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/45">
              إجمالي القطع
            </p>

            <p className="mt-1 text-lg font-black text-lime-300">
              {totalItems}
            </p>
          </div>

          <Link
            href="/checkout"
            className="flex min-h-12 flex-[1.35] items-center justify-center rounded-xl bg-lime-300 px-5 text-sm font-black text-[#071109] shadow-[0_8px_20px_rgba(200,243,63,.18)]"
          >
            إتمام الطلب
          </Link>
        </div>
      </div>

      <div className="h-24 lg:hidden" />
    </main>
  );
}
