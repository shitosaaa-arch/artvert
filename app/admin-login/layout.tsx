import "../globals.css";
import { Cairo } from "next/font/google";

const cairo = Cairo({ subsets: ["arabic"] });

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-[#05130a] text-white min-h-screen m-0 p-0`}>
        {children}
      </body>
    </html>
  );
}