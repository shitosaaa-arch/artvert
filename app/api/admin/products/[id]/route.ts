import type { KnowledgePublicationState, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import {
  canHardDeleteProduct,
  canManageProduct,
  canPublishProduct,
  canViewProducts,
} from "@/lib/products/product-permissions";
import { ProductRepository } from "@/lib/products/product-repository";
import { normalizeProductValue } from "@/schemas/product";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ProductAliasInput = string | { value: string; locale?: string | null };
type ProductRecommendationInput = Omit<
  Prisma.ProductRecommendationCreateManyInput,
  "productId"
>;

type ProductPatch = {
  slug?: string;
  publicationState?: KnowledgePublicationState;
  aliases?: ProductAliasInput[];
  recommendations?: ProductRecommendationInput[];
  category?: string;
  nameAr?: string;
  nameEn?: string;
  shortDescription?: string;
  description?: string;
  composition?: string;
  dosage?: string;
  packageSize?: string;
  benefits?: Prisma.InputJsonValue;
  crops?: Prisma.InputJsonValue;
};

async function actor() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    throw new Error("Unauthorized");
  }

  return {
    id: session.user.id,
    role: session.user.role as UserRole,
  };
}

function aliasRows(productId: string, aliases: ProductAliasInput[]) {
  return aliases.map((alias) => {
    const value = typeof alias === "string" ? alias : alias.value;
    const locale = typeof alias === "string" ? null : (alias.locale ?? null);

    return {
      productId,
      value,
      locale,
      normalizedValue: normalizeProductValue(value),
    };
  });
}

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const current = await actor();

    if (!canViewProducts(current.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const product = await new ProductRepository().find((await params).id);

    return product
      ? NextResponse.json(product)
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Access denied" }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const current = await actor();
    const { id } = await params;
    const prisma = getPrismaClient();
    const product = await prisma.product.findUnique({
      where: { id },
      include: { entity: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      !canManageProduct(current.role, current.id, {
        createdByUserId: product.createdByUserId,
        publicationState: product.entity.publicationState,
      })
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as ProductPatch;

    if (
      body.publicationState &&
      body.publicationState !== product.entity.publicationState &&
      !canPublishProduct(current.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.knowledgeEntity.update({
        where: { id },
        data: {
          slug: body.slug,
          name: body.nameEn ?? product.nameEn,
          publicationState: body.publicationState,
        },
      });

      if (body.aliases) {
        await tx.productAlias.deleteMany({ where: { productId: id } });
        await tx.productAlias.createMany({
          data: aliasRows(id, body.aliases),
        });
      }

      if (body.recommendations) {
        await tx.productRecommendation.deleteMany({ where: { productId: id } });
        await tx.productRecommendation.createMany({
          data: body.recommendations.map((recommendation) => ({
            ...recommendation,
            productId: id,
          })),
        });
      }

      const data: Prisma.ProductUncheckedUpdateInput = {
        updatedByUserId: current.id,
      };

      if (body.category !== undefined) data.category = body.category;
      if (body.nameAr !== undefined) data.nameAr = body.nameAr;
      if (body.nameEn !== undefined) data.nameEn = body.nameEn;
      if (body.shortDescription !== undefined) data.shortDescription = body.shortDescription;
      if (body.description !== undefined) data.description = body.description;
      if (body.composition !== undefined) data.composition = body.composition;
      if (body.dosage !== undefined) data.dosage = body.dosage;
      if (body.packageSize !== undefined) data.packageSize = body.packageSize;
      if (body.benefits !== undefined) data.benefits = body.benefits;
      if (body.crops !== undefined) data.crops = body.crops;

      return tx.product.update({
        where: { id },
        data,
        include: {
          entity: true,
          aliases: true,
          images: true,
          recommendations: true,
          syncState: true,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Product could not be updated" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const current = await actor();
    const { id } = await params;
    const prisma = getPrismaClient();
    const hard = new URL(request.url).searchParams.get("hard") === "true";
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        entity: true,
        images: true,
        recommendations: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!hard) {
      if (!canPublishProduct(current.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await prisma.knowledgeEntity.update({
        where: { id },
        data: { publicationState: "ARCHIVED" },
      });

      return new NextResponse(null, { status: 204 });
    }

    if (!canHardDeleteProduct(current.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (product.recommendations.length) {
      return NextResponse.json(
        {
          error: "Remove recommendation relationships before permanently deleting this product.",
          impact: {
            recommendations: product.recommendations.length,
            images: product.images.length,
          },
        },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const image of product.images) {
        if (image.ownership !== "MANAGED_BLOB" || !image.storageKey) {
          continue;
        }

        await tx.storageCleanupJob.upsert({
          where: { storageKey: image.storageKey },
          create: { storageKey: image.storageKey },
          update: { status: "PENDING" },
        });
      }

      await tx.product.delete({ where: { id } });
      await tx.knowledgeEntity.delete({ where: { id } });
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Product could not be deleted" },
      { status: 400 },
    );
  }
}
