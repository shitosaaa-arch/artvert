import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";

import {
  KnowledgePublicationState,
  PlantCategory,
  Prisma,
  UserRole,
} from "@prisma/client";
import dotenv from "dotenv";
import * as XLSX from "xlsx";

dotenv.config({
  path: path.join(process.cwd(), ".env.local"),
});

dotenv.config({
  path: path.join(process.cwd(), "prisma", ".env"),
  override: false,
});

import { getPrismaClient } from "@/lib/db/prisma";
import { createKnowledgeExportStore } from "@/lib/knowledge/export/knowledge-export-store-factory";
import { KnowledgeGenerator } from "@/lib/knowledge/knowledge-generator";
import { createPrismaKnowledgeEntityRepository } from "@/lib/knowledge/prisma/prisma-knowledge-repository";
import { PrismaKnowledgeReleaseRepository } from "@/lib/knowledge/prisma/prisma-knowledge-release-repository";
import { toPlantSlug } from "@/lib/plants/plant-slug";
import {
  normalizePlantAlias,
  validatePlantInput,
  type PlantInput,
} from "@/schemas/plant";

type SpreadsheetRow = Record<string, unknown>;

type ParsedPlantRow = {
  rowNumber: number;
  input: PlantInput;
};

type ImportFailure = {
  rowNumber: number;
  plantName: string;
  message: string;
};

type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  failures: ImportFailure[];
};

const DEFAULT_INPUT_FILE = path.join(
  process.cwd(),
  "data",
  "import",
  "plants.xlsx",
);

const TRUE_VALUES = new Set([
  "1",
  "true",
  "yes",
  "y",
  "نعم",
]);

const FALSE_VALUES = new Set([
  "0",
  "false",
  "no",
  "n",
  "لا",
]);

const CATEGORY_ALIASES: Record<string, PlantCategory> = {
  CROP: PlantCategory.CROP,
  crop: PlantCategory.CROP,
  "محصول": PlantCategory.CROP,
  "محصول زراعي": PlantCategory.CROP,

  HOME_PLANT: PlantCategory.HOME_PLANT,
  home_plant: PlantCategory.HOME_PLANT,
  "نبات منزلي": PlantCategory.HOME_PLANT,
  "نباتات منزلية": PlantCategory.HOME_PLANT,

  ORNAMENTAL: PlantCategory.ORNAMENTAL,
  ornamental: PlantCategory.ORNAMENTAL,
  "نبات زينة": PlantCategory.ORNAMENTAL,
  "نباتات زينة": PlantCategory.ORNAMENTAL,
};

const PUBLICATION_STATE_ALIASES: Record<
  string,
  KnowledgePublicationState
> = {
  DRAFT: KnowledgePublicationState.DRAFT,
  draft: KnowledgePublicationState.DRAFT,
  "مسودة": KnowledgePublicationState.DRAFT,

  PUBLISHED: KnowledgePublicationState.PUBLISHED,
  published: KnowledgePublicationState.PUBLISHED,
  "منشور": KnowledgePublicationState.PUBLISHED,
  "منشورة": KnowledgePublicationState.PUBLISHED,

  ARCHIVED: KnowledgePublicationState.ARCHIVED,
  archived: KnowledgePublicationState.ARCHIVED,
  "مؤرشف": KnowledgePublicationState.ARCHIVED,
  "مؤرشفة": KnowledgePublicationState.ARCHIVED,
};

function readArgument(name: string) {
  const prefix = `${name}=`;

  const argument = process.argv
    .slice(2)
    .find((value) => value.startsWith(prefix));

  return argument
    ? argument.slice(prefix.length).trim()
    : null;
}

