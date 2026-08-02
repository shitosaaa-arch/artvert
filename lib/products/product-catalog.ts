import type { Prisma } from "@prisma/client";

import { products as legacyProducts } from "@/data/products";
import { getPrismaClient } from "@/lib/db/prisma";

export type CatalogProduct = (typeof legacyProducts)[number];

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

export function productCatalogSource(): "LEGACY" | "DATABASE" {
  const value = process.env.PRODUCT_CATALOG_SOURCE ?? "LEGACY";

  if (value !== "LEGACY" && value !== "DATABASE") {
    throw new Error("PRODUCT_CATALOG_SOURCE must be LEGACY or DATABASE.");
  }

  return value;
}

function toStringArray(value: Prisma.JsonValue, field: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`Product ${field} must be an array of strings.`);
  }

  return value;
}

function mapProduct(product: DatabaseProduct): CatalogProduct {
  const image = product.images[0]?.url;

  if (!image) {
    throw new Error(`Product ${product.entity.slug} has no image.`);
  }

  return {
    id: product.legacyId ?? 0,
    slug: product.entity.slug,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    category: product.category,
    image,
    shortDescription: product.shortDescription,
    description: product.description,
    benefits: toStringArray(product.benefits, "benefits"),
    composition: product.composition,
    dosage: product.dosage,
    packageSize: product.packageSize,
    crops: toStringArray(product.crops, "crops"),
  };
}

export class ProductCatalog {
  async list(): Promise<CatalogProduct[]> {
    if (productCatalogSource() === "LEGACY") {
      return legacyProducts;
    }

    const prisma = getPrismaClient();
    const products = await prisma.product.findMany({
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

    if (products.length !== legacyProducts.length) {
      throw new Error(
        `Product import parity gate failed: expected ${legacyProducts.length}, found ${products.length}.`,
      );
    }

    return products.map(mapProduct);
  }

  async findBySlug(slug: string): Promise<CatalogProduct | null> {
    return (await this.list()).find((product) => product.slug === slug) ?? null;
  }
}

export function getProductCatalog() {
  return new ProductCatalog();
}
