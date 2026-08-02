import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import PestManager from "@/components/admin/PestManager";
import { UserRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
export const metadata: Metadata = { title: "Pest management" };
export default async function PestsPage() { await requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGRONOMIST); return <div className="lg:flex"><AdminSidebar /><PestManager /></div>; }
