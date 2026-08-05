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
  normalizeDeficiencyValue,
  validateDeficiencyInput,
  type DeficiencyInput,
} from "@/schemas/deficiency";

function toJsonObject(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function buildKnowledgePayload(
  input: DeficiencyInput,
  slug: string,
): Prisma.InputJsonValue {
  return {
    nutrientCode:
      input.nutrientCode
        .trim()
        .toUpperCase(),
    nutrientNameAr:
      input.nutrientNameAr.trim(),
    nutrientNameEn:
      input.nutrientNameEn.trim(),
    slug,
    scientificName:
      input.scientificName?.trim() ||
      null,
    classification:
      input.classification,
    mobility: input.mobility,
    description:
      input.description?.trim() ||
      null,
    soilContext:
      input.soilContext ?? null,
    phContext:
      input.phContext ?? null,
    aliases: input.aliases ?? [],
    symptoms:
      (input.symptoms ?? []).map(
        (symptom) => ({
          value: symptom.value.trim(),
          locations:
            symptom.locations ?? [],
        }),
      ),
    visualPatterns:
      input.visualPatterns ?? [],
    causes: input.causes ?? [],
    aggravatingConditions:
      input.aggravatingConditions ?? [],
  } as Prisma.InputJsonValue;
}

export class DeficiencyService {
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
    input: DeficiencyInput,
    actor: {
      id: string;
      role: UserRole;
    },
  ) {
    validateDeficiencyInput(input);

    const id = randomUUID();

    const slug = toPlantSlug(
      input.slug ||
        input.nutrientNameEn,
    );

    if (!slug) {
      throw new Error(
        "Deficiency slug is invalid.",
      );
    }

    const publicationState =
      actor.role ===
      UserRole.AGRONOMIST
        ? "DRAFT"
        : input.publicationState ??
          "DRAFT";

    const knowledgePayload =
      buildKnowledgePayload(
        input,
        slug,
      );

    await this.prisma.$transaction(
      async (transaction) => {
        await transaction.knowledgeEntity.create(
          {
            data: {
              id,
              type: "DEFICIENCY",
              slug,
              name:
                input.nutrientNameEn.trim(),
              payload:
                knowledgePayload,
              schemaVersion: 1,
              publicationState,
            },
          },
        );

        await transaction.deficiency.create(
          {
            data: {
              id,
              nutrientCode:
                input.nutrientCode
                  .trim()
                  .toUpperCase(),
              nutrientNameAr:
                input.nutrientNameAr.trim(),
              nutrientNameEn:
                input.nutrientNameEn.trim(),
              scientificName:
                input.scientificName?.trim() ||
                null,
              classification:
                input.classification,
              mobility: input.mobility,
              description:
                input.description?.trim() ||
                null,
              soilContext:
                toJsonObject(
                  input.soilContext,
                ),
              phContext:
                toJsonObject(
                  input.phContext,
                ),
              createdByUserId:
                actor.id,

              aliases: {
                create: (
                  input.aliases ?? []
                ).map((value) => ({
                  value: value.trim(),
                  normalizedValue:
                    normalizeDeficiencyValue(
                      value,
                    ),
                })),
              },

              symptoms: {
                create: (
                  input.symptoms ?? []
                ).map((symptom) => ({
                  value:
                    symptom.value.trim(),
                  normalizedValue:
                    normalizeDeficiencyValue(
                      symptom.value,
                    ),
                  locations:
                    symptom.locations ??
                    [],
                })),
              },

              visualPatterns: {
                create: (
                  input.visualPatterns ??
                  []
                ).map((value) => ({
                  value: value.trim(),
                  normalizedValue:
                    normalizeDeficiencyValue(
                      value,
                    ),
                })),
              },

              causes: {
                create: (
                  input.causes ?? []
                ).map((value) => ({
                  value: value.trim(),
                  normalizedValue:
                    normalizeDeficiencyValue(
                      value,
                    ),
                })),
              },

              aggravatingConditions: {
                create: (
                  input.aggravatingConditions ??
                  []
                ).map((value) => ({
                  value: value.trim(),
                  normalizedValue:
                    normalizeDeficiencyValue(
                      value,
                    ),
                })),
              },

              plants: {
                create: (
                  input.plants ?? []
                ).map((plant) => ({
                  plantId:
                    plant.plantId,
                  susceptibility:
                    plant.susceptibility,
                  relationshipType:
                    plant.relationshipType,
                  notes:
                    plant.notes?.trim() ||
                    null,
                  soilContext:
                    toJsonObject(
                      plant.soilContext,
                    ),
                  phContext:
                    toJsonObject(
                      plant.phContext,
                    ),
                })),
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
        timeout: 20000,
      },
    );

    /*
     * حفظ سجل نقص العنصر في PostgreSQL هو نجاح العملية الأساسية.
     * فشل توليد ملف المعرفة لا يجب أن يحول نتيجة الإنشاء إلى 400.
     * sync() يسجل حالة FAILED بالفعل داخل DeficiencyKnowledgeSync.
     */
    try {
      await this.sync(id);
    } catch (error) {
      console.error(
        `Deficiency knowledge sync failed for ${id}:`,
        error,
      );
    }

    return this.prisma.deficiency.findUniqueOrThrow(
      {
        where: {
          id,
        },
        include: {
          entity: true,
          aliases: true,
          symptoms: true,
          visualPatterns: true,
          causes: true,
          aggravatingConditions:
            true,
          plants: true,
          syncState: true,
        },
      },
    );
  }

  async sync(
    deficiencyId: string,
  ) {
    await this.prisma.deficiencyKnowledgeSync.update(
      {
        where: {
          deficiencyId,
        },
        data: {
          status: "PENDING",
          diagnosticCode: null,
        },
      },
    );

    try {
      await this.generate();

      await this.prisma.deficiencyKnowledgeSync.update(
        {
          where: {
            deficiencyId,
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
      await this.prisma.deficiencyKnowledgeSync.update(
        {
          where: {
            deficiencyId,
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
