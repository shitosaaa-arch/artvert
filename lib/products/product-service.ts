import { randomUUID } from "node:crypto";

import {
  Prisma,
  type PrismaClient,
} from "@prisma/client";

import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { createKnowledgeExportStore } from "@/lib/knowledge/export/knowledge-export-store-factory";
import { KnowledgeGenerator } from "@/lib/knowledge/knowledge-generator";
import { createPrismaKnowledgeEntityRepository } from "@/lib/knowledge/prisma/prisma-knowledge-repository";
import { PrismaKnowledgeReleaseRepository } from "@/lib/knowledge/prisma/prisma-knowledge-release-repository";
import { toPlantSlug } from "@/lib/plants/plant-slug";
import {
  normalizeProductValue,
  validateProductInput,
  type ProductInput,
} from "@/schemas/product";

function buildProductPayload(
  input: ProductInput,
  slug: string,
): Prisma.InputJsonValue {
  return {
    slug,
    category: input.category.trim(),
    nameAr: input.nameAr.trim(),
    nameEn: input.nameEn.trim(),
    shortDescription:
      input.shortDescription.trim(),
    description:
      input.description.trim(),
    composition:
      input.composition.trim(),
    dosage: input.dosage.trim(),
    packageSize:
      input.packageSize.trim(),

    benefits: input.benefits.map(
      (value) => value.trim(),
    ),

    crops: input.crops.map(
      (value) => value.trim(),
    ),

    aliases: (
      input.aliases ?? []
    ).map((alias) => ({
      value: alias.value.trim(),
      locale:
        alias.locale?.trim() ||
        null,
    })),

    recommendations: (
      input.recommendations ?? []
    ).map((recommendation) => ({
      targetType:
        recommendation.targetType,

      plantId:
        recommendation.plantId ??
        null,

      diseaseId:
        recommendation.diseaseId ??
        null,

      pestId:
        recommendation.pestId ??
        null,

      deficiencyId:
        recommendation.deficiencyId ??
        null,

      state:
        recommendation.state ??
        "ACTIVE",

      priority:
        recommendation.priority ??
        "NORMAL",

      usageContext:
        recommendation.usageContext?.trim() ||
        null,

      compatibility:
        recommendation.compatibility?.trim() ||
        null,

      contraindications:
        recommendation.contraindications?.trim() ||
        null,

      notes:
        recommendation.notes?.trim() ||
        null,
    })),
  } as Prisma.InputJsonValue;
}

export class ProductService {
  constructor(
    private readonly prisma: PrismaClient =
      getPrismaClient(),

    private readonly generate = () =>
      new KnowledgeGenerator(
        createPrismaKnowledgeEntityRepository(
          this.prisma,
        ),
        new PrismaKnowledgeReleaseRepository(
          this.prisma,
        ),
        createKnowledgeExportStore(),
      ).generate(),
  ) {}

  async create(
    input: ProductInput,
    actor: {
      id: string;
      role: UserRole;
    },
  ) {
    validateProductInput(input);

    const id = randomUUID();

    const slug = toPlantSlug(
      input.slug ||
        input.nameEn,
    );

    if (!slug) {
      throw new Error(
        "Product slug is invalid.",
      );
    }

    const publicationState =
      actor.role ===
      UserRole.AGRONOMIST
        ? "DRAFT"
        : input.publicationState ??
          "DRAFT";

    const knowledgePayload =
      buildProductPayload(
        input,
        slug,
      );

    await this.prisma.$transaction(
      async (transaction) => {
        await transaction.knowledgeEntity.create(
          {
            data: {
              id,
              type: "PRODUCT",
              slug,
              name:
                input.nameEn.trim(),
              payload:
                knowledgePayload,
              schemaVersion: 1,
              publicationState,
            },
          },
        );

        await transaction.product.create(
          {
            data: {
              id,
              category:
                input.category.trim(),
              nameAr:
                input.nameAr.trim(),
              nameEn:
                input.nameEn.trim(),
              shortDescription:
                input.shortDescription.trim(),
              description:
                input.description.trim(),
              composition:
                input.composition.trim(),
              dosage:
                input.dosage.trim(),
              packageSize:
                input.packageSize.trim(),

              benefits:
                input.benefits.map(
                  (value) =>
                    value.trim(),
                ),

              crops:
                input.crops.map(
                  (value) =>
                    value.trim(),
                ),

              createdByUserId:
                actor.id,

              aliases: {
                create: (
                  input.aliases ?? []
                ).map((alias) => ({
                  value:
                    alias.value.trim(),
                  locale:
                    alias.locale?.trim() ||
                    null,
                  normalizedValue:
                    normalizeProductValue(
                      alias.value,
                    ),
                })),
              },

              recommendations: {
                create: (
                  input.recommendations ??
                  []
                ).map(
                  (
                    recommendation,
                  ) => ({
                    targetType:
                      recommendation.targetType,

                    plantId:
                      recommendation.plantId,

                    diseaseId:
                      recommendation.diseaseId,

                    pestId:
                      recommendation.pestId,

                    deficiencyId:
                      recommendation.deficiencyId,

                    state:
                      recommendation.state ??
                      "ACTIVE",

                    priority:
                      recommendation.priority ??
                      "NORMAL",

                    usageContext:
                      recommendation.usageContext?.trim() ||
                      null,

                    compatibility:
                      recommendation.compatibility?.trim() ||
                      null,

                    contraindications:
                      recommendation.contraindications?.trim() ||
                      null,

                    notes:
                      recommendation.notes?.trim() ||
                      null,
                  }),
                ),
              },

              syncState: {
                create: {
                  status: "PENDING",
                },
              },
            },
          },
        );
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );

    /*
     * إنشاء المنتج ينجح عند حفظه في قاعدة البيانات.
     * فشل تصدير المعرفة لا يلغي المنتج المحفوظ.
     */
    try {
      await this.sync(id);
    } catch (error) {
      console.error(
        `Product knowledge sync failed for ${id}:`,
        error,
      );
    }

    return this.prisma.product.findUniqueOrThrow(
      {
        where: {
          id,
        },
        include: {
          entity: true,
          aliases: true,
          recommendations: true,
          syncState: true,
        },
      },
    );
  }

  async sync(productId: string) {
    await this.prisma.productKnowledgeSync.update(
      {
        where: {
          productId,
        },
        data: {
          status: "PENDING",
          diagnosticCode: null,
        },
      },
    );

    try {
      await this.generate();

      await this.prisma.productKnowledgeSync.update(
        {
          where: {
            productId,
          },
          data: {
            status: "SYNCED",
            lastSyncedAt:
              new Date(),
            diagnosticCode: null,
          },
        },
      );
    } catch (error) {
      await this.prisma.productKnowledgeSync.update(
        {
          where: {
            productId,
          },
          data: {
            status: "FAILED",
            diagnosticCode:
              "KNOWLEDGE_EXPORT_FAILED",
          },
        },
      );

      throw new Error(
        "Knowledge export failed.",
        {
          cause: error,
        },
      );
    }
  }
}