import { HomeHero } from "@/components/home/HomeHero";
import { getProductCatalog } from "@/lib/products/product-catalog";

export default async function Home() {
  const products = await getProductCatalog().list();
  const featuredSlugs = ["plant-grow", "organic", "artvert-19-19-19", "root-x"];
  const featured = featuredSlugs
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is (typeof products)[number] => Boolean(product));

  return <HomeHero products={featured} />;
}
