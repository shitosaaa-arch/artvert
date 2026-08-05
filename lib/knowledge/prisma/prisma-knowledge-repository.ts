import type {
  Prisma,
  PrismaClient,
} from "@prisma/client";

import type {
  KnowledgeEntityQuery,
  KnowledgeEntityRepository,
} from "@/lib/knowledge/knowledge-repository";
import { getPrismaClient } from "@/lib/db/prisma";
import {
  validateKnowledgeEntityEnvelope,
  type KnowledgeEntityEnvelope,
  type KnowledgeEntityInput,
} from "@/schemas/knowledge-entity-envelope";

function toEnvelope(entity: {
  id: string;
  type: string;
  slug: string;
  name: string;
  payload: Prisma.JsonValue;
  schemaVersion: number;
  publicationState: string;
  createdAt: Date;
  updatedAt: Date;
}): KnowledgeEntityEnvelope {
  const envelope: KnowledgeEntityEnvelope = {
    id: entity.id,
    type:
      entity.type as KnowledgeEntityEnvelope["type"],
    slug: entity.slug,
    name: entity.name,
    payload:
      entity.payload as KnowledgeEntityEnvelope["payload"],
    schemaVersion: entity.schemaVersion,
    publicationState:
      entity.publicationState as KnowledgeEntityEnvelope["publicationState"],
    createdAt:
      entity.createdAt.toISOString(),
    updatedAt:
      entity.updatedAt.toISOString(),
  };

  validateKnowledgeEntityEnvelope(
    envelope,
  );

  return envelope;
}

export function createPrismaKnowledgeEntityRepository(
  prisma: PrismaClient =
    getPrismaClient(),
): KnowledgeEntityRepository {
  return {
    async findById(id) {
      const entity =
        await prisma.knowledgeEntity.findUnique(
          {
            where: {
              id,
            },
          },
        );

      return entity
        ? toEnvelope(entity)
        : null;
    },

    async findByTypeAndSlug(
      type,
      slug,
    ) {
      const entity =
        await prisma.knowledgeEntity.findUnique(
          {
            where: {
              type_slug: {
                type,
                slug,
              },
            },
          },
        );

      return entity
        ? toEnvelope(entity)
        : null;
    },

    async list(
      query: KnowledgeEntityQuery = {},
    ) {
      const entities =
        await prisma.knowledgeEntity.findMany(
          {
            where: {
              ...(query.type
                ? {
                    type:
                      query.type,
                  }
                : {}),
              ...(query.publishedOnly
                ? {
                    publicationState:
                      "PUBLISHED",
                  }
                : {}),
            },
            orderBy: [
              {
                type: "asc",
              },
              {
                slug: "asc",
              },
              {
                id: "asc",
              },
            ],
          },
        );

      return entities.map(
        toEnvelope,
      );
    },

    async materializePublishedSnapshot() {
      return prisma.$transaction(
        async (tx) => {
          const entities =
            await tx.knowledgeEntity.findMany(
              {
                where: {
                  publicationState:
                    "PUBLISHED",
                },
                orderBy: [
                  {
                    type: "asc",
                  },
                  {
                    slug: "asc",
                  },
                  {
                    id: "asc",
                  },
                ],
              },
            );

          return entities.map(
            toEnvelope,
          );
        },
        {
          isolationLevel:
            "RepeatableRead",
          maxWait: 10000,
          timeout: 30000,
        },
      );
    },

    async create(
      input: KnowledgeEntityInput,
    ) {
      validateKnowledgeEntityEnvelope(
        input,
      );

      const entity =
        await prisma.knowledgeEntity.create(
          {
            data: {
              ...input,
              payload:
                input.payload as Prisma.InputJsonValue,
              createdAt:
                input.createdAt
                  ? new Date(
                      input.createdAt,
                    )
                  : undefined,
              updatedAt:
                input.updatedAt
                  ? new Date(
                      input.updatedAt,
                    )
                  : undefined,
            },
          },
        );

      return toEnvelope(entity);
    },

    async update(id, input) {
      validateKnowledgeEntityEnvelope(
        input,
      );

      const entity =
        await prisma.knowledgeEntity.update(
          {
            where: {
              id,
            },
            data: {
              ...input,
              payload:
                input.payload as Prisma.InputJsonValue,
              createdAt:
                input.createdAt
                  ? new Date(
                      input.createdAt,
                    )
                  : undefined,
              updatedAt:
                input.updatedAt
                  ? new Date(
                      input.updatedAt,
                    )
                  : undefined,
            },
          },
        );

      return toEnvelope(entity);
    },

    async delete(id) {
      await prisma.knowledgeEntity.delete(
        {
          where: {
            id,
          },
        },
      );
    },
  };
}