import type { Metadata } from "next";

import { DoctorChat } from "@/components/doctor/DoctorChat";
import GoldBranch from "@/components/GoldBranch";

export const metadata: Metadata = {
  title: "دكتور ArtVert | الإرشاد الزراعي",
  description: "تحدث مع دكتور ArtVert للحصول على إرشاد زراعي آمن ومبني على المعرفة المنشورة.",
};

export default function DoctorPage() {
  return <main className="relative min-h-screen overflow-hidden bg-[#111111] py-10 text-white sm:py-16">
    <GoldBranch className="right-0 top-12 opacity-20" />
    <GoldBranch rotate className="bottom-0 left-0 opacity-20" />
    <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6"><DoctorChat /></div>
  </main>;
}
