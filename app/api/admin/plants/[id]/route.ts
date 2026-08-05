import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
            "ليس لديك صلاحية لحذف النباتات.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    authorized: true as const,
    token,
  };
}

function isRecordNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function isForeignKeyConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
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
    const plantId = id.trim();

    if (!plantId) {
      return NextResponse.json(
        {
          error: "INVALID_PLANT_ID",
          message: "معرّف النبات غير صحيح.",
        },
        {
          status: 400,
        },
      );
    }

    const plant = await prisma.plant.findUnique({
      where: {
        id: plantId,
      },
      select: {
        id: true,
        entity: {
          select: {
            name: true,
            slug: true,
            publicationState: true,
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
            images: true,
            diseases: true,
            pests: true,
            deficiencies: true,
            productRecommendations: true,
            savedByCustomers: true,
          },
        },
      },
    });

    if (!plant) {
      return NextResponse.json(
        {
          error: "PLANT_NOT_FOUND",
          message: "النبات غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.$transaction(
      async (transaction) => {
        if (plant.images.length > 0) {
          await transaction.storageCleanupJob.createMany({
            data: plant.images.map((image) => ({
              storageKey: image.storageKey,
              status: "PENDING",
            })),
            skipDuplicates: true,
          });
        }

        await transaction.plant.delete({
          where: {
            id: plantId,
          },
        });

        await transaction.knowledgeEntity.delete({
          where: {
            id: plantId,
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
      message: "تم حذف النبات نهائيًا.",
      plant: {
        id: plant.id,
        name: plant.entity.name,
        slug: plant.entity.slug,
        publicationState:
          plant.entity.publicationState,
        deletedRelations: {
          aliases: plant._count.aliases,
          images: plant._count.images,
          diseases: plant._count.diseases,
          pests: plant._count.pests,
          deficiencies:
            plant._count.deficiencies,
          productRecommendations:
            plant._count
              .productRecommendations,
          savedByCustomers:
            plant._count.savedByCustomers,
        },
      },
    });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json(
        {
          error: "PLANT_NOT_FOUND",
          message: "النبات غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    if (isForeignKeyConflict(error)) {
      return NextResponse.json(
        {
          error: "PLANT_DELETE_CONFLICT",
          message:
            "تعذر حذف النبات لأنه مرتبط ببيانات تمنع الحذف.",
        },
        {
          status: 409,
        },
      );
    }

    console.error(
      "DELETE /api/admin/plants/[id] failed",
      error,
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          "تعذر حذف النبات حاليًا. حاول مرة أخرى.",
      },
      {
        status: 500,
      },
    );
  }
}
