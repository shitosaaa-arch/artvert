import type {
  Metadata,
} from "next";
import { notFound } from "next/navigation";
import ProductDetailsClient from "../ProductDetailsClient";
import {
  getProductCatalog,
} from "../../../../lib/products/product-catalog";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

function toNumber(
  value:
    | string
    | number
    | null
    | undefined,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } =
    await params;

  const product =
    await getProductCatalog().findBySlug(
      slug,
    );

  return {
    title: product
      ? `${product.nameAr} | ArtVert Egypt`
      : "ArtVert Egypt",

    description:
      product?.description ||
      "حلول زراعية متكاملة",
  };
}

export default async function ProductPage({
  params,
}: Props) {
  const { slug } = await params;

  const product =
    await getProductCatalog().findBySlug(
      slug,
    );

  if (!product) {
    notFound();
  }

  const primaryImage =
    product.images.find(
      (image) => image.isPrimary,
    ) ?? product.images[0];

  const price = toNumber(
    (product as any).price,
  );

  const comparePrice = toNumber(
    (product as any).comparePrice,
  );

  const hasDiscount =
    price !== null &&
    comparePrice !== null &&
    comparePrice > price;

  const discount = hasDiscount
    ? Math.round(
        ((comparePrice - price) /
          comparePrice) *
          100,
      )
    : 0;

  return (
    <ProductDetailsClient
      product={{
        id: product.id,
        slug: product.slug,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        image: product.image,
        category: product.category,
        categoryEn: product.categoryEn,
        description: product.description,
        descriptionEn: product.descriptionEn,
        benefits: product.benefits,
        benefitsEn: product.benefitsEn,
        composition: product.composition,
        compositionEn: product.compositionEn,
        dosage: product.dosage,
        dosageEn: product.dosageEn,
        packageSize: product.packageSize,
        crops: product.crops,
        cropsEn: product.cropsEn,
        images: product.images,
      }}
      price={price}
      comparePrice={comparePrice}
      discount={discount}
      hasDiscount={hasDiscount}
      primaryImageUrl={
        primaryImage?.url ??
        product.image
      }
    />
  );
}
