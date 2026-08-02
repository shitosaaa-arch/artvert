import Link from "next/link"; import CustomerAuthForm from "@/components/customer/CustomerAuthForm";
export default function CustomerRegisterPage() { return <main className="min-h-screen bg-green-950 p-6 pt-24"><CustomerAuthForm mode="register" /><p className="mt-4 text-center text-white"><Link href="/account/login">لديك حساب بالفعل؟ سجّل الدخول</Link></p></main>; }
