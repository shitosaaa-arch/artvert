import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DiseaseManager from "@/components/admin/DiseaseManager";
import { UserRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
export const metadata: Metadata = { title: "Disease management" };
export default async function DiseasesPage() { await requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGRONOMIST); return <div className="lg:flex"><AdminSidebar /><DiseaseManager /></div>; }
