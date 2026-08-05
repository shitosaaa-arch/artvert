import {
  getServerSession,
} from "next-auth";
import {
  redirect,
} from "next/navigation";
import {
  Leaf,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import LoginCard from "@/components/auth/LoginCard";
import {
  authOptions,
} from "@/lib/auth/options";

const getSafeCallbackUrl = (
  callbackUrl?: string,
) =>
  callbackUrl?.startsWith(
    "/admin",
  ) &&
  !callbackUrl.startsWith("//")
    ? callbackUrl
    : "/admin";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
}) {
  const [
    session,
    params,
  ] = await Promise.all([
    getServerSession(
      authOptions,
    ),
    searchParams,
  ]);

  const callbackUrl =
    getSafeCallbackUrl(
      params.callbackUrl,
    );

  if (
    session?.user
      ?.sessionExpiresAt
  ) {
    redirect(callbackUrl);
  }

  return (
    <main
      className="relative grid min-h-screen place-items-center overflow-hidden bg-[#061008] p-6 text-white font-sans"
      dir="rtl"
    >
      {/* خلفية متدرجة أساسية تتناسب مع الثيم الداكن */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_15%_6%,rgba(143,202,45,.12),transparent_25%),radial-gradient(circle_at_88%_18%,rgba(38,164,83,.12),transparent_27%),linear-gradient(145deg,#02150d_0%,#063220_48%,#02180f_100%)]" />

      {/* شبكة الخلفية الفسفورية الخفيفة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize:
            "52px 52px",
        }}
      />

      {/* إضاءات جانبية (Glow Orbs) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-0 h-80 w-80 rounded-full bg-[rgba(200,243,63,.09)] blur-[110px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-[rgba(34,197,94,.08)] blur-[110px]"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* رأس الصفحة / الشعار */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300 shadow-[0_0_20px_rgba(200,243,63,0.15)]">
            <Leaf size={28} />
          </div>

          <h1 className="mt-5 text-3xl font-black text-white">
            تسجيل الدخول
          </h1>

          <p className="mt-2 text-sm leading-7 text-white/60">
            دخول آمن إلى لوحة تحكم ArtVert
          </p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <div className="rounded-[32px] border border-lime-300/20 bg-[#0b1a0e]/80 p-4 shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl sm:p-5">
          <LoginCard
            callbackUrl={
              callbackUrl
            }
            error={
              params.error
            }
          />
        </div>

        {/* بطاقات المعلومات السفلية */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[.02] p-3 backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
              <ShieldCheck
                size={18}
              />
            </div>

            <div>
              <p className="text-xs font-black text-white">
                جلسة آمنة
              </p>

              <p className="mt-1 text-[10px] text-white/40">
                حماية بيانات الدخول
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[.02] p-3 backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
              <LockKeyhole
                size={18}
              />
            </div>

            <div>
              <p className="text-xs font-black text-white">
                وصول محمي
              </p>

              <p className="mt-1 text-[10px] text-white/40">
                للمديرين المصرح لهم فقط
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}