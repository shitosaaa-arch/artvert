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

type JsonRecord = Record<
  string,
  Prisma.JsonValue
>;

type RepairSummary = {
  scanned: number;
  changed: number;
  unchanged: number;
  failed: number;
};

const MOJIBAKE_MARKERS = [
  "Ø",
  "Ù",
  "Ã",
  "Â",
  "Ð",
  "Ñ",
  "â€",
  "â€™",
  "ï»¿",
];

function hasMojibake(
  value: string,
) {
  return MOJIBAKE_MARKERS.some(
    (marker) =>
      value.includes(marker),
  );
}

function decodeLatin1AsUtf8(
  value: string,
) {
  try {
    return Buffer.from(
      value,
      "latin1",
    ).toString("utf8");
  } catch {
    return value;
  }
}

function replacementScore(
  value: string,
) {
  const markerCount =
    MOJIBAKE_MARKERS.reduce(
      (count, marker) =>
        count +
        value.split(marker).length -
        1,
      0,
    );

  const replacementCharacters =
    value.split("\uFFFD").length -
    1;

  return (
    markerCount * 10 +
    replacementCharacters * 25
  );
}

function repairString(
  value: string,
) {
  if (!hasMojibake(value)) {
    return value;
  }

  let best = value;
  let bestScore =
    replacementScore(value);

  let current = value;

  for (
    let attempt = 0;
    attempt < 3;
    attempt += 1
  ) {
    const decoded =
      decodeLatin1AsUtf8(
        current,
      );

    if (decoded === current) {
      break;
    }

    const score =
      replacementScore(decoded);

    if (score < bestScore) {
      best = decoded;
      bestScore = score;
    }

    current = decoded;
  }

  return best;
}

function repairJson(
  value: Prisma.JsonValue,
): Prisma.JsonValue {
  if (typeof value === "string") {
    return repairString(value);
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      repairJson(item),
    );
  }

  const repaired:
    JsonRecord = {};

  for (const [key, item] of Object.entries(
    value,
  )) {
    repaired[key] =
      item === undefined
        ? null
        : repairJson(item);
  }

  return repaired;
}

function jsonChanged(
  before: Prisma.JsonValue,
  after: Prisma.JsonValue,
) {
  return (
    JSON.stringify(before) !==
    JSON.stringify(after)
  );
}

async function generateKnowledge(
  prisma: PrismaClient,
) {
  const generator =
    new KnowledgeGenerator(
      createPrismaKnowledgeEntityRepository(
        prisma,
      ),
      new PrismaKnowledgeReleaseRepository(
        prisma,
      ),
      createKnowledgeExportStore(),
    );

  return generator.generate();
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

  const entities =
    await prisma.knowledgeEntity.findMany(
      {
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
        select: {
          id: true,
          type: true,
          slug: true,
          name: true,
          payload: true,
        },
      },
    );

  const summary:
    RepairSummary = {
    scanned: 0,
    changed: 0,
    unchanged: 0,
    failed: 0,
  };

  console.log("");
  console.log(
    "ArtVert knowledge encoding repair",
  );
  console.log(
    `Mode: ${dryRun ? "DRY RUN" : "WRITE"}`,
  );
  console.log(
    `Entities: ${entities.length}`,
  );
  console.log("");

  for (const entity of entities) {
    summary.scanned += 1;

    try {
      const repairedName =
        repairString(
          entity.name,
        );

      const repairedPayload =
        repairJson(
          entity.payload,
        );

      const changed =
        repairedName !==
          entity.name ||
        jsonChanged(
          entity.payload,
          repairedPayload,
        );

      if (!changed) {
        summary.unchanged += 1;
        continue;
      }

      summary.changed += 1;

      console.log(
        `[REPAIRED] ${entity.type} ${entity.slug}`,
      );

      if (!dryRun) {
        await prisma.knowledgeEntity.update(
          {
            where: {
              id: entity.id,
            },
            data: {
              name:
                repairedName,
              payload:
                repairedPayload as Prisma.InputJsonValue,
            },
          },
        );
      }
    } catch (error) {
      summary.failed += 1;

      console.error(
        `[FAILED] ${entity.type} ${entity.slug}:`,
        error instanceof Error
          ? error.message
          : error,
      );
    }
  }

  console.log("");
  console.log(
    "Repair summary",
  );

  console.table({
    scanned:
      summary.scanned,
    changed:
      summary.changed,
    unchanged:
      summary.unchanged,
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
      "Knowledge encoding repair failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrismaClient().$disconnect();
  });
