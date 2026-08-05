import { randomUUID } from "node:crypto";

import {
  Prisma,
  type PrismaClient,
} from "@prisma/client";

import { products } from "@/data/products";
import { getPrismaClient } from "@/lib/db/prisma";
import { createKnowledgeExportStore } from "@/lib/knowledge/export/knowledge-export-store-factory";
import { KnowledgeGenerator } from "@/lib/knowledge/knowledge-generator";
import { createPrismaKnowledgeEntityRepository } from "@/lib/knowledge/prisma/prisma-knowledge-repository";
import { PrismaKnowledgeReleaseRepository } from "@/lib/knowledge/prisma/prisma-knowledge-release-repository";

type RecommendationPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

type RecommendationState =
  | "ACTIVE"
  | "DISABLED";

type RecommendationTargetType =
  | "PLANT"
  | "DISEASE"
  | "PEST"
  | "DEFICIENCY";

type ResolvedRecommendation = {
  targetType: RecommendationTargetType;
  plantId?: string;
  diseaseId?: string;
  pestId?: string;
  deficiencyId?: string;
  state: RecommendationState;
  priority: RecommendationPriority;
  usageContext?: string;
  compatibility?: string;
  contraindications?: string;
  notes?: string;
};

type ImportLegacyProductsResult = {
  imported: number;
  created: number;
  updated: number;
  recommendations: number;
  generatedRelease?: string;
};

type ImportLegacyProductsOptions = {
  generate?: boolean;
};

const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");

const deficiencyCodesByProduct: Record<
  string,
  string[]
> = {
  "amino-comp": [
    "K",
    "Fe",
    "Mn",
    "Zn",
  ],
  "art-phospho": [
    "P",
    "Zn",
  ],
  "art-sal-wax": [
    "Ca",
    "K",
    "N",
  ],
  "plant-grow": [
    "N",
    "P",
    "K",
    "Fe",
    "Mg",
    "Zn",
    "Mn",
    "B",
    "Cu",
    "Mo",
  ],
  "cyto-zinc": [
    "Zn",
  ],
  "cal-b-mix": [
    "Ca",
    "B",
  ],
  "citro-art": [
    "K",
  ],
  "cal-art": [
    "Ca",
  ],
  "fast-grow-10-50-10": [
    "P",
  ],
  "fast-grow-24-24-24": [
    "N",
    "P",
    "K",
  ],
  "fast-grow-50-10-10": [
    "K",
  ],
  "giant-plus": [
    "N",
    "P",
    "K",
    "Zn",
    "B",
    "Mg",
    "Cu",
    "Mn",
    "Fe",
    "Ca",
    "Mo",
  ],
  "artvert-19-19-19": [
    "N",
    "P",
    "K",
    "Zn",
  ],
  "nitro-super-art": [
    "N",
    "P",
    "K",
  ],
  "root-x": [
    "P",
  ],
  "artvert-5-0-45": [
    "K",
    "Zn",
  ],
};

const pestKeywordsByProduct: Record<
  string,
  string[]
> = {
  "art-p-fos": [
    "aphid",
    "whitefly",
    "thrips",
    "leafhopper",
    "borer",
    "cutworm",
    "armyworm",
    "fruit worm",
    "fruit moth",
    "beetle",
    "scale",
    "mealybug",
    "المن",
    "الذبابة البيضاء",
    "التربس",
    "النطاط",
    "الحفار",
    "الدودة القارضة",
    "دودة الثمار",
    "الخنافس",
    "الحشرات القشرية",
    "البق الدقيقي",
  ],
  "ever-mectin": [
    "mite",
    "spider mite",
    "leafminer",
    "thrips",
    "أكاروس",
    "العنكبوت الأحمر",
    "صانعات الأنفاق",
    "التربس",
  ],
  "folamine": [
    "aphid",
    "whitefly",
    "thrips",
    "leafhopper",
    "borer",
    "cutworm",
    "armyworm",
    "fruit worm",
    "beetle",
    "scale",
    "mealybug",
    "المن",
    "الذبابة البيضاء",
    "التربس",
    "النطاط",
    "الحفار",
    "الدودة القارضة",
    "دودة الثمار",
    "الخنافس",
    "الحشرات القشرية",
    "البق الدقيقي",
  ],
  "lamba-set": [
    "aphid",
    "whitefly",
    "thrips",
    "leafhopper",
    "المن",
    "الذبابة البيضاء",
    "التربس",
    "النطاط",
  ],
  "lambada-10": [
    "cutworm",
    "armyworm",
    "fruit worm",
    "borer",
    "beetle",
    "الدودة القارضة",
    "دودة الثمار",
    "الحفار",
    "الخنافس",
  ],
  "torbid-plus": [
    "aphid",
    "whitefly",
    "thrips",
    "leafhopper",
    "borer",
    "cutworm",
    "armyworm",
    "fruit worm",
    "beetle",
    "scale",
    "mealybug",
    "المن",
    "الذبابة البيضاء",
    "التربس",
    "النطاط",
    "الحفار",
    "الدودة القارضة",
    "دودة الثمار",
    "الخنافس",
    "الحشرات القشرية",
    "البق الدقيقي",
  ],
};

