"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

type LoginCardProps = { callbackUrl: string; error?: string };

export default function LoginCard({ callbackUrl, error }: LoginCardProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(error === "AccessDenied" ? "You do not have access to this admin area." : "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      remember: data.get("remember") === "on" ? "true" : "false",
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (result?.error) {
      setMessage("The email address or password is incorrect.");
      return;
    }
    window.location.assign(result?.url || callbackUrl);
  }

  return <section className="w-full max-w-md rounded-3xl border border-emerald-200/15 bg-[#0b2118]/95 p-7 shadow-2xl"><div className="grid size-12 place-items-center rounded-2xl bg-emerald-300 text-[#082017]"><ShieldCheck /></div><h1 className="mt-5 text-3xl font-black">ArtVert OS</h1><p className="mt-2 text-sm leading-6 text-white/55">Secure access to the agricultural intelligence platform.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm"><span className="mb-2 flex items-center gap-2 text-white/70"><Mail size={15} />Email</span><input required name="email" type="email" autoComplete="email" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-emerald-300" /></label><label className="block text-sm"><span className="mb-2 flex items-center gap-2 text-white/70"><LockKeyhole size={15} />Password</span><input required minLength={8} name="password" type="password" autoComplete="current-password" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 outline-none focus:border-emerald-300" /></label><label className="flex items-center gap-2 text-sm text-white/60"><input type="checkbox" name="remember" />Remember me on this device</label>{message && <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{message}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 py-3 font-black text-[#082017] disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={17} />}Sign in</button></form><button disabled title="Password recovery will be available in a future release." className="mt-5 text-sm text-emerald-200/60">Forgot password?</button></section>;
}
