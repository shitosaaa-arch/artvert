"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { useLanguage } from "@/components/i18n/LanguageProvider";

const translations = {
  AR: {
    registerTitle: "إنشاء حساب العميل",
    loginTitle: "تسجيل الدخول",
    displayName: "الاسم الظاهر",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    passwordHint: "كلمة المرور يجب أن تكون 12 حرفاً على الأقل.",
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
    passwordHint: "Password must be at least 12 characters.",
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
  const { locale } = useLanguage();
  const t = translations[locale];

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    if (mode === "login") {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(t.requestError);
        setLoading(false);
        return;
      }

      // توجيه العميل لصفحة حسابه
      router.push("/account");
      router.refresh();
      return;
    }

    const body = {
      email,
      password,
      displayName: form.get("displayName") as string,
      locale: locale === "AR" ? "ar-EG" : "en",
    };

    const response = await fetch("/api/customer/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setError(t.requestError);
      setLoading(false);
      return;
    }

    // توجيه العميل لصفحة حسابه بعد التسجيل
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <h1>
        {mode === "register"
          ? t.registerTitle
          : t.loginTitle}
      </h1>

      {mode === "register" && (
        <label>
          {t.displayName}
          <input
            required
            name="displayName"
            type="text"
            autoComplete="name"
            className="rounded border p-3"
          />
        </label>
      )}

      <label>
        {t.email}
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          className="rounded border p-3"
        />
      </label>

      <label>
        {t.password}
        <input
          required
          name="password"
          type="password"
          minLength={12}
          autoComplete={
            mode === "register"
              ? "new-password"
              : "current-password"
          }
          className="rounded border p-3"
        />
      </label>

      {mode === "register" && (
        <p>{t.passwordHint}</p>
      )}

      {error && <p className="text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
      >
        {loading
          ? t.processing
          : mode === "register"
            ? t.createAccount
            : t.login}
      </button>

      {mode === "login" ? (
        <p>
          {t.noAccount}{" "}
          <Link href="/account/register">
            {t.createAccountLink}
          </Link>
        </p>
      ) : (
        <p>
          {t.alreadyHaveAccount}{" "}
          <Link href="/account/login">
            {t.loginLink}
          </Link>
        </p>
      )}
    </form>
  );
}