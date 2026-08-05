import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  KnowledgeEntityType,
  KnowledgePublicationState,
  KnowledgeSyncStatus,
  Prisma,
  ProductImageOwnership,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ALIASES = 100;
const MAX_BENEFITS = 100;
const MAX_CROPS = 200;
const MAX_IMAGES = 20;

type UnknownRecord = Record<string, unknown>;

type ProductImageInput = {
  url: string;
  alt: string;
  sortOrder: number;
};

type CreateProductPayload = {
  slug: string;
  category: string;
  nameAr: string;
  nameEn: string;
  shortDescription: string;
  description: string;
  composition: string;
  dosage: string;
  packageSize: string;
  price: number;
  comparePrice: number | null;
  publicationState: KnowledgePublicationState;
  aliases: string[];
  benefits: string[];
  crops: string[];
  images: ProductImageInput[];
};

class ProductValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductValidationError";
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
    throw new ProductValidationError(
      `حقل ${fieldName} مطلوب.`,
    );
  }

  const cleaned = value.trim();

  if (!cleaned) {
    throw new ProductValidationError(
      `حقل ${fieldName} مطلوب.`,
    );
  }

  if (cleaned.length > maxLength) {
    throw new ProductValidationError(
      `حقل ${fieldName} أطول من الحد المسموح.`,
    );
  }

  return cleaned;
}

function cleanStringArray(
  value: unknown,
  fieldName: string,
  maximumItems: number,
  required: boolean,
) {
  if (!Array.isArray(value)) {
    if (!required && value === undefined) {
      return [];
    }

    throw new ProductValidationError(
      `قائمة ${fieldName} غير صحيحة.`,
    );
  }

  const cleanedItems = value
    .map((item) => {
      if (typeof item !== "string") {
        return "";
      }

      return item.trim();
    })
    .filter(Boolean);

  if (required && cleanedItems.length === 0) {
    throw new ProductValidationError(
      `أضف عنصرًا واحدًا على الأقل في ${fieldName}.`,
    );
  }

  if (cleanedItems.length > maximumItems) {
    throw new ProductValidationError(
      `عدد عناصر ${fieldName} أكبر من الحد المسموح.`,
    );
  }

  return Array.from(new Set(cleanedItems));
}

function normalizeSlug(value: unknown) {
  const slug = cleanRequiredString(
    value,
    "رابط المنتج",
    160,
  )
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    throw new ProductValidationError(
      "رابط المنتج يجب أن يحتوي على حروف إنجليزية أو أرقام.",
    );
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ProductValidationError(
      "صيغة رابط المنتج غير صحيحة.",
    );
  }

  return slug;
}

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function validatePublicationState(
  value: unknown,
): KnowledgePublicationState {
  if (
    value === KnowledgePublicationState.DRAFT ||
    value === KnowledgePublicationState.PUBLISHED ||
    value === KnowledgePublicationState.ARCHIVED
  ) {
    return value;
  }

  throw new ProductValidationError(
    "حالة نشر المنتج غير صحيحة.",
  );
}

function validateMoney(
  value: unknown,
  fieldName: string,
  required: boolean,
) {
  if (
    !required &&
    (value === undefined ||
      value === null ||
      value === "")
  ) {
    return null;
  }

  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0
  ) {
    throw new ProductValidationError(
      `${fieldName} يجب أن يكون رقمًا أكبر من صفر.`,
    );
  }

  const roundedValue =
    Math.round(numericValue * 100) / 100;

  if (roundedValue > 99999999.99) {
    throw new ProductValidationError(
      `${fieldName} أكبر من الحد المسموح.`,
    );
  }

  return roundedValue;
}

function validateImages(value: unknown): ProductImageInput[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ProductValidationError(
      "قائمة صور المنتج غير صحيحة.",
    );
  }

  if (value.length > MAX_IMAGES) {
    throw new ProductValidationError(
      "عدد صور المنتج أكبر من الحد المسموح.",
    );
  }

  const normalizedImages = value.map(
    (image, index): ProductImageInput => {
      if (!isRecord(image)) {
        throw new ProductValidationError(
          `بيانات الصورة رقم ${index + 1} غير صحيحة.`,
        );
      }

      const url = cleanRequiredString(
        image.url,
        `رابط الصورة رقم ${index + 1}`,
        1000,
      );

      const isLocalUrl = url.startsWith("/");
      const isExternalUrl =
        url.startsWith("https://") ||
        url.startsWith("http://");

      if (!isLocalUrl && !isExternalUrl) {
        throw new ProductValidationError(
          `رابط الصورة رقم ${index + 1} غير صحيح.`,
        );
      }

      const alt =
        typeof image.alt === "string" &&
        image.alt.trim()
          ? image.alt.trim().slice(0, 300)
          : `صورة المنتج ${index + 1}`;

      return {
        url,
        alt,
        sortOrder: index,
      };
    },
  );

  const uniqueUrls = new Set<string>();

  for (const image of normalizedImages) {
    if (uniqueUrls.has(image.url)) {
      throw new ProductValidationError(
        "يوجد رابط صورة مكرر.",
      );
    }

    uniqueUrls.add(image.url);
  }

  return normalizedImages;
}

