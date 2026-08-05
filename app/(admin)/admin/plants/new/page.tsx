import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  PlusCircle,
} from "lucide-react";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { UserRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

import PlantCreateForm from "./PlantCreateForm";

export const metadata: Metadata = {
  title: "إضافة نبات جديد",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewPlantPage() {
  await requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.AGRONOMIST,
  );

  return (
    <div className="lg:flex">
      <AdminSidebar />

      <main
        className="min-h-screen flex-1 bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
        dir="rtl"
      >
        <div className="mx-auto max-w-[1200px]">
          <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/admin/plants"
                className="inline-flex items-center gap-2 text-sm font-bold text-white/55 transition hover:text-lime-300"
              >
                <ArrowRight
                  aria-hidden="true"
                  size={17}
                />

                العودة إلى إدارة النباتات
              </Link>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                  <PlusCircle
                    aria-hidden="true"
                    size={24}
                  />
                </div>

                <div>
                  <span className="text-sm font-black text-lime-300">
                    Doctor Knowledge Base
                  </span>

                  <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                    إضافة نبات جديد
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-3xl leading-7 text-white/55">
                أنشئ كيانًا نباتيًا جديدًا داخل قاعدة المعرفة،
                وأضف بياناته الأساسية والأسماء البديلة وحالة النشر.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[.03] px-5 py-4">
              <span className="flex items-center gap-2 text-xs font-bold text-white/40">
                <Leaf
                  aria-hidden="true"
                  size={15}
                />

                وحدة النباتات
              </span>

              <strong className="mt-2 block text-sm font-black text-lime-300">
                إنشاء سجل جديد
              </strong>
            </div>
          </header>

          <PlantCreateForm />
        </div>
      </main>
    </div>
  );
}