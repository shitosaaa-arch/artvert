import path from "node:path";

import {
  Prisma,
  type PrismaClient,
} from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({
  path: path.join(
    process.cwd(),
    ".env.local",
  ),
});

dotenv.config({
  path: path.join(
    process.cwd(),
    "prisma",
    ".env",
  ),
  override: false,
});

import { getPrismaClient } from "@/lib/db/prisma";
import { createKnowledgeExportStore } from "@/lib/knowledge/export/knowledge-export-store-factory";
import { KnowledgeGenerator } from "@/lib/knowledge/knowledge-generator";
import { createPrismaKnowledgeEntityRepository } from "@/lib/knowledge/prisma/prisma-knowledge-repository";
import { PrismaKnowledgeReleaseRepository } from "@/lib/knowledge/prisma/prisma-knowledge-release-repository";

type JsonRecord = Record<string, Prisma.JsonValue>;

type Summary = {
  diseases: number;
  pests: number;
  deficiencies: number;
  failed: number;
};

function asRecord(
  value: Prisma.JsonValue,
): JsonRecord {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as JsonRecord;
  }

  return {};
}

function relationshipPayload(
  rows: Array<{
    plantId: string;
    susceptibility: string;
    relationshipType: string;
    notes: string | null;
  }>,
) {
  return rows.map((row) => ({
    plantId: row.plantId,
    susceptibility:
      row.susceptibility,
    relationshipType:
      row.relationshipType,
    notes: row.notes,
  }));
}

async function backfillDiseases(
  prisma: PrismaClient,
  dryRun: boolean,
) {
  const diseases =
    await prisma.disease.findMany({
      include: {
        entity: true,
        plants: true,
      },
    });

  let updated = 0;

  for (const disease of diseases) {
    try {
      const payload = {
        ...asRecord(
          disease.entity.payload,
        ),
        plants:
          relationshipPayload(
            disease.plants,
          ),
        plantIds:
          disease.plants.map(
            (row) =>
              row.plantId,
          ),
      } as Prisma.InputJsonValue;

      if (!dryRun) {
        await prisma.knowledgeEntity.update({
          where: {
            id: disease.id,
          },
          data: {
            payload,
          },
        });
      }

      updated += 1;
    } catch (error) {
      console.error(
        `[DISEASE FAILED] ${disease.id}:`,
        error instanceof Error
          ? error.message
          : error,
      );

      throw error;
    }
  }

  return updated;
}

async function backfillPests(
  prisma: PrismaClient,
  dryRun: boolean,
) {
  const pests =
    await prisma.pest.findMany({
      include: {
        entity: true,
        plants: true,
      },
    });

  let updated = 0;

  for (const pest of pests) {
    try {
      const payload = {
        ...asRecord(
          pest.entity.payload,
        ),
        plants:
          relationshipPayload(
            pest.plants,
          ),
        plantIds:
          pest.plants.map(
            (row) =>
              row.plantId,
          ),
      } as Prisma.InputJsonValue;

      if (!dryRun) {
        await prisma.knowledgeEntity.update({
          where: {
            id: pest.id,
          },
          data: {
            payload,
          },
        });
      }

      updated += 1;
    } catch (error) {
      console.error(
        `[PEST FAILED] ${pest.id}:`,
        error instanceof Error
          ? error.message
          : error,
      );

      throw error;
    }
  }

  return updated;
}

async function backfillDeficiencies(
  prisma: PrismaClient,
  dryRun: boolean,
) {
  const deficiencies =
    await prisma.deficiency.findMany({
      include: {
        entity: true,
        plants: true,
      },
    });

  let updated = 0;

  for (const deficiency of deficiencies) {
    try {
      const payload = {
        ...asRecord(
          deficiency.entity.payload,
        ),
        plants:
          relationshipPayload(
            deficiency.plants,
          ),
        plantIds:
          deficiency.plants.map(
            (row) =>
              row.plantId,
          ),
      } as Prisma.InputJsonValue;

      if (!dryRun) {
        await prisma.knowledgeEntity.update({
          where: {
            id: deficiency.id,
          },
          data: {
            payload,
          },
        });
      }

      updated += 1;
    } catch (error) {
      console.error(
        `[DEFICIENCY FAILED] ${deficiency.id}:`,
        error instanceof Error
          ? error.message
          : error,
      );

      throw error;
    }
  }

  return updated;
}

async function generateKnowledge(
  prisma: PrismaClient,
) {
  return new KnowledgeGenerator(
    createPrismaKnowledgeEntityRepository(
      prisma,
    ),
    new PrismaKnowledgeReleaseRepository(
      prisma,
    ),
    createKnowledgeExportStore(),
  ).generate();
}

async function main() {
  const dryRun =
    process.argv.includes(
      "--dry-run",
    );

  const shouldGenerate =
    process.argv.includes(
      "--generate",
    );

  const prisma =
    getPrismaClient();

  const summary: Summary = {
    diseases: 0,
    pests: 0,
    deficiencies: 0,
    failed: 0,
  };

  console.log("");
  console.log(
    "ArtVert knowledge plant-link backfill",
  );
  console.log(
    `Mode: ${dryRun ? "DRY RUN" : "WRITE"}`,
  );
  console.log("");

  try {
    summary.diseases =
      await backfillDiseases(
        prisma,
        dryRun,
      );

    summary.pests =
      await backfillPests(
        prisma,
        dryRun,
      );

    summary.deficiencies =
      await backfillDeficiencies(
        prisma,
        dryRun,
      );
  } catch {
    summary.failed += 1;
  }

  console.table({
    diseases:
      summary.diseases,
    pests:
      summary.pests,
    deficiencies:
      summary.deficiencies,
    failed:
      summary.failed,
  });

  if (
    !dryRun &&
    shouldGenerate &&
    summary.failed === 0
  ) {
    console.log("");
    console.log(
      "Generating knowledge release...",
    );

    const release =
      await generateKnowledge(
        prisma,
      );

    console.log(
      `Knowledge release activated: ${release.version}`,
    );

    console.log(
      `Content checksum: ${release.contentChecksum}`,
    );
  }

  if (
    summary.failed > 0
  ) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(
      "Knowledge plant-link backfill failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrismaClient().$disconnect();
  });
