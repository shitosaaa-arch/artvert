"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  UserRound,
  UserRoundPlus,
} from "lucide-react";

import { useLanguage } from "@/components/i18n/LanguageProvider";

const translations = {
  AR: {
    registerTitle: "إنشاء حساب العميل",
    loginTitle: "تسجيل الدخول",
    displayName: "الاسم الظاهر",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    passwordHint:
      "كلمة المرور يجب أن تكون 12 حرفاً على الأقل.",
    requestError:
      "تعذّر إتمام الطلب. تحقّق من البيانات ثم حاول مرة أخرى.",
    processing: "جارٍ المعالجة…",
    createAccount: "إنشاء الحساب",
    login: "دخول",
    noAccount: "ليس لديك حساب؟",
    createAccountLink: "إنشاء حساب",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    loginLink: "سجّل الدخول",
  },
  EN: {
    registerTitle: "Create Customer Account",
    loginTitle: "Sign In",
    displayName: "Display Name",
    email: "Email Address",
    password: "Password",
    passwordHint:
      "Password must be at least 12 characters.",
    requestError:
      "Unable to complete the request. Check your details and try again.",
    processing: "Processing…",
    createAccount: "Create Account",
    login: "Sign In",
    noAccount: "Don't have an account?",
    createAccountLink: "Create Account",
    alreadyHaveAccount: "Already have an account?",
    loginLink: "Sign In",
  },
} as const;

export default function CustomerAuthForm({
  mode,
}: {
  mode: "login" | "register";
}) {
  const router = useRouter();

  const {
    locale,
    isArabic,
  } = useLanguage();

  const t = translations[locale];

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const form =
      new FormData(
        event.currentTarget,
      );

    const email =
      form.get("email") as string;

    const password =
      form.get("password") as string;

    if (mode === "login") {
      const result =
        await signIn(
          "credentials",
          {
            redirect: false,
            email,
            password,
          },
        );

      if (result?.error) {
        setError(
          t.requestError,
        );

        setLoading(false);

        return;
      }

      router.push("/account");
      router.refresh();

      return;
    }

    const body = {
      email,
      password,
      displayName:
        form.get(
          "displayName",
        ) as string,
      locale:
        locale === "AR"
          ? "ar-EG"
          : "en",
    };

    const response =
      await fetch(
        "/api/customer/auth/register",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify(
            body,
          ),
        },
      );

    if (!response.ok) {
      setError(
        t.requestError,
      );

      setLoading(false);

      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5"
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
    >
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-lime-300/15 bg-lime-300/10 text-lime-300 shadow-[0_0_25px_rgba(140,210,52,.12)]">
          {mode ===
          "register" ? (
            <UserRoundPlus
              size={25}
              strokeWidth={1.8}
            />
          ) : (
            <LogIn
              size={25}
              strokeWidth={1.8}
            />
          )}
        </div>

        <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">
          {mode ===
          "register"
            ? t.registerTitle
            : t.loginTitle}
        </h1>
      </div>

      {mode ===
        "register" && (
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/75">
            <UserRound
              size={16}
              className="text-lime-300"
            />

            {
              t.displayName
            }
          </span>

          <input
            required
            name="displayName"
            type="text"
            autoComplete="name"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/[.05] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300/70 focus:bg-white/[.07] focus:ring-4 focus:ring-lime-300/10"
          />
        </label>
      )}

      <label className="block">
        <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/75">
          <Mail
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
          dir="ltr"
          className="h-12 w-full rounded-xl border border-white/10 bg-white/[.05] px-4 text-left text-white outline-none transition placeholder:text-white/25 focus:border-lime-300/70 focus:bg-white/[.07] focus:ring-4 focus:ring-lime-300/10"
        />
      </label>

      <label className="block">
        <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/75">
          <LockKeyhole
            size={16}
            className="text-lime-300"
          />

          {t.password}
        </span>

        <input
          required
          name="password"
          type="password"
          minLength={12}
          autoComplete={
            mode ===
            "register"
              ? "new-password"
              : "current-password"
          }
          placeholder="••••••••••••"
          dir="ltr"
          className="h-12 w-full rounded-xl border border-white/10 bg-white/[.05] px-4 text-left text-white outline-none transition placeholder:text-white/25 focus:border-lime-300/70 focus:bg-white/[.07] focus:ring-4 focus:ring-lime-300/10"
        />
      </label>

      {mode ===
        "register" && (
        <p className="rounded-xl border border-white/5 bg-white/[.025] px-4 py-3 text-xs leading-6 text-white/45">
          {
            t.passwordHint
          }
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-red-300/15 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8cd234] px-5 font-black text-[#071109] shadow-[0_10px_30px_rgba(140,210,52,.18)] transition hover:bg-[#9ce147] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2
            size={18}
            className="animate-spin"
          />
        ) : mode ===
          "register" ? (
          <UserRoundPlus
            size={18}
          />
        ) : (
          <LogIn
            size={18}
          />
        )}

        {loading
          ? t.processing
          : mode ===
              "register"
            ? t.createAccount
            : t.login}
      </button>

      <div className="border-t border-white/5 pt-4 text-center text-sm text-white/55">
        {mode ===
        "login" ? (
          <p>
            {
              t.noAccount
            }{" "}
            <Link
              href="/account/register"
              className="font-black text-lime-300 transition hover:text-lime-200"
            >
              {
                t.createAccountLink
              }
            </Link>
          </p>
        ) : (
          <p>
            {
              t.alreadyHaveAccount
            }{" "}
            <Link
              href="/account/login"
              className="font-black text-lime-300 transition hover:text-lime-200"
            >
              {
                t.loginLink
              }
            </Link>
          </p>
        )}
      </div>
    </form>
  );
}