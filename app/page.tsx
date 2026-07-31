import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Categories from "../components/Categories";
import FeaturedProducts from "../components/FeaturedProducts";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <Hero />

      <Categories />

      <FeaturedProducts />

      {/* About */}
      <section className="py-20 bg-green-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            من نحن
          </h2>

          <p className="text-lg leading-9 text-gray-700">
            ArtVert Egypt شركة متخصصة في الأسمدة الزراعية،
            المبيدات، التغذية النباتية، الزراعة المنزلية،
            نباتات الزينة، وتقديم الدعم الفني والاستشارات
            للمزارعين داخل وخارج مصر.
          </p>
        </div>
      </section>
    </main>
  );
}