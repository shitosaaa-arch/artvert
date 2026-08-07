import type { Metadata } from "next";

import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title:
    "تواصل معنا | ArtVert Egypt",
  description:
    "تواصل مع ArtVert Egypt للحصول على أفضل الحلول الزراعية",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
