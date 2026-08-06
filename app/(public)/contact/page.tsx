import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Leaf,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title:
    "تواصل معنا | ArtVert Egypt",
  description:
    "تواصل مع ArtVert Egypt للحصول على أفضل الحلول الزراعية",
};

export default function ContactPage() {
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
          backgroundSize:
            "50px 50px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <MessageCircle size={16} />
            تواصل معنا
          </span>

          <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:mt-6 sm:text-5xl lg:text-6xl">
            نحن هنا لمساعدتك
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-8 text-white/68 sm:mt-6 sm:text-lg">
            نساعدك في اختيار أفضل الحلول الزراعية المناسبة لنباتاتك ومحاصيلك، سواء للزراعة التجارية أو المنزلية.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="https://wa.me/201080040408?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D8%A9%20%D8%B2%D8%B1%D8%A7%D8%B9%D9%8A%D8%A9%20%D9%85%D9%86%20ArtVert."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#21a366] px-6 text-sm font-black text-white shadow-[0_8px_24px_rgba(33,163,102,.22)] transition hover:-translate-y-0.5 hover:bg-[#27b875]"
            >
              <MessageCircle size={18} />
              تواصل عبر واتساب
            </a>

            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[.05] px-6 text-sm font-black text-white/85 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-lime-300/35 hover:bg-white/[.09]"
            >
              <ShoppingBag size={18} />
              تصفح المنتجات
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-5 sm:mt-14 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:gap-8">
          <div className="rounded-[28px] border border-lime-300/15 bg-[#0b1a0e]/84 p-5 shadow-[0_18px_45px_rgba(0,0,0,.22)] backdrop-blur-xl sm:p-7">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                <Phone size={21} />
              </div>

              <div>
                <h2 className="text-xl font-black text-white sm:text-2xl">
                  بيانات التواصل
                </h2>
                <p className="mt-1 text-xs text-white/42">
                  تواصل معنا بالطريقة الأنسب لك
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <a
                href="tel:+201080040408"
                className="group flex min-h-20 items-center gap-4 rounded-2xl border border-white/[.06] bg-white/[.025] p-4 transition hover:border-lime-300/30 hover:bg-lime-300/[.05]"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime-300/10 text-lime-300 transition group-hover:scale-105">
                  <Phone size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-white/45">
                    الهاتف
                  </p>
                  <p
                    className="mt-1 text-lg font-black text-white transition group-hover:text-lime-300"
                    dir="ltr"
                  >
                    01080040408
                  </p>
                </div>
              </a>

              <div className="flex min-h-20 items-center gap-4 rounded-2xl border border-white/[.06] bg-white/[.025] p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Leaf size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold text-white/45">
                    الشركة
                  </p>
                  <p className="mt-1 text-lg font-black text-white">
                    ArtVert Egypt
                  </p>
                </div>
              </div>

              <div className="flex min-h-20 items-center gap-4 rounded-2xl border border-white/[.06] bg-white/[.025] p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                  <MapPin size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold text-white/45">
                    الموقع
                  </p>
                  <p className="mt-1 text-lg font-black text-white">
                    مصر
                  </p>
                </div>
              </div>

              <div className="flex min-h-20 items-center gap-4 rounded-2xl border border-white/[.06] bg-white/[.025] p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                  <Clock3 size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold text-white/45">
                    خدمة العملاء
                  </p>
                  <p className="mt-1 text-lg font-black text-white">
                    طوال أيام الأسبوع
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-lime-300/15 bg-lime-300/[.05] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-lime-300"
                />

                <p className="text-xs leading-6 text-white/56">
                  فريقنا يساعدك في اختيار المنتج والبرنامج المناسب قبل الشراء وبعده.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-lime-300/15 bg-[#0b1a0e]/84 p-5 shadow-[0_18px_45px_rgba(0,0,0,.22)] backdrop-blur-xl sm:p-7">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                <Send size={21} />
              </div>

              <div>
                <h2 className="text-xl font-black text-white sm:text-2xl">
                  أرسل رسالة
                </h2>
                <p className="mt-1 text-xs text-white/42">
                  اترك بياناتك وسنتواصل معك
                </p>
              </div>
            </div>

            <form className="mt-6 grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-white/78">
                    الاسم
                  </span>

                  <input
                    id="contact-name"
                    type="text"
                    placeholder="اكتب اسمك"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-white/78">
                    رقم الهاتف
                  </span>

                  <input
                    id="contact-phone"
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                    dir="ltr"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/78">
                  نوع الاستفسار
                </span>

                <select className="h-12 w-full rounded-xl border border-white/10 bg-[#08140c] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10">
                  <option>
                    استشارة زراعية
                  </option>
                  <option>
                    استفسار عن منتج
                  </option>
                  <option>
                    متابعة طلب
                  </option>
                  <option>
                    تعاون تجاري
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/78">
                  رسالتك
                </span>

                <textarea
                  id="contact-message"
                  placeholder="اكتب رسالتك بالتفصيل"
                  rows={6}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[.04] p-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                />
              </label>

              <button
                type="submit"
                className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200 sm:text-base"
              >
                <Send size={18} />
                إرسال الرسالة
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-5xl rounded-[28px] border border-lime-300/20 bg-[linear-gradient(135deg,rgba(200,243,63,.08),rgba(11,26,14,.92))] px-5 py-10 text-center shadow-[0_0_40px_rgba(200,243,63,0.10)] backdrop-blur-xl sm:mt-16 sm:px-10 sm:py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-300">
            <Sparkles size={15} />
            استشارة زراعية
          </span>

          <h2 className="mt-6 text-3xl font-black text-white sm:text-5xl">
            هل تحتاج استشارة زراعية؟
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-white/66 sm:text-base">
            فريق ArtVert جاهز لمساعدتك في اختيار البرنامج والمنتج المناسب حسب نوع النبات أو المحصول والحالة.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/doctor"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-7 text-sm font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200"
            >
              <MessageCircle size={18} />
              اسأل دكتور ArtVert
            </Link>

            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-7 text-sm font-black text-white/78 transition hover:border-lime-300/35 hover:bg-white/[.08] hover:text-white"
            >
              <ShoppingBag size={18} />
              تصفح المنتجات
              <ArrowLeft size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
