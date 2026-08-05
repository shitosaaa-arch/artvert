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

type LoginCardProps = {
  callbackUrl: string;
  error?: string;
};

export default function LoginCard({
  callbackUrl,
  error,
}: LoginCardProps) {
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState(
    error === "AccessDenied"
      ? "ليس لديك صلاحية للدخول إلى هذه المنطقة."
      : "",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

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
      setMessage(
        "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      );
      return;
    }

    window.location.assign(result?.url || callbackUrl);
  }

  return (
    <section
      className="w-full max-w-md rounded-3xl border border-lime-300/15 bg-[#081a0d]/95 p-7 text-white shadow-2xl backdrop-blur-xl"
      dir="rtl"
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-lime-300 text-[#071109] shadow-[0_10px_30px_rgba(190,255,70,.25)]">
        <ShieldCheck
          aria-hidden="true"
          size={28}
        />
      </div>

      <h1 className="mt-5 text-3xl font-black">
        تسجيل الدخول
      </h1>

      <p className="mt-2 text-sm leading-7 text-white/60">
        ادخل بيانات حسابك للوصول إلى لوحة التحكم
        وخدمات ArtVert.
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

            البريد الإلكتروني
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

            كلمة المرور
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

          تذكرني على هذا الجهاز
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
            ? "جاري تسجيل الدخول..."
            : "تسجيل الدخول"}
        </button>
      </form>

      <button
        type="button"
        disabled
        title="استعادة كلمة المرور ستتوفر لاحقًا."
        className="mt-5 text-sm font-bold text-lime-300/55"
      >
        نسيت كلمة المرور؟
      </button>
    </section>
  );
}