"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { useLanguage } from "@/components/i18n/LanguageProvider";

type LoginCardProps = {
  callbackUrl: string;
  error?: string;
};

const translations = {
  AR: {
    secureAccess: "دخول آمن",
    title: "تسجيل الدخول",
    description:
      "ادخل بيانات حسابك للوصول إلى لوحة التحكم وخدمات ArtVert.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    remember: "تذكرني على هذا الجهاز",
    accessDenied: "ليس لديك صلاحية للدخول إلى هذه المنطقة.",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    loading: "جاري تسجيل الدخول...",
    login: "تسجيل الدخول",
    forgotPassword: "نسيت كلمة المرور؟",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
  },
  EN: {
    secureAccess: "Secure Access",
    title: "Sign In",
    description:
      "Enter your account details to access the dashboard and ArtVert services.",
    email: "Email Address",
    password: "Password",
    remember: "Remember me on this device",
    accessDenied: "You do not have permission to access this area.",
    invalidCredentials: "The email address or password is incorrect.",
    loading: "Signing in...",
    login: "Sign In",
    forgotPassword: "Forgot your password?",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
} as const;

type MessageType =
  | ""
  | "accessDenied"
  | "invalidCredentials";

export default function LoginCard({
  callbackUrl,
  error,
}: LoginCardProps) {
  const { locale } = useLanguage();
  const t = translations[locale];

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [messageType, setMessageType] =
    useState<MessageType>(
      error === "AccessDenied"
        ? "accessDenied"
        : "",
    );

  const message =
    messageType === "accessDenied"
      ? t.accessDenied
      : messageType ===
          "invalidCredentials"
        ? t.invalidCredentials
        : "";

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessageType("");

    const data = new FormData(
      event.currentTarget,
    );

    const result = await signIn(
      "credentials",
      {
        email: data.get("email"),
        password: data.get("password"),
        remember:
          data.get("remember") === "on"
            ? "true"
            : "false",
        redirect: false,
        callbackUrl,
      },
    );

    setLoading(false);

    if (result?.error) {
      setMessageType(
        "invalidCredentials",
      );
      return;
    }

    window.location.assign(
      result?.url || callbackUrl,
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2 text-lime-300">
        <ShieldCheck
          aria-hidden="true"
          size={18}
        />

        <span className="text-xs font-black">
          {t.secureAccess}
        </span>
      </div>

      <h1 className="mt-5 text-3xl font-black">
        {t.title}
      </h1>

      <p className="mt-2 text-sm leading-7 text-white/60">
        {t.description}
      </p>

      <form
        onSubmit={submit}
        className="mt-7 space-y-4"
      >
        <label className="block text-sm">
          <span className="mb-2 flex items-center gap-2 text-white/75">
            <Mail
              aria-hidden="true"
              size={16}
              className="text-lime-300"
            />

            {t.email}
          </span>

          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/[.05] px-4 text-left outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
            dir="ltr"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-2 flex items-center gap-2 text-white/75">
            <LockKeyhole
              aria-hidden="true"
              size={16}
              className="text-lime-300"
            />

            {t.password}
          </span>

          <div className="relative">
            <input
              required
              minLength={8}
              name="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.05] px-4 pr-12 text-left outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
              dir="ltr"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (current) => !current,
                )
              }
              aria-label={
                showPassword
                  ? t.hidePassword
                  : t.showPassword
              }
              title={
                showPassword
                  ? t.hidePassword
                  : t.showPassword
              }
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[.06] hover:text-lime-300"
            >
              {showPassword ? (
                <EyeOff
                  aria-hidden="true"
                  size={18}
                />
              ) : (
                <Eye
                  aria-hidden="true"
                  size={18}
                />
              )}
            </button>
          </div>
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 accent-lime-300"
          />

          {t.remember}
        </label>

        {message && (
          <p
            role="alert"
            className="rounded-xl border border-red-300/15 bg-red-400/10 p-3 text-sm text-red-200"
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-[#071109] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2
              aria-hidden="true"
              className="animate-spin"
              size={18}
            />
          ) : (
            <LogIn
              aria-hidden="true"
              size={18}
            />
          )}

          {loading
            ? t.loading
            : t.login}
        </button>
      </form>

      <Link
        href="/forgot-password"
        className="mt-5 inline-block text-sm font-bold text-lime-300 transition hover:text-lime-200"
      >
        {t.forgotPassword}
      </Link>
    </section>
  );
}