function hasFlag(name: string) {
  return process.argv
    .slice(2)
    .includes(name);
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function buildNormalizedRow(
  row: SpreadsheetRow,
) {
  return Object.fromEntries(
    Object.entries(row).map(
      ([key, value]) => [
        normalizeHeader(key),
        value,
      ],
    ),
  );
}

function readCell(
  row: Record<string, unknown>,
  aliases: string[],
) {
  for (const alias of aliases) {
    const value =
      row[normalizeHeader(alias)];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return undefined;
}

function optionalString(value: unknown) {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  const cleaned = String(value).trim();

  return cleaned || undefined;
}

function requiredString(
  value: unknown,
  fieldName: string,
) {
  const cleaned = optionalString(value);

  if (!cleaned) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  return cleaned;
}

function parseBoolean(
  value: unknown,
  defaultValue: boolean,
) {
  const normalized =
    optionalString(value)?.toLowerCase();

  if (!normalized) {
    return defaultValue;
  }

  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  throw new Error(
    `Boolean value is invalid: ${String(value)}`,
  );
}

function parseCategory(
  value: unknown,
): PlantCategory {
  const cleaned = requiredString(
    value,
    "Plant category",
  );

  const category =
    CATEGORY_ALIASES[cleaned] ??
    CATEGORY_ALIASES[
      cleaned.toLowerCase()
    ];

  if (!category) {
    throw new Error(
      `Unsupported plant category: ${cleaned}`,
    );
  }

  return category;
}

function parsePublicationState(
  value: unknown,
): KnowledgePublicationState {
  const cleaned =
    optionalString(value) ??
    "PUBLISHED";

  const publicationState =
    PUBLICATION_STATE_ALIASES[
      cleaned
    ] ??
    PUBLICATION_STATE_ALIASES[
      cleaned.toLowerCase()
    ];

  if (!publicationState) {
    throw new Error(
      `Unsupported publication state: ${cleaned}`,
    );
  }

  return publicationState;
}

function parseAliases(
  value: unknown,
) {
  const cleaned = optionalString(value);

  if (!cleaned) {
    return [];
  }

  const values = cleaned
    .split(/[|،,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = new Map<
    string,
    string
  >();

  for (const alias of values) {
    const normalized =
      normalizePlantAlias(alias);

    if (normalized) {
      unique.set(normalized, alias);
    }
  }

  return Array.from(
    unique.values(),
  ).map((alias) => ({
    value: alias,
    locale: "ar-EG",
  }));
}

function parseRow(
  row: SpreadsheetRow,
  rowNumber: number,
): ParsedPlantRow | null {
  const normalizedRow =
    buildNormalizedRow(row);

  const enabled = parseBoolean(
    readCell(normalizedRow, [
      "enabled",
      "active",
      "import",
      "استيراد",
      "مفعل",
    ]),
    true,
  );

  if (!enabled) {
    return null;
  }

  const name = requiredString(
    readCell(normalizedRow, [
      "name",
      "nameAr",
      "arabicName",
      "plantName",
      "الاسم",
      "الاسم العربي",
      "اسم النبات",
    ]),
    "Plant name",
  );

  const input: PlantInput = {
    name,
    slug: optionalString(
      readCell(normalizedRow, [
        "slug",
        "الرابط",
        "المعرف",
      ]),
    ),
    category: parseCategory(
      readCell(normalizedRow, [
        "category",
        "type",
        "التصنيف",
        "النوع",
      ]),
    ),
    scientificName:
      optionalString(
        readCell(normalizedRow, [
          "scientificName",
          "latinName",
          "botanicalName",
          "الاسم العلمي",
        ]),
      ),
    description:
      optionalString(
        readCell(normalizedRow, [
          "description",
          "الوصف",
        ]),
      ),
    aliases: parseAliases(
      readCell(normalizedRow, [
        "aliases",
        "alternativeNames",
        "synonyms",
        "الأسماء البديلة",
        "اسماء بديلة",
      ]),
    ),
    publicationState:
      parsePublicationState(
        readCell(normalizedRow, [
          "publicationState",
          "state",
          "status",
          "حالة النشر",
          "الحالة",
        ]),
      ),
  };

  validatePlantInput(input);

  return {
    rowNumber,
    input,
  };
}

function loadRows(
  inputPath: string,
): ParsedPlantRow[] {
  if (!existsSync(inputPath)) {
    throw new Error(
      `Import file was not found: ${inputPath}`,
    );
  }

  const workbook =
    XLSX.readFile(inputPath, {
      cellDates: false,
      raw: false,
    });

  const sheetName =
    workbook.SheetNames.find(
      (name) =>
        name.trim().toLowerCase() ===
        "plants",
    ) ?? workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error(
      "The import workbook has no sheets.",
    );
  }

  const worksheet =
    workbook.Sheets[sheetName];

  const matrix =
    XLSX.utils.sheet_to_json<unknown[]>(
      worksheet,
      {
        header: 1,
        defval: "",
        blankrows: false,
        raw: false,
      },
    );

  if (matrix.length < 2) {
    throw new Error(
      "The import workbook contains no plant rows.",
    );
  }

  const headerRow = matrix[0].map(
    (value) =>
      normalizeHeader(
        String(value ?? ""),
      ),
  );

  const requiredNameHeaders = [
    "name",
    "nameAr",
    "arabicName",
    "plantName",
    "الاسم",
    "الاسم العربي",
    "اسم النبات",
  ].map(normalizeHeader);

  const hasNameColumn =
    requiredNameHeaders.some(
      (header) =>
        headerRow.includes(header),
    );

  if (!hasNameColumn) {
    throw new Error(
      `The Plants sheet header row is invalid. Found headers: ${headerRow.join(", ")}`,
    );
  }

  const parsedRows: ParsedPlantRow[] =
    [];

  for (
    let index = 1;
    index < matrix.length;
    index += 1
  ) {
    const values = matrix[index];

    const hasAnyValue = values.some(
      (value) =>
        value !== undefined &&
        value !== null &&
        String(value).trim() !== "",
    );

    if (!hasAnyValue) {
      continue;
    }

    const rawRow: SpreadsheetRow = {};

    for (
      let columnIndex = 0;
      columnIndex < headerRow.length;
      columnIndex += 1
    ) {
      const header =
        headerRow[columnIndex];

      if (!header) {
        continue;
      }

      rawRow[header] =
        values[columnIndex] ?? "";
    }

    const parsed = parseRow(
      rawRow,
      index + 1,
    );

    if (parsed) {
      parsedRows.push(parsed);
    }
  }

  if (parsedRows.length === 0) {
    throw new Error(
      "The import file contains no enabled plant rows.",
    );
  }

  return parsedRows;
}

async function resolveActor() {
  const prisma = getPrismaClient();

  const requestedEmail =
    process.env.IMPORT_ACTOR_EMAIL
      ?.trim()
      .toLowerCase();

  if (requestedEmail) {
    const requestedUser =
      await prisma.user.findFirst({
        where: {
          email: requestedEmail,
          active: true,
        },
      });

    if (!requestedUser) {
      throw new Error(
        `IMPORT_ACTOR_EMAIL does not match an active user: ${requestedEmail}`,
      );
    }

    return requestedUser;
  }

  const user =
    await prisma.user.findFirst({
      where: {
        active: true,
        role: {
          in: [
            UserRole.SUPER_ADMIN,
            UserRole.ADMIN,
            UserRole.AGRONOMIST,
          ],
        },
      },
      orderBy: [
        {
          role: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

  if (!user) {
    throw new Error(
      "No active staff user is available. Create an admin first or set IMPORT_ACTOR_EMAIL.",
    );
  }

  return user;
}

function buildKnowledgePayload(
  input: PlantInput,
  slug: string,
): Prisma.InputJsonValue {
  return {
    name: input.name.trim(),
    slug,
    category: input.category,
    scientificName:
      input.scientificName?.trim() ??
      null,
    description:
      input.description?.trim() ??
      null,
    aliases: (
      input.aliases ?? []
    ).map((alias) => ({
      value: alias.value.trim(),
      locale:
        alias.locale?.trim() ??
        null,
    })),
  };
}

async function importPlant(
  row: ParsedPlantRow,
  actorId: string,
  dryRun: boolean,
) {
  const prisma = getPrismaClient();
  const { input } = row;

  const slug = toPlantSlug(
    input.slug || input.name,
  );

  if (!slug) {
    throw new Error(
      "Plant slug is invalid.",
    );
  }

  const normalizedAliases =
    Array.from(
      new Map(
        (input.aliases ?? []).map(
          (alias) => [
            normalizePlantAlias(
              alias.value,
            ),
            {
              value:
                alias.value.trim(),
              normalizedValue:
                normalizePlantAlias(
                  alias.value,
                ),
              locale:
                alias.locale?.trim() ??
                null,
            },
          ],
        ),
      ).values(),
    ).filter(
      (alias) =>
        alias.normalizedValue,
    );

  const existingEntity =
    await prisma.knowledgeEntity.findUnique(
      {
        where: {
          type_slug: {
            type: "PLANT",
            slug,
          },
        },
        include: {
          plant: true,
        },
      },
    );

  if (dryRun) {
    return existingEntity
      ? "updated"
      : "created";
  }

  if (existingEntity) {
    if (!existingEntity.plant) {
      throw new Error(
        `Knowledge entity ${slug} exists but is not linked to a plant.`,
      );
    }

    await prisma.$transaction(
      async (transaction) => {
        await transaction.knowledgeEntity.update(
          {
            where: {
              id: existingEntity.id,
            },
            data: {
              name:
                input.name.trim(),
              payload:
                buildKnowledgePayload(
                  input,
                  slug,
                ),
              publicationState:
                input.publicationState ??
                KnowledgePublicationState.PUBLISHED,
              schemaVersion: 1,
            },
          },
        );

        await transaction.plant.update({
          where: {
            id: existingEntity.id,
          },
          data: {
            category:
              input.category,
            scientificName:
              input.scientificName?.trim() ||
              null,
            description:
              input.description?.trim() ||
              null,
            updatedByUserId:
              actorId,
            aliases: {
              deleteMany: {},
              create:
                normalizedAliases,
            },
            syncState: {
              upsert: {
                create: {
                  status:
                    "PENDING",
                },
                update: {
                  status:
                    "PENDING",
                  diagnosticCode:
                    null,
                },
              },
            },
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );

    return "updated";
  }

  const id = randomUUID();

  await prisma.$transaction(
    async (transaction) => {
      await transaction.knowledgeEntity.create(
        {
          data: {
            id,
            type: "PLANT",
            slug,
            name:
              input.name.trim(),
            payload:
              buildKnowledgePayload(
                input,
                slug,
              ),
            schemaVersion: 1,
            publicationState:
              input.publicationState ??
              KnowledgePublicationState.PUBLISHED,
          },
        },
      );

      await transaction.plant.create({
        data: {
          id,
          category:
            input.category,
          scientificName:
            input.scientificName?.trim() ||
            null,
          description:
            input.description?.trim() ||
            null,
          createdByUserId:
            actorId,
          aliases: {
            create:
              normalizedAliases,
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
      timeout: 30000,
    },
  );

  return "created";
}

async function generateKnowledge() {
  const prisma = getPrismaClient();

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
  const inputArgument =
    readArgument("--file");

  const inputPath = path.resolve(
    inputArgument ||
      DEFAULT_INPUT_FILE,
  );

  const dryRun =
    hasFlag("--dry-run");

  const shouldGenerate =
    hasFlag("--generate");

  const rows = loadRows(inputPath);
  const actor = await resolveActor();

  const summary: ImportSummary = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  console.log("");
  console.log(
    "ArtVert plant bulk import",
  );
  console.log(
    `File: ${inputPath}`,
  );
  console.log(
    `Rows: ${rows.length}`,
  );
  console.log(
    `Actor: ${actor.email} (${actor.role})`,
  );
  console.log(
    `Mode: ${dryRun ? "DRY RUN" : "WRITE"}`,
  );
  console.log("");

  for (const row of rows) {
    try {
      const action =
        await importPlant(
          row,
          actor.id,
          dryRun,
        );

      summary[action] += 1;

      console.log(
        `[${action.toUpperCase()}] row ${row.rowNumber}: ${row.input.name}`,
      );
    } catch (error) {
      summary.failed += 1;

      const message =
        error instanceof Error
          ? error.message
          : "Unknown import error.";

      summary.failures.push({
        rowNumber:
          row.rowNumber,
        plantName:
          row.input.name,
        message,
      });

      console.error(
        `[FAILED] row ${row.rowNumber}: ${row.input.name} — ${message}`,
      );
    }
  }

  console.log("");
  console.log(
    "Import summary",
  );
  console.table({
    created: summary.created,
    updated: summary.updated,
    skipped: summary.skipped,
    failed: summary.failed,
  });

  if (
    summary.failures.length > 0
  ) {
    console.log("");
    console.log(
      "Failed rows",
    );
    console.table(
      summary.failures,
    );
  }

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
      await generateKnowledge();

    console.log(
      `Knowledge release activated: ${release.version}`,
    );
    console.log(
      `Content checksum: ${release.contentChecksum}`,
    );
  } else if (
    shouldGenerate &&
    summary.failed > 0
  ) {
    console.log("");
    console.log(
      "Knowledge generation was skipped because some rows failed.",
    );
  }

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(
      "Plant import failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    const prisma = getPrismaClient();

    await prisma.$disconnect();
  });
