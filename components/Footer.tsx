import Link from "next/link";
import {
  ArrowLeft,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export default function Footer() {
  const year =
    new Date().getFullYear();

  const quickLinks = [
    {
      label: "الرئيسية",
      href: "/",
    },
    {
      label: "المنتجات",
      href: "/products",
    },
    {
      label: "دكتور ArtVert",
      href: "/doctor",
    },
    {
      label: "الرعاية الزراعية",
      href: "/plant-care",
    },
    {
      label: "المدونة",
      href: "/blog",
    },
    {
      label: "من نحن",
      href: "/about",
    },
    {
      label: "تواصل معنا",
      href: "/contact",
    },
  ];

  const productLinks = [
    {
      label: "الأسمدة والمغذيات",
      href: "/products",
    },
    {
      label: "المنشطات الحيوية",
      href: "/products",
    },
    {
      label: "حماية النبات",
      href: "/products",
    },
    {
      label: "الزراعة المنزلية",
      href: "/plant-care",
    },
  ];

  return (
    <footer
      className="relative overflow-hidden border-t border-white/[.06] bg-[#061008] text-white font-sans"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(38,164,83,.08),transparent_62%)]" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize:
            "52px 52px",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-[rgba(200,243,63,.07)] blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[rgba(34,197,94,.07)] blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-14">
        <section className="mb-8 rounded-[26px] border border-lime-300/15 bg-[linear-gradient(135deg,rgba(200,243,63,.08),rgba(11,26,14,.88))] p-5 shadow-[0_18px_45px_rgba(0,0,0,.22)] backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
                <Sparkles size={15} />
                دعم زراعي متخصص
              </span>

              <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
                محتاج مساعدة في اختيار المنتج المناسب؟
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/58 sm:text-base">
                فريق ArtVert معاك لاختيار الحل المناسب حسب النبات أو المحصول والحالة.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="https://wa.me/201080040408"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#21a366] px-6 text-sm font-black text-white shadow-[0_8px_22px_rgba(33,163,102,.18)] transition hover:-translate-y-0.5 hover:bg-[#27b875]"
              >
                <MessageCircle size={18} />
                تواصل عبر واتساب
              </a>

              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 text-sm font-black text-[#071109] shadow-[0_8px_22px_rgba(200,243,63,.16)] transition hover:-translate-y-0.5 hover:bg-lime-200"
              >
                <ShoppingBag size={18} />
                تصفح المنتجات
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-[1.15fr_.85fr_.85fr_1fr]">
          <section className="rounded-[26px] border border-lime-300/15 bg-[#0b1a0e]/84 p-5 shadow-xl backdrop-blur-xl sm:p-6">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
              aria-label="ArtVert Egypt"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-lime-300/20 bg-lime-300/10 text-lime-300">
                <Leaf size={24} />
              </span>

              <span>
                <span className="block text-2xl font-black text-white">
                  ArtVert Egypt
                </span>

                <span className="mt-1 block text-[10px] font-black tracking-[0.18em] text-lime-300">
                  GROWING SUCCESS
                </span>
              </span>
            </Link>

            <p className="mt-5 text-sm leading-8 text-white/64 sm:text-base">
              حلول زراعية متكاملة للتغذية والحماية وتحسين نمو النبات بأحدث التقنيات.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300 shadow-[0_0_8px_rgba(200,243,63,0.6)]" />

              <span className="text-xs font-bold text-white/75">
                دعم وإرشاد زراعي مستمر
              </span>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <a
                href="#"
                aria-label="Facebook"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-white/65 transition hover:border-lime-300/30 hover:bg-lime-300/10 hover:text-lime-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-white/65 transition hover:border-lime-300/30 hover:bg-lime-300/10 hover:text-lime-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <rect
                    width="18"
                    height="18"
                    x="3"
                    y="3"
                    rx="5"
                    ry="5"
                  />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line
                    x1="17.5"
                    x2="17.51"
                    y1="6.5"
                    y2="6.5"
                  />
                </svg>
              </a>

              <a
                href="https://wa.me/201080040408"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-white/65 transition hover:border-lime-300/30 hover:bg-lime-300/10 hover:text-lime-300"
              >
                <MessageCircle size={17} />
              </a>
            </div>
          </section>

          <section className="rounded-[26px] border border-white/[.06] bg-[#0b1a0e]/56 p-5 backdrop-blur-md sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[.05] text-white/78">
                <Sparkles size={20} />
              </span>

              <h3 className="text-lg font-black text-white">
                روابط سريعة
              </h3>
            </div>

            <nav className="mt-5 grid gap-1.5">
              {quickLinks.map(
                (item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex min-h-11 items-center justify-between rounded-xl border border-transparent px-3 text-sm font-bold text-white/58 transition hover:border-lime-300/20 hover:bg-lime-300/[.06] hover:text-lime-300"
                  >
                    <span>
                      {item.label}
                    </span>

                    <ArrowLeft
                      size={14}
                      className="opacity-0 transition group-hover:opacity-100"
                    />
                  </Link>
                ),
              )}
            </nav>
          </section>

          <section className="rounded-[26px] border border-white/[.06] bg-[#0b1a0e]/56 p-5 backdrop-blur-md sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[.05] text-white/78">
                <ShieldCheck size={20} />
              </span>

              <h3 className="text-lg font-black text-white">
                منتجاتنا
              </h3>
            </div>

            <nav className="mt-5 grid gap-1.5">
              {productLinks.map(
                (item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group flex min-h-11 items-center justify-between rounded-xl border border-transparent px-3 text-sm font-bold text-white/58 transition hover:border-lime-300/20 hover:bg-lime-300/[.06] hover:text-lime-300"
                  >
                    <span>
                      {item.label}
                    </span>

                    <ArrowLeft
                      size={14}
                      className="opacity-0 transition group-hover:opacity-100"
                    />
                  </Link>
                ),
              )}
            </nav>
          </section>

          <section className="rounded-[26px] border border-white/[.06] bg-[#0b1a0e]/56 p-5 backdrop-blur-md sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[.05] text-white/78">
                <Mail size={20} />
              </span>

              <h3 className="text-lg font-black text-white">
                تواصل معنا
              </h3>
            </div>

            <div className="mt-5 grid gap-3">
              <a
                href="tel:+201080040408"
                className="flex min-h-12 items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.025] px-4 text-sm font-bold text-white/78 transition hover:border-lime-300/30 hover:bg-lime-300/[.06] hover:text-lime-300"
              >
                <Phone
                  size={18}
                  className="shrink-0 text-lime-300"
                />

                <span dir="ltr">
                  01080040408
                </span>
              </a>

              <div className="flex min-h-12 items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.025] px-4 text-sm font-bold text-white/72">
                <MapPin
                  size={18}
                  className="shrink-0 text-lime-300"
                />

                مصر
              </div>

              <div className="flex min-h-12 items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.025] px-4 text-sm font-bold text-white/72">
                <Leaf
                  size={18}
                  className="shrink-0 text-lime-300"
                />

                ArtVert Egypt
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/[.08] bg-[#040b06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-3 py-5 text-center text-xs text-white/45 sm:px-6 sm:text-sm lg:flex-row lg:text-right">
          <p>
            © {year} ArtVert Egypt — جميع الحقوق محفوظة
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link
              href="/privacy"
              className="transition hover:text-lime-300"
            >
              سياسة الخصوصية
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-lime-300"
            >
              الشروط والأحكام
            </Link>

            <Link
              href="/returns"
              className="transition hover:text-lime-300"
            >
              سياسة الاسترجاع
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
