"use client";

import {
  usePathname,
} from "next/navigation";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";

type Props = {
  children: React.ReactNode;
};

export default function SiteChrome({
  children,
}: Props) {
  const pathname =
    usePathname();

  const isDoctorPage =
    pathname === "/doctor" ||
    pathname.startsWith(
      "/doctor/",
    );

  if (isDoctorPage) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />

      <main>{children}</main>

      <Footer />

      <WhatsAppButton />
    </>
  );
}
