import type { KnowledgeEntityEnvelope } from "@/schemas/knowledge-entity-envelope";

import type {
  DoctorCandidate,
  DoctorProductRecommendation,
} from "@/engine/doctor/doctor-types";

export type ProductContextItem = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string;
  category?: string;
  shortDescription?: string;
  composition?: string;
  dosage?: string;
  packageSize?: string;
  benefits: string[];
  crops: string[];
  priority:
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "CRITICAL";
  reason: string;
  compatibilityWarning?: string;
  contraindications: string[];
};

export type ProductContext = {
  diagnosis?: {
    id: string;
    type:
      | "DISEASE"
      | "PEST"
      | "DEFICIENCY";
    name: string;
    slug: string;
    confidence:
      | "HIGH"
      | "MODERATE"
      | "LOW"
      | "INSUFFICIENT";
  };
  products: ProductContextItem[];
};

type JsonRecord =
  Record<string, unknown>;

function payloadRecord(
  entity: KnowledgeEntityEnvelope,
): JsonRecord {
  const payload =
    entity.payload;

  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload)
  ) {
    return payload as JsonRecord;
  }

  return {};
}

function stringValue(
  record: JsonRecord,
  keys: string[],
) {
  for (const key of keys) {
    const value =
      record[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return undefined;
}

function stringArrayValue(
  record: JsonRecord,
  keys: string[],
) {
  for (const key of keys) {
    const value =
      record[key];

    if (Array.isArray(value)) {
      return value
        .filter(
          (
            item,
          ): item is string =>
            typeof item === "string",
        )
        .map((item) =>
          item.trim(),
        )
        .filter(Boolean);
    }
  }

  return [];
}

function normalized(
  value: string,
) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ar")
    .trim()
    .replace(/\s+/g, " ");
}

function publicationIsVisible(
  entity: KnowledgeEntityEnvelope,
) {
  return (
    entity.type === "PRODUCT" &&
    entity.publicationState ===
      "PUBLISHED"
  );
}

function recommendationMap(
  recommendations:
    DoctorProductRecommendation[],
) {
  return new Map(
    recommendations.map(
      (item) => [
        item.productId,
        item,
      ],
    ),
  );
}

function productNameAr(
  entity: KnowledgeEntityEnvelope,
  payload: JsonRecord,
) {
  return (
    stringValue(
      payload,
      [
        "nameAr",
        "arabicName",
        "name_ar",
      ],
    ) ||
    entity.name
  );
}

function productNameEn(
  payload: JsonRecord,
) {
  return stringValue(
    payload,
    [
      "nameEn",
      "englishName",
      "name_en",
    ],
  );
}

function productContextItem(
  entity: KnowledgeEntityEnvelope,
  recommendation:
    DoctorProductRecommendation,
): ProductContextItem {
  const payload =
    payloadRecord(entity);

  const contraindications =
    stringArrayValue(
      payload,
      [
        "contraindications",
        "warnings",
      ],
    );

  const payloadWarning =
    stringValue(
      payload,
      [
        "compatibilityWarning",
        "compatibility",
      ],
    );

  return {
    id: entity.id,
    slug: entity.slug,
    nameAr:
      productNameAr(
        entity,
        payload,
      ),
    nameEn:
      productNameEn(payload),
    category:
      stringValue(
        payload,
        ["category"],
      ),
    shortDescription:
      stringValue(
        payload,
        [
          "shortDescription",
          "summary",
        ],
      ),
    composition:
      stringValue(
        payload,
        [
          "composition",
          "ingredients",
        ],
      ),
    dosage:
      stringValue(
        payload,
        [
          "dosage",
          "dose",
          "usageRate",
        ],
      ),
    packageSize:
      stringValue(
        payload,
        [
          "packageSize",
          "packSize",
        ],
      ),
    benefits:
      stringArrayValue(
        payload,
        [
          "benefits",
          "uses",
        ],
      ),
    crops:
      stringArrayValue(
        payload,
        [
          "crops",
          "plants",
          "compatiblePlants",
        ],
      ),
    priority:
      recommendation.priority,
    reason:
      recommendation.reason,
    compatibilityWarning:
      recommendation.compatibilityWarning ??
      payloadWarning,
    contraindications,
  };
}

export function buildProductContext(
  products:
    KnowledgeEntityEnvelope[],
  recommendations:
    DoctorProductRecommendation[],
  candidates:
    DoctorCandidate[],
): ProductContext {
  const recommendedById =
    recommendationMap(
      recommendations,
    );

  const publishedProducts =
    products.filter(
      publicationIsVisible,
    );

  const selected =
    publishedProducts
      .filter((entity) =>
        recommendedById.has(
          entity.id,
        ),
      )
      .map((entity) =>
        productContextItem(
          entity,
          recommendedById.get(
            entity.id,
          )!,
        ),
      )
      .sort(
        (left, right) => {
          const weights = {
            CRITICAL: 4,
            HIGH: 3,
            NORMAL: 2,
            LOW: 1,
          } as const;

          return (
            weights[
              right.priority
            ] -
              weights[
                left.priority
              ] ||
            normalized(
              left.nameAr,
            ).localeCompare(
              normalized(
                right.nameAr,
              ),
              "ar",
            )
          );
        },
      );

  const leader =
    candidates[0];

  return {
    diagnosis: leader
      ? {
          id: leader.id,
          type: leader.type,
          name: leader.name,
          slug: leader.slug,
          confidence:
            leader.confidence,
        }
      : undefined,
    products: selected,
  };
}

export function productContextForPrompt(
  context: ProductContext,
) {
  return JSON.stringify(
    {
      diagnosis:
        context.diagnosis,
      products:
        context.products.map(
          (product) => ({
            nameAr:
              product.nameAr,
            nameEn:
              product.nameEn,
            category:
              product.category,
            shortDescription:
              product.shortDescription,
            composition:
              product.composition,
            dosage:
              product.dosage,
            benefits:
              product.benefits,
            crops:
              product.crops,
            priority:
              product.priority,
            reason:
              product.reason,
            compatibilityWarning:
              product.compatibilityWarning,
            contraindications:
              product.contraindications,
          }),
        ),
    },
    null,
    2,
  );
}
