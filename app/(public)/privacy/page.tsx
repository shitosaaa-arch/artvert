import {
  Database,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

const sections = [
  {
    icon: ShieldCheck,
    title: "مقدمة",
    text: "تحرص ArtVert Egypt على حماية خصوصية عملائها وزوار الموقع، ونلتزم باستخدام البيانات بطريقة آمنة لتحسين تجربة المستخدم وتقديم أفضل خدمة.",
  },
  {
    icon: Database,
    title: "البيانات التي يتم جمعها",
    text: "قد يتم جمع بيانات التواصل مثل الاسم ورقم الهاتف عند طلب المنتجات أو التواصل مع فريق الدعم.",
  },
  {
    icon: UserRoundCheck,
    title: "استخدام البيانات",
    text: "تستخدم البيانات للرد على الاستفسارات، متابعة الطلبات، وتحسين خدمات ومنتجات الشركة.",
  },
  {
    icon: LockKeyhole,
    title: "حماية المعلومات",
    text: "نحرص على حماية معلومات العملاء وعدم مشاركتها مع أي جهة خارجية بدون موافقة.",
  },
] as const;

export default function PrivacyPage() {
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
            <ShieldCheck size={16} />
            الخصوصية والأمان
          </span>

          <h1 className="mt-6 text-4xl font-black text-lime-300 drop-shadow-[0_0_25px_rgba(200,243,63,0.3)] sm:text-5xl">
            سياسة الخصوصية
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80">
            نوضح هنا كيفية التعامل مع بيانات العملاء وزوار موقع ArtVert Egypt.
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