import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/db/prisma";
import { requireCustomerAdmin } from "@/lib/customers/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePositiveInteger(
  value: string | null,
  fallback: number,
) {
  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return Math.floor(parsed);
}

export async function GET(
  request: Request,
) {
  try {
    await requireCustomerAdmin();

    const url =
      new URL(request.url);

    const page =
      parsePositiveInteger(
        url.searchParams.get("page"),
        1,
      );

    const pageSizeRaw =
      parsePositiveInteger(
        url.searchParams.get("pageSize"),
        20,
      );

    const pageSize =
      Math.min(pageSizeRaw, 100);

    const prisma =
      getPrismaClient();

    const [
      campaigns,
      total,
    ] = await Promise.all([
      prisma.whatsAppCampaign.findMany({
        orderBy: {
          createdAt: "desc",
        },

        skip:
          (page - 1) *
          pageSize,

        take: pageSize,

        select: {
          id: true,
          name: true,
          templateName: true,
          languageCode: true,
          status: true,
          totalRecipients: true,
          pendingCount: true,
          sentCount: true,
          failedCount: true,
          blockedCount: true,
          sourceFileName: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      prisma.whatsAppCampaign.count(),
    ]);

    return NextResponse.json({
      ok: true,

      pagination: {
        page,
        pageSize,
        total,
        totalPages:
          Math.max(
            1,
            Math.ceil(
              total / pageSize,
            ),
          ),
      },

      campaigns,
    });
  } catch (error) {
    console.error(
      "[whatsapp-campaigns-list]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "WHATSAPP_CAMPAIGNS_LIST_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}