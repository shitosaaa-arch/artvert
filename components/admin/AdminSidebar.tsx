"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Bug,
  FlaskConical,
  Leaf,
  Package,
  Settings,
  Sprout,
} from "lucide-react";

import SignOutButton from "@/components/auth/SignOutButton";

const items = [
  {
    label: "لوحة التحكم",
    href: "/admin",
    icon: BarChart3,
  },
  {
    label: "النباتات",
    href: "/admin/plants",
    icon: Sprout,
  },
  {
    label: "الأمراض",
    href: "/admin/diseases",
    icon: FlaskConical,
  },
  {
    label: "الآفات",
    href: "/admin/pests",
    icon: Bug,
  },
  {
    label: "نقص العناصر",
    href: "/admin/deficiencies",
    icon: Leaf,
  },
  {
    label: "المنتجات",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "مولد المعرفة",
    href: "/admin/knowledge",
    icon: BookOpen,
  },
  {
    label: "الإعدادات",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  return (
    <aside className="flex shrink-0 flex-col border-b border-white/10 bg-[#092017] p-4 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-l">
      <Link
        href="/admin"
        className="mb-7 flex items-center gap-3 px-3 py-2"
      >
        <span className="grid size-10 place-items-center rounded-2xl bg-emerald-300 text-[#082017]">
          <Sprout size={22} />
        </span>

        <span>
          <strong className="block text-lg tracking-tight">
            ArtVert OS
          </strong>

          <small className="text-xs text-emerald-200/60">
            Agricultural intelligence
          </small>
        </span>
      </Link>

      <nav
        aria-label="Admin navigation"
        className="flex gap-2 overflow-x-auto lg:block lg:space-y-1 lg:overflow-visible"
      >
        {items.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-emerald-50/70 transition hover:bg-white/5 hover:text-white"
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-3">
        <SignOutButton />
      </div>

      <div className="mt-auto hidden rounded-2xl border border-emerald-200/10 bg-emerald-300/5 p-4 lg:block">
        <p className="text-sm font-bold text-emerald-200">
          Knowledge management
        </p>

        <p className="mt-1 text-xs leading-5 text-white/45">
          إدارة النباتات والأمراض والآفات ونواقص العناصر والمنتجات وتوليد قاعدة المعرفة من مكان واحد.
        </p>
      </div>
    </aside>
  );
}