function recommendationPriority(
  productSlug: string,
  targetType: RecommendationTargetType,
): RecommendationPriority {
  if (
    targetType === "DEFICIENCY" &&
    [
      "cyto-zinc",
      "cal-art",
      "cal-b-mix",
      "art-phospho",
      "citro-art",
      "fast-grow-10-50-10",
      "fast-grow-50-10-10",
      "nitro-super-art",
    ].includes(productSlug)
  ) {
    return "HIGH";
  }

  if (
    targetType === "PEST"
  ) {
    return "NORMAL";
  }

  return "NORMAL";
}

function usageContext(
  productSlug: string,
  targetType: RecommendationTargetType,
) {
  if (targetType === "PEST") {
    return "يُستخدم فقط إذا كانت الآفة والتسجيل والمحصول والجرعة متوافقة مع بطاقة المبيد الرسمية والقوانين المحلية.";
  }

  if (productSlug === "plant-grow") {
    return "مناسب للتغذية العامة للنباتات المنزلية ونباتات الزينة، وليس بديلًا عن تشخيص سبب الاصفرار أو تحليل التربة.";
  }

  return "يُستخدم بعد التأكد من أن الأعراض مرتبطة فعلًا بنقص العنصر ومع مراعاة تحليل التربة أو ماء الري عند الحاجة.";
}

function contraindications(
  targetType: RecommendationTargetType,
) {
  if (targetType === "PEST") {
    return "لا يُوصى بالاستخدام دون التحقق من تسجيل المبيد على المحصول والآفة وفترة الأمان والجرعة المدونة على العبوة.";
  }

  return "تجنب الإفراط في الاستخدام أو الخلط غير الموصى به، ولا تعتمد على المنتج وحده إذا كان سبب المشكلة جذريًا أو مرتبطًا بالري أو الملوحة.";
}

function buildProductPayload(
  legacy: (typeof products)[number],
  recommendations: ResolvedRecommendation[],
): Prisma.InputJsonValue {
  return {
    legacyId: legacy.id,
    slug: legacy.slug,
    category: legacy.category,
    nameAr: legacy.nameAr,
    nameEn: legacy.nameEn,
    shortDescription:
      legacy.shortDescription,
    description:
      legacy.description,
    composition:
      legacy.composition,
    dosage:
      legacy.dosage,
    packageSize:
      legacy.packageSize,
    benefits:
      legacy.benefits,
    crops:
      legacy.crops,
    image:
      legacy.image,
    aliases: [
      {
        value: legacy.nameAr,
        locale: "ar",
      },
      {
        value: legacy.nameEn,
        locale: "en",
      },
    ],
    recommendations:
      recommendations.map(
        (recommendation) => ({
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
            recommendation.state,
          priority:
            recommendation.priority,
          usageContext:
            recommendation.usageContext ??
            null,
          compatibility:
            recommendation.compatibility ??
            null,
          contraindications:
            recommendation.contraindications ??
            null,
          notes:
            recommendation.notes ??
            null,
        }),
      ),
  } as Prisma.InputJsonValue;
}

