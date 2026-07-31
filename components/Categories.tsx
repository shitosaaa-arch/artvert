import Link from "next/link";

const categories = [
  {
    title: "الأسمدة الزراعية",
    desc: "تغذية متكاملة لجميع المحاصيل",
    color: "bg-green-600",
    icon: "🌱",
  },
  {
    title: "المخصبات الحيوية",
    desc: "زيادة خصوبة التربة وتنشيط الجذور",
    color: "bg-blue-600",
    icon: "🧪",
  },
  {
    title: "منظمات النمو",
    desc: "تحفيز النمو والتزهير والعقد",
    color: "bg-orange-500",
    icon: "🌿",
  },
  {
    title: "محسنات الامتصاص",
    desc: "رفع كفاءة امتصاص العناصر",
    color: "bg-purple-600",
    icon: "💧",
  },
  {
    title: "المبيدات",
    desc: "حماية النباتات من الآفات",
    color: "bg-red-600",
    icon: "🛡️",
  },
];

export default function Categories() {
  return (
    <section className="py-24 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <h2 className="text-5xl font-black text-gray-900">
            فئات المنتجات
          </h2>

          <p className="mt-5 text-gray-600 text-lg">
            اكتشف جميع منتجات ArtVert حسب الفئة
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">

          {categories.map((item) => (

            <Link
              href="/products"
              key={item.title}
              className="rounded-3xl bg-white shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 p-8 text-center"
            >

              <div
                className={`${item.color} mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl`}
              >
                {item.icon}
              </div>

              <h3 className="text-2xl font-bold text-gray-900">
                {item.title}
              </h3>

              <p className="mt-4 leading-8 text-gray-600">
                {item.desc}
              </p>

            </Link>

          ))}

        </div>

      </div>

    </section>
  );
}