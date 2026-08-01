import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardHome from "@/components/admin/DashboardHome";
import { products } from "@/data/products";

export const metadata: Metadata = { title: "لوحة التحكم" };

export default function AdminPage() {
  const categoryCount = new Set(products.map((product) => product.category)).size;
  return <div className="lg:flex"><AdminSidebar /><DashboardHome productCount={products.length} categoryCount={categoryCount} /></div>;
}