function validatePayload(value: unknown): CreateProductPayload {
  if (!isRecord(value)) {
    throw new ProductValidationError(
      "بيانات المنتج غير صحيحة.",
    );
  }

  const price = validateMoney(
    value.price,
    "السعر الأساسي",
    true,
  );

  if (price === null) {
    throw new ProductValidationError(
      "السعر الأساسي مطلوب.",
    );
  }

  const comparePrice = validateMoney(
    value.comparePrice,
    "السعر قبل الخصم",
    false,
  );

  if (
    comparePrice !== null &&
    comparePrice <= price
  ) {
    throw new ProductValidationError(
      "السعر قبل الخصم يجب أن يكون أكبر من السعر الأساسي.",
    );
  }

  return {
    slug: normalizeSlug(value.slug),
    category: cleanRequiredString(
      value.category,
      "التصنيف",
      120,
    ),
    nameAr: cleanRequiredString(
      value.nameAr,
      "اسم المنتج بالعربية",
      200,
    ),
    nameEn: cleanRequiredString(
      value.nameEn,
      "اسم المنتج بالإنجليزية",
      200,
    ),
    shortDescription: cleanRequiredString(
      value.shortDescription,
      "الوصف المختصر",
      500,
    ),
    description: cleanRequiredString(
      value.description,
      "الوصف الكامل",
      5000,
    ),
    composition: cleanRequiredString(
      value.composition,
      "التركيب",
      3000,
    ),
    dosage: cleanRequiredString(
      value.dosage,
      "الجرعة",
      3000,
    ),
    packageSize: cleanRequiredString(
      value.packageSize,
      "حجم العبوة",
      120,
    ),
    price,
    comparePrice,
    publicationState: validatePublicationState(
      value.publicationState,
    ),
    aliases: cleanStringArray(
      value.aliases,
      "الأسماء البديلة",
      MAX_ALIASES,
      false,
    ),
    benefits: cleanStringArray(
      value.benefits,
      "الفوائد",
      MAX_BENEFITS,
      true,
    ),
    crops: cleanStringArray(
      value.crops,
      "المحاصيل والاستخدامات",
      MAX_CROPS,
      true,
    ),
    images: validateImages(value.images),
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
    role !== "SUPER_ADMIN"
  ) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          error: "FORBIDDEN",
          message:
            "ليس لديك صلاحية لإضافة المنتجات.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  const userId =
    typeof token.sub === "string"
      ? token.sub.trim()
      : "";

  if (!userId) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          error: "INVALID_SESSION",
          message:
            "جلسة المستخدم لا تحتوي على معرّف صالح.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  return {
    authorized: true as const,
    userId,
  };
}

function getImageOwnership(
  url: string,
): ProductImageOwnership {
  if (url.startsWith("/")) {
    return ProductImageOwnership.LEGACY_PUBLIC;
  }

  return ProductImageOwnership.EXTERNAL;
}

