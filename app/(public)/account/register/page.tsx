"use client";

import CustomerAuthForm from "@/components/customer/CustomerAuthForm";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function CustomerRegisterPage() {
  const { isArabic } = useLanguage();

  return (
    <main
      className="relative flex min-h-[calc(100vh-90px)] items-center justify-center overflow-hidden bg-[#031d10] px-4 py-12 text-white"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(140,210,52,.10),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(34,197,94,.08),transparent_30%)]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-[28px] border border-white/10 bg-[#07160d]/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,.45)] backdrop-blur-xl sm:p-7">
          <CustomerAuthForm mode="register" />
        </div>
      </div>
    </main>
  );
}