"use client";

import Link from "next/link";
import { BarChart3, BookOpen, Bug, FlaskConical, Leaf, Package, Settings, Sprout } from "lucide-react";

const items = [
  { label: "لوحة التحكم", href: "/admin", icon: BarChart3, active: true },
  { label: "النباتات", icon: Sprout },
  { label: "الأمراض", icon: FlaskConical },
  { label: "الآفات", icon: Bug },
  { label: "نقص العناصر", icon: Leaf },
  { label: "المنتجات", icon: Package },
  { label: "مولد المعرفة", icon: BookOpen },
  { label: "الإعدادات", icon: Settings },
];

export default function AdminSidebar() {
  return <aside className="flex shrink-0 flex-col border-b border-white/10 bg-[#092017] p-4 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-l">
    <Link href="/admin" className="mb-7 flex items-center gap-3 px-3 py-2">
      <span className="grid size-10 place-items-center rounded-2xl bg-emerald-300 text-[#082017]"><Sprout size={22} /></span>
      <span><strong className="block text-lg tracking-tight">ArtVert OS</strong><small className="text-xs text-emerald-200/60">Agricultural intelligence</small></span>
    </Link>
    <nav aria-label="Admin navigation" className="flex gap-2 overflow-x-auto lg:block lg:space-y-1 lg:overflow-visible">
      {items.map(({ label, href, icon: Icon, active }) => active ? (
        <Link key={label} href={href!} className="flex shrink-0 items-center gap-3 rounded-xl bg-emerald-300 px-3 py-3 text-sm font-black text-[#082017]"><Icon size={18} />{label}</Link>
      ) : (
        <div key={label} aria-disabled="true" title="متاح في Sprint لاحق" className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-emerald-50/45"><Icon size={18} />{label}<span className="mr-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px]">قريبًا</span></div>
      ))}
    </nav>
    <div className="mt-auto hidden rounded-2xl border border-emerald-200/10 bg-emerald-300/5 p-4 lg:block"><p className="text-sm font-bold text-emerald-200">Sprint 1</p><p className="mt-1 text-xs leading-5 text-white/45">تم تأسيس مساحة إدارة مستقلة دون تعديل تجربة الموقع العام.</p></div>
  </aside>;
}
