import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  KnowledgeEntityType,
  PestClassification,
  PestEconomicImpact,
  PestSeverity,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UnknownRecord = Record<string, unknown>;

type UpdatePestPayload = {
  name: string;
  slug: string;
  classification: PestClassification;
  severity: PestSeverity;
  economicImpact: PestEconomicImpact;
  scientificName: string | null;
  description: string | null;
  aliases: string[];
  symptoms: string[];
  damagePatterns: string[];
  lifecycleStages: string[];
};

class PestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PestValidationError";
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function cleanRequiredString(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  if (typeof value !== "string") {
    throw new PestValidationError(
      `حقل ${fieldName} مطلوب.`,
    );
  }

  const cleaned = value.trim();

  if (!cleaned) {
    throw new PestValidationError(
      `حقل ${fieldName} مطلوب.`,
    );
  }

  if (cleaned.length > maxLength) {
    throw new PestValidationError(
      `حقل ${fieldName} أطول من الحد المسموح.`,
    );
  }

  return cleaned;
}

function cleanOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    throw new PestValidationError(
      `حقل ${fieldName} غير صحيح.`,
    );
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  if (cleaned.length > maxLength) {
    throw new PestValidationError(
      `حقل ${fieldName} أطول من الحد المسموح.`,
    );
  }

  return cleaned;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
}

function normalizeValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ar-EG")
    .replace(/\s+/g, " ");
}

function cleanStringArray(
  value: unknown,
  fieldName: string,
  maxItems: number,
  maxLength: number,
) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new PestValidationError(
      `قائمة ${fieldName} غير صحيحة.`,
    );
  }

  if (value.length > maxItems) {
    throw new PestValidationError(
      `عدد عناصر ${fieldName} أكبر من الحد المسموح.`,
    );
  }

  const cleanedValues = value.map(
    (item, index) =>
      cleanRequiredString(
        item,
        `${fieldName} رقم ${index + 1}`,
        maxLength,
      ),
  );

  const normalizedValues =
    cleanedValues.map(normalizeValue);

  if (
    new Set(normalizedValues).size !==
    normalizedValues.length
  ) {
    throw new PestValidationError(
      `يوجد عنصر مكرر داخل ${fieldName}.`,
    );
  }

  return cleanedValues;
}

function isPestClassification(
  value: unknown,
): value is PestClassification {
  return (
    typeof value === "string" &&
    Object.values(PestClassification).includes(
      value as PestClassification,
    )
  );
}

function isPestSeverity(
  value: unknown,
): value is PestSeverity {
  return (
    typeof value === "string" &&
    Object.values(PestSeverity).includes(
      value as PestSeverity,
    )
  );
}

function isPestEconomicImpact(
  value: unknown,
): value is PestEconomicImpact {
  return (
    typeof value === "string" &&
    Object.values(PestEconomicImpact).includes(
      value as PestEconomicImpact,
    )
  );
}

function validatePayload(
  value: unknown,
): UpdatePestPayload {
  if (!isRecord(value)) {
    throw new PestValidationError(
      "بيانات الآفة غير صحيحة.",
    );
  }

  const name = cleanRequiredString(
    value.name,
    "اسم الآفة",
    200,
  );

  const rawSlug = cleanRequiredString(
    value.slug,
    "الرابط المختصر",
    160,
  );

  const slug = normalizeSlug(rawSlug);

  if (!slug) {
    throw new PestValidationError(
      "الرابط المختصر يجب أن يكون بالإنجليزية.",
    );
  }

  if (
    !isPestClassification(
      value.classification,
    )
  ) {
    throw new PestValidationError(
      "تصنيف الآفة غير مدعوم.",
    );
  }

  if (!isPestSeverity(value.severity)) {
    throw new PestValidationError(
      "درجة خطورة الآفة غير مدعومة.",
    );
  }

  if (
    !isPestEconomicImpact(
      value.economicImpact,
    )
  ) {
    throw new PestValidationError(
      "التأثير الاقتصادي غير مدعوم.",
    );
  }

  return {
    name,
    slug,
    classification:
      value.classification,
    severity: value.severity,
    economicImpact:
      value.economicImpact,
    scientificName: cleanOptionalString(
      value.scientificName,
      "الاسم العلمي",
      220,
    ),
    description: cleanOptionalString(
      value.description,
      "الوصف",
      5000,
    ),
    aliases: cleanStringArray(
      value.aliases,
      "الأسماء البديلة",
      100,
      200,
    ),
    symptoms: cleanStringArray(
      value.symptoms,
      "الأعراض",
      200,
      500,
    ),
    damagePatterns: cleanStringArray(
      value.damagePatterns,
      "أنماط الضرر",
      200,
      500,
    ),
    lifecycleStages: cleanStringArray(
      value.lifecycleStages,
      "مراحل دورة الحياة",
      100,
      300,
    ),
  };
}

