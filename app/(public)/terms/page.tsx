import {
  FileCheck2,
  PackageSearch,
  Scale,
  ScrollText,
} from "lucide-react";

const sections = [
  {
    icon: ScrollText,
    title: "استخدام الموقع",
    text: "باستخدامك لموقع ArtVert Egypt فإنك توافق على الالتزام بالشروط والأحكام الموضحة، واستخدام الموقع بطريقة قانونية وسليمة.",
  },
  {
    icon: PackageSearch,
    title: "المنتجات والمعلومات",
    text: "جميع المعلومات الخاصة بالمنتجات والتركيبات وطرق الاستخدام مقدمة بهدف الإرشاد الزراعي، ويجب مراعاة ظروف المحصول والتوصيات الفنية المناسبة.",
  },
  {
    icon: FileCheck2,
    title: "الطلب والتواصل",
    text: "يتم تأكيد الطلبات والتفاصيل الخاصة بالمنتجات من خلال قنوات التواصل الرسمية الخاصة بالشركة.",
  },
  {
    icon: Scale,
    title: "حقوق الملكية",
    text: "جميع المحتويات والعلامات التجارية والصور الخاصة بـ ArtVert Egypt محفوظة ولا يجوز استخدامها بدون إذن.",
  },
] as const;

export default function TermsPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#061008] py-16 text-white font-sans"
      dir="rtl"
    >
      {/* شبكة الخلفية الخفيفة المدمجة مع التصميم (Subtle Grid Overlay) */}
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

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <Scale size={16} />
            الشروط القانونية
          </span>

          <h1 className="mt-6 text-4xl font-black text-lime-300 drop-shadow-[0_0_25px_rgba(200,243,63,0.3)] sm:text-5xl">
            الشروط والأحكام
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80">
            توضح هذه الصفحة قواعد استخدام موقع ArtVert Egypt وحقوق الشركة
            والتزامات المستخدم.
          </p>
        </section>

        <div className="mt-12 rounded-[32px] border border-lime-300/15 bg-[#0b1a0e]/80 p-6 shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl sm:p-10">
          <div className="grid gap-5">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <section
                  key={section.title}
                  className="rounded-2xl border border-white/5 bg-white/[.02] p-5 backdrop-blur-md transition duration-300 hover:border-lime-300/20 sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300 transition-transform duration-300 hover:scale-110">
                      <Icon size={21} />
                    </div>

                    <div>
                      <h2 className="text-2xl font-black text-white">
                        {section.title}
                      </h2>

                      <p className="mt-4 leading-9 text-white/60">
                        {section.text}
                      </p>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}