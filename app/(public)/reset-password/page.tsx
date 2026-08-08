"use client";

import { Suspense, type FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Leaf,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { useLanguage } from "@/components/i18n/LanguageProvider";

const translations = {
  AR: {
    title: "إعادة تعيين كلمة المرور",
    description: "اكتب كلمة المرور الجديدة ثم أكدها مرة أخرى.",
    password: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    submit: "تغيير كلمة المرور",
    loading: "جاري تغيير كلمة المرور...",
    back: "العودة لتسجيل الدخول",
    secure: "إعادة تعيين آمنة",
    invalidToken: "رابط إعادة التعيين غير صالح.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    weakPassword:
      "كلمة المرور يجب أن تكون 12 حرفًا على الأقل وتحتوي على حرف كبير وصغير ورقم ورمز.",
    success: "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.",
    genericError: "تعذر تغيير كلمة المرور. حاول مرة أخرى.",
  },

  EN: {
    title: "Reset Password",
    description: "Enter your new password and confirm it again.",
    password: "New Password",
    confirmPassword: "Confirm Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Change Password",
    loading: "Changing password...",
    back: "Back to Sign In",
    secure: "Secure Password Reset",
    invalidToken: "The password reset link is invalid.",
    passwordMismatch: "The passwords do not match.",
    weakPassword:
      "Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.",
    success: "Your password has been changed successfully. You can now sign in.",
    genericError: "Unable to change your password. Please try again.",
  },
} as const;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!token) {
      setMessage(t.invalidToken);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setMessage(t.passwordMismatch);
      return;
    }

    const strongPassword =
      password.length >= 12 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!strongPassword) {
      setMessage(t.weakPassword);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          typeof result?.message === "string" ? result.message : t.genericError
        );
        return;
      }

      setSuccess(true);
    } catch {
      setMessage(t.genericError);
    } finally {
      setLoading(false);
    }
  }

  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300 shadow-[0_0_20px_rgba(200,243,63,0.15)]">
          <Leaf size={28} />
        </div>

        <h1 className="mt-5 text-3xl font-black">{t.title}</h1>

        <p className="mt-3 text-sm leading-7 text-white/60">{t.description}</p>
      </div>

      <section className="rounded-[32px] border border-lime-300/20 bg-[#0b1a0e]/80 p-5 shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center gap-2 text-lime-300">
          <ShieldCheck size={18} aria-hidden="true" />
          <span className="text-xs font-black">{t.secure}</span>
        </div>

        {!success ? (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <label className="block text-sm">
              <span className="mb-2 flex items-center gap-2 text-white/75">
                <LockKeyhole size={16} className="text-lime-300" aria-hidden="true" />
                {t.password}
              </span>

              <div className="relative">
                <input
                  required
                  minLength={12}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  dir="ltr"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.05] px-4 pr-12 text-left outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[.06] hover:text-lime-300"
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </label>

            <label className="block text-sm">
              <span className="mb-2 flex items-center gap-2 text-white/75">
                <KeyRound size={16} className="text-lime-300" aria-hidden="true" />
                {t.confirmPassword}
              </span>

              <div className="relative">
                <input
                  required
                  minLength={12}
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  dir="ltr"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.05] px-4 pr-12 text-left outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[.06] hover:text-lime-300"
                >
                  {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </label>

            {message && (
              <p role="alert" className="rounded-xl border border-red-300/15 bg-red-400/10 p-3 text-sm leading-6 text-red-200">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-[#071109] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
              {loading ? t.loading : t.submit}
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl border border-lime-300/20 bg-lime-300/[.07] p-5 text-center">
            <CheckCircle2 size={38} className="mx-auto text-lime-300" aria-hidden="true" />
            <p className="mt-4 text-sm leading-7 text-white/75">{t.success}</p>
          </div>
        )}

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-lime-300 transition hover:text-lime-200"
        >
          <BackIcon size={16} aria-hidden="true" />
          {t.back}
        </Link>
      </section>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#061008] p-6 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-0 h-80 w-80 rounded-full bg-[rgba(200,243,63,.09)] blur-[110px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-[rgba(34,197,94,.08)] blur-[110px]" />

      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={<div className="text-center text-white/60">جاري التحميل...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}