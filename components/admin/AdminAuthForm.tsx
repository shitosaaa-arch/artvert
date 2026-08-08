"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  LogIn,
} from "lucide-react";

export default function AdminAuthForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("بيانات الدخول غير صحيحة، أو ليس لديك صلاحية.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-[30px] border border-[#c8f33f]/20 bg-[#0b1a0e]/95 shadow-[0_0_40px_rgba(200,243,63,.08)] backdrop-blur-xl">
      <div className="p-6 sm:p-8">
        {/* رأس الصندوق (دخول آمن) */}
        <div className="mb-2 flex items-center gap-2 text-[#c8f33f]">
          <ShieldCheck size={20} />
          <span className="text-sm font-bold">دخول آمن</span>
        </div>
        <h2 className="mb-2 text-2xl font-black text-white">تسجيل الدخول</h2>
        <p className="mb-6 text-sm text-white/60">
          ادخل بيانات حسابك للوصول إلى لوحة التحكم وخدمات ArtVert.
        </p>

        <form onSubmit={submit} className="space-y-5">
          {/* حقل البريد الإلكتروني */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80">
              <Mail size={16} className="text-[#c8f33f]" />
              البريد الإلكتروني
            </label>
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none transition focus:border-[#c8f33f] focus:bg-black/60 focus:ring-1 focus:ring-[#c8f33f]"
            />
          </div>

          {/* حقل كلمة المرور */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80">
              <Lock size={16} className="text-[#c8f33f]" />
              كلمة المرور
            </label>
            <div className="relative">
              <input
                required
                name="password"
                type={showPassword ? "text" : "password"}
                dir="ltr"
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-12 pr-4 text-white outline-none transition focus:border-[#c8f33f] focus:bg-black/60 focus:ring-1 focus:ring-[#c8f33f]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute bottom-0 left-0 top-0 grid w-12 place-items-center text-white/40 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* تذكرني */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-white/20 bg-black/40 accent-[#c8f33f]"
            />
            <label htmlFor="remember" className="text-sm text-white/70">
              تذكرني على هذا الجهاز
            </label>
          </div>

          {/* رسالة الخطأ */}
          {error && <p className="text-sm font-bold text-red-500">{error}</p>}

          {/* زر تسجيل الدخول */}
          <button
            type="submit"
            disabled={loading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c8f33f] px-5 font-black text-[#071109] transition hover:bg-[#d6ff58] disabled:opacity-70"
          >
            {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
            <LogIn size={18} className="-scale-x-100" />
          </button>

          {/* نسيت كلمة المرور */}
          <div className="text-center">
            <Link
              href="/account/reset-password"
              className="text-sm font-bold text-white/60 transition hover:text-white"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
        </form>
      </div>

      {/* الفوتر المقسوم (جلسة آمنة - وصول محمي) */}
      <div className="grid grid-cols-2 divide-x divide-x-reverse divide-white/10 border-t border-white/10 bg-white/[.02]">
        <div className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c8f33f]/10 text-[#c8f33f]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-white">جلسة آمنة</p>
            <p className="mt-1 text-[10px] text-white/50">حماية بيانات الدخول</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c8f33f]/10 text-[#c8f33f]">
            <Lock size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-white">وصول محمي</p>
            <p className="mt-1 text-[10px] text-white/50">للمديرين المصرح لهم فقط</p>
          </div>
        </div>
      </div>
    </div>
  );
}