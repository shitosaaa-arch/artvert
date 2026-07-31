import Image from "next/image";
import Link from "next/link";
import { products } from "@/data/products";

export default function FeaturedProducts() {
  return (
    <section className="bg-[#f7faf7] py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-16 text-center">
          <h2 className="text-5xl font-black text-gray-900">
            منتجات ArtVert
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            مجموعة مختارة من أشهر منتجاتنا
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {products.slice(0, 8).map((product) => (

            <div
              key={product.id}
              className="overflow-hidden rounded-3xl bg-white shadow-lg transition hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="relative h-72 bg-white">

                <Image
                  src={product.image}
                  alt={product.nameEn}
                  fill
                  className="object-contain p-6"
                />

              </div>

              <div className="p-6">

                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  {product.category}
                </span>

                <h3 className="mt-4 text-2xl font-bold">
                  {product.nameAr}
                </h3>

                <p className="mt-2 text-gray-600">
                  {product.nameEn}
                </p>

                <Link
                  href={`/products/${product.slug}`}
                  className="mt-6 inline-block rounded-xl bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-800"
                >
                  عرض المنتج
                </Link>

              </div>
            </div>

          ))}

        </div>

        <div className="mt-14 text-center">

          <Link
            href="/products"
            className="rounded-xl border-2 border-green-700 px-8 py-4 font-bold text-green-700 transition hover:bg-green-700 hover:text-white"
          >
            عرض جميع المنتجات
          </Link>

        </div>

      </div>
    </section>
  );
}