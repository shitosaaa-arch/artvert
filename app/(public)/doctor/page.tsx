import type { Metadata } from "next";

import { DoctorChat } from "@/components/doctor/DoctorChat";

export const metadata: Metadata = {
  title: "دكتور ArtVert AI | الإرشاد الزراعي الذكي",
  description:
    "تحدث مع دكتور ArtVert AI للحصول على إرشاد زراعي وتحليل صور واقتراح منتجات ArtVert المناسبة.",
};

export default function DoctorPage() {
  return (
    <DoctorChat />
  );
}
