"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Globe2,
  Home,
  Leaf,
  LogIn,
  Menu,
  Newspaper,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Store,
  UserRound,
  X,
} from "lucide-react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useCart,
} from "@/components/cart/CartProvider";

import { useLanguage } from "@/components/i18n/LanguageProvider";

const navigation = [
  {
    labelAr: "الرئيسية",
    labelEn: "Home",
    href: "/",
    icon: Home,
  },
  {
    labelAr: "المنتجات",
    labelEn: "Products",
    href: "/products",
    icon: Store,
  },
  {
    labelAr: "دكتور ArtVert",
    labelEn: "Doctor ArtVert",
    href: "/doctor",
    icon: Stethoscope,
  },
  {
    labelAr: "البرامج الزراعية",
    labelEn: "Plant Care",
    href: "/plant-care",
    icon: Leaf,
  },
  {
    labelAr: "المقالات",
    labelEn: "Blog",
    href: "/blog",
    icon: Newspaper,
  },
  {
    labelAr: "من نحن",
    labelEn: "About Us",
    href: "/about",
    icon: Sparkles,
  },
  {
    labelAr: "تواصل معنا",
    labelEn: "Contact Us",
    href: "/contact",
    icon: Phone,
  },
] as const;

const translations = {
  AR: {
    homeAria: "ArtVert Egypt - الصفحة الرئيسية",
    mainNavAria: "التنقل الرئيسي",
    searchAria: "البحث في المنتجات",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    admin: "الإدارة",
    changeLanguage: "تغيير اللغة",
    cart: "سلة التسوق",
    shopNow: "تسوق الآن",
    closeMenu: "إغلاق القائمة",
    openMenu: "فتح القائمة",
    searchPlaceholder: "ابحث عن منتج...",
    searchButton: "بحث",
    mobileNavAria: "التنقل على الهاتف",
    quickNav: "تنقل سريع داخل الموقع",
    language: "اللغة",
  },
  EN: {
    homeAria: "ArtVert Egypt - Home",
    mainNavAria: "Main navigation",
    searchAria: "Search products",
    login: "Log in",
    register: "Register",
    admin: "Admin",
    changeLanguage: "Change language",
    cart: "Shopping cart",
    shopNow: "Shop now",
    closeMenu: "Close menu",
    openMenu: "Open menu",
    searchPlaceholder: "Search products...",
    searchButton: "Search",
    mobileNavAria: "Mobile navigation",
    quickNav: "Quick navigation",
    language: "Language",
  },
} as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    locale,
    isArabic,
    toggleLocale,
  } = useLanguage();

  const {
    totalItems,
    isReady,
  } = useCart();


  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    searchValue,
    setSearchValue,
  ] = useState("");

  const [
    isScrolled,
    setIsScrolled,
  ] = useState(false);

  const menuTriggerRef =
    useRef<HTMLButtonElement>(
      null,
    );

  const searchInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const displayedCartCount =
    isReady
      ? totalItems
      : 0;

  const t = translations[locale];

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(
        window.scrollY > 16,
      );
    }

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      setMenuOpen(false);
      setSearchOpen(false);
      menuTriggerRef.current?.focus();
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    requestAnimationFrame(
      () => {
        searchInputRef.current?.focus();
      },
    );
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow =
      menuOpen
        ? "hidden"
        : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function isActive(
    href: string,
  ) {
    return href === "/"
      ? pathname === "/"
      : pathname.startsWith(
          href,
        );
  }

  function submitSearch() {
    const query =
      searchValue.trim();

    if (!query) {
      return;
    }

    router.push(
      `/products?search=${encodeURIComponent(
        query,
      )}`,
    );

    setSearchOpen(false);
    setMenuOpen(false);
  }

  return (
    <header
      data-site-navbar
      className={[
        "sticky top-0 z-50 w-full border-b text-white transition-all duration-300",
        isScrolled
          ? "border-[#9fbd35]/35 bg-[#03170e]/96 shadow-[0_16px_42px_rgba(0,0,0,.42)] backdrop-blur-2xl"
          : "border-[#9fbd35]/22 bg-[linear-gradient(90deg,#031a10_0%,#052617_50%,#031a10_100%)] shadow-[0_10px_30px_rgba(0,0,0,.28)] backdrop-blur-xl",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto grid max-w-[1560px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 transition-all duration-300 sm:px-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-4 xl:gap-6",
          isScrolled
            ? "h-[62px]"
            : "h-[72px]",
        ].join(" ")}
      >
        <Link
          href="/"
          className="flex w-fit items-center gap-2 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-[#c8f33f]/20"
          aria-label={t.homeAria}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#c8f33f]/22 bg-[#c8f33f]/10 shadow-[0_0_22px_rgba(200,243,63,.10)]">
            <Leaf
              aria-hidden="true"
              size={29}
              strokeWidth={2.5}
              className="-rotate-12 text-[#c8f33f]"
            />
          </span>

          <span
            className="leading-none"
            dir="ltr"
          >
            <span className="block text-[22px] font-black tracking-[-0.04em] text-white sm:text-[25px]">
              ART
              <span className="text-[#c8f33f]">
                VERT
              </span>
            </span>

            <span className="mt-1 block text-center text-[9px] font-black tracking-[0.30em] text-[#c8f33f]">
              EGYPT
            </span>
          </span>
        </Link>

        <nav
          className="hidden min-w-0 items-center justify-center gap-1 whitespace-nowrap text-[11px] lg:flex xl:gap-1.5 xl:text-[12px]"
          dir={isArabic ? "rtl" : "ltr"}
          aria-label={t.mainNavAria}
        >
          {navigation.map(
            (item) => {
              const active =
                isActive(
                  item.href,
                );

              return (
                <Link
                  key={item.href}
                  href={
                    item.href
                  }
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={[
                    "relative rounded-xl border px-2.5 py-2.5 font-bold transition-all duration-200 xl:px-3",
                    active
                      ? "border-[#c8f33f]/45 bg-[#c8f33f]/10 text-white shadow-[0_0_18px_rgba(200,243,63,.10)]"
                      : "border-transparent text-white/82 hover:border-white/8 hover:bg-white/[.045] hover:text-[#c8f33f]",
                  ].join(" ")}
                >
                  {isArabic ? item.labelAr : item.labelEn}
                </Link>
              );
            },
          )}
        </nav>

        <div
          className="flex items-center justify-self-end gap-2"
          dir="ltr"
        >
          <button
            type="button"
            onClick={() =>
              setSearchOpen(
                (open) => !open,
              )
            }
            className="hidden min-h-11 min-w-11 place-items-center rounded-xl border border-white/12 bg-white/[.035] text-white transition hover:border-[#c8f33f]/45 hover:bg-[#c8f33f]/10 lg:grid"
            aria-expanded={
              searchOpen
            }
            aria-label={t.searchAria}
          >
            <Search
              aria-hidden="true"
              size={18}
            />
          </button>

          <Link
            href="/account/login"
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/[.035] px-3 text-xs font-black text-white transition hover:border-[#c8f33f]/45 hover:bg-[#c8f33f]/10 lg:inline-flex xl:px-4 xl:text-sm"
          >
            <LogIn
              aria-hidden="true"
              size={17}
            />
            {t.login}
          </Link>

          <Link
            href="/account/register"
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-[#c8f33f]/22 bg-[#c8f33f]/8 px-3 text-xs font-black text-[#c8f33f] transition hover:border-[#c8f33f]/45 hover:bg-[#c8f33f]/12 lg:inline-flex xl:px-4 xl:text-sm"
          >
            <UserRound
              aria-hidden="true"
              size={17}
            />
            {t.register}
          </Link>

          <Link
            href="/login"
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/[.035] px-3 text-xs font-black text-white transition hover:border-[#c8f33f]/45 hover:bg-[#c8f33f]/10 lg:inline-flex xl:px-4 xl:text-sm"
          >
            <ShieldCheck
              aria-hidden="true"
              size={17}
            />
            {t.admin}
          </Link>

          <button
            type="button"
            onClick={toggleLocale}
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/[.035] px-3 text-xs font-black text-white transition hover:border-[#c8f33f]/45 hover:bg-[#c8f33f]/10 sm:inline-flex"
            aria-label={t.changeLanguage}
          >
            <Globe2
              aria-hidden="true"
              size={16}
            />
            {isArabic ? "EN" : "AR"}
          </button>

          <Link
            href="/cart"
            className="relative grid min-h-11 min-w-11 place-items-center rounded-xl border border-white/12 bg-white/[.035] text-white transition hover:border-[#c8f33f]/45 hover:bg-[#c8f33f]/10"
            aria-label={`${t.cart}, ${displayedCartCount}`}
          >
            <ShoppingCart
              aria-hidden="true"
              size={18}
            />

            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border border-[#03170e] bg-[#c8f33f] px-1 text-[10px] font-black text-[#102014] shadow-[0_0_14px_rgba(200,243,63,.28)]">
              {displayedCartCount > 99
                ? "99+"
                : displayedCartCount}
            </span>
          </Link>

          <Link
            href="/products"
            className="hidden min-h-11 items-center gap-2 rounded-xl bg-[#c8f33f] px-3 text-xs font-black text-[#102014] shadow-[0_0_24px_rgba(200,243,63,.18)] transition hover:-translate-y-0.5 hover:bg-[#d6ff58] xl:inline-flex xl:px-4 xl:text-sm"
          >
            <ShoppingBag
              aria-hidden="true"
              size={17}
            />
            {t.shopNow}
          </Link>

          <button
            ref={
              menuTriggerRef
            }
            type="button"
            onClick={() =>
              setMenuOpen(
                (open) => !open,
              )
            }
            aria-expanded={
              menuOpen
            }
            aria-controls="artvert-mobile-navigation"
            aria-label={
              menuOpen
                ? t.closeMenu
                : t.openMenu
            }
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-white/12 bg-white/[.035] text-white transition hover:border-[#c8f33f]/45 hover:bg-[#c8f33f]/10 lg:hidden"
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

      {searchOpen && (
        <div className="hidden border-t border-white/[.06] bg-[#03170e]/96 px-4 py-3 shadow-inner backdrop-blur-xl lg:block">
          <div className="mx-auto flex max-w-[900px] items-center gap-2 rounded-2xl border border-[#c8f33f]/22 bg-black/20 p-2">
            <Search
              aria-hidden="true"
              size={19}
              className="mr-2 shrink-0 text-[#c8f33f]"
            />

            <input
              ref={
                searchInputRef
              }
              value={
                searchValue
              }
              onChange={(
                event,
              ) =>
                setSearchValue(
                  event.target.value,
                )
              }
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  submitSearch();
                }
              }}
              placeholder={t.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/35"
            />

            <button
              type="button"
              onClick={
                submitSearch
              }
              className="min-h-10 rounded-xl bg-[#c8f33f] px-5 text-sm font-black text-[#102014]"
            >
              {t.searchButton}
            </button>
          </div>
        </div>
      )}

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label={t.closeMenu}
            onClick={
              closeMenu
            }
            className="fixed inset-0 top-[62px] z-40 bg-black/58 backdrop-blur-[2px] lg:hidden"
          />

          <aside
            id="artvert-mobile-navigation"
            className="fixed bottom-0 right-0 top-[62px] z-50 flex w-[min(92vw,390px)] flex-col border-l border-[#9fbd35]/28 bg-[#041b11]/98 shadow-[-24px_0_70px_rgba(0,0,0,.45)] backdrop-blur-2xl lg:hidden"
            dir={isArabic ? "rtl" : "ltr"}
            aria-label={t.mobileNavAria}
          >
            <div className="border-b border-white/[.07] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">
                    ArtVert Egypt
                  </p>

                  <p className="mt-1 text-xs text-white/42">
                    {t.quickNav}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeMenu
                  }
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-white"
                  aria-label={t.closeMenu}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
                <Search
                  aria-hidden="true"
                  size={17}
                  className="mr-1 shrink-0 text-[#c8f33f]"
                />

                <input
                  value={
                    searchValue
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchValue(
                      event.target.value,
                    )
                  }
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      submitSearch();
                    }
                  }}
                  placeholder={t.searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/30"
                />

                <button
                  type="button"
                  onClick={
                    submitSearch
                  }
                  className="min-h-9 rounded-lg bg-[#c8f33f] px-3 text-xs font-black text-[#102014]"
                >
                  {t.searchButton}
                </button>
              </div>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="grid gap-1.5">
                {navigation.map(
                  (item) => {
                    const active =
                      isActive(
                        item.href,
                      );

                    const Icon =
                      item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={
                          item.href
                        }
                        onClick={
                          closeMenu
                        }
                        aria-current={
                          active
                            ? "page"
                            : undefined
                        }
                        className={[
                          "flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-right text-sm font-bold transition",
                          active
                            ? "border-[#c8f33f]/30 bg-[#c8f33f]/12 text-[#c8f33f]"
                            : "border-transparent text-white/82 hover:border-white/8 hover:bg-white/[.045]",
                        ].join(" ")}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.04] text-[#c8f33f]">
                          <Icon size={17} />
                        </span>

                        <span>
                          {isArabic ? item.labelAr : item.labelEn}
                        </span>
                      </Link>
                    );
                  },
                )}
              </div>
            </nav>

            <div className="border-t border-white/[.07] p-3">
              <div className="grid gap-2">
                <Link
                  href="/cart"
                  onClick={
                    closeMenu
                  }
                  className="flex min-h-12 items-center justify-between rounded-xl border border-white/10 bg-white/[.035] px-4 text-sm font-bold text-white"
                >
                  <span className="flex items-center gap-3">
                    <ShoppingCart
                      aria-hidden="true"
                      size={18}
                      className="text-[#c8f33f]"
                    />
                    {t.cart}
                  </span>

                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#c8f33f] px-1.5 text-xs font-black text-[#102014]">
                    {displayedCartCount >
                    99
                      ? "99+"
                      : displayedCartCount}
                  </span>
                </Link>

                <Link
                  href="/account/login"
                  onClick={
                    closeMenu
                  }
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-[#c8f33f]/22 bg-[#c8f33f]/8 px-4 text-sm font-black text-[#c8f33f]"
                >
                  <UserRound
                    aria-hidden="true"
                    size={18}
                  />
                  {t.login}
                </Link>

                <Link
                  href="/account/register"
                  onClick={
                    closeMenu
                  }
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[.025] px-4 text-sm font-black text-white"
                >
                  <UserRound
                    aria-hidden="true"
                    size={18}
                    className="text-[#c8f33f]"
                  />
                  {t.register}
                </Link>

                <Link
                  href="/login"
                  onClick={
                    closeMenu
                  }
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[.025] px-4 text-sm font-black text-white"
                >
                  <ShieldCheck
                    aria-hidden="true"
                    size={18}
                    className="text-[#c8f33f]"
                  />
                  {t.admin}
                </Link>

                <button
                  type="button"
                  onClick={toggleLocale}
                  className="flex min-h-12 items-center justify-between rounded-xl border border-white/10 bg-white/[.025] px-4 text-sm font-bold text-white"
                  aria-label={t.changeLanguage}
                >
                  <span className="flex items-center gap-3">
                    <Globe2
                      aria-hidden="true"
                      size={18}
                      className="text-[#c8f33f]"
                    />
                    {t.language}
                  </span>

                  <span dir="ltr">
                    {isArabic ? "EN" : "AR"}
                  </span>
                </button>

                <Link
                  href="/products"
                  onClick={
                    closeMenu
                  }
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c8f33f] px-4 text-sm font-black text-[#102014] shadow-[0_0_22px_rgba(200,243,63,.16)]"
                >
                  <ShoppingBag
                    aria-hidden="true"
                    size={18}
                  />
                  {t.shopNow}
                </Link>
              </div>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
