"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Globe2, Menu, ShoppingBag, ShoppingCart, X } from "lucide-react";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "الرئيسية", href: "/" },
  { label: "المنتجات", href: "/products" },
  { label: "الزراعة المنزلية", href: "/plant-care" },
  { label: "نباتات الزينة", href: "/plant-care" },
  { label: "الرعاية والتشخيص", href: "/doctor" },
  { label: "المدونة", href: "/blog" },
  { label: "من نحن", href: "/about" },
  { label: "تواصل معنا", href: "/contact" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<"AR" | "EN">("AR");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuTriggerRef.current?.focus();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
    menuTriggerRef.current?.focus();
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header
      data-site-navbar
      className="relative z-50 w-full border-b border-lime-300/15 bg-[#061008]/95 text-white shadow-[0_12px_35px_rgba(0,0,0,.22)] backdrop-blur-xl"
    >
      <div className="mx-auto grid h-[74px] max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-6">
        <Link
          href="/"
          className="flex w-fit items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
          aria-label="ArtVert Egypt - الصفحة الرئيسية"
        >
          <Image
            src="/images/logo.jpeg"
            alt="ArtVert Egypt"
            width={38}
            height={38}
            className="h-[38px] w-[38px] rounded-lg object-cover ring-1 ring-lime-300/30"
          />
          <span className="leading-none">
            <span className="block text-base font-black tracking-tight text-white">ARTVERT</span>
            <span className="mt-1 block text-[9px] font-black tracking-[0.28em] text-lime-300">EGYPT</span>
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center justify-center gap-4 whitespace-nowrap text-xs font-bold text-white/75 xl:flex" dir="rtl" aria-label="التنقل الرئيسي">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-2 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300 ${active ? "text-lime-300" : "hover:text-white"}`}
              >
                {item.label}
                {active && <span aria-hidden="true" className="absolute inset-x-1 -bottom-1 h-0.5 rounded-full bg-lime-300" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-self-end gap-2" dir="ltr">
          <button
            type="button"
            onClick={() => setLocale(locale === "AR" ? "EN" : "AR")}
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[.04] px-3 text-xs font-black text-white transition hover:border-lime-300/50 hover:bg-white/[.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 sm:inline-flex"
            aria-label="تغيير اللغة"
          >
            <Globe2 aria-hidden="true" size={16} className="text-lime-300" />
            {locale}
          </button>
          <Link
            href="/products"
            className="relative grid min-h-11 min-w-11 place-items-center rounded-xl border border-white/15 bg-white/[.04] text-white transition hover:border-lime-300/50 hover:bg-white/[.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
            aria-label="سلة التسوق، 0 عناصر"
          >
            <ShoppingCart aria-hidden="true" size={18} />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border border-[#061008] bg-lime-300 px-1 text-[10px] font-black text-[#061008]">0</span>
          </Link>
          <Link
            href="/products"
            className="hidden min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-black text-[#071109] shadow-[0_8px_22px_rgba(178,255,48,.2)] transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 sm:inline-flex"
          >
            <ShoppingBag aria-hidden="true" size={17} />
            تسوق الآن
          </Link>
          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="artvert-mobile-navigation"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-white/15 bg-white/[.04] text-white transition hover:border-lime-300/50 hover:bg-white/[.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 xl:hidden"
          >
            {menuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute inset-x-3 top-[calc(100%+8px)] rounded-2xl border border-lime-300/20 bg-[#08140c]/[.98] p-3 shadow-2xl backdrop-blur-xl xl:hidden" dir="rtl">
          <nav id="artvert-mobile-navigation" aria-label="التنقل على الهاتف" className="grid gap-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={active ? "page" : undefined}
                  className={`min-h-11 rounded-xl px-4 py-3 text-right text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 ${active ? "bg-lime-300/15 text-lime-300" : "text-white/85 hover:bg-white/[.06]"}`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setLocale(locale === "AR" ? "EN" : "AR")}
              className="mt-1 flex min-h-11 items-center justify-between rounded-xl border border-white/10 px-4 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
              aria-label="تغيير اللغة"
            >
              <span className="flex items-center gap-2"><Globe2 aria-hidden="true" size={16} className="text-lime-300" /> اللغة</span>
              <span dir="ltr">{locale}</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
