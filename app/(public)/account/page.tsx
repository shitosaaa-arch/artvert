import { redirect } from "next/navigation"; import CustomerAccount from "@/components/customer/CustomerAccount"; import { currentCustomer } from "@/lib/customers/session";
export const dynamic = "force-dynamic";
export default async function AccountPage() { const customer = await currentCustomer(); if (!customer) redirect("/account/login"); return <CustomerAccount customer={customer} />; }
