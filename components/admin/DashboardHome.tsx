import Link from "next/link";
import { ArrowUpLeft, Boxes, FolderKanban, ShieldCheck, Sparkles } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import GoldBranch from "@/components/GoldBranch";

type Props = { productCount: number; categoryCount: number };

export default function DashboardHome({ productCount, categoryCount }: Props) {
  return <main className="relative min-h-screen overflow-hidden bg-[#07140f] px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
    <GoldBranch className="-left-24 -top-20 opacity-[0.07]" />
    <GoldBranch rotate className="-bottom-24 -right-24 opacity-[0.07]" />
    <div className="relative mx-auto max-w-7xl">
      <AnimatedSection><header className="flex flex-col gap-4 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-emerald-300">ArtVert Agricultural Platform</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">مساحة إدارة المنصة</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">نقطة الانطلاق التشغيلية لمنظومة المعرفة الزراعية. ستضاف الوحدات تدريجيًا دون تعطيل تجربة العملاء الحالية.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200"><ShieldCheck size={15}/> نطاق إدارة معزول</span></header></AnimatedSection>
      <AnimatedSection className="mt-7"><section className="grid gap-4 md:grid-cols-3"><Metric icon={Boxes} label="المنتجات الحالية" value={productCount} detail="من data/products.ts"/><Metric icon={FolderKanban} label="تصنيفات المنتجات" value={categoryCount} detail="متوافقة مع الموقع الحالي"/><Metric icon={Sparkles} label="وحدات الإدارة" value="8" detail="خريطة المنصة المعتمدة"/></section></AnimatedSection>
      <AnimatedSection className="mt-7"><section className="grid gap-5 rounded-3xl border border-white/10 bg-[#0b2118]/90 p-6 lg:grid-cols-[1.2fr_0.8fr]"><div><p className="text-sm font-bold text-emerald-300">حالة Sprint 1</p><h2 className="mt-2 text-2xl font-black">الأساس جاهز للتوسّع المدروس</h2><p className="mt-4 max-w-2xl leading-8 text-white/55">هذه اللوحة لا تنشئ بيانات بديلة ولا تغيّر الكتالوج. المرحلة التالية ستربط وحدات الإدارة بالمصادر الرسمية بعد اعتماد schemas وخطة ترحيل المنتجات.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-black text-[#082017]">عرض كتالوج المنتجات <ArrowUpLeft size={16}/></Link><Link href="/doctor" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/5">تجربة Doctor الحالية <ArrowUpLeft size={16}/></Link></div></div><div className="rounded-2xl border border-white/10 bg-black/15 p-5"><h3 className="font-black">التتابع المعتمد</h3><ol className="mt-4 space-y-3 text-sm text-white/55"><li><span className="ml-2 text-emerald-300">01</span>هيكل ولوحة الإدارة</li><li><span className="ml-2 text-white/35">02</span>ترحيل المنتجات وCRUD</li><li><span className="ml-2 text-white/35">03</span>محرك المعرفة وDoctor</li><li><span className="ml-2 text-white/35">04</span>واجهة Vision المنفصلة</li></ol></div></section></AnimatedSection>
    </div>
  </main>;
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Boxes; label: string; value: number | string; detail: string }) { return <article className="rounded-3xl border border-white/10 bg-[#0b2118]/90 p-5 shadow-xl shadow-black/10"><div className="flex items-center justify-between"><p className="text-sm text-white/55">{label}</p><span className="grid size-9 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><Icon size={18}/></span></div><p className="mt-6 text-3xl font-black">{value}</p><p className="mt-1 text-xs text-white/35">{detail}</p></article>; }
