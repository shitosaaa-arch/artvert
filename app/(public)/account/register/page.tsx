"use client";

import Link from "next/link";

import CustomerAuthForm from "@/components/customer/CustomerAuthForm";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function CustomerRegisterPage() {
  const { isArabic } = useLanguage();

  return (
    <main className="min-h-screen bg-green-950 p-6 pt-24">
      <CustomerAuthForm mode="register" />

      <p className="mt-4 text-center text-white">
        <Link href="/account/login">
          {isArabic
            ? "لديك حساب بالفعل؟ سجّل الدخول"
            : "Already have an account? Sign in"}
        </Link>
      </p>
    </main>
  );
}