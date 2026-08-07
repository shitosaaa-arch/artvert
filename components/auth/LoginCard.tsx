"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import {
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
    forgotPasswordTitle: "استعادة كلمة المرور ستتوفر لاحقًا.",
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
    forgotPasswordTitle: "Password recovery will be available later.",
  },
} as const;

type MessageType = "" | "accessDenied" | "invalidCredentials";

export default function LoginCard({
  callbackUrl,
  error,
}: LoginCardProps) {
  const { locale } = useLanguage();
  const t = translations[locale];

  const [loading, setLoading] = useState(false);

  const [messageType, setMessageType] = useState<MessageType>(
    error === "AccessDenied"
      ? "accessDenied"
      : "",
  );

  const message =
    messageType === "accessDenied"
      ? t.accessDenied
      : messageType === "invalidCredentials"
        ? t.invalidCredentials
        : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessageType("");

    const data = new FormData(event.currentTarget);

    const result = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      remember:
        data.get("remember") === "on"
          ? "true"
          : "false",
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setMessageType("invalidCredentials");
      return;
    }

    window.location.assign(result?.url || callbackUrl);
  }

  return (
    <section className="rounded-[28px] border border-white/5 bg-white/[.02] p-5 sm:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300">
        <ShieldCheck
          aria-hidden="true"
          size={22}
        />
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

          <input
            required
            minLength={8}
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/[.05] px-4 text-left outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
            dir="ltr"
          />
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

      <button
        type="button"
        disabled
        title={t.forgotPasswordTitle}
        className="mt-5 text-sm font-bold text-lime-300/55"
      >
        {t.forgotPassword}
      </button>
    </section>
  );
}
