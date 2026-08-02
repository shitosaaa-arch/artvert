"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { DoctorAvatarAsset } from "@/components/doctor/DoctorAvatarAsset";
import { FloatingDoctorWidget } from "@/components/doctor/FloatingDoctorWidget";

type Product = { slug: string; nameAr: string; nameEn: string; image: string };

const services = [
  ["تشخيص المشاكل", "/doctor"], ["برامج زراعية", "/plant-care"], ["منتجات مضمونة", "/products"], ["دعم فني", "/contact"],
] as const;

const assurances = [
  ["خبرة زراعية", "حلول عملية مبنية على احتياج نباتك"],
  ["منتجات أصلية", "من عبوات ArtVert الأصلية فقط"],
  ["دعم مستمر", "معك من التشخيص حتى القرار"],
] as const;

export function HomeHero({ products }: { products: Product[] }) {
  const [cart, setCart] = useState(0);
  return <>
    <main className="home-hero min-h-screen bg-[#071109] text-white" dir="rtl">
      <section className="relative isolate min-h-[870px] overflow-hidden border-b border-lime-300/15 bg-[#071109]">
        <Image src="/hero.jpeg" alt="حقل زراعي وقت الغروب" fill priority sizes="100vw" className="-z-30 object-cover object-center" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(4,14,8,.92),rgba(5,22,11,.72),rgba(3,12,7,.92))]"/>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_28%,rgba(177,255,48,.18),transparent_30%),linear-gradient(0deg,rgba(2,10,5,.9),transparent_35%)]"/>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[.85fr_1.4fr_.42fr] lg:items-center lg:gap-6 lg:pb-32 lg:pt-16" dir="ltr">
          <div className="order-2 mx-auto w-full max-w-[280px] sm:max-w-[360px] lg:order-1 lg:mx-0"><div className="relative"><div className="absolute left-0 top-8 rounded-2xl border border-lime-200/30 bg-[#f5ffe7] px-4 py-3 text-sm font-bold text-[#14351d] shadow-xl before:absolute before:-left-2 before:top-7 before:border-y-8 before:border-r-10 before:border-y-transparent before:border-r-[#f5ffe7]" dir="rtl">أهلاً بك! كيف أساعد نباتك اليوم؟</div><Link href="/doctor" className="block rounded-[2rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300" aria-label="افتح دكتور ArtVert"><DoctorAvatarAsset state="WELCOME" className="pt-20"/></Link></div></div>
          <div className="order-1 text-right lg:order-2" dir="rtl"><p className="mb-5 text-sm font-black tracking-[.18em] text-lime-300">حلول زراعية ذكية من قلب الأرض</p><h1 className="max-w-3xl text-4xl font-black leading-[1.16] sm:text-6xl xl:text-7xl">نغذّي نباتك<br/><span className="text-lime-300">ونفهم احتياجاته.</span></h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">منتجات زراعية موثوقة، خبرة عملية، ودكتور ArtVert لمساعدتك في اتخاذ الخطوة التالية بثقة.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/doctor" className="min-h-12 rounded-xl bg-lime-300 px-6 py-3 font-black text-[#0a2511] shadow-[0_12px_32px_rgba(178,255,48,.24)] transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-100">اسأل دكتور ArtVert</Link><Link href="/products" className="min-h-12 rounded-xl border border-white/25 bg-white/5 px-6 py-3 font-bold backdrop-blur transition hover:bg-white/15">تصفح المنتجات</Link></div>
            <div className="relative mt-10 h-52 sm:h-60"><div className="absolute inset-x-0 bottom-0 h-16 rounded-[50%] border border-lime-200/20 bg-gradient-to-b from-[#34522c] to-[#0a170c] shadow-[0_-12px_42px_rgba(161,255,49,.16)]"/><div className="absolute left-2 top-0 z-20 flex min-h-11 items-center gap-2 rounded-full border border-lime-200/25 bg-[#0b2010]/90 px-3 text-xs font-black text-lime-200 shadow-lg backdrop-blur" aria-live="polite"><ShoppingBag aria-hidden="true" size={15}/>{cart}<span className="sr-only">منتجات في السلة</span></div>{products.map((product, index) => <div key={product.slug} className="group absolute bottom-4 h-44 w-1/4 max-w-36 sm:h-60" style={{ right: `${index * 25}%`, transform: `translateY(${index % 2 ? 5 : 0}px)` }}><Image src={product.image} alt={`${product.nameAr} - ${product.nameEn}`} fill sizes="(max-width: 640px) 27vw, 144px" className="object-contain drop-shadow-2xl transition duration-300 group-hover:-translate-y-2"/><button type="button" onClick={() => setCart((count) => count + 1)} className="absolute -bottom-2 left-1/2 min-h-8 -translate-x-1/2 rounded-full bg-[#142c18] px-3 text-[10px] font-bold text-lime-200 opacity-100 transition focus-visible:outline-2 focus-visible:outline-lime-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" aria-label={`إضافة ${product.nameAr} للسلة`}>أضف</button></div>)}</div></div>
          <aside className="order-3 grid grid-cols-2 gap-2 lg:grid-cols-1" aria-label="خدمات ArtVert" dir="rtl">{services.map(([name, href], index) => <Link key={href} href={href} className="group min-h-16 rounded-2xl border border-white/10 bg-[#0c2112]/75 p-3 text-center text-xs font-black text-white shadow-xl backdrop-blur transition hover:border-lime-300/60 hover:bg-[#183a20]"><span className="mb-1 block text-lime-300">0{index + 1}</span>{name}</Link>)}</aside>
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-3 px-4 pb-5 sm:grid-cols-3 sm:px-6 lg:absolute lg:inset-x-0 lg:bottom-0">{assurances.map(([title, text]) => <article key={title} className="rounded-2xl border border-white/10 bg-[#0a1b0e]/75 p-4 backdrop-blur"><h2 className="font-black text-lime-200">{title}</h2><p className="mt-1 text-xs leading-5 text-white/65">{text}</p></article>)}</div>
      </section>
    </main><div className="hidden lg:block"><FloatingDoctorWidget /></div>
  </>;
}
