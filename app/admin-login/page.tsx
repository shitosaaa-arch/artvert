import AdminAuthForm from "@/components/admin/AdminAuthForm";
import { ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#05130a] flex items-center justify-center p-4">
      <main className="w-full max-w-lg">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-300/15 bg-lime-300/10 text-lime-300 shadow-[0_0_24px_rgba(200,243,63,.16)]">
            <ShieldCheck size={32} />
          </div>
          <h1 className="mt-4 text-3xl font-black">بوابة الإدارة</h1>
          <p className="mt-2 text-sm text-white/60">تسجيل الدخول الخاص بمسؤولي Art Vert Egypt</p>
        </div>
        <div className="rounded-[30px] border border-lime-300/20 bg-[#0b1a0e] p-6 shadow-[0_0_40px_rgba(200,243,63,.08)] backdrop-blur-xl">
          <AdminAuthForm />
        </div>
      </main>
    </div>
  );
}