function buildKnowledgePayload(
  payload: CreateProductPayload,
) {
  return {
    slug: payload.slug,
    category: payload.category,
    nameAr: payload.nameAr,
    nameEn: payload.nameEn,
    shortDescription: payload.shortDescription,
    description: payload.description,
    composition: payload.composition,
    dosage: payload.dosage,
    packageSize: payload.packageSize,
    price: payload.price,
    comparePrice: payload.comparePrice,
    aliases: payload.aliases,
    benefits: payload.benefits,
    crops: payload.crops,
    images: payload.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
  };
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isForeignKeyError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeAdmin(request);

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
            "يجب إرسال بيانات المنتج بصيغة JSON.",
        },
        {
          status: 415,
        },
      );
    }

    const rawBody: unknown = await request.json();
    const payload = validatePayload(rawBody);

    const activeUser = await prisma.user.findFirst({
      where: {
        id: authorization.userId,
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (!activeUser) {
      return NextResponse.json(
        {
          error: "USER_NOT_FOUND",
          message:
            "حساب المستخدم غير موجود أو غير نشط.",
        },
        {
          status: 403,
        },
      );
    }

    const existingEntity =
      await prisma.knowledgeEntity.findUnique({
        where: {
          type_slug: {
            type: KnowledgeEntityType.PRODUCT,
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
          error: "PRODUCT_SLUG_EXISTS",
          message:
            "يوجد منتج آخر يستخدم نفس رابط المنتج.",
        },
        {
          status: 409,
        },
      );
    }

    const productId = crypto.randomUUID();
    const knowledgePayload =
      buildKnowledgePayload(payload);

    await prisma.$transaction(
      async (transaction) => {
        await transaction.knowledgeEntity.create({
          data: {
            id: productId,
            type: KnowledgeEntityType.PRODUCT,
            slug: payload.slug,
            name: payload.nameAr,
            payload: knowledgePayload,
            schemaVersion: 1,
            publicationState:
              payload.publicationState,
          },
        });

        await transaction.product.create({
          data: {
            id: productId,
            category: payload.category,
            nameAr: payload.nameAr,
            nameEn: payload.nameEn,
            shortDescription:
              payload.shortDescription,
            description: payload.description,
            composition: payload.composition,
            dosage: payload.dosage,
            packageSize: payload.packageSize,
            price: new Prisma.Decimal(
              payload.price.toFixed(2),
            ),
            comparePrice:
              payload.comparePrice === null
                ? null
                : new Prisma.Decimal(
                    payload.comparePrice.toFixed(2),
                  ),
            benefits: payload.benefits,
            crops: payload.crops,
            createdByUserId: activeUser.id,

            aliases:
              payload.aliases.length > 0
                ? {
                    create: payload.aliases.map(
                      (alias) => ({
                        value: alias,
                        normalizedValue:
                          normalizeSearchValue(alias),
                        locale: null,
                      }),
                    ),
                  }
                : undefined,

            images:
              payload.images.length > 0
                ? {
                    create: payload.images.map(
                      (image) => ({
                        ownership: getImageOwnership(
                          image.url,
                        ),
                        storageKey: null,
                        url: image.url,
                        alt: image.alt,
                        contentType: null,
                        fileSize: null,
                        width: null,
                        height: null,
                        checksum: null,
                        sortOrder:
                          image.sortOrder,
                      }),
                    ),
                  }
                : undefined,

            syncState: {
              create: {
                status:
                  KnowledgeSyncStatus.PENDING,
                lastSyncedAt: null,
                diagnosticCode: null,
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

    const product =
      await prisma.product.findUniqueOrThrow({
        where: {
          id: productId,
        },
        select: {
          id: true,
          category: true,
          nameAr: true,
          nameEn: true,
          packageSize: true,
          price: true,
          comparePrice: true,
          createdAt: true,
          entity: {
            select: {
              slug: true,
              publicationState: true,
              schemaVersion: true,
            },
          },
          images: {
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              id: true,
              url: true,
              alt: true,
              ownership: true,
              sortOrder: true,
            },
          },
          aliases: {
            orderBy: {
              value: "asc",
            },
            select: {
              id: true,
              value: true,
              normalizedValue: true,
            },
          },
          syncState: {
            select: {
              status: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "تم إضافة المنتج بنجاح.",
        product: {
          id: product.id,
          slug: product.entity.slug,
          category: product.category,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          packageSize: product.packageSize,
          price: String(product.price),
          comparePrice:
            product.comparePrice == null
              ? null
              : String(product.comparePrice),
          publicationState:
            product.entity.publicationState,
          schemaVersion:
            product.entity.schemaVersion,
          syncStatus:
            product.syncState?.status ?? "PENDING",
          createdAt:
            product.createdAt.toISOString(),
          aliases: product.aliases,
          images: product.images,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (error instanceof ProductValidationError) {
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
            "صيغة بيانات المنتج غير صحيحة.",
        },
        {
          status: 400,
        },
      );
    }

    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        {
          error: "DUPLICATE_PRODUCT",
          message:
            "يوجد منتج آخر بنفس الرابط أو إحدى البيانات الفريدة.",
        },
        {
          status: 409,
        },
      );
    }

    if (isForeignKeyError(error)) {
      return NextResponse.json(
        {
          error: "INVALID_USER",
          message:
            "تعذر ربط المنتج بحساب المستخدم الحالي.",
        },
        {
          status: 400,
        },
      );
    }

    console.error(
      "POST /api/admin/products failed",
      error,
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          "تعذر حفظ المنتج حاليًا. حاول مرة أخرى.",
      },
      {
        status: 500,
      },
    );
  }
}