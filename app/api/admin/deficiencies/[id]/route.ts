import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { DeficiencyCleanupProcessor } from "@/lib/deficiencies/deficiency-cleanup";
import {
  canHardDeleteDeficiency,
  canManageDeficiency,
  canPublishDeficiency,
  canViewDeficiencies,
} from "@/lib/deficiencies/deficiency-permissions";
import { DeficiencyRepository } from "@/lib/deficiencies/deficiency-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UnknownRecord = Record<string, unknown>;

class DeficiencyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeficiencyValidationError";
  }
}

async function actor() {
  const session = await getServerSession(
    authOptions,
  );

  if (
    !session?.user?.id ||
    !session.user.role
  ) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    id: session.user.id,
    role: session.user.role as UserRole,
  };
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ar-EG")
    .replace(/\s+/g, " ");
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
    throw new DeficiencyValidationError(
      `حقل ${fieldName} غير صحيح.`,
    );
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  if (cleaned.length > maxLength) {
    throw new DeficiencyValidationError(
      `حقل ${fieldName} أطول من الحد المسموح.`,
    );
  }

  return cleaned;
}

function cleanStringArray(
  value: unknown,
  fieldName: string,
  maxItems = 200,
  maxLength = 500,
) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new DeficiencyValidationError(
      `قائمة ${fieldName} غير صحيحة.`,
    );
  }

  if (value.length > maxItems) {
    throw new DeficiencyValidationError(
      `عدد عناصر ${fieldName} أكبر من الحد المسموح.`,
    );
  }

  const cleaned = value.map(
    (item, index) => {
      if (typeof item !== "string") {
        throw new DeficiencyValidationError(
          `${fieldName} رقم ${index + 1} غير صحيح.`,
        );
      }

      const result = item.trim();

      if (!result) {
        throw new DeficiencyValidationError(
          `${fieldName} رقم ${index + 1} فارغ.`,
        );
      }

      if (result.length > maxLength) {
        throw new DeficiencyValidationError(
          `${fieldName} رقم ${index + 1} أطول من الحد المسموح.`,
        );
      }

      return result;
    },
  );

  const normalized =
    cleaned.map(normalizeValue);

  if (
    new Set(normalized).size !==
    normalized.length
  ) {
    throw new DeficiencyValidationError(
      `يوجد عنصر مكرر داخل ${fieldName}.`,
    );
  }

  return cleaned;
}

function valueRows(
  deficiencyId: string,
  values: string[],
) {
  return values.map((value) => ({
    deficiencyId,
    value: value.trim(),
    normalizedValue:
      normalizeValue(value),
  }));
}

