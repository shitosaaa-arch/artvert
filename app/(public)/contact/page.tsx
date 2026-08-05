import Link from "next/link";
import {
  Clock3,
  Leaf,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShoppingBag,
} from "lucide-react";

export const metadata = {
  title: "تواصل معنا | ArtVert Egypt",
  description:
    "تواصل مع ArtVert Egypt للحصول على أفضل الحلول الزراعية",
};

export default function ContactPage() {
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

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <MessageCircle size={16} />
            تواصل معنا
          </span>

          <h1 className="mt-6 text-4xl font-black text-lime-300 drop-shadow-[0_0_25px_rgba(200,243,63,0.3)] sm:text-5xl lg:text-6xl">
            نحن هنا لمساعدتك
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/80">
            نحن هنا لمساعدتك في اختيار أفضل الحلول الزراعية المناسبة لنباتاتك
            ومحاصيلك.
          </p>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* قسم بيانات التواصل */}
          <div className="rounded-[32px] border border-lime-300/15 bg-[#0b1a0e]/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300">
                <Phone size={21} />
              </div>

              <h2 className="text-3xl font-black text-white">
                بيانات التواصل
              </h2>
            </div>

            <div className="mt-8 grid gap-4">
              <a
                href="tel:+201080040408"
                className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[.02] p-4 backdrop-blur-md transition hover:border-lime-300/30 hover:bg-lime-300/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300 transition group-hover:scale-110">
                  <Phone size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold text-white/50">الهاتف</p>
                  <p
                    className="mt-1 text-lg font-black text-white transition group-hover:text-lime-300"
                    dir="ltr"
                  >
                    01080040408
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[.02] p-4 backdrop-blur-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Leaf size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold text-white/50">الشركة</p>
                  <p className="mt-1 text-lg font-black text-white">
                    ArtVert Egypt
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[.02] p-4 backdrop-blur-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <MapPin size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold text-white/50">الموقع</p>
                  <p className="mt-1 text-lg font-black text-white">Egypt</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[.02] p-4 backdrop-blur-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Clock3 size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold text-white/50">خدمة العملاء</p>
                  <p className="mt-1 text-lg font-black text-white">
                    طوال أيام الأسبوع
                  </p>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/201080040408?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D8%A9%20%D8%B2%D8%B1%D8%A7%D8%B9%D9%8A%D8%A9%20%D9%85%D9%86%20ArtVert."
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#21a366] px-6 font-black text-white shadow-[0_8px_25px_rgba(33,163,102,0.25)] transition hover:scale-[1.02] hover:bg-[#27b875]"
            >
              <MessageCircle size={20} />
              تواصل عبر واتساب
            </a>
          </div>

          {/* قسم نموذج المراسلة */}
          <div className="rounded-[32px] border border-lime-300/15 bg-[#0b1a0e]/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300/10 text-lime-300">
                <Send size={21} className="mr-1" />
              </div>

              <h2 className="text-3xl font-black text-white">أرسل رسالة</h2>
            </div>

            <form className="mt-8 space-y-6">
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-2 block text-sm font-bold text-white/80"
                >
                  الاسم
                </label>

                <input
                  id="contact-name"
                  type="text"
                  placeholder="اكتب اسمك"
                  className="h-14 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-phone"
                  className="mb-2 block text-sm font-bold text-white/80"
                >
                  رقم الهاتف
                </label>

                <input
                  id="contact-phone"
                  type="tel"
                  placeholder="اكتب رقم الهاتف"
                  className="h-14 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                  dir="ltr"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-sm font-bold text-white/80"
                >
                  رسالتك
                </label>

                <textarea
                  id="contact-message"
                  placeholder="اكتب رسالتك"
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[.04] p-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                />
              </div>

              <button
                type="submit"
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.25)] transition hover:scale-[1.02] hover:bg-lime-200"
              >
                <Send size={18} className="mr-1" />
                إرسال
              </button>
            </form>
          </div>
        </section>

        {/* قسم CTA */}
        <section className="mx-auto mt-20 max-w-5xl rounded-[32px] border border-lime-300/20 bg-[#0b1a0e]/95 px-6 py-12 text-center shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl sm:px-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <Leaf size={16} />
            استشارة زراعية
          </span>

          <h2 className="mt-6 text-4xl font-black text-white sm:text-5xl">
            هل تحتاج استشارة زراعية؟
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/70">
            فريق ArtVert جاهز لمساعدتك في اختيار البرنامج المناسب.
          </p>

          <Link
            href="/products"
            className="mt-8 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-lime-300 px-10 text-base font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.25)] transition hover:scale-105 hover:bg-lime-200"
          >
            <ShoppingBag size={18} />
            تصفح المنتجات
          </Link>
        </section>
      </div>
    </main>
  );
}