async function resolveDeficiencyRecommendations(
  prisma: PrismaClient,
  productSlug: string,
): Promise<ResolvedRecommendation[]> {
  const codes =
    deficiencyCodesByProduct[
      productSlug
    ] ?? [];

  if (codes.length === 0) {
    return [];
  }

  const deficiencies =
    await prisma.deficiency.findMany({
      where: {
        nutrientCode: {
          in: codes,
        },
      },
      select: {
        id: true,
        nutrientCode: true,
        nutrientNameAr: true,
      },
    });

  return deficiencies.map(
    (deficiency) => ({
      targetType: "DEFICIENCY",
      deficiencyId:
        deficiency.id,
      state: "ACTIVE",
      priority:
        recommendationPriority(
          productSlug,
          "DEFICIENCY",
        ),
      usageContext:
        usageContext(
          productSlug,
          "DEFICIENCY",
        ),
      compatibility:
        "plant-required",
      contraindications:
        contraindications(
          "DEFICIENCY",
        ),
      notes:
        `ترشيح مرتبط بنقص ${deficiency.nutrientNameAr} (${deficiency.nutrientCode}).`,
    }),
  );
}

async function resolvePestRecommendations(
  prisma: PrismaClient,
  productSlug: string,
): Promise<ResolvedRecommendation[]> {
  const keywords =
    pestKeywordsByProduct[
      productSlug
    ] ?? [];

  if (keywords.length === 0) {
    return [];
  }

  const pests =
    await prisma.pest.findMany({
      where: {
        entity: {
          is: {
            publicationState:
              "PUBLISHED",
          },
        },
      },
      select: {
        id: true,
        scientificName: true,
        entity: {
          select: {
            name: true,
            slug: true,
          },
        },
        aliases: {
          select: {
            value: true,
          },
        },
      },
    });

  const normalizedKeywords =
    keywords.map(normalize);

  return pests
    .filter((pest) => {
      const searchable = [
        pest.entity.name,
        pest.entity.slug,
        pest.scientificName ?? "",
        ...pest.aliases.map(
          (alias) =>
            alias.value,
        ),
      ]
        .map(normalize)
        .join(" ");

      return normalizedKeywords.some(
        (keyword) =>
          searchable.includes(
            keyword,
          ),
      );
    })
    .map((pest) => ({
      targetType: "PEST" as const,
      pestId: pest.id,
      state: "ACTIVE" as const,
      priority:
        recommendationPriority(
          productSlug,
          "PEST",
        ),
      usageContext:
        usageContext(
          productSlug,
          "PEST",
        ),
      compatibility:
        "plant-required-label-required",
      contraindications:
        contraindications(
          "PEST",
        ),
      notes:
        `ترشيح مبدئي للآفة ${pest.entity.name} ويجب مراجعته طبقًا لبطاقة تسجيل المبيد.`,
    }));
}

async function resolveRecommendations(
  prisma: PrismaClient,
  productSlug: string,
) {
  const [
    deficiencyRecommendations,
    pestRecommendations,
  ] = await Promise.all([
    resolveDeficiencyRecommendations(
      prisma,
      productSlug,
    ),
    resolvePestRecommendations(
      prisma,
      productSlug,
    ),
  ]);

  return [
    ...deficiencyRecommendations,
    ...pestRecommendations,
  ];
}

/**
 * Lossless and idempotent migration of the public catalog.
 *
 * It:
 * - never rewrites the legacy public text;
 * - updates existing products instead of duplicating them;
 * - rebuilds aliases, image and recommendations deterministically;
 * - writes the full product payload consumed by DoctorEngine;
 * - generates and activates a new knowledge release by default.
 */
