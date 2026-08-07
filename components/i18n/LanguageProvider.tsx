"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SiteLocale = "AR" | "EN";

type LanguageContextValue = {
  locale: SiteLocale;
  isArabic: boolean;
  setLocale: (locale: SiteLocale) => void;
  toggleLocale: () => void;
};

const LanguageContext =
  createContext<LanguageContextValue | null>(
    null,
  );

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [locale, setLocale] =
    useState<SiteLocale>("AR");

  const isArabic = locale === "AR";

  useEffect(() => {
    document.documentElement.lang =
      isArabic ? "ar" : "en";

    document.documentElement.dir =
      isArabic ? "rtl" : "ltr";
  }, [isArabic]);

  function toggleLocale() {
    setLocale((currentLocale) =>
      currentLocale === "AR" ? "EN" : "AR",
    );
  }

  const value = useMemo(
    () => ({
      locale,
      isArabic,
      setLocale,
      toggleLocale,
    }),
    [locale, isArabic],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider",
    );
  }

  return context;
}
