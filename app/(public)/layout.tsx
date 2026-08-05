import type { Metadata } from "next";
import {
  Cairo,
} from "next/font/google";

import "../globals.css";

import {
  CartProvider,
} from "@/components/cart/CartProvider";
import SiteChrome from "@/components/SiteChrome";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: [
    "400",
    "500",
    "700",
    "800",
    "900",
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://artvertegypt.com",
  ),

  title: {
    default: "ArtVert Egypt",
    template:
      "%s | ArtVert Egypt",
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
    icon: "/icon.png",
    shortcut: "/icon.png",
  },

  openGraph: {
    title: "ArtVert Egypt",
    description:
      "حلول زراعية متكاملة لتغذية وحماية النبات",
    url:
      "https://artvertegypt.com",
    siteName:
      "ArtVert Egypt",
    images: [
      {
        url: "/hero.jpeg",
        width: 1200,
        height: 630,
        alt:
          "ArtVert Egypt",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },

  twitter: {
    card:
      "summary_large_image",
    title:
      "ArtVert Egypt",
    description:
      "حلول زراعية متكاملة للنبات",
    images: ["/hero.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
    >
      <body
        className={`${cairo.className} bg-[#0a150f] text-white font-sans`}
      >
        <CartProvider>
          <SiteChrome>
            {children}
          </SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}