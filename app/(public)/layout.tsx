import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "../globals.css";

import { CartProvider } from "@/components/cart/CartProvider";
import SiteChrome from "@/components/SiteChrome";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.artvertegypt.com"),

  title: {
    default: "ArtVert Egypt",
    template: "%s | ArtVert Egypt",
  },

  description:
    "ArtVert Egypt - حلول زراعية متكاملة من أسمدة ومغذيات ومنشطات وحماية النبات",

  keywords: [
    "ArtVert Egypt",
    "ArtVert",
    "أسمدة زراعية",
    "مغذيات نباتية",
    "منشطات نمو",
    "حلول زراعية",
    "زراعة منزلية",
  ],

  icons: {
    icon: [
      {
        url: "/icon.png",
        type: "image/png",
        sizes: "512x512",
      },
      {
        url: "/favicon.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    shortcut: "/favicon.png",
    apple: [
      {
        url: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },

  openGraph: {
    title: "ArtVert Egypt",
    description: "حلول زراعية متكاملة لتغذية وحماية النبات",
    url: "https://www.artvertegypt.com",
    siteName: "ArtVert Egypt",
    images: [
      {
        url: "/hero.jpeg",
        width: 1200,
        height: 630,
        alt: "ArtVert Egypt",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ArtVert Egypt",
    description: "حلول زراعية متكاملة للنبات",
    images: ["/hero.jpeg"],
  },
};

export default function PublicRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      dir="rtl"
      className={`${cairo.className} min-h-screen bg-[#0a150f] text-white font-sans`}
    >
      <CartProvider>
        <SiteChrome>{children}</SiteChrome>
      </CartProvider>

      <Analytics />
      <SpeedInsights />
    </div>
  );
}
