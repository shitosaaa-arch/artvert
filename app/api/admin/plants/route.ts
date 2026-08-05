import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  KnowledgeEntityType,
  KnowledgePublicationState,
  PlantCategory,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NAME_LENGTH = 200;
const MAX_SLUG_LENGTH = 160;
const MAX_SCIENTIFIC_NAME_LENGTH = 220;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_ALIAS_LENGTH = 200;
const MAX_ALIASES = 50;

type UnknownRecord = Record<string, unknown>;

type CreatePlantPayload = {
  name: string;
  slug: string;
  category: PlantCategory;
  scientificName: string | null;
  description: string | null;
  publicationState: KnowledgePublicationState;
  aliases: string[];
};

class PlantValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlantValidationError";
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
    throw new PlantValidationError(
      `حقل ${fieldName} مطلوب.`,
    );
  }

  const cleaned = value.trim();

  if (!cleaned) {
    throw new PlantValidationError(
      `حقل ${fieldName} مطلوب.`,
    );
  }

  if (cleaned.length > maxLength) {
    throw new PlantValidationError(
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
    throw new PlantValidationError(
      `حقل ${fieldName} غير صحيح.`,
    );
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  if (cleaned.length > maxLength) {
    throw new PlantValidationError(
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

function isPlantCategory(
  value: unknown,
): value is PlantCategory {
  return (
    typeof value === "string" &&
    Object.values(PlantCategory).includes(
      value as PlantCategory,
    )
  );
}

function isPublicationState(
  value: unknown,
): value is KnowledgePublicationState {
  return (
    typeof value === "string" &&
    Object.values(
      KnowledgePublicationState,
    ).includes(
      value as KnowledgePublicationState,
    )
  );
}

function validateAliases(value: unknown) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new PlantValidationError(
      "قائمة الأسماء البديلة غير صحيحة.",
    );
  }

  if (value.length > MAX_ALIASES) {
    throw new PlantValidationError(
      "عدد الأسماء البديلة أكبر من الحد المسموح.",
    );
  }

  const aliases = value
    .map((alias, index) =>
      cleanRequiredString(
        alias,
        `الاسم البديل رقم ${index + 1}`,
        MAX_ALIAS_LENGTH,
      ),
    )
    .filter(Boolean);

  const normalizedAliases = aliases.map(
    normalizeSearchValue,
  );

  if (
    new Set(normalizedAliases).size !==
    normalizedAliases.length
  ) {
    throw new PlantValidationError(
      "يوجد اسم بديل مكرر.",
    );
  }

  return aliases;
}

function validatePayload(
  value: unknown,
): CreatePlantPayload {
  if (!isRecord(value)) {
    throw new PlantValidationError(
      "بيانات النبات غير صحيحة.",
    );
  }

  const name = cleanRequiredString(
    value.name,
    "اسم النبات",
    MAX_NAME_LENGTH,
  );

  const rawSlug = cleanRequiredString(
    value.slug,
    "الرابط المختصر",
    MAX_SLUG_LENGTH,
  );

  const slug = normalizeSlug(rawSlug);

  if (!slug) {
    throw new PlantValidationError(
      "الرابط المختصر غير صحيح.",
    );
  }

  if (!isPlantCategory(value.category)) {
    throw new PlantValidationError(
      "تصنيف النبات غير مدعوم.",
    );
  }

  if (
    !isPublicationState(
      value.publicationState,
    )
  ) {
    throw new PlantValidationError(
      "حالة النشر غير مدعومة.",
    );
  }

  return {
    name,
    slug,
    category: value.category,
    scientificName: cleanOptionalString(
      value.scientificName,
      "الاسم العلمي",
      MAX_SCIENTIFIC_NAME_LENGTH,
    ),
    description: cleanOptionalString(
      value.description,
      "الوصف",
      MAX_DESCRIPTION_LENGTH,
    ),
    publicationState:
      value.publicationState,
    aliases: validateAliases(value.aliases),
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
            "ليس لديك صلاحية لإضافة النباتات.",
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

function isUniqueConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function POST(request: NextRequest) {
  try {
    const authorization =
      await authorizeAdmin(request);

    if (!authorization.authorized) {
      return authorization.response;
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
            "يجب إرسال بيانات النبات بصيغة JSON.",
        },
        {
          status: 415,
        },
      );
    }

    const rawBody: unknown = await request.json();
    const payload = validatePayload(rawBody);

    const existingEntity =
      await prisma.knowledgeEntity.findUnique({
        where: {
          type_slug: {
            type: KnowledgeEntityType.PLANT,
            slug: payload.slug,
          },
        },
        select: {
          id: true,
        },
      });

    if (existingEntity) {
      return NextResponse.json(
        {
          error: "PLANT_SLUG_EXISTS",
          message:
            "يوجد نبات بنفس الرابط المختصر.",
        },
        {
          status: 409,
        },
      );
    }

    const plantId = crypto.randomUUID();

    const createdPlant = await prisma.$transaction(
      async (transaction) => {
        await transaction.knowledgeEntity.create({
          data: {
            id: plantId,
            type: KnowledgeEntityType.PLANT,
            slug: payload.slug,
            name: payload.name,
            payload: {
              name: payload.name,
              slug: payload.slug,
              category: payload.category,
              scientificName:
                payload.scientificName,
              description: payload.description,
              aliases: payload.aliases,
            },
            schemaVersion: 1,
            publicationState:
              payload.publicationState,
          },
        });

        const plant = await transaction.plant.create({
          data: {
            id: plantId,
            category: payload.category,
            scientificName:
              payload.scientificName,
            description: payload.description,
            createdByUserId:
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
            syncState: {
              create: {
                status: "PENDING",
              },
            },
          },
          select: {
            id: true,
            category: true,
            scientificName: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            entity: {
              select: {
                slug: true,
                name: true,
                publicationState: true,
              },
            },
            aliases: {
              orderBy: {
                value: "asc",
              },
              select: {
                id: true,
                value: true,
              },
            },
          },
        });

        return plant;
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: "تم إضافة النبات بنجاح.",
        plant: {
          id: createdPlant.id,
          slug: createdPlant.entity.slug,
          name: createdPlant.entity.name,
          publicationState:
            createdPlant.entity
              .publicationState,
          category: createdPlant.category,
          scientificName:
            createdPlant.scientificName,
          description:
            createdPlant.description,
          aliases: createdPlant.aliases,
          createdAt:
            createdPlant.createdAt.toISOString(),
          updatedAt:
            createdPlant.updatedAt.toISOString(),
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (error instanceof PlantValidationError) {
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
            "صيغة بيانات النبات غير صحيحة.",
        },
        {
          status: 400,
        },
      );
    }

    if (isUniqueConflict(error)) {
      return NextResponse.json(
        {
          error: "PLANT_ALREADY_EXISTS",
          message:
            "يوجد نبات بنفس الرابط أو اسم بديل مكرر.",
        },
        {
          status: 409,
        },
      );
    }

    console.error(
      "POST /api/admin/plants failed",
      error,
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          "تعذر إضافة النبات حاليًا. حاول مرة أخرى.",
      },
      {
        status: 500,
      },
    );
  }
}
