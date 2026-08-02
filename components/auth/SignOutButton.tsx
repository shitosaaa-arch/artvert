"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  return <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-emerald-50/60 transition hover:bg-white/5 hover:text-emerald-100"><LogOut size={18} />Sign out</button>;
}
