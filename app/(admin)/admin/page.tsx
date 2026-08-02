import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardHome from "@/components/admin/DashboardHome";
import { getProductCatalog } from "@/lib/products/product-catalog";
import { UserRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "لوحة التحكم" };

export default async function AdminPage() {
  await requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGRONOMIST);
  const products = await getProductCatalog().list();
  const categoryCount = new Set(products.map((product) => product.category)).size;
  return <div className="lg:flex"><AdminSidebar /><DashboardHome productCount={products.length} categoryCount={categoryCount} /></div>;
}
