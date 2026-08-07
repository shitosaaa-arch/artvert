import type { Prisma } from "@prisma/client";

import { products as legacyProducts } from "@/data/products";
import { getPrismaClient } from "@/lib/db/prisma";

export type CatalogImageFit =
  | "COVER"
  | "CONTAIN"
  | "FILL"
  | "SCALE_DOWN";

export type CatalogImagePosition =
  | "CENTER"
  | "TOP"
  | "BOTTOM"
  | "LEFT"
  | "RIGHT";

export type CatalogProductImage = {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
  objectFit: CatalogImageFit;
  objectPosition: CatalogImagePosition;
  zoom: number;
  cropX: number;
  cropY: number;
  rotation: number;
  thumbnailUrl: string | null;
  webpUrl: string | null;
  avifUrl: string | null;
  blurDataUrl: string | null;
};

type LegacyProduct =
  (typeof legacyProducts)[number];

export type CatalogProduct =
  LegacyProduct & {
    price: number | null;
    comparePrice: number | null;
    images: CatalogProductImage[];
  };

type DatabaseProduct =
  Prisma.ProductGetPayload<{
    include: {
      entity: true;
      images: {
        orderBy: {
          sortOrder: "asc";
        };
      };
    };
  }>;

export function productCatalogSource():
  | "LEGACY"
  | "DATABASE" {
  const value =
    process.env.PRODUCT_CATALOG_SOURCE ??
    "LEGACY";

  if (
    value !== "LEGACY" &&
    value !== "DATABASE"
  ) {
    throw new Error(
      "PRODUCT_CATALOG_SOURCE must be LEGACY or DATABASE.",
    );
  }

  return value;
}

function toStringArray(
  value: Prisma.JsonValue,
  field: string,
): string[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) => typeof item === "string",
    )
  ) {
    throw new Error(
      `Product ${field} must be an array of strings.`,
    );
  }

  return value;
}

function optionalLegacyNumber(
  product: LegacyProduct,
  field: "price" | "comparePrice",
): number | null {
  const value = (
    product as LegacyProduct &
      Record<string, unknown>
  )[field];

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

function findLegacyProductBySlug(
  slug: string,
): LegacyProduct {
  const legacyProduct =
    legacyProducts.find(
      (product) =>
        product.slug === slug,
    );

  if (!legacyProduct) {
    throw new Error(
      `No legacy product translation fallback found for slug: ${slug}`,
    );
  }

  return legacyProduct;
}

function mapLegacyProduct(
  product: LegacyProduct,
): CatalogProduct {
  return {
    ...product,
    price: optionalLegacyNumber(
      product,
      "price",
    ),
    comparePrice:
      optionalLegacyNumber(
        product,
        "comparePrice",
      ),
    images: [
      {
        id: `legacy-${product.slug}-0`,
        url: product.image,
        alt: product.nameAr,
        sortOrder: 0,
        isPrimary: true,
        objectFit: "CONTAIN",
        objectPosition: "CENTER",
        zoom: 100,
        cropX: 50,
        cropY: 50,
        rotation: 0,
        thumbnailUrl: null,
        webpUrl: null,
        avifUrl: null,
        blurDataUrl: null,
      },
    ],
  };
}

function mapProduct(
  product: DatabaseProduct,
): CatalogProduct {
  const orderedImages = [
    ...product.images,
  ]
    .sort((a, b) => {
      if (
        a.isPrimary !==
        b.isPrimary
      ) {
        return a.isPrimary
          ? -1
          : 1;
      }

      return (
        a.sortOrder -
        b.sortOrder
      );
    })
    .map(
      (
        image,
      ): CatalogProductImage => ({
        id: image.id,
        url:
          image.avifUrl ??
          image.webpUrl ??
          image.url,
        alt: image.alt,
        sortOrder:
          image.sortOrder,
        isPrimary:
          image.isPrimary,
        objectFit:
          image.objectFit,
        objectPosition:
          image.objectPosition,
        zoom: image.zoom,
        cropX: image.cropX,
        cropY: image.cropY,
        rotation:
          image.rotation,
        thumbnailUrl:
          image.thumbnailUrl,
        webpUrl:
          image.webpUrl,
        avifUrl:
          image.avifUrl,
        blurDataUrl:
          image.blurDataUrl,
      }),
    );

  const primaryImage =
    orderedImages.find(
      (image) =>
        image.isPrimary,
    ) ?? orderedImages[0];

  if (!primaryImage) {
    throw new Error(
      `Product ${product.entity.slug} has no image.`,
    );
  }

  const legacyProduct =
    findLegacyProductBySlug(
      product.entity.slug,
    );

  return {
    id:
      product.legacyId ??
      0,
    slug:
      product.entity.slug,
    nameAr:
      product.nameAr,
    nameEn:
      product.nameEn,

    category:
      product.category,
    categoryEn:
      legacyProduct.categoryEn,

    image:
      primaryImage.url,
    images:
      orderedImages,

    shortDescription:
      product.shortDescription,
    shortDescriptionEn:
      legacyProduct.shortDescriptionEn,

    description:
      product.description,
    descriptionEn:
      legacyProduct.descriptionEn,

    benefits:
      toStringArray(
        product.benefits,
        "benefits",
      ),
    benefitsEn:
      legacyProduct.benefitsEn,

    composition:
      product.composition,
    compositionEn:
      legacyProduct.compositionEn,

    dosage:
      product.dosage,
    dosageEn:
      legacyProduct.dosageEn,

    packageSize:
      product.packageSize,

    crops:
      toStringArray(
        product.crops,
        "crops",
      ),
    cropsEn:
      legacyProduct.cropsEn,

    price:
      Number(
        product.price,
      ),
    comparePrice:
      product.comparePrice ===
      null
        ? null
        : Number(
            product.comparePrice,
          ),
  };
}

export class ProductCatalog {
  async list(): Promise<
    CatalogProduct[]
  > {
    if (
      productCatalogSource() ===
      "LEGACY"
    ) {
      return legacyProducts.map(
        mapLegacyProduct,
      );
    }

    const prisma =
      getPrismaClient();

    const products =
      await prisma.product.findMany(
        {
          where: {
            entity: {
              publicationState:
                "PUBLISHED",
            },
          },
          include: {
            entity: true,
            images: {
              orderBy: {
                sortOrder:
                  "asc",
              },
            },
          },
          orderBy: {
            legacyId:
              "asc",
          },
        },
      );

    if (
      products.length !==
      legacyProducts.length
    ) {
      throw new Error(
        `Product import parity gate failed: expected ${legacyProducts.length}, found ${products.length}.`,
      );
    }

    return products.map(
      mapProduct,
    );
  }

  async findBySlug(
    slug: string,
  ): Promise<
    CatalogProduct | null
  > {
    return (
      (
        await this.list()
      ).find(
        (product) =>
          product.slug ===
          slug,
      ) ?? null
    );
  }
}

export function getProductCatalog() {
  return new ProductCatalog();
}
