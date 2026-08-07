"use client";

import Link from "next/link";
import {
  Leaf,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import CustomerAuthForm from "@/components/customer/CustomerAuthForm";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const translations = {
  AR: {
    title: "تسجيل دخول العميل",
    subtitle: "ادخل إلى حسابك لمتابعة طلباتك وخدمات ArtVert",
    createAccount: "إنشاء حساب جديد",
    forgotPassword: "نسيت كلمة المرور؟",
    secureSession: "جلسة آمنة",
    secureSessionText: "حماية بيانات حسابك",
    customerAccess: "حساب العميل",
    customerAccessText: "متابعة الطلبات والخدمات",
  },
  EN: {
    title: "Customer Sign In",
    subtitle: "Access your account to manage orders and ArtVert services",
    createAccount: "Create New Account",
    forgotPassword: "Forgot your password?",
    secureSession: "Secure Session",
    secureSessionText: "Your account data is protected",
    customerAccess: "Customer Account",
    customerAccessText: "Manage orders and services",
  },
} as const;

export default function CustomerLoginPage() {
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

  return (
    <main
      className="relative grid min-h-[calc(100vh-72px)] place-items-center overflow-hidden bg-[#061008] px-4 py-12 text-white sm:px-6"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(200,243,63,.12),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(34,197,94,.10),transparent_30%),linear-gradient(145deg,#02150d_0%,#063220_50%,#02180f_100%)]" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-300/15 bg-lime-300/10 text-lime-300 shadow-[0_0_24px_rgba(200,243,63,.16)]">
            <Leaf size={29} />
          </div>

          <h1 className="mt-5 text-3xl font-black text-white sm:text-4xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-white/58 sm:text-base">
            {t.subtitle}
          </p>
        </div>

        <section className="rounded-[30px] border border-lime-300/20 bg-[#0b1a0e]/88 p-5 shadow-[0_0_42px_rgba(200,243,63,.12)] backdrop-blur-xl sm:p-7">
          <div
            className={[
              "[&_form]:space-y-4",
              "[&_form>h1]:text-2xl [&_form>h1]:font-black [&_form>h1]:text-white",
              "[&_form_label]:block [&_form_label]:text-sm [&_form_label]:font-bold [&_form_label]:text-white/72",
              "[&_form_input]:mt-2 [&_form_input]:h-12 [&_form_input]:w-full [&_form_input]:rounded-xl [&_form_input]:border [&_form_input]:border-white/10 [&_form_input]:bg-white/[.05] [&_form_input]:px-4 [&_form_input]:text-white [&_form_input]:outline-none [&_form_input]:transition",
              "[&_form_input]:focus:border-lime-300 [&_form_input]:focus:ring-4 [&_form_input]:focus:ring-lime-300/10",
              "[&_form_button]:mt-2 [&_form_button]:flex [&_form_button]:min-h-12 [&_form_button]:w-full [&_form_button]:items-center [&_form_button]:justify-center [&_form_button]:rounded-xl [&_form_button]:bg-lime-300 [&_form_button]:px-5 [&_form_button]:font-black [&_form_button]:text-[#071109] [&_form_button]:transition [&_form_button]:hover:bg-lime-200",
              "[&_form_p]:text-sm [&_form_p]:leading-7 [&_form_p]:text-white/60",
              "[&_form_a]:font-black [&_form_a]:text-lime-300 [&_form_a]:transition [&_form_a]:hover:text-lime-200",
            ].join(" ")}
          >
            <CustomerAuthForm mode="login" />
          </div>

          <div className="mt-5 flex flex-col items-center justify-center gap-2 border-t border-white/[.07] pt-5 text-sm sm:flex-row sm:gap-4">
            <Link
              href="/account/register"
              className="font-black text-lime-300 transition hover:text-lime-200"
            >
              {t.createAccount}
            </Link>

            <span className="hidden text-white/20 sm:inline">•</span>

            <Link
              href="/account/reset-password"
              className="font-bold text-white/65 transition hover:text-white"
            >
              {t.forgotPassword}
            </Link>
          </div>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3 backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
              <ShieldCheck size={18} />
            </div>

            <div>
              <p className="text-xs font-black text-white">
                {t.secureSession}
              </p>
              <p className="mt-1 text-[10px] text-white/40">
                {t.secureSessionText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3 backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
              <UserRound size={18} />
            </div>

            <div>
              <p className="text-xs font-black text-white">
                {t.customerAccess}
              </p>
              <p className="mt-1 text-[10px] text-white/40">
                {t.customerAccessText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
