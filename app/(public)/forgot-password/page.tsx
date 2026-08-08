"use client";

import {
  type FormEvent,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { useLanguage } from "@/components/i18n/LanguageProvider";

const translations = {
  AR: {
    title: "نسيت كلمة المرور؟",
    description:
      "اكتب البريد الإلكتروني المرتبط بحسابك وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.",
    email: "البريد الإلكتروني",
    placeholder: "name@example.com",
    send: "إرسال رابط الاستعادة",
    sending: "جاري الإرسال...",
    back: "العودة لتسجيل الدخول",
    secure: "استعادة آمنة للحساب",
    success:
      "إذا كان البريد الإلكتروني مسجلاً لدينا، سيتم إرسال رابط استعادة كلمة المرور إليه.",
    error:
      "حدث خطأ أثناء إرسال طلب الاستعادة. حاول مرة أخرى.",
  },

  EN: {
    title: "Forgot your password?",
    description:
      "Enter the email address associated with your account and we'll send you a password reset link.",
    email: "Email Address",
    placeholder: "name@example.com",
    send: "Send Reset Link",
    sending: "Sending...",
    back: "Back to Sign In",
    secure: "Secure Account Recovery",
    success:
      "If the email address is registered, a password reset link will be sent to it.",
    error:
      "Something went wrong while sending the recovery request. Please try again.",
  },
} as const;

export default function ForgotPasswordPage() {
  const {
    locale,
    isArabic,
  } = useLanguage();

  const t = translations[locale];

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setSuccess(false);
    setError("");

    const formData =
      new FormData(event.currentTarget);

    const email = String(
      formData.get("email") || "",
    )
      .trim()
      .toLowerCase();

    try {
      const response = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Password reset request failed",
        );
      }

      setSuccess(true);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  const BackIcon = isArabic
    ? ArrowRight
    : ArrowLeft;

  return (
    <main
      className="relative grid min-h-screen place-items-center overflow-hidden bg-[#061008] p-6 text-white"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize:
            "52px 52px",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-0 h-80 w-80 rounded-full bg-[rgba(200,243,63,.09)] blur-[110px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-[rgba(34,197,94,.08)] blur-[110px]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300 shadow-[0_0_20px_rgba(200,243,63,0.15)]">
            <Leaf size={28} />
          </div>

          <h1 className="mt-5 text-3xl font-black">
            {t.title}
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/60">
            {t.description}
          </p>
        </div>

        <section className="rounded-[32px] border border-lime-300/20 bg-[#0b1a0e]/80 p-5 shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-2 text-lime-300">
            <ShieldCheck
              size={18}
              aria-hidden="true"
            />

            <span className="text-xs font-black">
              {t.secure}
            </span>
          </div>

          {!success ? (
            <form
              onSubmit={submit}
              className="mt-6 space-y-5"
            >
              <label className="block text-sm">
                <span className="mb-2 flex items-center gap-2 text-white/75">
                  <Mail
                    size={16}
                    aria-hidden="true"
                    className="text-lime-300"
                  />

                  {t.email}
                </span>

                <input
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={
                    t.placeholder
                  }
                  dir="ltr"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.05] px-4 text-left outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                />
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-300/15 bg-red-400/10 p-3 text-sm leading-6 text-red-200"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-[#071109] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <Loader2
                    size={18}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                )}

                {loading
                  ? t.sending
                  : t.send}
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-2xl border border-lime-300/20 bg-lime-300/[.07] p-5 text-center">
              <CheckCircle2
                size={36}
                className="mx-auto text-lime-300"
              />

              <p className="mt-4 text-sm leading-7 text-white/75">
                {t.success}
              </p>
            </div>
          )}

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-lime-300 transition hover:text-lime-200"
          >
            <BackIcon
              size={16}
              aria-hidden="true"
            />

            {t.back}
          </Link>
        </section>
      </div>
    </main>
  );
}