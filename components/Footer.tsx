import Link from "next/link";
import {
  Leaf,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
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
      label: "من نحن",
      href: "/about",
    },
    {
      label: "تواصل معنا",
      href: "/contact",
    },
  ];

  const productLinks = [
    "الأسمدة والمغذيات",
    "المنشطات الحيوية",
    "حماية النبات",
    "الزراعة المنزلية",
  ];

  return (
    <footer
      className="relative overflow-hidden bg-[#061008] text-white font-sans"
      dir="rtl"
    >
      {/* خلفية متدرجة خفيفة لدمج الفوتر مع باقي الصفحات */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(38,164,83,.05),transparent_70%)]" />

      {/* شبكة الخلفية المضيئة */}
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

      {/* إضاءات جانبية (Glow Orbs) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-[rgba(200,243,63,.06)] blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[rgba(34,197,94,.06)] blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          
          {/* قسم نبذة عن الشركة */}
          <section className="rounded-3xl border border-lime-300/15 bg-[#0b1a0e]/80 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300">
                <Leaf size={23} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">
                  ArtVert Egypt
                </h2>

                <p className="mt-1 text-xs font-black tracking-[0.18em] text-lime-300">
                  GROWING SUCCESS
                </p>
              </div>
            </div>

            <p className="mt-5 leading-8 text-white/70">
              حلول زراعية متكاملة للتغذية والحماية وتحسين نمو النبات بأحدث التقنيات.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(200,243,63,0.6)] animate-pulse" />

              <span className="text-xs font-bold text-white/80">
                دعم وإرشاد زراعي مستمر
              </span>
            </div>
          </section>

          {/* قسم الروابط السريعة */}
          <section className="rounded-3xl border border-white/5 bg-[#0b1a0e]/50 p-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-white/80">
                <Sparkles size={21} />
              </div>

              <h3 className="text-lg font-black text-white">
                روابط سريعة
              </h3>
            </div>

            <nav className="mt-5 grid gap-2">
              {quickLinks.map(
                (item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-11 items-center rounded-xl border border-transparent px-3 text-sm font-bold text-white/60 transition duration-300 hover:border-lime-300/20 hover:bg-lime-300/10 hover:text-lime-300"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </section>

          {/* قسم منتجاتنا */}
          <section className="rounded-3xl border border-white/5 bg-[#0b1a0e]/50 p-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-white/80">
                <ShieldCheck size={21} />
              </div>

              <h3 className="text-lg font-black text-white">
                منتجاتنا
              </h3>
            </div>

            <div className="mt-5 grid gap-2">
              {productLinks.map(
                (item) => (
                  <div
                    key={item}
                    className="flex min-h-11 items-center rounded-xl border border-transparent px-3 text-sm font-bold text-white/60"
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </section>

          {/* قسم بيانات التواصل */}
          <section className="rounded-3xl border border-white/5 bg-[#0b1a0e]/50 p-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-white/80">
                <Mail size={21} />
              </div>

              <h3 className="text-lg font-black text-white">
                تواصل معنا
              </h3>
            </div>

            <div className="mt-5 grid gap-3">
              <a
                href="tel:+201080040408"
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.02] px-4 py-3 text-sm font-bold text-white/80 transition duration-300 hover:border-lime-300/30 hover:bg-lime-300/10 hover:text-lime-300"
              >
                <Phone
                  size={18}
                  className="text-lime-300"
                />

                <span dir="ltr">
                  01080040408
                </span>
              </a>

              <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.02] px-4 py-3 text-sm font-bold text-white/80">
                <MapPin
                  size={18}
                  className="text-lime-300"
                />

                Egypt
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.02] px-4 py-3 text-sm font-bold text-white/80">
                <Leaf
                  size={18}
                  className="text-lime-300"
                />

                ArtVert Egypt
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* الشريط السفلي للحقوق */}
      <div className="border-t border-white/10 bg-[#040b06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-sm text-white/50 sm:flex-row sm:px-6 sm:text-right">
          <p>
            © {year} ArtVert Egypt - All Rights Reserved
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
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