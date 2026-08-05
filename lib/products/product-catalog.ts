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

type LegacyProduct = (typeof legacyProducts)[number];

export type CatalogProduct = LegacyProduct & {
  images: CatalogProductImage[];
};

type DatabaseProduct = Prisma.ProductGetPayload<{
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

function mapLegacyProduct(
  product: LegacyProduct,
): CatalogProduct {
  return {
    ...product,
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
        cropX: 0,
        cropY: 0,
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
  const orderedImages = [...product.images]
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) {
        return a.isPrimary ? -1 : 1;
      }

      return a.sortOrder - b.sortOrder;
    })
    .map(
      (image): CatalogProductImage => ({
        id: image.id,
        url:
          image.avifUrl ??
          image.webpUrl ??
          image.url,
        alt: image.alt,
        sortOrder: image.sortOrder,
        isPrimary: image.isPrimary,
        objectFit: image.objectFit,
        objectPosition:
          image.objectPosition,
        zoom: image.zoom,
        cropX: image.cropX,
        cropY: image.cropY,
        rotation: image.rotation,
        thumbnailUrl: image.thumbnailUrl,
        webpUrl: image.webpUrl,
        avifUrl: image.avifUrl,
        blurDataUrl: image.blurDataUrl,
      }),
    );

  const primaryImage =
    orderedImages.find(
      (image) => image.isPrimary,
    ) ?? orderedImages[0];

  if (!primaryImage) {
    throw new Error(
      `Product ${product.entity.slug} has no image.`,
    );
  }

  return {
    id: product.legacyId ?? 0,
    slug: product.entity.slug,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    category: product.category,
    image: primaryImage.url,
    images: orderedImages,
    shortDescription:
      product.shortDescription,
    description: product.description,
    benefits: toStringArray(
      product.benefits,
      "benefits",
    ),
    composition: product.composition,
    dosage: product.dosage,
    packageSize: product.packageSize,
    crops: toStringArray(
      product.crops,
      "crops",
    ),
  };
}

export class ProductCatalog {
  async list(): Promise<CatalogProduct[]> {
    if (
      productCatalogSource() === "LEGACY"
    ) {
      return legacyProducts.map(
        mapLegacyProduct,
      );
    }

    const prisma = getPrismaClient();

    const products =
      await prisma.product.findMany({
        where: {
          entity: {
            publicationState: "PUBLISHED",
          },
        },
        include: {
          entity: true,
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
        orderBy: {
          legacyId: "asc",
        },
      });

    if (
      products.length !==
      legacyProducts.length
    ) {
      throw new Error(
        `Product import parity gate failed: expected ${legacyProducts.length}, found ${products.length}.`,
      );
    }

    return products.map(mapProduct);
  }

  async findBySlug(
    slug: string,
  ): Promise<CatalogProduct | null> {
    return (
      (await this.list()).find(
        (product) =>
          product.slug === slug,
      ) ?? null
    );
  }
}

export function getProductCatalog() {
  return new ProductCatalog();
}
