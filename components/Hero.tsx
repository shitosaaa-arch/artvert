export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-green-800 via-green-700 to-lime-600 text-white">
      <div className="max-w-7xl mx-auto px-6 py-24">

        <h1 className="text-6xl font-extrabold mb-6">
          ArtVert Egypt
        </h1>

        <h2 className="text-3xl font-semibold mb-6">
          Growing Success... Worldwide
        </h2>

        <p className="text-xl leading-9 max-w-2xl mb-10">
          حلول متكاملة للمزارعين والزراعة المنزلية ونباتات الزينة،
          مع منتجات عالية الجودة ودعم فني متخصص.
        </p>

        <div className="flex gap-4">
          <button className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold hover:bg-yellow-300">
            تسوق الآن
          </button>

          <button className="border-2 border-white px-8 py-4 rounded-xl hover:bg-white hover:text-green-800">
            تواصل معنا
          </button>
        </div>

      </div>
    </section>
  );
}