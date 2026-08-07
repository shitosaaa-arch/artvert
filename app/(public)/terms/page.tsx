"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  Mail,
  PackageSearch,
  Scale,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import { useLanguage } from "@/components/i18n/LanguageProvider";

const sections = [
  {
    icon: ScrollText,
    titleAr: "استخدام الموقع",
    titleEn: "Website Use",
    textAr:
      "باستخدامك لموقع ArtVert Egypt فإنك توافق على الالتزام بالشروط والأحكام الموضحة، واستخدام الموقع بطريقة قانونية وسليمة.",
    textEn:
      "By using the ArtVert Egypt website, you agree to comply with the stated terms and conditions and to use the website lawfully and appropriately.",
  },
  {
    icon: PackageSearch,
    titleAr: "المنتجات والمعلومات",
    titleEn: "Products & Information",
    textAr:
      "جميع المعلومات الخاصة بالمنتجات والتركيبات وطرق الاستخدام مقدمة بهدف الإرشاد الزراعي، ويجب مراعاة ظروف المحصول والتوصيات الفنية المناسبة.",
    textEn:
      "All information about products, formulations, and methods of use is provided for agricultural guidance, and crop conditions and appropriate technical recommendations should be considered.",
  },
  {
    icon: FileCheck2,
    titleAr: "الطلب والتواصل",
    titleEn: "Orders & Communication",
    textAr:
      "يتم تأكيد الطلبات والتفاصيل الخاصة بالمنتجات من خلال قنوات التواصل الرسمية الخاصة بالشركة.",
    textEn:
      "Orders and product details are confirmed through the company’s official communication channels.",
  },
  {
    icon: Scale,
    titleAr: "حقوق الملكية",
    titleEn: "Intellectual Property Rights",
    textAr:
      "جميع المحتويات والعلامات التجارية والصور الخاصة بـ ArtVert Egypt محفوظة ولا يجوز استخدامها بدون إذن.",
    textEn:
      "All ArtVert Egypt content, trademarks, and images are protected and may not be used without permission.",
  },
] as const;

const userCommitments = [
  {
    ar: "تقديم بيانات صحيحة عند إنشاء الطلب أو التواصل مع فريق الدعم.",
    en: "Provide accurate information when creating an order or contacting the support team.",
  },
  {
    ar: "عدم إساءة استخدام الموقع أو محاولة التأثير على تشغيله.",
    en: "Do not misuse the website or attempt to interfere with its operation.",
  },
  {
    ar: "مراجعة تعليمات الاستخدام والجرعات قبل تطبيق أي منتج.",
    en: "Review usage instructions and dosages before applying any product.",
  },
] as const;

const translations = {
  AR: {
    legalTerms: "الشروط القانونية",
    title: "الشروط والأحكام",
    intro:
      "توضح هذه الصفحة قواعد استخدام موقع ArtVert Egypt وحقوق الشركة والتزامات المستخدم.",
    userCommitmentsTitle: "التزامات المستخدم",
    userCommitmentsSub: "قواعد أساسية لضمان استخدام آمن وواضح للموقع",
    needClarification: "تحتاج توضيح؟",
    contactTerms: "تواصل معنا بخصوص الشروط",
    contactText:
      "لو عندك سؤال عن استخدام الموقع أو الطلبات أو حقوق المحتوى، تقدر تتواصل مع فريق ArtVert.",
    contactUs: "تواصل معنا",
  },
  EN: {
    legalTerms: "Legal Terms",
    title: "Terms & Conditions",
    intro:
      "This page explains the rules for using the ArtVert Egypt website, the company’s rights, and user obligations.",
    userCommitmentsTitle: "User Commitments",
    userCommitmentsSub: "Basic rules to ensure safe and clear use of the website",
    needClarification: "Need Clarification?",
    contactTerms: "Contact Us About the Terms",
    contactText:
      "If you have a question about website use, orders, or content rights, you can contact the ArtVert team.",
    contactUs: "Contact Us",
  },
} as const;

export default function TermsPage() {
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#061008] py-10 text-white font-sans sm:py-14 lg:py-16"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_15%_6%,rgba(143,202,45,.12),transparent_25%),radial-gradient(circle_at_88%_18%,rgba(38,164,83,.12),transparent_27%),linear-gradient(145deg,#02150d_0%,#063220_48%,#02180f_100%)]" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-3 sm:px-6">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <Scale size={16} />
            {t.legalTerms}
          </span>

          <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:mt-6 sm:text-5xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-white/68 sm:mt-6 sm:text-lg">
            {t.intro}
          </p>
        </section>

        <section className="mt-8 rounded-[28px] border border-lime-300/15 bg-[#0b1a0e]/86 p-4 shadow-[0_18px_45px_rgba(0,0,0,.22)] backdrop-blur-xl sm:mt-12 sm:p-7">
          <div className="grid gap-4">
            {sections.map((section, index) => {
              const Icon = section.icon;

              return (
                <article
                  key={section.titleAr}
                  className="group rounded-[22px] border border-white/[.06] bg-white/[.025] p-4 transition duration-300 hover:border-lime-300/20 hover:bg-white/[.04] sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-lime-300/15 bg-lime-300/10 text-lime-300 transition group-hover:scale-105">
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-black text-white sm:text-2xl">
                          {isArabic ? section.titleAr : section.titleEn}
                        </h2>

                        <span className="text-2xl font-black text-white/[.07]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-8 text-white/60 sm:text-base">
                        {isArabic ? section.textAr : section.textEn}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-[#0b1a0e]/72 p-5 shadow-xl backdrop-blur-xl sm:mt-8 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="text-xl font-black text-white sm:text-2xl">
                {t.userCommitmentsTitle}
              </h2>
              <p className="mt-1 text-xs text-white/40">
                {t.userCommitmentsSub}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {userCommitments.map((item) => (
              <div
                key={item.ar}
                className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-4"
              >
                <CheckCircle2
                  size={18}
                  className="mt-1 shrink-0 text-lime-300"
                />

                <p className="text-sm leading-7 text-white/64">
                  {isArabic ? item.ar : item.en}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-lime-300/20 bg-[linear-gradient(135deg,rgba(200,243,63,.08),rgba(11,26,14,.92))] p-5 text-center shadow-[0_0_40px_rgba(200,243,63,0.10)] backdrop-blur-xl sm:mt-8 sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <Mail size={15} />
            {t.needClarification}
          </span>

          <h2 className="mt-5 text-2xl font-black text-white sm:text-3xl">
            {t.contactTerms}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/60">
            {t.contactText}
          </p>

          <Link
            href="/contact"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-7 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200"
          >
            {t.contactUs}
            <ArrowLeft size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}
