import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  DiseaseClassification,
  DiseaseSeverity,
  KnowledgeEntityType,
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

type UpdateDiseasePayload = {
  name: string;
  slug: string;
  classification: DiseaseClassification;
  severity: DiseaseSeverity;
  scientificName: string | null;
  aliases: string[];
  symptoms: string[];
};

class DiseaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiseaseValidationError";
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
    throw new DiseaseValidationError(
      `حقل ${fieldName} مطلوب.`,
    );
  }

  const cleanedValue = value.trim();

  if (!cleanedValue) {
    throw new DiseaseValidationError(
      `حقل ${fieldName} مطلوب.`,
    );
  }

  if (cleanedValue.length > maxLength) {
    throw new DiseaseValidationError(
      `حقل ${fieldName} أطول من الحد المسموح.`,
    );
  }

  return cleanedValue;
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
    throw new DiseaseValidationError(
      `حقل ${fieldName} غير صحيح.`,
    );
  }

  const cleanedValue = value.trim();

  if (!cleanedValue) {
    return null;
  }

  if (cleanedValue.length > maxLength) {
    throw new DiseaseValidationError(
      `حقل ${fieldName} أطول من الحد المسموح.`,
    );
  }

  return cleanedValue;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06ff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeSearchValue(value: string) {
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
    throw new DiseaseValidationError(
      `قائمة ${fieldName} غير صحيحة.`,
    );
  }

  if (value.length > maxItems) {
    throw new DiseaseValidationError(
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

  const normalizedValues = cleanedValues.map(
    normalizeSearchValue,
  );

  if (
    new Set(normalizedValues).size !==
    normalizedValues.length
  ) {
    throw new DiseaseValidationError(
      `يوجد عنصر مكرر داخل ${fieldName}.`,
    );
  }

  return cleanedValues;
}

function isDiseaseClassification(
  value: unknown,
): value is DiseaseClassification {
  return (
    typeof value === "string" &&
    Object.values(DiseaseClassification).includes(
      value as DiseaseClassification,
    )
  );
}

function isDiseaseSeverity(
  value: unknown,
): value is DiseaseSeverity {
  return (
    typeof value === "string" &&
    Object.values(DiseaseSeverity).includes(
      value as DiseaseSeverity,
    )
  );
}

function validatePayload(
  value: unknown,
): UpdateDiseasePayload {
  if (!isRecord(value)) {
    throw new DiseaseValidationError(
      "بيانات المرض غير صحيحة.",
    );
  }

  const name = cleanRequiredString(
    value.name,
    "اسم المرض",
    200,
  );

  const rawSlug = cleanRequiredString(
    value.slug,
    "الرابط المختصر",
    160,
  );

  const slug = normalizeSlug(rawSlug);

  if (!slug) {
    throw new DiseaseValidationError(
      "الرابط المختصر غير صحيح.",
    );
  }

  if (
    !isDiseaseClassification(
      value.classification,
    )
  ) {
    throw new DiseaseValidationError(
      "تصنيف المرض غير مدعوم.",
    );
  }

  if (!isDiseaseSeverity(value.severity)) {
    throw new DiseaseValidationError(
      "درجة خطورة المرض غير مدعومة.",
    );
  }

  return {
    name,
    slug,
    classification:
      value.classification,
    severity: value.severity,
    scientificName: cleanOptionalString(
      value.scientificName,
      "الاسم العلمي",
      220,
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
            "ليس لديك صلاحية لإدارة الأمراض.",
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
      role: true,
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
    const diseaseId = id.trim();

    if (!diseaseId) {
      return NextResponse.json(
        {
          error: "INVALID_DISEASE_ID",
          message: "معرّف المرض غير صحيح.",
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
            "يجب إرسال بيانات المرض بصيغة JSON.",
        },
        {
          status: 415,
        },
      );
    }

    const rawBody: unknown = await request.json();
    const payload = validatePayload(rawBody);

    const existingDisease =
      await prisma.disease.findUnique({
        where: {
          id: diseaseId,
        },
        select: {
          id: true,
          entity: {
            select: {
              slug: true,
              payload: true,
              publicationState: true,
            },
          },
        },
      });

    if (!existingDisease) {
      return NextResponse.json(
        {
          error: "DISEASE_NOT_FOUND",
          message: "المرض غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    const duplicateEntity =
      await prisma.knowledgeEntity.findFirst({
        where: {
          type: KnowledgeEntityType.DISEASE,
          slug: payload.slug,
          id: {
            not: diseaseId,
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicateEntity) {
      return NextResponse.json(
        {
          error: "DISEASE_SLUG_EXISTS",
          message:
            "يوجد مرض آخر بنفس الرابط المختصر.",
        },
        {
          status: 409,
        },
      );
    }

    const updatedDisease =
      await prisma.$transaction(
        async (transaction) => {
          await transaction.diseaseAlias.deleteMany({
            where: {
              diseaseId,
            },
          });

          await transaction.diseaseSymptom.deleteMany({
            where: {
              diseaseId,
            },
          });

          await transaction.knowledgeEntity.update({
            where: {
              id: diseaseId,
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
                scientificName:
                  payload.scientificName,
                aliases: payload.aliases,
                symptoms: payload.symptoms,
              },
            },
          });

          await transaction.disease.update({
            where: {
              id: diseaseId,
            },
            data: {
              classification:
                payload.classification,
              severity: payload.severity,
              scientificName:
                payload.scientificName,
              updatedByUserId:
                authorization.user.id,
              aliases: {
                create: payload.aliases.map(
                  (alias) => ({
                    value: alias,
                    normalizedValue:
                      normalizeSearchValue(alias),
                    locale: "ar-EG",
                  }),
                ),
              },
              symptoms: {
                create: payload.symptoms.map(
                  (symptom) => ({
                    value: symptom,
                    normalizedValue:
                      normalizeSearchValue(symptom),
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

          return transaction.disease.findUniqueOrThrow({
            where: {
              id: diseaseId,
            },
            select: {
              id: true,
              classification: true,
              severity: true,
              scientificName: true,
              entity: {
                select: {
                  name: true,
                  slug: true,
                },
              },
              aliases: {
                orderBy: {
                  value: "asc",
                },
                select: {
                  value: true,
                },
              },
              symptoms: {
                orderBy: {
                  value: "asc",
                },
                select: {
                  value: true,
                },
              },
              syncState: {
                select: {
                  status: true,
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

    return NextResponse.json({
      success: true,
      message: "تم تعديل المرض بنجاح.",
      ...updatedDisease,
    });
  } catch (error) {
    if (
      error instanceof DiseaseValidationError
    ) {
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
            "صيغة بيانات المرض غير صحيحة.",
        },
        {
          status: 400,
        },
      );
    }

    if (isUniqueConflict(error)) {
      return NextResponse.json(
        {
          error: "DISEASE_CONFLICT",
          message:
            "يوجد مرض بنفس الرابط أو بيانات مكررة.",
        },
        {
          status: 409,
        },
      );
    }

    if (isRecordNotFound(error)) {
      return NextResponse.json(
        {
          error: "DISEASE_NOT_FOUND",
          message: "المرض غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    console.error(
      "PATCH /api/admin/diseases/[id] failed",
      error,
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          "تعذر تعديل المرض حاليًا. حاول مرة أخرى.",
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
    const diseaseId = id.trim();

    if (!diseaseId) {
      return NextResponse.json(
        {
          error: "INVALID_DISEASE_ID",
          message: "معرّف المرض غير صحيح.",
        },
        {
          status: 400,
        },
      );
    }

    const disease = await prisma.disease.findUnique({
      where: {
        id: diseaseId,
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
            causes: true,
            plantParts: true,
            riskFactors: true,
            plants: true,
            images: true,
            productRecommendations: true,
          },
        },
      },
    });

    if (!disease) {
      return NextResponse.json(
        {
          error: "DISEASE_NOT_FOUND",
          message: "المرض غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.$transaction(
      async (transaction) => {
        if (disease.images.length > 0) {
          await transaction.storageCleanupJob.createMany({
            data: disease.images.map((image) => ({
              storageKey: image.storageKey,
              status: "PENDING",
            })),
            skipDuplicates: true,
          });
        }

        await transaction.disease.delete({
          where: {
            id: diseaseId,
          },
        });

        await transaction.knowledgeEntity.delete({
          where: {
            id: diseaseId,
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
      message: "تم حذف المرض نهائيًا.",
      disease: {
        id: disease.id,
        name: disease.entity.name,
        slug: disease.entity.slug,
        deletedRelations: {
          aliases: disease._count.aliases,
          symptoms: disease._count.symptoms,
          causes: disease._count.causes,
          plantParts:
            disease._count.plantParts,
          riskFactors:
            disease._count.riskFactors,
          plants: disease._count.plants,
          images: disease._count.images,
          productRecommendations:
            disease._count
              .productRecommendations,
        },
      },
    });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json(
        {
          error: "DISEASE_NOT_FOUND",
          message: "المرض غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    if (isForeignKeyConflict(error)) {
      return NextResponse.json(
        {
          error: "DISEASE_DELETE_CONFLICT",
          message:
            "تعذر حذف المرض لأنه مرتبط ببيانات تمنع الحذف.",
        },
        {
          status: 409,
        },
      );
    }

    console.error(
      "DELETE /api/admin/diseases/[id] failed",
      error,
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          "تعذر حذف المرض حاليًا. حاول مرة أخرى.",
      },
      {
        status: 500,
      },
    );
  }
}
