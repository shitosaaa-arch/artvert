import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="relative h-[760px] bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/hero.png')",
      }}
    >
      <div className="absolute inset-0 bg-black/45"></div>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6">

        <div className="max-w-2xl text-white">

          <span className="mb-6 inline-block rounded-full bg-green-700 px-5 py-2 text-sm font-bold">
            ARTVERT EGYPT
          </span>

          <h1 className="text-6xl font-black leading-tight">
            حلول زراعية
            <br />
            لمستقبل أكثر إنتاجية
          </h1>

          <p className="mt-8 text-xl leading-10 text-gray-100">
            نقدم مجموعة متكاملة من الأسمدة الزراعية والمخصبات الحيوية
            ومنظمات النمو ومحسنات الامتصاص لتحقيق أعلى إنتاجية وجودة للمحاصيل.
          </p>

          <div className="mt-10 flex gap-5">

            <Link
              href="/products"
              className="rounded-xl bg-lime-500 px-8 py-4 font-bold text-black hover:bg-lime-400 transition"
            >
              تصفح المنتجات
            </Link>

            <Link
              href="/contact"
              className="rounded-xl border-2 border-white px-8 py-4 font-bold hover:bg-white hover:text-green-700 transition"
            >
              تواصل معنا
            </Link>

          </div>

        </div>

      </div>
    </section>
  );
}