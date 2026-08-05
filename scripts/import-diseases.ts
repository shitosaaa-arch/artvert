import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";

import {
  DiseaseClassification,
  DiseaseSeverity,
  KnowledgePublicationState,
  Prisma,
  UserRole,
} from "@prisma/client";
import dotenv from "dotenv";
import * as XLSX from "xlsx";

dotenv.config({
  path: path.join(process.cwd(), ".env.local"),
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
import { toPlantSlug } from "@/lib/plants/plant-slug";
import {
  normalizeDiseaseValue,
  validateDiseaseInput,
  type DiseaseInput,
} from "@/schemas/disease";

type SpreadsheetRow =
  Record<string, unknown>;

type PlantRelationInput = {
  plantSlug: string;
  susceptibility:
    | "LOW"
    | "MEDIUM"
    | "HIGH";
  relationshipType:
    | "HOST"
    | "COMMON_HOST"
    | "OCCASIONAL_HOST";
  notes?: string;
};

type ParsedDiseaseRow = {
  rowNumber: number;
  input: DiseaseInput;
  plantRelations: PlantRelationInput[];
};

type ImportFailure = {
  rowNumber: number;
  diseaseName: string;
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
  "diseases.xlsx",
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

const CLASSIFICATION_ALIASES: Record<
  string,
  DiseaseClassification
> = {
  FUNGAL:
    DiseaseClassification.FUNGAL,
  fungal:
    DiseaseClassification.FUNGAL,
  "فطري":
    DiseaseClassification.FUNGAL,

  BACTERIAL:
    DiseaseClassification.BACTERIAL,
  bacterial:
    DiseaseClassification.BACTERIAL,
  "بكتيري":
    DiseaseClassification.BACTERIAL,

  VIRAL:
    DiseaseClassification.VIRAL,
  viral:
    DiseaseClassification.VIRAL,
  "فيروسي":
    DiseaseClassification.VIRAL,

  OOMYCETE:
    DiseaseClassification.OOMYCETE,
  oomycete:
    DiseaseClassification.OOMYCETE,
  "فطر بيضي":
    DiseaseClassification.OOMYCETE,
  "أوميستي":
    DiseaseClassification.OOMYCETE,

  PHYSIOLOGICAL_DISORDER:
    DiseaseClassification.PHYSIOLOGICAL_DISORDER,
  physiological_disorder:
    DiseaseClassification.PHYSIOLOGICAL_DISORDER,
  "اضطراب فسيولوجي":
    DiseaseClassification.PHYSIOLOGICAL_DISORDER,
  "مرض فسيولوجي":
    DiseaseClassification.PHYSIOLOGICAL_DISORDER,
};

const SEVERITY_ALIASES: Record<
  string,
  DiseaseSeverity
> = {
  LOW: DiseaseSeverity.LOW,
  low: DiseaseSeverity.LOW,
  "منخفض": DiseaseSeverity.LOW,

  MODERATE:
    DiseaseSeverity.MODERATE,
  moderate:
    DiseaseSeverity.MODERATE,
  "متوسط":
    DiseaseSeverity.MODERATE,

  HIGH: DiseaseSeverity.HIGH,
  high: DiseaseSeverity.HIGH,
  "مرتفع": DiseaseSeverity.HIGH,
  "عالي": DiseaseSeverity.HIGH,

  CRITICAL:
    DiseaseSeverity.CRITICAL,
  critical:
    DiseaseSeverity.CRITICAL,
  "حرج": DiseaseSeverity.CRITICAL,
  "خطير": DiseaseSeverity.CRITICAL,
};

const PUBLICATION_STATE_ALIASES: Record<
  string,
  KnowledgePublicationState
> = {
  DRAFT:
    KnowledgePublicationState.DRAFT,
  draft:
    KnowledgePublicationState.DRAFT,
  "مسودة":
    KnowledgePublicationState.DRAFT,

  PUBLISHED:
    KnowledgePublicationState.PUBLISHED,
  published:
    KnowledgePublicationState.PUBLISHED,
  "منشور":
    KnowledgePublicationState.PUBLISHED,
  "منشورة":
    KnowledgePublicationState.PUBLISHED,

  ARCHIVED:
    KnowledgePublicationState.ARCHIVED,
  archived:
    KnowledgePublicationState.ARCHIVED,
  "مؤرشف":
    KnowledgePublicationState.ARCHIVED,
  "مؤرشفة":
    KnowledgePublicationState.ARCHIVED,
};

const SUSCEPTIBILITY_VALUES = new Set([
  "LOW",
  "MEDIUM",
  "HIGH",
]);

const RELATIONSHIP_VALUES = new Set([
  "HOST",
  "COMMON_HOST",
  "OCCASIONAL_HOST",
]);

function readArgument(name: string) {
  const prefix = `${name}=`;

  const argument = process.argv
    .slice(2)
    .find((value) =>
      value.startsWith(prefix),
    );

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

function readCell(
  row: SpreadsheetRow,
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

function parseClassification(
  value: unknown,
) {
  const cleaned = requiredString(
    value,
    "Disease classification",
  );

  const classification =
    CLASSIFICATION_ALIASES[
      cleaned
    ] ??
    CLASSIFICATION_ALIASES[
      cleaned.toLowerCase()
    ];

  if (!classification) {
    throw new Error(
      `Unsupported disease classification: ${cleaned}`,
    );
  }

  return classification;
}

function parseSeverity(value: unknown) {
  const cleaned = requiredString(
    value,
    "Disease severity",
  );

  const severity =
    SEVERITY_ALIASES[cleaned] ??
    SEVERITY_ALIASES[
      cleaned.toLowerCase()
    ];

  if (!severity) {
    throw new Error(
      `Unsupported disease severity: ${cleaned}`,
    );
  }

  return severity;
}

function parsePublicationState(
  value: unknown,
) {
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

function parseStringList(
  value: unknown,
) {
  const cleaned = optionalString(value);

  if (!cleaned) {
    return [];
  }

  const unique = new Map<
    string,
    string
  >();

  for (const item of cleaned
    .split(/[|،;\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)) {
    const normalized =
      normalizeDiseaseValue(item);

    if (normalized) {
      unique.set(normalized, item);
    }
  }

  return Array.from(
    unique.values(),
  );
}

function parsePlantRelations(
  value: unknown,
): PlantRelationInput[] {
  const cleaned = optionalString(value);

  if (!cleaned) {
    return [];
  }

  const relations: PlantRelationInput[] =
    [];

  const seen = new Set<string>();

  const entries = cleaned
    .split(/[|\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const parts = entry
      .split(":")
      .map((part) => part.trim());

    const plantSlug = toPlantSlug(
      parts[0] ?? "",
    );

    if (!plantSlug) {
      throw new Error(
        `Plant relation slug is invalid: ${entry}`,
      );
    }

    if (seen.has(plantSlug)) {
      continue;
    }

    const susceptibility = (
      parts[1]?.toUpperCase() ||
      "HIGH"
    ) as PlantRelationInput["susceptibility"];

    const relationshipType = (
      parts[2]?.toUpperCase() ||
      "COMMON_HOST"
    ) as PlantRelationInput["relationshipType"];

    if (
      !SUSCEPTIBILITY_VALUES.has(
        susceptibility,
      )
    ) {
      throw new Error(
        `Plant susceptibility is invalid for ${plantSlug}: ${susceptibility}`,
      );
    }

    if (
      !RELATIONSHIP_VALUES.has(
        relationshipType,
      )
    ) {
      throw new Error(
        `Plant relationship type is invalid for ${plantSlug}: ${relationshipType}`,
      );
    }

    const notes =
      parts.slice(3).join(":").trim() ||
      undefined;

    seen.add(plantSlug);

    relations.push({
      plantSlug,
      susceptibility,
      relationshipType,
      notes,
    });
  }

  return relations;
}

function parseRow(
  row: SpreadsheetRow,
  rowNumber: number,
): ParsedDiseaseRow | null {
  const enabled = parseBoolean(
    readCell(row, [
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
    readCell(row, [
      "name",
      "nameAr",
      "arabicName",
      "diseaseName",
      "الاسم",
      "اسم المرض",
      "الاسم العربي",
    ]),
    "Disease name",
  );

  const plantRelations =
    parsePlantRelations(
      readCell(row, [
        "plants",
        "plantRelations",
        "hosts",
        "النباتات",
        "العوائل",
      ]),
    );

  const input: DiseaseInput = {
    name,
    slug: optionalString(
      readCell(row, [
        "slug",
        "الرابط",
        "المعرف",
      ]),
    ),
    classification:
      parseClassification(
        readCell(row, [
          "classification",
          "type",
          "التصنيف",
          "النوع",
        ]),
      ),
    severity: parseSeverity(
      readCell(row, [
        "severity",
        "درجة الخطورة",
        "الخطورة",
      ]),
    ),
    scientificName:
      optionalString(
        readCell(row, [
          "scientificName",
          "scientific",
          "الاسم العلمي",
        ]),
      ),
    pathogenGenus:
      optionalString(
        readCell(row, [
          "pathogenGenus",
          "genus",
          "جنس المسبب",
        ]),
      ),
    pathogenSpecies:
      optionalString(
        readCell(row, [
          "pathogenSpecies",
          "species",
          "نوع المسبب",
        ]),
      ),
    lifecycle: optionalString(
      readCell(row, [
        "lifecycle",
        "دورة الحياة",
      ]),
    ),
    aliases: parseStringList(
      readCell(row, [
        "aliases",
        "alternativeNames",
        "synonyms",
        "الأسماء البديلة",
      ]),
    ),
    symptoms: parseStringList(
      readCell(row, [
        "symptoms",
        "الأعراض",
      ]),
    ),
    causes: parseStringList(
      readCell(row, [
        "causes",
        "المسببات",
        "الأسباب",
      ]),
    ),
    plantParts: parseStringList(
      readCell(row, [
        "plantParts",
        "affectedParts",
        "الأجزاء المصابة",
      ]),
    ),
    riskFactors: parseStringList(
      readCell(row, [
        "riskFactors",
        "conditions",
        "عوامل الخطورة",
        "الظروف المساعدة",
      ]),
    ),
    publicationState:
      parsePublicationState(
        readCell(row, [
          "publicationState",
          "state",
          "status",
          "حالة النشر",
          "الحالة",
        ]),
      ),
  };

  validateDiseaseInput(input);

  return {
    rowNumber,
    input,
    plantRelations,
  };
}

function loadRows(
  inputPath: string,
): ParsedDiseaseRow[] {
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
        "diseases",
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
      "The import workbook contains no disease rows.",
    );
  }

  const headerRow = matrix[0].map(
    (value) =>
      normalizeHeader(
        String(value ?? ""),
      ),
  );

  const hasNameColumn = [
    "name",
    "nameAr",
    "arabicName",
    "diseaseName",
    "الاسم",
    "اسم المرض",
    "الاسم العربي",
  ]
    .map(normalizeHeader)
    .some((header) =>
      headerRow.includes(header),
    );

  if (!hasNameColumn) {
    throw new Error(
      `The Diseases sheet header row is invalid. Found headers: ${headerRow.join(", ")}`,
    );
  }

  const parsedRows: ParsedDiseaseRow[] =
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

    const row: SpreadsheetRow = {};

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

      row[header] =
        values[columnIndex] ?? "";
    }

    const parsed = parseRow(
      row,
      index + 1,
    );

    if (parsed) {
      parsedRows.push(parsed);
    }
  }

  if (parsedRows.length === 0) {
    throw new Error(
      "The import file contains no enabled disease rows.",
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
  input: DiseaseInput,
  slug: string,
): Prisma.InputJsonValue {
  return {
    name: input.name.trim(),
    slug,
    classification:
      input.classification,
    severity: input.severity,
    scientificName:
      input.scientificName?.trim() ??
      null,
    pathogenGenus:
      input.pathogenGenus?.trim() ??
      null,
    pathogenSpecies:
      input.pathogenSpecies?.trim() ??
      null,
    lifecycle:
      input.lifecycle?.trim() ??
      null,
    aliases: input.aliases ?? [],
    symptoms: input.symptoms ?? [],
    causes: input.causes ?? [],
    plantParts:
      input.plantParts ?? [],
    riskFactors:
      input.riskFactors ?? [],
  };
}

function normalizedRecords(
  values: string[],
) {
  return Array.from(
    new Map(
      values
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => [
          normalizeDiseaseValue(value),
          {
            value,
            normalizedValue:
              normalizeDiseaseValue(value),
          },
        ]),
    ).values(),
  );
}

async function resolvePlantLinks(
  relations: PlantRelationInput[],
) {
  if (relations.length === 0) {
    return [];
  }

  const prisma = getPrismaClient();

  const plants =
    await prisma.knowledgeEntity.findMany(
      {
        where: {
          type: "PLANT",
          slug: {
            in: relations.map(
              (relation) =>
                relation.plantSlug,
            ),
          },
          plant: {
            isNot: null,
          },
        },
        select: {
          id: true,
          slug: true,
        },
      },
    );

  const bySlug = new Map(
    plants.map((plant) => [
      plant.slug,
      plant.id,
    ]),
  );

  const missing = relations
    .filter(
      (relation) =>
        !bySlug.has(
          relation.plantSlug,
        ),
    )
    .map(
      (relation) =>
        relation.plantSlug,
    );

  if (missing.length > 0) {
    throw new Error(
      `Linked plants were not found: ${missing.join(", ")}`,
    );
  }

  return relations.map(
    (relation) => ({
      plantId:
        bySlug.get(
          relation.plantSlug,
        )!,
      susceptibility:
        relation.susceptibility,
      relationshipType:
        relation.relationshipType,
      notes:
        relation.notes?.trim() ||
        null,
    }),
  );
}

async function importDisease(
  row: ParsedDiseaseRow,
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
      "Disease slug is invalid.",
    );
  }

  const plantLinks =
    await resolvePlantLinks(
      row.plantRelations,
    );

  const existingEntity =
    await prisma.knowledgeEntity.findUnique(
      {
        where: {
          type_slug: {
            type: "DISEASE",
            slug,
          },
        },
        include: {
          disease: true,
        },
      },
    );

  if (dryRun) {
    return existingEntity
      ? "updated"
      : "created";
  }

  const aliases =
    normalizedRecords(
      input.aliases ?? [],
    );

  const symptoms =
    normalizedRecords(
      input.symptoms ?? [],
    );

  const causes =
    normalizedRecords(
      input.causes ?? [],
    );

  const plantParts =
    normalizedRecords(
      input.plantParts ?? [],
    );

  const riskFactors =
    normalizedRecords(
      input.riskFactors ?? [],
    );

  if (existingEntity) {
    if (!existingEntity.disease) {
      throw new Error(
        `Knowledge entity ${slug} exists but is not linked to a disease.`,
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
              schemaVersion: 1,
              publicationState:
                input.publicationState ??
                KnowledgePublicationState.PUBLISHED,
            },
          },
        );

        await transaction.disease.update(
          {
            where: {
              id: existingEntity.id,
            },
            data: {
              classification:
                input.classification,
              severity:
                input.severity,
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
              updatedByUserId:
                actorId,

              aliases: {
                deleteMany: {},
                create: aliases,
              },

              symptoms: {
                deleteMany: {},
                create: symptoms,
              },

              causes: {
                deleteMany: {},
                create: causes,
              },

              plantParts: {
                deleteMany: {},
                create: plantParts,
              },

              riskFactors: {
                deleteMany: {},
                create: riskFactors,
              },

              plants: {
                deleteMany: {},
                create: plantLinks,
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
          },
        );
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
            type: "DISEASE",
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

      await transaction.disease.create({
        data: {
          id,
          classification:
            input.classification,
          severity:
            input.severity,
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
          createdByUserId:
            actorId,

          aliases: {
            create: aliases,
          },

          symptoms: {
            create: symptoms,
          },

          causes: {
            create: causes,
          },

          plantParts: {
            create: plantParts,
          },

          riskFactors: {
            create: riskFactors,
          },

          plants: {
            create: plantLinks,
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
    "ArtVert disease bulk import",
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
        await importDisease(
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
        diseaseName:
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
      "Disease import failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    const prisma = getPrismaClient();

    await prisma.$disconnect();
  });