async function authorizeAdmin(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  if (
    typeof token.sessionExpiresAt !== "number" ||
    token.sessionExpiresAt <= Date.now()
  ) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          error: "SESSION_EXPIRED",
          message:
            "انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const role =
    typeof token.role === "string"
      ? token.role.toUpperCase()
      : "";

  if (
    role !== "ADMIN" &&
    role !== "SUPER_ADMIN" &&
    role !== "AGRONOMIST"
  ) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          error: "FORBIDDEN",
          message:
            "ليس لديك صلاحية لإدارة الآفات.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  const possibleUserId =
    typeof token.userId === "string"
      ? token.userId
      : typeof token.id === "string"
        ? token.id
        : typeof token.sub === "string"
          ? token.sub
          : "";

  if (!possibleUserId) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          error: "INVALID_SESSION",
          message:
            "تعذر تحديد حساب المستخدم الحالي.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: possibleUserId,
    },
    select: {
      id: true,
      active: true,
    },
  });

  if (!user || !user.active) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          error: "INVALID_USER",
          message:
            "حساب المستخدم غير موجود أو غير نشط.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    authorized: true as const,
    user,
  };
}

function isRecordNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function isUniqueConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isForeignKeyConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const authorization =
      await authorizeAdmin(request);

    if (!authorization.authorized) {
      return authorization.response;
    }

    const { id } = await context.params;
    const pestId = id.trim();

    if (!pestId) {
      return NextResponse.json(
        {
          error: "INVALID_PEST_ID",
          message: "معرّف الآفة غير صحيح.",
        },
        {
          status: 400,
        },
      );
    }

    const contentType =
      request.headers.get("content-type") ?? "";

    if (
      !contentType
        .toLowerCase()
        .includes("application/json")
    ) {
      return NextResponse.json(
        {
          error: "UNSUPPORTED_MEDIA_TYPE",
          message:
            "يجب إرسال بيانات الآفة بصيغة JSON.",
        },
        {
          status: 415,
        },
      );
    }

    const rawBody: unknown = await request.json();
    const payload = validatePayload(rawBody);

    const existingPest =
      await prisma.pest.findUnique({
        where: {
          id: pestId,
        },
        select: {
          id: true,
        },
      });

    if (!existingPest) {
      return NextResponse.json(
        {
          error: "PEST_NOT_FOUND",
          message: "الآفة غير موجودة.",
        },
        {
          status: 404,
        },
      );
    }

    const duplicateEntity =
      await prisma.knowledgeEntity.findFirst({
        where: {
          type: KnowledgeEntityType.PEST,
          slug: payload.slug,
          id: {
            not: pestId,
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicateEntity) {
      return NextResponse.json(
        {
          error: "PEST_SLUG_EXISTS",
          message:
            "يوجد آفة أخرى بنفس الرابط المختصر.",
        },
        {
          status: 409,
        },
      );
    }

    const updatedPest =
      await prisma.$transaction(
        async (transaction) => {
          await transaction.pestAlias.deleteMany({
            where: {
              pestId,
            },
          });

          await transaction.pestSymptom.deleteMany({
            where: {
              pestId,
            },
          });

          await transaction.pestDamagePattern.deleteMany({
            where: {
              pestId,
            },
          });

          await transaction.pestLifecycleStage.deleteMany({
            where: {
              pestId,
            },
          });

          await transaction.knowledgeEntity.update({
            where: {
              id: pestId,
            },
            data: {
              slug: payload.slug,
              name: payload.name,
              payload: {
                name: payload.name,
                slug: payload.slug,
                classification:
                  payload.classification,
                severity: payload.severity,
                economicImpact:
                  payload.economicImpact,
                scientificName:
                  payload.scientificName,
                description:
                  payload.description,
                aliases: payload.aliases,
                symptoms: payload.symptoms,
                damagePatterns:
                  payload.damagePatterns,
                lifecycleStages:
                  payload.lifecycleStages,
              },
            },
          });

          await transaction.pest.update({
            where: {
              id: pestId,
            },
            data: {
              classification:
                payload.classification,
              severity: payload.severity,
              economicImpact:
                payload.economicImpact,
              scientificName:
                payload.scientificName,
              description:
                payload.description,
              updatedByUserId:
                authorization.user.id,

              aliases: {
                create: payload.aliases.map(
                  (alias) => ({
                    value: alias,
                    normalizedValue:
                      normalizeValue(alias),
                    locale: "ar-EG",
                  }),
                ),
              },

              symptoms: {
                create: payload.symptoms.map(
                  (symptom) => ({
                    value: symptom,
                    normalizedValue:
                      normalizeValue(symptom),
                  }),
                ),
              },

              damagePatterns: {
                create:
                  payload.damagePatterns.map(
                    (pattern) => ({
                      value: pattern,
                      normalizedValue:
                        normalizeValue(pattern),
                    }),
                  ),
              },

              lifecycleStages: {
                create:
                  payload.lifecycleStages.map(
                    (stage, index) => ({
                      value: stage,
                      normalizedValue:
                        normalizeValue(stage),
                      sortOrder: index + 1,
                    }),
                  ),
              },

              syncState: {
                upsert: {
                  create: {
                    status: "PENDING",
                  },
                  update: {
                    status: "PENDING",
                    diagnosticCode: null,
                  },
                },
              },
            },
          });

          return transaction.pest.findUniqueOrThrow({
            where: {
              id: pestId,
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
              syncState: true,
            },
          });
        },
        {
          maxWait: 10000,
          timeout: 20000,
        },
      );

    return NextResponse.json({
      success: true,
      message: "تم تعديل الآفة بنجاح.",
      ...updatedPest,
    });
  } catch (error) {
    if (error instanceof PestValidationError) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: error.message,
        },
        {
          status: 400,
        },
      );
    }

    if (
      error instanceof SyntaxError ||
      (error instanceof Error &&
        error.message
          .toLowerCase()
          .includes("json"))
    ) {
      return NextResponse.json(
        {
          error: "INVALID_JSON",
          message:
            "صيغة بيانات الآفة غير صحيحة.",
        },
        {
          status: 400,
        },
      );
    }

    if (isUniqueConflict(error)) {
      return NextResponse.json(
        {
          error: "PEST_CONFLICT",
          message:
            "يوجد آفة بنفس الرابط أو بيانات مكررة.",
        },
        {
          status: 409,
        },
      );
    }

    if (isRecordNotFound(error)) {
      return NextResponse.json(
        {
          error: "PEST_NOT_FOUND",
          message: "الآفة غير موجودة.",
        },
        {
          status: 404,
        },
      );
    }

    console.error(
      "PATCH /api/admin/pests/[id] failed",
      error,
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          "تعذر تعديل الآفة حاليًا. حاول مرة أخرى.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const authorization =
      await authorizeAdmin(request);

    if (!authorization.authorized) {
      return authorization.response;
    }

    const { id } = await context.params;
    const pestId = id.trim();

    if (!pestId) {
      return NextResponse.json(
        {
          error: "INVALID_PEST_ID",
          message: "معرّف الآفة غير صحيح.",
        },
        {
          status: 400,
        },
      );
    }

    const pest = await prisma.pest.findUnique({
      where: {
        id: pestId,
      },
      select: {
        id: true,
        entity: {
          select: {
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            storageKey: true,
          },
        },
        _count: {
          select: {
            aliases: true,
            symptoms: true,
            damagePatterns: true,
            lifecycleStages: true,
            plants: true,
            images: true,
            productRecommendations: true,
          },
        },
      },
    });

    if (!pest) {
      return NextResponse.json(
        {
          error: "PEST_NOT_FOUND",
          message: "الآفة غير موجودة.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.$transaction(
      async (transaction) => {
        if (pest.images.length > 0) {
          await transaction.storageCleanupJob.createMany({
            data: pest.images.map((image) => ({
              storageKey: image.storageKey,
              status: "PENDING",
            })),
            skipDuplicates: true,
          });
        }

        await transaction.pest.delete({
          where: {
            id: pestId,
          },
        });

        await transaction.knowledgeEntity.delete({
          where: {
            id: pestId,
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    return NextResponse.json({
      success: true,
      message: "تم حذف الآفة نهائيًا.",
      pest: {
        id: pest.id,
        name: pest.entity.name,
        slug: pest.entity.slug,
        deletedRelations: {
          aliases: pest._count.aliases,
          symptoms: pest._count.symptoms,
          damagePatterns:
            pest._count.damagePatterns,
          lifecycleStages:
            pest._count.lifecycleStages,
          plants: pest._count.plants,
          images: pest._count.images,
          productRecommendations:
            pest._count
              .productRecommendations,
        },
      },
    });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json(
        {
          error: "PEST_NOT_FOUND",
          message: "الآفة غير موجودة.",
        },
        {
          status: 404,
        },
      );
    }

    if (isForeignKeyConflict(error)) {
      return NextResponse.json(
        {
          error: "PEST_DELETE_CONFLICT",
          message:
            "تعذر حذف الآفة لأنها مرتبطة ببيانات تمنع الحذف.",
        },
        {
          status: 409,
        },
      );
    }

    console.error(
      "DELETE /api/admin/pests/[id] failed",
      error,
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          "تعذر حذف الآفة حاليًا. حاول مرة أخرى.",
      },
      {
        status: 500,
      },
    );
  }
}
