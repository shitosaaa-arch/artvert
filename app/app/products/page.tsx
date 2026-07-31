import { products } from "../../data/products";

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">

        <h1 className="text-5xl font-bold text-center mb-12">
          منتجات ArtVert Egypt
        </h1>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-56 object-contain mb-6"
              />

              <h2 className="text-2xl font-bold mb-3">
                {product.name}
              </h2>

              <p className="text-gray-600 mb-5">
                {product.description}
              </p>

              <button className="bg-green-700 text-white px-5 py-3 rounded-lg hover:bg-green-800">
                عرض التفاصيل
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}