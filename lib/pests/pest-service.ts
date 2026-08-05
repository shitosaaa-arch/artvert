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
  normalizePestValue,
  validatePestInput,
  type PestInput,
} from "@/schemas/pest";

export class PestService {
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
    input: PestInput,
    actor: {
      id: string;
      role: UserRole;
    },
  ) {
    validatePestInput(input);

    const id = randomUUID();
    const slug = toPlantSlug(
      input.slug || input.name,
    );

    if (!slug) {
      throw new Error(
        "Pest slug is invalid.",
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
            type: "PEST",
            slug,
            name: input.name.trim(),
            payload: {
              name: input.name.trim(),
              slug,
              classification:
                input.classification,
              severity: input.severity,
              economicImpact:
                input.economicImpact,
              scientificName:
                input.scientificName?.trim() ||
                null,
              description:
                input.description?.trim() ||
                null,
              aliases: input.aliases ?? [],
              symptoms: input.symptoms ?? [],
              damagePatterns:
                input.damagePatterns ?? [],
              lifecycleStages:
                input.lifecycleStages ?? [],
            },
            schemaVersion: 1,
            publicationState,
          },
        });

        await transaction.pest.create({
          data: {
            id,
            classification:
              input.classification,
            severity: input.severity,
            economicImpact:
              input.economicImpact,
            scientificName:
              input.scientificName?.trim() ||
              null,
            description:
              input.description?.trim() ||
              null,
            createdByUserId: actor.id,

            aliases: {
              create: (
                input.aliases ?? []
              ).map((value) => ({
                value: value.trim(),
                normalizedValue:
                  normalizePestValue(value),
              })),
            },

            symptoms: {
              create: (
                input.symptoms ?? []
              ).map((value) => ({
                value: value.trim(),
                normalizedValue:
                  normalizePestValue(value),
              })),
            },

            damagePatterns: {
              create: (
                input.damagePatterns ?? []
              ).map((value) => ({
                value: value.trim(),
                normalizedValue:
                  normalizePestValue(value),
              })),
            },

            lifecycleStages: {
              create: (
                input.lifecycleStages ?? []
              ).map((value, sortOrder) => ({
                value: value.trim(),
                normalizedValue:
                  normalizePestValue(value),
                sortOrder,
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
     * نجاح إنشاء الآفة يعتمد على حفظها في قاعدة البيانات.
     * فشل تصدير المعرفة لا يجب أن يحول العملية إلى 400،
     * لأن sync() يسجل حالة FAILED داخل PestKnowledgeSync.
     */
    try {
      await this.sync(id);
    } catch (error) {
      console.error(
        `Pest knowledge sync failed for ${id}:`,
        error,
      );
    }

    return this.prisma.pest.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        entity: true,
        aliases: true,
        symptoms: true,
        damagePatterns: true,
        lifecycleStages: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        plants: true,
        syncState: true,
      },
    });
  }

  async sync(pestId: string) {
    await this.prisma.pestKnowledgeSync.update({
      where: {
        pestId,
      },
      data: {
        status: "PENDING",
        diagnosticCode: null,
      },
    });

    try {
      await this.generate();

      await this.prisma.pestKnowledgeSync.update({
        where: {
          pestId,
        },
        data: {
          status: "SYNCED",
          lastSyncedAt: new Date(),
          diagnosticCode: null,
        },
      });
    } catch (error) {
      await this.prisma.pestKnowledgeSync.update({
        where: {
          pestId,
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
