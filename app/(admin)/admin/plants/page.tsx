import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import PlantManager from "@/components/admin/PlantManager";
import { UserRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Plant management" };

export default async function PlantsPage() {
  await requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGRONOMIST);
  return <div className="lg:flex"><AdminSidebar /><PlantManager /></div>;
}