export async function importLegacyProducts(
  prisma: PrismaClient =
    getPrismaClient(),
  actorId =
    process.env
      .PRODUCT_IMPORT_USER_ID,
  options: ImportLegacyProductsOptions = {
    generate: true,
  },
): Promise<ImportLegacyProductsResult> {
  const userId =
    actorId ??
    (
      await prisma.user.findFirst({
        where: {
          active: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
        },
      })
    )?.id;

  if (!userId) {
    throw new Error(
      "PRODUCT_IMPORT_USER_ID or an active user is required.",
    );
  }

  let created = 0;
  let updated = 0;
  let recommendationCount = 0;

  for (const legacy of products) {
    const recommendations =
      await resolveRecommendations(
        prisma,
        legacy.slug,
      );

    recommendationCount +=
      recommendations.length;

    await prisma.$transaction(
      async (transaction) => {
        const existing =
          await transaction.product.findUnique(
            {
              where: {
                legacyId:
                  legacy.id,
              },
              select: {
                id: true,
              },
            },
          );

        const id =
          existing?.id ??
          randomUUID();

        if (existing) {
          updated += 1;
        } else {
          created += 1;
        }

        const aliases = [
          {
            value:
              legacy.nameAr,
            locale: "ar",
          },
          {
            value:
              legacy.nameEn,
            locale: "en",
          },
        ].filter(
          (
            alias,
            index,
            all,
          ) =>
            all.findIndex(
              (candidate) =>
                normalize(
                  candidate.value,
                ) ===
                normalize(
                  alias.value,
                ),
            ) === index,
        );

        const payload =
          buildProductPayload(
            legacy,
            recommendations,
          );

        await transaction.knowledgeEntity.upsert(
          {
            where: {
              id,
            },
            create: {
              id,
              type: "PRODUCT",
              slug:
                legacy.slug,
              name:
                legacy.nameEn,
              payload,
              schemaVersion: 1,
              publicationState:
                "PUBLISHED",
            },
            update: {
              slug:
                legacy.slug,
              name:
                legacy.nameEn,
              payload,
              schemaVersion: 1,
              publicationState:
                "PUBLISHED",
            },
          },
        );

        await transaction.product.upsert(
          {
            where: {
              legacyId:
                legacy.id,
            },
            create: {
              id,
              legacyId:
                legacy.id,
              category:
                legacy.category,
              nameAr:
                legacy.nameAr,
              nameEn:
                legacy.nameEn,
              shortDescription:
                legacy.shortDescription,
              description:
                legacy.description,
              composition:
                legacy.composition,
              dosage:
                legacy.dosage,
              packageSize:
                legacy.packageSize,
              benefits:
                legacy.benefits,
              crops:
                legacy.crops,
              createdByUserId:
                userId,

              aliases: {
                create:
                  aliases.map(
                    (alias) => ({
                      ...alias,
                      normalizedValue:
                        normalize(
                          alias.value,
                        ),
                    }),
                  ),
              },

              images: {
                create: {
                  ownership:
                    "LEGACY_PUBLIC",
                  url:
                    legacy.image,
                  alt:
                    legacy.nameAr,
                  sortOrder: 0,
                },
              },

              recommendations: {
                create:
                  recommendations,
              },

              syncState: {
                create: {
                  status:
                    "PENDING",
                },
              },
            },
            update: {
              category:
                legacy.category,
              nameAr:
                legacy.nameAr,
              nameEn:
                legacy.nameEn,
              shortDescription:
                legacy.shortDescription,
              description:
                legacy.description,
              composition:
                legacy.composition,
              dosage:
                legacy.dosage,
              packageSize:
                legacy.packageSize,
              benefits:
                legacy.benefits,
              crops:
                legacy.crops,
              updatedByUserId:
                userId,

              aliases: {
                deleteMany: {},
                create:
                  aliases.map(
                    (alias) => ({
                      ...alias,
                      normalizedValue:
                        normalize(
                          alias.value,
                        ),
                    }),
                  ),
              },

              images: {
                deleteMany: {},
                create: {
                  ownership:
                    "LEGACY_PUBLIC",
                  url:
                    legacy.image,
                  alt:
                    legacy.nameAr,
                  sortOrder: 0,
                },
              },

              recommendations: {
                deleteMany: {},
                create:
                  recommendations,
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
        maxWait: 15000,
        timeout: 60000,
      },
    );
  }

  let generatedRelease:
    | string
    | undefined;

  if (
    options.generate !== false
  ) {
    const release =
      await new KnowledgeGenerator(
        createPrismaKnowledgeEntityRepository(
          prisma,
        ),
        new PrismaKnowledgeReleaseRepository(
          prisma,
        ),
        createKnowledgeExportStore(),
      ).generate();

    generatedRelease =
      release.version;

    await prisma.productKnowledgeSync.updateMany(
      {
        where: {
          product: {
            legacyId: {
              not: null,
            },
          },
        },
        data: {
          status: "SYNCED",
          lastSyncedAt:
            new Date(),
          diagnosticCode:
            null,
        },
      },
    );
  }

  return {
    imported:
      products.length,
    created,
    updated,
    recommendations:
      recommendationCount,
    generatedRelease,
  };
}
