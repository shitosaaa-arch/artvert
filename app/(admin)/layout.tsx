import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "../globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: { default: "ArtVert Admin", template: "%s | ArtVert Admin" },
  description: "ArtVert agricultural platform administration",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body className={`${cairo.className} bg-[#07140f] text-white`}>{children}</body></html>;
}
