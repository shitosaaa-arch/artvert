export default function Categories() {
  const categories = [
    {
      title: "الزراعة التجارية",
      desc: "أسمدة ومبيدات وبرامج تسميد للمحاصيل.",
      icon: "🌾",
    },
    {
      title: "الزراعة المنزلية",
      desc: "كل ما تحتاجه للنباتات داخل المنزل.",
      icon: "🏡",
    },
    {
      title: "نباتات الزينة",
      desc: "حلول متكاملة للعناية بنباتات الزينة.",
      icon: "🪴",
    },
    {
      title: "الدعم الفني",
      desc: "استشارات وبرامج تسميد وتشخيص الأمراض.",
      icon: "💡",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12">
          أقسام ArtVert Egypt
        </h2>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border p-8 shadow hover:shadow-xl transition"
            >
              <div className="text-5xl mb-4">{item.icon}</div>

              <h3 className="text-2xl font-bold mb-3">
                {item.title}
              </h3>

              <p className="text-gray-600">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}