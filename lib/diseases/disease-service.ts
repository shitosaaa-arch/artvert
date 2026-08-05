import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { createKnowledgeExportStore } from "@/lib/knowledge/export/knowledge-export-store-factory";
import { KnowledgeGenerator } from "@/lib/knowledge/knowledge-generator";
import { createPrismaKnowledgeEntityRepository } from "@/lib/knowledge/prisma/prisma-knowledge-repository";
import { PrismaKnowledgeReleaseRepository } from "@/lib/knowledge/prisma/prisma-knowledge-release-repository";
import { toPlantSlug } from "@/lib/plants/plant-slug";
import {
  normalizeDiseaseValue,
  validateDiseaseInput,
  type DiseaseInput,
} from "@/schemas/disease";

export class DiseaseService {
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
    input: DiseaseInput,
    actor: {
      id: string;
      role: UserRole;
    },
  ) {
    validateDiseaseInput(input);

    const id = randomUUID();
    const slug = toPlantSlug(
      input.slug || input.name,
    );

    if (!slug) {
      throw new Error(
        "Disease slug is invalid.",
      );
    }

    const publicationState =
      actor.role === UserRole.AGRONOMIST
        ? "DRAFT"
        : input.publicationState ?? "DRAFT";

    await this.prisma.$transaction(
      async (transaction) => {
        await transaction.knowledgeEntity.create({
          data: {
            id,
            type: "DISEASE",
            slug,
            name: input.name.trim(),
            payload: {
              name: input.name.trim(),
              slug,
              classification:
                input.classification,
              severity: input.severity,
              scientificName:
                input.scientificName?.trim() ||
                null,
              pathogenGenus:
                input.pathogenGenus?.trim() ||
                null,
              pathogenSpecies:
                input.pathogenSpecies?.trim() ||
                null,
              lifecycle:
                input.lifecycle?.trim() ||
                null,
              aliases: input.aliases ?? [],
              symptoms: input.symptoms ?? [],
              causes: input.causes ?? [],
              plantParts:
                input.plantParts ?? [],
              riskFactors:
                input.riskFactors ?? [],
            },
            schemaVersion: 1,
            publicationState,
          },
        });

        await transaction.disease.create({
          data: {
            id,
            classification:
              input.classification,
            severity: input.severity,
            scientificName:
              input.scientificName?.trim() ||
              null,
            pathogenGenus:
              input.pathogenGenus?.trim() ||
              null,
            pathogenSpecies:
              input.pathogenSpecies?.trim() ||
              null,
            lifecycle:
              input.lifecycle?.trim() ||
              null,
            createdByUserId: actor.id,

            aliases: {
              create: (
                input.aliases ?? []
              ).map((value) => ({
                value,
                normalizedValue:
                  normalizeDiseaseValue(value),
              })),
            },

            symptoms: {
              create: (
                input.symptoms ?? []
              ).map((value) => ({
                value,
                normalizedValue:
                  normalizeDiseaseValue(value),
              })),
            },

            causes: {
              create: (
                input.causes ?? []
              ).map((value) => ({
                value,
                normalizedValue:
                  normalizeDiseaseValue(value),
              })),
            },

            plantParts: {
              create: (
                input.plantParts ?? []
              ).map((value) => ({
                value,
                normalizedValue:
                  normalizeDiseaseValue(value),
              })),
            },

            riskFactors: {
              create: (
                input.riskFactors ?? []
              ).map((value) => ({
                value,
                normalizedValue:
                  normalizeDiseaseValue(value),
              })),
            },

            plants: {
              create: input.plants ?? [],
            },

            syncState: {
              create: {
                status: "PENDING",
              },
            },
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    /*
     * إنشاء المرض يعتبر ناجحًا بمجرد حفظه في قاعدة البيانات.
     * فشل توليد ملف المعرفة لا يجب أن يحوّل عملية الإنشاء إلى 400،
     * لأن sync() يسجل حالة FAILED بالفعل داخل DiseaseKnowledgeSync.
     */
    try {
      await this.sync(id);
    } catch (error) {
      console.error(
        `Disease knowledge sync failed for ${id}:`,
        error,
      );
    }

    return this.prisma.disease.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        entity: true,
        aliases: true,
        symptoms: true,
        causes: true,
        plantParts: true,
        riskFactors: true,
        plants: true,
        syncState: true,
      },
    });
  }

  async sync(diseaseId: string) {
    await this.prisma.diseaseKnowledgeSync.update({
      where: {
        diseaseId,
      },
      data: {
        status: "PENDING",
        diagnosticCode: null,
      },
    });

    try {
      await this.generate();

      await this.prisma.diseaseKnowledgeSync.update({
        where: {
          diseaseId,
        },
        data: {
          status: "SYNCED",
          lastSyncedAt: new Date(),
          diagnosticCode: null,
        },
      });
    } catch (error) {
      await this.prisma.diseaseKnowledgeSync.update({
        where: {
          diseaseId,
        },
        data: {
          status: "FAILED",
          diagnosticCode:
            "KNOWLEDGE_EXPORT_FAILED",
        },
      });

      throw new Error(
        "Knowledge export failed.",
        {
          cause: error,
        },
      );
    }
  }
}
