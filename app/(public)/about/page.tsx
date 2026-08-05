"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Handshake,
  Leaf,
  Lightbulb,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Trophy,
} from "lucide-react";

import AnimatedSection from "@/components/AnimatedSection";

const values = [
  {
    icon: Trophy,
    title: "الجودة",
    text: "منتجات عالية الجودة لتحقيق أفضل نمو وإنتاج للنبات.",
  },
  {
    icon: Lightbulb,
    title: "الابتكار",
    text: "نطور حلول زراعية حديثة تناسب احتياجات السوق.",
  },
  {
    icon: Handshake,
    title: "الثقة",
    text: "شراكة ودعم فني مستمر مع عملائنا.",
  },
  {
    icon: Sprout,
    title: "الاستدامة",
    text: "حلول زراعية تحافظ على النبات والبيئة.",
  },
] as const;

const stats = [
  ["50+", "منتج"],
  ["10+", "حلول زراعية"],
  ["1000+", "عميل"],
  ["24/7", "دعم فني"],
] as const;

export default function AboutPage() {
  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#061008] text-white font-sans"
    >
      {/* Hero Section */}
      <section className="relative h-[620px] overflow-hidden border-b border-lime-300/10">
        <Image
          src="/images/about-hero.jpg"
          alt="ArtVert Egypt"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,21,13,.85)_0%,rgba(2,21,13,.7)_48%,rgba(6,16,8,1)_100%)]" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        <AnimatedSection className="relative z-10 flex h-full items-center justify-center px-6 text-center">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
              <Leaf size={16} />
              من نحن
            </span>

            <h1 className="mt-6 text-5xl font-black text-lime-300 drop-shadow-[0_0_25px_rgba(200,243,63,0.3)] sm:text-6xl lg:text-7xl">
              ArtVert Egypt
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80">
              حلول زراعية متكاملة لمستقبل أفضل
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* Stats Section */}
      <AnimatedSection>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 grid gap-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item[1]}
              className="rounded-3xl border border-lime-300/15 bg-[#0b1a0e]/95 p-7 text-center shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-lime-300/40 hover:shadow-[0_15px_30px_rgba(200,243,63,0.15)]"
            >
              <h2 className="text-4xl font-black text-lime-300 sm:text-5xl">
                {item[0]}
              </h2>

              <p className="mt-3 text-lg font-bold text-white/75">
                {item[1]}
              </p>
            </div>
          ))}
        </section>
      </AnimatedSection>

      {/* Story Section */}
      <AnimatedSection>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 grid items-center gap-10 py-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-lime-300">
              <Sprout size={16} />
              قصتنا
            </span>

            <h2 className="mt-4 text-4xl font-black text-white sm:text-5xl">
              خبرة زراعية برؤية حديثة
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
              بدأت ArtVert Egypt بهدف تقديم حلول زراعية تجمع بين جودة المنتج
              والخبرة الفنية، لمساعدة المزارعين ومحبي النباتات على تحقيق أفضل
              النتائج. نسعى دائمًا لمواكبة التطور وتقديم منتجات تعزز من إنتاجية
              المحاصيل بطرق آمنة ومستدامة.
            </p>
          </div>

          <div className="relative h-[400px] overflow-hidden rounded-[32px] border border-lime-300/15 shadow-[0_0_30px_rgba(200,243,63,0.1)]">
            <Image
              src="/images/farm.jpg"
              alt="مزارع ArtVert"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,21,13,.7)] to-transparent" />
          </div>
        </section>
      </AnimatedSection>

      {/* Values Section */}
      <AnimatedSection>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
          <div className="text-center">
            <span className="inline-flex items-center justify-center gap-2 text-sm font-bold text-lime-300">
              <ShieldCheck size={16} />
              قيمنا
            </span>

            <h2 className="mt-4 text-4xl font-black text-white sm:text-5xl">
              المبادئ التي نبني عليها
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {values.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-lime-300/15 bg-[#0b1a0e]/95 p-7 text-center shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-lime-300/40 hover:shadow-[0_15px_30px_rgba(200,243,63,0.15)]"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300">
                    <Icon size={28} />
                  </div>

                  <h3 className="mt-6 text-2xl font-black text-white">
                    {item.title}
                  </h3>

                  <p className="mt-4 leading-8 text-white/60">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection>
        <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-20">
          <div className="rounded-[32px] border border-lime-300/20 bg-[#0b1a0e]/95 px-6 py-12 text-center shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl sm:px-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
              <ShoppingBag size={16} />
              ابدأ الآن
            </span>

            <h2 className="mt-6 text-4xl font-black text-white sm:text-5xl">
              ابدأ رحلتك مع ArtVert
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/70">
              اكتشف منتجاتنا وحلولنا الزراعية المصممة لدعم نمو نباتاتك وتحسين
              الإنتاجية.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-lime-300 px-10 text-base font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.25)] transition hover:bg-lime-200 hover:scale-105"
            >
              <ShoppingBag size={18} />
              تصفح المنتجات
            </Link>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
}