import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import {
  canCreateDisease,
  canViewDiseases,
} from "@/lib/diseases/disease-permissions";
import { DiseaseService } from "@/lib/diseases/disease-service";
import type { DiseaseInput } from "@/schemas/disease";

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

function first(
  value: string | null,
  allowed: readonly string[],
) {
  return value && allowed.includes(value)
    ? value
    : undefined;
}

export async function GET(request: Request) {
  try {
    const current = await actor();

    if (!canViewDiseases(current.role)) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message:
            "ليس لديك صلاحية لعرض الأمراض.",
        },
        {
          status: 403,
        },
      );
    }

    const params = new URL(
      request.url,
    ).searchParams;

    const page = Math.max(
      1,
      Number.parseInt(
        params.get("page") ?? "1",
        10,
      ) || 1,
    );

    const pageSize = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(
          params.get("pageSize") ?? "20",
          10,
        ) || 20,
      ),
    );

    const q = (
      params.get("q") ?? ""
    ).trim();

    const classification = first(
      params.get("classification"),
      [
        "FUNGAL",
        "BACTERIAL",
        "VIRAL",
        "OOMYCETE",
        "PHYSIOLOGICAL_DISORDER",
      ],
    );

    const severity = first(
      params.get("severity"),
      [
        "LOW",
        "MODERATE",
        "HIGH",
        "CRITICAL",
      ],
    );

    const publicationState = first(
      params.get("publicationState"),
      [
        "DRAFT",
        "PUBLISHED",
        "ARCHIVED",
      ],
    );

    const syncStatus = first(
      params.get("syncStatus"),
      [
        "PENDING",
        "SYNCED",
        "FAILED",
      ],
    );

    const sort =
      first(params.get("sort"), [
        "updatedAt",
        "createdAt",
        "name",
      ]) ?? "updatedAt";

    const direction: Prisma.SortOrder =
      params.get("direction") === "asc"
        ? "asc"
        : "desc";

    const where: Prisma.DiseaseWhereInput = {
      ...(classification
        ? {
            classification:
              classification as Prisma.EnumDiseaseClassificationFilter["equals"],
          }
        : {}),

      ...(severity
        ? {
            severity:
              severity as Prisma.EnumDiseaseSeverityFilter["equals"],
          }
        : {}),

      ...(publicationState
        ? {
            entity: {
              publicationState:
                publicationState as Prisma.EnumKnowledgePublicationStateFilter["equals"],
            },
          }
        : {}),

      ...(syncStatus
        ? {
            syncState: {
              is: {
                status:
                  syncStatus as Prisma.EnumKnowledgeSyncStatusFilter["equals"],
              },
            },
          }
        : {}),

      ...(q
        ? {
            OR: [
              {
                entity: {
                  name: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              },
              {
                scientificName: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                aliases: {
                  some: {
                    normalizedValue: {
                      contains:
                        q.toLowerCase(),
                    },
                  },
                },
              },
              {
                symptoms: {
                  some: {
                    normalizedValue: {
                      contains:
                        q.toLowerCase(),
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const db = getPrismaClient();

    const include = {
      entity: true,
      aliases: true,
      symptoms: true,
      images: {
        orderBy: {
          sortOrder: "asc" as const,
        },
      },
      syncState: true,
      plants: true,
    };

    const orderBy: Prisma.DiseaseOrderByWithRelationInput =
      sort === "name"
        ? {
            entity: {
              name: direction,
            },
          }
        : {
            [sort]: direction,
          };

    const [items, total] =
      await Promise.all([
        db.disease.findMany({
          where,
          include,
          skip:
            (page - 1) * pageSize,
          take: pageSize,
          orderBy,
        }),

        db.disease.count({
          where,
        }),
      ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(
        1,
        Math.ceil(total / pageSize),
      ),
    });
  } catch (error) {
    console.error(
      "GET /api/admin/diseases failed:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Access denied";

    return NextResponse.json(
      {
        error:
          message === "UNAUTHORIZED"
            ? "UNAUTHORIZED"
            : "DISEASE_LIST_FAILED",
        message:
          message === "UNAUTHORIZED"
            ? "يجب تسجيل الدخول أولًا."
            : "تعذر تحميل قائمة الأمراض.",
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

export async function POST(
  request: Request,
) {
  try {
    const current = await actor();

    if (!canCreateDisease(current.role)) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message:
            "ليس لديك صلاحية لإضافة الأمراض.",
        },
        {
          status: 403,
        },
      );
    }

    const body: unknown =
      await request.json();

    console.log(
      "POST /api/admin/diseases payload:",
      body,
    );

    const disease =
      await new DiseaseService().create(
        body as DiseaseInput,
        current,
      );

    return NextResponse.json(disease, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "POST /api/admin/diseases failed:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Disease could not be created";

    const normalizedMessage =
      message.toLowerCase();

    const status =
      message === "UNAUTHORIZED"
        ? 401
        : normalizedMessage.includes(
              "unique",
            ) ||
            normalizedMessage.includes(
              "already exists",
            ) ||
            normalizedMessage.includes(
              "duplicate",
            )
          ? 409
          : 400;

    return NextResponse.json(
      {
        error:
          status === 401
            ? "UNAUTHORIZED"
            : status === 409
              ? "DISEASE_CONFLICT"
              : "DISEASE_CREATE_FAILED",
        message:
          message === "UNAUTHORIZED"
            ? "يجب تسجيل الدخول أولًا."
            : message,
      },
      {
        status,
      },
    );
  }
}
