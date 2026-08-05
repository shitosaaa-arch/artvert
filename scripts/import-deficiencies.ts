import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";

import {
  KnowledgePublicationState,
  NutrientClassification,
  NutrientMobility,
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
  normalizeDeficiencyValue,
  validateDeficiencyInput,
  type DeficiencyInput,
} from "@/schemas/deficiency";

type SpreadsheetRow =
  Record<string, unknown>;

type PlantRelationInput = {
  plantSlug: string;
  susceptibility:
    | "LOW"
    | "MEDIUM"
    | "HIGH";
  relationshipType:
    | "COMMON"
    | "SUSCEPTIBLE"
    | "OCCASIONAL";
  notes?: string;
  soilContext?: Record<
    string,
    unknown
  >;
  phContext?: Record<
    string,
    unknown
  >;
};

type ParsedDeficiencyRow = {
  rowNumber: number;
  input: DeficiencyInput;
  plantRelations: PlantRelationInput[];
};

type ImportFailure = {
  rowNumber: number;
  nutrientCode: string;
  nutrientNameEn: string;
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
  "deficiencies.xlsx",
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
  NutrientClassification
> = {
  MACRONUTRIENT:
    NutrientClassification.MACRONUTRIENT,
  macronutrient:
    NutrientClassification.MACRONUTRIENT,
  "عنصر كبرى":
    NutrientClassification.MACRONUTRIENT,
  "عنصر كبير":
    NutrientClassification.MACRONUTRIENT,

  SECONDARY_NUTRIENT:
    NutrientClassification.SECONDARY_NUTRIENT,
  secondary_nutrient:
    NutrientClassification.SECONDARY_NUTRIENT,
  "عنصر ثانوي":
    NutrientClassification.SECONDARY_NUTRIENT,

  MICRONUTRIENT:
    NutrientClassification.MICRONUTRIENT,
  micronutrient:
    NutrientClassification.MICRONUTRIENT,
  "عنصر صغرى":
    NutrientClassification.MICRONUTRIENT,
  "عنصر دقيق":
    NutrientClassification.MICRONUTRIENT,

  BENEFICIAL_ELEMENT:
    NutrientClassification.BENEFICIAL_ELEMENT,
  beneficial_element:
    NutrientClassification.BENEFICIAL_ELEMENT,
  "عنصر نافع":
    NutrientClassification.BENEFICIAL_ELEMENT,

  OTHER:
    NutrientClassification.OTHER,
  other:
    NutrientClassification.OTHER,
  "أخرى":
    NutrientClassification.OTHER,
};

const MOBILITY_ALIASES: Record<
  string,
  NutrientMobility
> = {
  MOBILE:
    NutrientMobility.MOBILE,
  mobile:
    NutrientMobility.MOBILE,
  "متحرك":
    NutrientMobility.MOBILE,

  IMMOBILE:
    NutrientMobility.IMMOBILE,
  immobile:
    NutrientMobility.IMMOBILE,
  "غير متحرك":
    NutrientMobility.IMMOBILE,

  CONTEXT_DEPENDENT:
    NutrientMobility.CONTEXT_DEPENDENT,
  context_dependent:
    NutrientMobility.CONTEXT_DEPENDENT,
  "يعتمد على الظروف":
    NutrientMobility.CONTEXT_DEPENDENT,

  UNKNOWN:
    NutrientMobility.UNKNOWN,
  unknown:
    NutrientMobility.UNKNOWN,
  "غير معروف":
    NutrientMobility.UNKNOWN,
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

const SUSCEPTIBILITY_VALUES =
  new Set([
    "LOW",
    "MEDIUM",
    "HIGH",
  ]);

const RELATIONSHIP_VALUES =
  new Set([
    "COMMON",
    "SUSCEPTIBLE",
    "OCCASIONAL",
  ]);

function readArgument(name: string) {
  const prefix = `${name}=`;

  const argument = process.argv
    .slice(2)
    .find((value) =>
      value.startsWith(prefix),
    );

  return argument
    ? argument
        .slice(prefix.length)
        .trim()
    : null;
}

function hasFlag(name: string) {
  return process.argv
    .slice(2)
    .includes(name);
}

function normalizeHeader(
  value: string,
) {
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

function optionalString(
  value: unknown,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  const cleaned =
    String(value).trim();

  return cleaned || undefined;
}

function requiredString(
  value: unknown,
  fieldName: string,
) {
  const cleaned =
    optionalString(value);

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

  if (
    TRUE_VALUES.has(normalized)
  ) {
    return true;
  }

  if (
    FALSE_VALUES.has(normalized)
  ) {
    return false;
  }

  throw new Error(
    `Boolean value is invalid: ${String(value)}`,
  );
}

function parseClassification(
  value: unknown,
) {
  const cleaned =
    requiredString(
      value,
      "Nutrient classification",
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
      `Unsupported nutrient classification: ${cleaned}`,
    );
  }

  return classification;
}

function parseMobility(
  value: unknown,
) {
  const cleaned =
    requiredString(
      value,
      "Nutrient mobility",
    );

  const mobility =
    MOBILITY_ALIASES[
      cleaned
    ] ??
    MOBILITY_ALIASES[
      cleaned.toLowerCase()
    ];

  if (!mobility) {
    throw new Error(
      `Unsupported nutrient mobility: ${cleaned}`,
    );
  }

  return mobility;
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
  const cleaned =
    optionalString(value);

  if (!cleaned) {
    return [];
  }

  const unique = new Map<
    string,
    string
  >();

  for (const item of cleaned
    .split(/[|،;\n]+/)
    .map((entry) =>
      entry.trim(),
    )
    .filter(Boolean)) {
    const normalized =
      normalizeDeficiencyValue(
        item,
      );

    if (normalized) {
      unique.set(
        normalized,
        item,
      );
    }
  }

  return Array.from(
    unique.values(),
  );
}

function parseJsonObject(
  value: unknown,
  fieldName: string,
):
  | Record<string, unknown>
  | undefined {
  const cleaned =
    optionalString(value);

  if (!cleaned) {
    return undefined;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `${fieldName} must contain valid JSON.`,
    );
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      `${fieldName} must be a JSON object.`,
    );
  }

  return parsed as Record<
    string,
    unknown
  >;
}

