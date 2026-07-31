import { products } from "../data/products";

export default function FeaturedProducts() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12">
          منتجاتنا المميزة
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border shadow-lg p-6 hover:shadow-2xl transition"
            >
              <div className="h-48 rounded-lg bg-gray-100 flex items-center justify-center mb-5">
                <span className="text-gray-400">صورة المنتج</span>
              </div>

              <h3 className="text-2xl font-bold mb-3">
                {product.name}
              </h3>

              <p className="text-gray-600 mb-4">
                {product.description}
              </p>

              <button className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800">
                اعرف المزيد
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}