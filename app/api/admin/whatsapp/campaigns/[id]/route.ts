import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/db/prisma";
import { requireCustomerAdmin } from "@/lib/customers/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireCustomerAdmin();

    const params = await context.params;

    const campaignId =
      params.id?.trim() ?? "";

    if (!campaignId) {
      return NextResponse.json(
        {
          ok: false,
          error: "معرف الحملة مطلوب.",
        },
        {
          status: 400,
        },
      );
    }

    const prisma =
      getPrismaClient();

    const campaign =
      await prisma.whatsAppCampaign.findUnique({
        where: {
          id: campaignId,
        },

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
      });

    if (!campaign) {
      return NextResponse.json(
        {
          ok: false,
          error: "الحملة غير موجودة.",
        },
        {
          status: 404,
        },
      );
    }

    const recipients =
      await prisma.whatsAppCampaignRecipient.findMany({
        where: {
          campaignId,
        },

        orderBy: [
          {
            status: "asc",
          },
          {
            createdAt: "asc",
          },
        ],

        select: {
          id: true,
          phone: true,
          displayName: true,
          status: true,
          blockedReason: true,
          failureReason: true,
          metaMessageId: true,
          attemptCount: true,
          lastAttemptAt: true,
          sentAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      ok: true,

      campaign: {
        ...campaign,
        recipients,
      },
    });
  } catch (error) {
    console.error(
      "[whatsapp-campaign-details]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "WHATSAPP_CAMPAIGN_DETAILS_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}