function parseLocations(
  value: string,
) {
  return Array.from(
    new Set(
      value
        .split(/[,+/]+/)
        .map((location) =>
          location.trim(),
        )
        .filter(Boolean),
    ),
  );
}

function parseSymptoms(
  value: unknown,
): NonNullable<
  DeficiencyInput["symptoms"]
> {
  const cleaned =
    optionalString(value);

  if (!cleaned) {
    return [];
  }

  const result: NonNullable<
    DeficiencyInput["symptoms"]
  > = [];

  const seen =
    new Set<string>();

  for (const entry of cleaned
    .split(/[|\n]+/)
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean)) {
    const separatorIndex =
      entry.indexOf("::");

    const symptomValue =
      (
        separatorIndex >= 0
          ? entry.slice(
              0,
              separatorIndex,
            )
          : entry
      ).trim();

    const locationsValue =
      separatorIndex >= 0
        ? entry
            .slice(
              separatorIndex + 2,
            )
            .trim()
        : "";

    const normalized =
      normalizeDeficiencyValue(
        symptomValue,
      );

    if (
      !normalized ||
      seen.has(normalized)
    ) {
      continue;
    }

    seen.add(normalized);

    result.push({
      value: symptomValue,
      locations:
        locationsValue
          ? parseLocations(
              locationsValue,
            )
          : [],
    });
  }

  return result;
}