export async function GET(
  _: Request,
  { params }: RouteContext,
) {
  try {
    const current = await actor();

    if (!canViewDeficiencies(current.role)) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message:
            "ليس لديك صلاحية لعرض نواقص العناصر.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;
    const deficiencyId = id.trim();

    if (!deficiencyId) {
      return NextResponse.json(
        {
          error: "INVALID_DEFICIENCY_ID",
          message:
            "معرّف نقص العنصر غير صحيح.",
        },
        {
          status: 400,
        },
      );
    }

    const deficiency =
      await new DeficiencyRepository().find(
        deficiencyId,
      );

    if (!deficiency) {
      return NextResponse.json(
        {
          error: "DEFICIENCY_NOT_FOUND",
          message:
            "سجل نقص العنصر غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(deficiency);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    return NextResponse.json(
      {
        error:
          message === "UNAUTHORIZED"
            ? "UNAUTHORIZED"
            : "DEFICIENCY_READ_FAILED",
        message:
          message === "UNAUTHORIZED"
            ? "يجب تسجيل الدخول أولًا."
            : "تعذر تحميل بيانات نقص العنصر.",
      },
      {
        status:
          message === "UNAUTHORIZED"
            ? 401
            : 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const current = await actor();
    const prisma = getPrismaClient();

    const { id } = await params;
    const deficiencyId = id.trim();

    if (!deficiencyId) {
      return NextResponse.json(
        {
          error: "INVALID_DEFICIENCY_ID",
          message:
            "معرّف نقص العنصر غير صحيح.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.deficiency.findUnique({
        where: {
          id: deficiencyId,
        },
        include: {
          entity: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error: "DEFICIENCY_NOT_FOUND",
          message:
            "سجل نقص العنصر غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !canManageDeficiency(
        current.role,
        current.id,
        {
          createdByUserId:
            existing.createdByUserId,
          publicationState:
            existing.entity
              .publicationState,
        },
      )
    ) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message:
            "ليس لديك صلاحية لتعديل نقص العنصر.",
        },
        {
          status: 403,
        },
      );
    }

    const rawBody: unknown =
      await request.json();

    if (!isRecord(rawBody)) {
      throw new DeficiencyValidationError(
        "بيانات نقص العنصر غير صحيحة.",
      );
    }

    const publicationState =
      typeof rawBody.publicationState ===
      "string"
        ? rawBody.publicationState
        : existing.entity.publicationState;

    if (
      publicationState !==
        existing.entity
          .publicationState &&
      !canPublishDeficiency(current.role)
    ) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message:
            "ليس لديك صلاحية لتغيير حالة النشر.",
        },
        {
          status: 403,
        },
      );
    }

    const nutrientCode =
      typeof rawBody.nutrientCode ===
      "string"
        ? rawBody.nutrientCode
            .trim()
            .toUpperCase()
        : existing.nutrientCode;

    const nutrientNameAr =
      typeof rawBody.nutrientNameAr ===
      "string"
        ? rawBody.nutrientNameAr.trim()
        : existing.nutrientNameAr;

    const nutrientNameEn =
      typeof rawBody.nutrientNameEn ===
      "string"
        ? rawBody.nutrientNameEn.trim()
        : existing.nutrientNameEn;

    if (
      !nutrientCode ||
      !nutrientNameAr ||
      !nutrientNameEn
    ) {
      throw new DeficiencyValidationError(
        "كود العنصر والاسم العربي والاسم الإنجليزي مطلوبة.",
      );
    }

    const slug =
      rawBody.slug === undefined
        ? existing.entity.slug
        : normalizeSlug(
            String(rawBody.slug),
          );

    if (!slug) {
      throw new DeficiencyValidationError(
        "الرابط المختصر يجب أن يكون بالإنجليزية.",
      );
    }

    const aliases = cleanStringArray(
      rawBody.aliases,
      "الأسماء البديلة",
    );

    const visualPatterns =
      cleanStringArray(
        rawBody.visualPatterns,
        "الأنماط البصرية",
      );

    const causes = cleanStringArray(
      rawBody.causes,
      "الأسباب",
    );

    const aggravatingConditions =
      cleanStringArray(
        rawBody.aggravatingConditions,
        "الظروف المساعدة",
      );

    const updated =
      await prisma.$transaction(
        async (transaction) => {
          await transaction.knowledgeEntity.update({
            where: {
              id: deficiencyId,
            },
            data: {
              name: nutrientNameEn,
              slug,
              publicationState:
                publicationState as typeof existing.entity.publicationState,
              payload: {
                nutrientCode,
                nutrientNameAr,
                nutrientNameEn,
                classification:
                  rawBody.classification ??
                  existing.classification,
                mobility:
                  rawBody.mobility ??
                  existing.mobility,
                scientificName:
                  rawBody.scientificName ??
                  existing.scientificName,
                description:
                  rawBody.description ??
                  existing.description,
                aliases: aliases ?? [],
                visualPatterns:
                  visualPatterns ?? [],
                causes: causes ?? [],
                aggravatingConditions:
                  aggravatingConditions ??
                  [],
              },
            },
          });

          if (aliases !== undefined) {
            await transaction.deficiencyAlias.deleteMany(
              {
                where: {
                  deficiencyId,
                },
              },
            );

            if (aliases.length > 0) {
              await transaction.deficiencyAlias.createMany(
                {
                  data: valueRows(
                    deficiencyId,
                    aliases,
                  ),
                },
              );
            }
          }

          if (
            visualPatterns !== undefined
          ) {
            await transaction.deficiencyVisualPattern.deleteMany(
              {
                where: {
                  deficiencyId,
                },
              },
            );

            if (
              visualPatterns.length > 0
            ) {
              await transaction.deficiencyVisualPattern.createMany(
                {
                  data: valueRows(
                    deficiencyId,
                    visualPatterns,
                  ),
                },
              );
            }
          }

          if (causes !== undefined) {
            await transaction.deficiencyCause.deleteMany(
              {
                where: {
                  deficiencyId,
                },
              },
            );

            if (causes.length > 0) {
              await transaction.deficiencyCause.createMany(
                {
                  data: valueRows(
                    deficiencyId,
                    causes,
                  ),
                },
              );
            }
          }

          if (
            aggravatingConditions !==
            undefined
          ) {
            await transaction.deficiencyAggravatingCondition.deleteMany(
              {
                where: {
                  deficiencyId,
                },
              },
            );

            if (
              aggravatingConditions.length >
              0
            ) {
              await transaction.deficiencyAggravatingCondition.createMany(
                {
                  data: valueRows(
                    deficiencyId,
                    aggravatingConditions,
                  ),
                },
              );
            }
          }

          await transaction.deficiency.update({
            where: {
              id: deficiencyId,
            },
            data: {
              nutrientCode,
              nutrientNameAr,
              nutrientNameEn,
              scientificName:
                cleanOptionalString(
                  rawBody.scientificName,
                  "الاسم العلمي",
                  220,
                ),
              classification:
                rawBody.classification ??
                existing.classification,
              mobility:
                rawBody.mobility ??
                existing.mobility,
              description:
                cleanOptionalString(
                  rawBody.description,
                  "الوصف",
                  5000,
                ),
              soilContext:
                rawBody.soilContext === null
                  ? Prisma.JsonNull
                  : rawBody.soilContext === undefined
                    ? existing.soilContext === null
                      ? Prisma.JsonNull
                      : (existing.soilContext as Prisma.InputJsonValue)
                    : (rawBody.soilContext as Prisma.InputJsonValue),
              phContext:
                rawBody.phContext === null
                  ? Prisma.JsonNull
                  : rawBody.phContext === undefined
                    ? existing.phContext === null
                      ? Prisma.JsonNull
                      : (existing.phContext as Prisma.InputJsonValue)
                    : (rawBody.phContext as Prisma.InputJsonValue),
              updatedByUserId:
                current.id,
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

          return transaction.deficiency.findUniqueOrThrow(
            {
              where: {
                id: deficiencyId,
              },
              include: {
                entity: true,
                aliases: true,
                symptoms: true,
                visualPatterns: true,
                causes: true,
                aggravatingConditions: true,
                plants: true,
                images: true,
                syncState: true,
              },
            },
          );
        },
        {
          maxWait: 10000,
          timeout: 20000,
        },
      );

    return NextResponse.json({
      success: true,
      message:
        "تم تعديل نقص العنصر بنجاح.",
      ...updated,
    });
  } catch (error) {
    if (
      error instanceof
      DeficiencyValidationError
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

    console.error(
      "PATCH /api/admin/deficiencies/[id] failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "DEFICIENCY_UPDATE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "تعذر تعديل نقص العنصر.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: RouteContext,
) {
  try {
    const current = await actor();
    const prisma = getPrismaClient();

    const { id } = await params;
    const deficiencyId = id.trim();

    if (!deficiencyId) {
      return NextResponse.json(
        {
          error: "INVALID_DEFICIENCY_ID",
          message:
            "معرّف نقص العنصر غير صحيح.",
        },
        {
          status: 400,
        },
      );
    }

    const deficiency =
      await prisma.deficiency.findUnique({
        where: {
          id: deficiencyId,
        },
        include: {
          entity: true,
          images: {
            select: {
              storageKey: true,
            },
          },
          plants: {
            select: {
              plantId: true,
            },
          },
        },
      });

    if (!deficiency) {
      return NextResponse.json(
        {
          error: "DEFICIENCY_NOT_FOUND",
          message:
            "سجل نقص العنصر غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !canHardDeleteDeficiency(
        current.role,
      )
    ) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message:
            "ليس لديك صلاحية للحذف النهائي.",
        },
        {
          status: 403,
        },
      );
    }

    if (deficiency.plants.length > 0) {
      return NextResponse.json(
        {
          error:
            "DEFICIENCY_DELETE_CONFLICT",
          message:
            "احذف روابط النباتات أولًا قبل حذف نقص العنصر نهائيًا.",
          impact: {
            plantRelationships:
              deficiency.plants.length,
            images:
              deficiency.images.length,
          },
        },
        {
          status: 409,
        },
      );
    }

    await prisma.$transaction(
      async (transaction) => {
        await Promise.all(
          deficiency.images.map((image) =>
            transaction.storageCleanupJob.upsert(
              {
                where: {
                  storageKey:
                    image.storageKey,
                },
                create: {
                  storageKey:
                    image.storageKey,
                },
                update: {
                  status: "PENDING",
                },
              },
            ),
          ),
        );

        await transaction.deficiency.delete({
          where: {
            id: deficiencyId,
          },
        });

        await transaction.knowledgeEntity.delete({
          where: {
            id: deficiencyId,
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    try {
      await new DeficiencyCleanupProcessor().processPending();
    } catch (error) {
      console.error(
        "Deficiency file cleanup failed:",
        error,
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "تم حذف نقص العنصر نهائيًا.",
      deficiency: {
        id: deficiency.id,
        nutrientCode:
          deficiency.nutrientCode,
        nutrientNameAr:
          deficiency.nutrientNameAr,
        nutrientNameEn:
          deficiency.nutrientNameEn,
      },
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/deficiencies/[id] failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "DEFICIENCY_DELETE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "تعذر حذف نقص العنصر.",
      },
      {
        status: 400,
      },
    );
  }
}
