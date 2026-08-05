"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Globe2,
  Leaf,
  LogIn,
  Menu,
  ShoppingBag,
  ShoppingCart,
  X,
} from "lucide-react";
import {
  usePathname,
} from "next/navigation";

import {
  useCart,
} from "@/components/cart/CartProvider";

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
  const {
    totalItems,
    isReady,
  } = useCart();

  const [
    locale,
    setLocale,
  ] = useState<"AR" | "EN">("AR");

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const menuTriggerRef =
    useRef<HTMLButtonElement>(null);

  const displayedCartCount =
    isReady ? totalItems : 0;

  useEffect(() => {
    function closeOnEscape(
      event: KeyboardEvent,
    ) {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      setMenuOpen(false);
      menuTriggerRef.current?.focus();
    }

    window.addEventListener(
      "keydown",
      closeOnEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        closeOnEscape,
      );
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function isActive(
    href: string,
  ) {
    return href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);
  }

  return (
    <header
      data-site-navbar
      className="sticky top-0 z-50 w-full border-b border-[#9fbd35]/30 bg-[linear-gradient(90deg,#031a10_0%,#052617_50%,#031a10_100%)] text-white shadow-[0_12px_35px_rgba(0,0,0,.35)] backdrop-blur-xl"
    >
      <div className="mx-auto grid h-[68px] max-w-[1480px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-5">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 rounded-xl"
          aria-label="ArtVert Egypt - الصفحة الرئيسية"
        >
          <Leaf
            aria-hidden="true"
            size={34}
            strokeWidth={2.5}
            className="-rotate-12 text-[#c8f33f]"
          />

          <span
            className="leading-none"
            dir="ltr"
          >
            <span className="block text-[24px] font-black tracking-[-0.04em] text-white">
              ART
              <span className="text-[#c8f33f]">
                VERT
              </span>
            </span>

            <span className="mt-1 block text-center text-[10px] font-black tracking-[0.32em] text-[#c8f33f]">
              EGYPT
            </span>
          </span>
        </Link>

        <nav
          className="hidden min-w-0 items-center justify-center gap-4 whitespace-nowrap text-xs lg:flex"
          dir="rtl"
          aria-label="التنقل الرئيسي"
        >
          {navigation.map(
            (item) => {
              const active =
                isActive(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className="relative rounded-lg px-2 py-2 text-white/90 transition-all duration-200 hover:bg-white/[.05] hover:text-[#c8f33f] aria-[current=page]:border aria-[current=page]:border-[#c8f33f]/55 aria-[current=page]:bg-[#c8f33f]/10 aria-[current=page]:text-white aria-[current=page]:shadow-[0_0_18px_rgba(200,243,63,.14)]"
                >
                  {item.label}
                </Link>
              );
            },
          )}
        </nav>

        <div
          className="flex items-center justify-self-end gap-2"
          dir="ltr"
        >
          <Link
            href="/login"
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[.04] px-4 text-sm font-black text-white transition hover:border-[#c8f33f]/50 hover:bg-[#c8f33f]/10 md:inline-flex"
          >
            <LogIn
              aria-hidden="true"
              size={17}
            />
            تسجيل الدخول
          </Link>

          <button
            type="button"
            onClick={() =>
              setLocale(
                (
                  currentLocale,
                ) =>
                  currentLocale ===
                  "AR"
                    ? "EN"
                    : "AR",
              )
            }
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[.04] px-3 text-xs font-black text-white transition hover:border-[#c8f33f]/50 hover:bg-[#c8f33f]/10 sm:inline-flex"
            aria-label="تغيير اللغة"
          >
            <Globe2
              aria-hidden="true"
              size={16}
            />
            {locale}
          </button>

          <Link
            href="/cart"
            className="relative grid min-h-11 min-w-11 place-items-center rounded-xl border border-white/15 bg-white/[.04] text-white transition hover:border-[#c8f33f]/50 hover:bg-[#c8f33f]/10"
            aria-label={`سلة التسوق، ${displayedCartCount} عناصر`}
          >
            <ShoppingCart
              aria-hidden="true"
              size={18}
            />

            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border border-[var(--artvert-bg)] bg-[var(--artvert-primary)] px-1 text-[10px] font-black text-[var(--artvert-text-dark)]">
              {displayedCartCount >
              99
                ? "99+"
                : displayedCartCount}
            </span>
          </Link>

          <Link
            href="/products"
            className="hidden min-h-11 items-center gap-2 rounded-xl bg-[#c8f33f] px-4 text-sm font-black text-[#102014] shadow-[0_0_24px_rgba(200,243,63,.22)] transition hover:bg-[#d6ff58] sm:inline-flex"
          >
            <ShoppingBag
              aria-hidden="true"
              size={17}
            />
            تسوق الآن
          </Link>

          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() =>
              setMenuOpen(
                (open) => !open,
              )
            }
            aria-expanded={menuOpen}
            aria-controls="artvert-mobile-navigation"
            aria-label={
              menuOpen
                ? "إغلاق القائمة"
                : "فتح القائمة"
            }
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-white/15 bg-white/[.04] text-white transition hover:border-[#c8f33f]/50 hover:bg-[#c8f33f]/10 lg:hidden"
          >
            {menuOpen ? (
              <X
                aria-hidden="true"
                size={20}
              />
            ) : (
              <Menu
                aria-hidden="true"
                size={20}
              />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="absolute inset-x-3 top-[calc(100%+8px)] rounded-2xl border border-[#9fbd35]/30 bg-[#041b11]/98 p-3 shadow-2xl backdrop-blur-xl lg:hidden"
          dir="rtl"
        >
          <nav
            id="artvert-mobile-navigation"
            aria-label="التنقل على الهاتف"
            className="grid gap-1"
          >
            {navigation.map(
              (item) => {
                const active =
                  isActive(item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={[
                      "min-h-11 rounded-xl px-4 py-3 text-right text-sm font-bold transition",
                      active
                        ? "bg-[rgba(200,243,63,.14)] text-[var(--artvert-primary)]"
                        : "text-white/85 hover:bg-white/[.06]",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              },
            )}

            <Link
              href="/cart"
              onClick={closeMenu}
              className="mt-1 flex min-h-11 items-center justify-between rounded-xl border border-[var(--artvert-border-soft)] bg-white/[.04] px-4 text-sm font-bold text-white"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart
                  aria-hidden="true"
                  size={17}
                  className="text-[var(--artvert-primary)]"
                />
                سلة التسوق
              </span>

              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[var(--artvert-primary)] px-1.5 text-xs font-black text-[var(--artvert-text-dark)]">
                {displayedCartCount >
                99
                  ? "99+"
                  : displayedCartCount}
              </span>
            </Link>

            <Link
              href="/login"
              onClick={closeMenu}
              className="mt-1 flex min-h-11 items-center justify-between rounded-xl border border-[var(--artvert-border)] bg-[rgba(200,243,63,.08)] px-4 text-sm font-black text-[var(--artvert-primary)]"
            >
              <span className="flex items-center gap-2">
                <LogIn
                  aria-hidden="true"
                  size={16}
                />
                تسجيل الدخول
              </span>
            </Link>

            <button
              type="button"
              onClick={() =>
                setLocale(
                  (
                    currentLocale,
                  ) =>
                    currentLocale ===
                    "AR"
                      ? "EN"
                      : "AR",
                )
              }
              className="mt-1 flex min-h-11 items-center justify-between rounded-xl border border-[var(--artvert-border-soft)] px-4 text-sm font-bold text-white"
              aria-label="تغيير اللغة"
            >
              <span className="flex items-center gap-2">
                <Globe2
                  aria-hidden="true"
                  size={16}
                  className="text-[var(--artvert-primary)]"
                />
                اللغة
              </span>

              <span dir="ltr">
                {locale}
              </span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