function parsePlantRelations(
  value: unknown,
): PlantRelationInput[] {
  const cleaned =
    optionalString(value);

  if (!cleaned) {
    return [];
  }

  const relations:
    PlantRelationInput[] = [];

  const seen =
    new Set<string>();

  const entries = cleaned
    .split(/[|\n]+/)
    .map((entry) =>
      entry.trim(),
    )
    .filter(Boolean);

  for (const entry of entries) {
    const parts = entry
      .split("::")
      .map((part) =>
        part.trim(),
      );

    const plantSlug =
      toPlantSlug(
        parts[0] ?? "",
      );

    if (!plantSlug) {
      throw new Error(
        `Plant relation slug is invalid: ${entry}`,
      );
    }

    if (
      seen.has(plantSlug)
    ) {
      continue;
    }

    const susceptibility =
      (
        parts[1]
          ?.toUpperCase() ||
        "HIGH"
      ) as PlantRelationInput["susceptibility"];

    const relationshipType =
      (
        parts[2]
          ?.toUpperCase() ||
        "COMMON"
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
      parts[3]?.trim() ||
      undefined;

    const soilContext =
      parts[4]
        ? parseJsonObject(
            parts[4],
            `Plant soil context for ${plantSlug}`,
          )
        : undefined;

    const phContext =
      parts[5]
        ? parseJsonObject(
            parts[5],
            `Plant pH context for ${plantSlug}`,
          )
        : undefined;

    seen.add(plantSlug);

    relations.push({
      plantSlug,
      susceptibility,
      relationshipType,
      notes,
      soilContext,
      phContext,
    });
  }

  return relations;
}

function parseRow(
  row: SpreadsheetRow,
  rowNumber: number,
): ParsedDeficiencyRow | null {
  const enabled =
    parseBoolean(
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

  const nutrientCode =
    requiredString(
      readCell(row, [
        "nutrientCode",
        "code",
        "elementCode",
        "كود العنصر",
        "الكود",
      ]),
      "Nutrient code",
    )
      .trim()
      .toUpperCase();

  const nutrientNameAr =
    requiredString(
      readCell(row, [
        "nutrientNameAr",
        "nameAr",
        "arabicName",
        "الاسم العربي",
        "اسم العنصر عربي",
      ]),
      "Arabic nutrient name",
    );

  const nutrientNameEn =
    requiredString(
      readCell(row, [
        "nutrientNameEn",
        "nameEn",
        "englishName",
        "الاسم الإنجليزي",
        "اسم العنصر انجليزي",
      ]),
      "English nutrient name",
    );

  const plantRelations =
    parsePlantRelations(
      readCell(row, [
        "plants",
        "plantRelations",
        "النباتات",
        "العوائل",
      ]),
    );

  const input: DeficiencyInput = {
    nutrientCode,
    nutrientNameAr,
    nutrientNameEn,
    slug: optionalString(
      readCell(row, [
        "slug",
        "الرابط",
        "المعرف",
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
    classification:
      parseClassification(
        readCell(row, [
          "classification",
          "type",
          "التصنيف",
          "النوع",
        ]),
      ),
    mobility: parseMobility(
      readCell(row, [
        "mobility",
        "الحركة",
        "قابلية الحركة",
      ]),
    ),
    description:
      optionalString(
        readCell(row, [
          "description",
          "الوصف",
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
    symptoms: parseSymptoms(
      readCell(row, [
        "symptoms",
        "الأعراض",
      ]),
    ),
    visualPatterns:
      parseStringList(
        readCell(row, [
          "visualPatterns",
          "patterns",
          "الأنماط البصرية",
          "المظهر",
        ]),
      ),
    causes: parseStringList(
      readCell(row, [
        "causes",
        "الأسباب",
      ]),
    ),
    aggravatingConditions:
      parseStringList(
        readCell(row, [
          "aggravatingConditions",
          "conditions",
          "الظروف المساعدة",
          "الظروف التي تزيد النقص",
        ]),
      ),
    soilContext:
      parseJsonObject(
        readCell(row, [
          "soilContext",
          "soil",
          "سياق التربة",
        ]),
        "Soil context",
      ),
    phContext:
      parseJsonObject(
        readCell(row, [
          "phContext",
          "ph",
          "سياق الحموضة",
        ]),
        "pH context",
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

  validateDeficiencyInput(input);

  return {
    rowNumber,
    input,
    plantRelations,
  };
}

function loadRows(
  inputPath: string,
): ParsedDeficiencyRow[] {
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
        name
          .trim()
          .toLowerCase() ===
        "deficiencies",
    ) ??
    workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error(
      "The import workbook has no sheets.",
    );
  }

  const worksheet =
    workbook.Sheets[
      sheetName
    ];

  const matrix =
    XLSX.utils.sheet_to_json<
      unknown[]
    >(worksheet, {
      header: 1,
      defval: "",
      blankrows: false,
      raw: false,
    });

  if (matrix.length < 2) {
    throw new Error(
      "The import workbook contains no deficiency rows.",
    );
  }

  const headerRow =
    matrix[0].map((value) =>
      normalizeHeader(
        String(value ?? ""),
      ),
    );

  const hasCodeColumn = [
    "nutrientCode",
    "code",
    "elementCode",
    "كود العنصر",
    "الكود",
  ]
    .map(normalizeHeader)
    .some((header) =>
      headerRow.includes(header),
    );

  if (!hasCodeColumn) {
    throw new Error(
      `The Deficiencies sheet header row is invalid. Found headers: ${headerRow.join(", ")}`,
    );
  }

  const parsedRows:
    ParsedDeficiencyRow[] = [];

  for (
    let index = 1;
    index < matrix.length;
    index += 1
  ) {
    const values =
      matrix[index];

    const hasAnyValue =
      values.some(
        (value) =>
          value !== undefined &&
          value !== null &&
          String(value).trim() !==
            "",
      );

    if (!hasAnyValue) {
      continue;
    }

    const row:
      SpreadsheetRow = {};

    for (
      let columnIndex = 0;
      columnIndex <
      headerRow.length;
      columnIndex += 1
    ) {
      const header =
        headerRow[columnIndex];

      if (!header) {
        continue;
      }

      row[header] =
        values[
          columnIndex
        ] ?? "";
    }

    const parsed =
      parseRow(
        row,
        index + 1,
      );

    if (parsed) {
      parsedRows.push(parsed);
    }
  }

  if (
    parsedRows.length === 0
  ) {
    throw new Error(
      "The import file contains no enabled deficiency rows.",
    );
  }

  return parsedRows;
}

async function resolveActor() {
  const prisma =
    getPrismaClient();

  const requestedEmail =
    process.env
      .IMPORT_ACTOR_EMAIL
      ?.trim()
      .toLowerCase();

  if (requestedEmail) {
    const requestedUser =
      await prisma.user.findFirst(
        {
          where: {
            email:
              requestedEmail,
            active: true,
          },
        },
      );

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

function toJsonInput(
  value:
    | Record<
        string,
        unknown
      >
    | undefined,
):
  | Prisma.InputJsonValue
  | typeof Prisma.JsonNull {
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
      input.scientificName?.trim() ??
      null,
    classification:
      input.classification,
    mobility: input.mobility,
    description:
      input.description?.trim() ??
      null,
    soilContext:
      input.soilContext ?? null,
    phContext:
      input.phContext ?? null,
    aliases:
      input.aliases ?? [],
    symptoms: (
      input.symptoms ?? []
    ).map((symptom) => ({
      value:
        symptom.value.trim(),
      locations:
        symptom.locations ?? [],
    })),
    visualPatterns:
      input.visualPatterns ?? [],
    causes:
      input.causes ?? [],
    aggravatingConditions:
      input.aggravatingConditions ??
      [],
  } as Prisma.InputJsonValue;
}

function normalizedRecords(
  values: string[],
) {
  return Array.from(
    new Map(
      values
        .map((value) =>
          value.trim(),
        )
        .filter(Boolean)
        .map((value) => [
          normalizeDeficiencyValue(
            value,
          ),
          {
            value,
            normalizedValue:
              normalizeDeficiencyValue(
                value,
              ),
          },
        ]),
    ).values(),
  );
}

function symptomRecords(
  symptoms: NonNullable<
    DeficiencyInput["symptoms"]
  >,
) {
  return Array.from(
    new Map(
      symptoms
        .map((symptom) => ({
          value:
            symptom.value.trim(),
          normalizedValue:
            normalizeDeficiencyValue(
              symptom.value,
            ),
          locations:
            Array.from(
              new Set(
                (
                  symptom.locations ??
                  []
                )
                  .map((location) =>
                    location.trim(),
                  )
                  .filter(Boolean),
              ),
            ),
        }))
        .filter(
          (symptom) =>
            symptom.normalizedValue,
        )
        .map((symptom) => [
          symptom.normalizedValue,
          symptom,
        ]),
    ).values(),
  );
}

async function resolvePlantLinks(
  relations:
    PlantRelationInput[],
) {
  if (
    relations.length === 0
  ) {
    return [];
  }

  const prisma =
    getPrismaClient();

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

  const bySlug =
    new Map(
      plants.map((plant) => [
        plant.slug,
        plant.id,
      ]),
    );

  const missing =
    relations
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

  if (
    missing.length > 0
  ) {
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
        relation.notes?.trim() ??
        null,
      soilContext:
        toJsonInput(
          relation.soilContext,
        ),
      phContext:
        toJsonInput(
          relation.phContext,
        ),
    }),
  );
}

async function importDeficiency(
  row: ParsedDeficiencyRow,
  actorId: string,
  dryRun: boolean,
) {
  const prisma =
    getPrismaClient();

  const { input } = row;

  const nutrientCode =
    input.nutrientCode
      .trim()
      .toUpperCase();

  const slug =
    toPlantSlug(
      input.slug ||
        input.nutrientNameEn,
    );

  if (!slug) {
    throw new Error(
      "Deficiency slug is invalid.",
    );
  }

  const plantLinks =
    await resolvePlantLinks(
      row.plantRelations,
    );

  const existingByCode =
    await prisma.deficiency.findUnique(
      {
        where: {
          nutrientCode,
        },
        include: {
          entity: true,
        },
      },
    );

  const existingBySlug =
    await prisma.knowledgeEntity.findUnique(
      {
        where: {
          type_slug: {
            type: "DEFICIENCY",
            slug,
          },
        },
        include: {
          deficiency: true,
        },
      },
    );

  if (
    existingByCode &&
    existingBySlug &&
    existingByCode.id !==
      existingBySlug.id
  ) {
    throw new Error(
      `Nutrient code ${nutrientCode} and slug ${slug} belong to different deficiency records.`,
    );
  }

  const existingId =
    existingByCode?.id ??
    existingBySlug?.id ??
    null;

  if (dryRun) {
    return existingId
      ? "updated"
      : "created";
  }

  const aliases =
    normalizedRecords(
      input.aliases ?? [],
    );

  const symptoms =
    symptomRecords(
      input.symptoms ?? [],
    );

  const visualPatterns =
    normalizedRecords(
      input.visualPatterns ?? [],
    );

  const causes =
    normalizedRecords(
      input.causes ?? [],
    );

  const aggravatingConditions =
    normalizedRecords(
      input.aggravatingConditions ??
        [],
    );

  const knowledgePayload =
    buildKnowledgePayload(
      input,
      slug,
    );

  if (existingId) {
    const entity =
      existingByCode?.entity ??
      existingBySlug;

    if (
      !entity ||
      entity.type !==
        "DEFICIENCY"
    ) {
      throw new Error(
        `Existing record for ${nutrientCode} is not a deficiency knowledge entity.`,
      );
    }

    await prisma.$transaction(
      async (transaction) => {
        await transaction.knowledgeEntity.update(
          {
            where: {
              id: existingId,
            },
            data: {
              slug,
              name:
                input.nutrientNameEn.trim(),
              payload:
                knowledgePayload,
              schemaVersion: 1,
              publicationState:
                input.publicationState ??
                KnowledgePublicationState.PUBLISHED,
            },
          },
        );

        await transaction.deficiency.update(
          {
            where: {
              id: existingId,
            },
            data: {
              nutrientCode,
              nutrientNameAr:
                input.nutrientNameAr.trim(),
              nutrientNameEn:
                input.nutrientNameEn.trim(),
              scientificName:
                input.scientificName?.trim() ||
                null,
              classification:
                input.classification,
              mobility:
                input.mobility,
              description:
                input.description?.trim() ||
                null,
              soilContext:
                toJsonInput(
                  input.soilContext,
                ),
              phContext:
                toJsonInput(
                  input.phContext,
                ),
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

              visualPatterns: {
                deleteMany: {},
                create:
                  visualPatterns,
              },

              causes: {
                deleteMany: {},
                create: causes,
              },

              aggravatingConditions: {
                deleteMany: {},
                create:
                  aggravatingConditions,
              },

              plants: {
                deleteMany: {},
                create:
                  plantLinks,
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
            type:
              "DEFICIENCY",
            slug,
            name:
              input.nutrientNameEn.trim(),
            payload:
              knowledgePayload,
            schemaVersion: 1,
            publicationState:
              input.publicationState ??
              KnowledgePublicationState.PUBLISHED,
          },
        },
      );

      await transaction.deficiency.create(
        {
          data: {
            id,
            nutrientCode,
            nutrientNameAr:
              input.nutrientNameAr.trim(),
            nutrientNameEn:
              input.nutrientNameEn.trim(),
            scientificName:
              input.scientificName?.trim() ||
              null,
            classification:
              input.classification,
            mobility:
              input.mobility,
            description:
              input.description?.trim() ||
              null,
            soilContext:
              toJsonInput(
                input.soilContext,
              ),
            phContext:
              toJsonInput(
                input.phContext,
              ),
            createdByUserId:
              actorId,

            aliases: {
              create: aliases,
            },

            symptoms: {
              create: symptoms,
            },

            visualPatterns: {
              create:
                visualPatterns,
            },

            causes: {
              create: causes,
            },

            aggravatingConditions: {
              create:
                aggravatingConditions,
            },

            plants: {
              create:
                plantLinks,
            },

            syncState: {
              create: {
                status:
                  "PENDING",
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

  return "created";
}

async function generateKnowledge() {
  const prisma =
    getPrismaClient();

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

  const inputPath =
    path.resolve(
      inputArgument ||
        DEFAULT_INPUT_FILE,
    );

  const dryRun =
    hasFlag("--dry-run");

  const shouldGenerate =
    hasFlag("--generate");

  const rows =
    loadRows(inputPath);

  const actor =
    await resolveActor();

  const summary:
    ImportSummary = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  console.log("");
  console.log(
    "ArtVert deficiency bulk import",
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
        await importDeficiency(
          row,
          actor.id,
          dryRun,
        );

      summary[action] += 1;

      console.log(
        `[${action.toUpperCase()}] row ${row.rowNumber}: ${row.input.nutrientCode} — ${row.input.nutrientNameEn}`,
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
        nutrientCode:
          row.input.nutrientCode,
        nutrientNameEn:
          row.input.nutrientNameEn,
        message,
      });

      console.error(
        `[FAILED] row ${row.rowNumber}: ${row.input.nutrientCode} — ${row.input.nutrientNameEn} — ${message}`,
      );
    }
  }

  console.log("");
  console.log(
    "Import summary",
  );

  console.table({
    created:
      summary.created,
    updated:
      summary.updated,
    skipped:
      summary.skipped,
    failed:
      summary.failed,
  });

  if (
    summary.failures.length >
    0
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

  if (
    summary.failed > 0
  ) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(
      "Deficiency import failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    const prisma =
      getPrismaClient();

    await prisma.$disconnect();
  });
