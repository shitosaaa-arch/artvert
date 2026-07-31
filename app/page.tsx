import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeaturedProducts from "../components/FeaturedProducts";
import Categories from "../components/Categories";
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">

      <Navbar />

      <Hero />
      <Categories />
      <FeaturedProducts />
      <section className="bg-gradient-to-r from-green-200 to-lime-300 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">

          <h2 className="text-5xl font-bold mb-6">
            حلول زراعية متكاملة
          </h2>

          <p className="text-xl max-w-2xl mx-auto mb-8">
            أسمدة - مبيدات - تغذية نباتية - زراعة منزلية - نباتات زينة
            <br />
            دعم فني واستشارات للمزارعين داخل وخارج مصر.
          </p>

          <div className="flex justify-center gap-4">
            <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">
              منتجاتنا
            </button>

            <button className="border-2 border-green-700 text-green-700 px-6 py-3 rounded-lg hover:bg-green-700 hover:text-white">
              تواصل معنا
            </button>
          </div>

        </div>
      </section>
{/* Products */}
<section className="py-20 bg-white">
  <div className="max-w-7xl mx-auto px-6">

    <h2 className="text-4xl font-bold text-center mb-12">
      منتجاتنا
    </h2>

    <div className="grid md:grid-cols-3 gap-8">

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-3">بلانت جرو</h3>
        <p>محفز نمو قوي لجميع النباتات.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-3">Art P Fosfo</h3>
        <p>سماد عالي الفوسفور لتحفيز التجذير والإزهار.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-3">Nitro Super Art</h3>
        <p>تغذية متكاملة للنمو الخضري.</p>
      </div>

    </div>

  </div>
</section>

{/* About */}
<section className="py-20 bg-green-50">
  <div className="max-w-5xl mx-auto px-6 text-center">

    <h2 className="text-4xl font-bold mb-6">
      من نحن
    </h2>

    <p className="text-lg leading-9 text-gray-700">
      Artvert Egypt شركة متخصصة في الأسمدة الزراعية،
      المبيدات، التغذية النباتية، الزراعة المنزلية،
      نباتات الزينة، وتقديم الدعم الفني والاستشارات
      للمزارعين داخل وخارج مصر.
    </p>

  </div>
</section>
{/* Categories */}

<section className="py-20 bg-white">

  <div className="max-w-7xl mx-auto px-6">

    <h2 className="text-4xl font-bold text-center mb-12">
      اختر القسم المناسب
    </h2>

    <div className="grid md:grid-cols-4 gap-8">

      <div className="rounded-2xl shadow-lg p-8 hover:shadow-2xl transition cursor-pointer">
        <h3 className="text-2xl font-bold mb-3">
          🌾 الزراعة التجارية
        </h3>

        <p>
          منتجات وبرامج تسميد للمحاصيل.
        </p>
      </div>

      <div className="rounded-2xl shadow-lg p-8 hover:shadow-2xl transition cursor-pointer">
        <h3 className="text-2xl font-bold mb-3">
          🏡 الزراعة المنزلية
        </h3>

        <p>
          كل ما تحتاجه للنباتات المنزلية.
        </p>
      </div>

      <div className="rounded-2xl shadow-lg p-8 hover:shadow-2xl transition cursor-pointer">
        <h3 className="text-2xl font-bold mb-3">
          🪴 نباتات الزينة
        </h3>

        <p>
          منتجات العناية بنباتات الزينة.
        </p>
      </div>

      <div className="rounded-2xl shadow-lg p-8 hover:shadow-2xl transition cursor-pointer">
        <h3 className="text-2xl font-bold mb-3">
          🌍 التصدير والوكلاء
        </h3>

        <p>
          انضم لشبكة موزعينا حول العالم.
        </p>
      </div>

    </div>

  </div>

</section>
  </main>
);
}