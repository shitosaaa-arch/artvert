import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/db/prisma";
import { requireCustomerAdmin } from "@/lib/customers/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "SOLD",
  "NOT_INTERESTED",
] as const;

type LeadStatus =
  (typeof LEAD_STATUSES)[number];

type UpdateLeadBody = {
  phone?: unknown;
  status?: unknown;
  note?: unknown;
};

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

function isLeadStatus(
  value: unknown,
): value is LeadStatus {
  return (
    typeof value === "string" &&
    LEAD_STATUSES.includes(
      value as LeadStatus,
    )
  );
}

function normalizeNote(
  value: unknown,
) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 1000);
}

export async function PATCH(
  request: Request,
) {
  try {
    const actor =
      await requireCustomerAdmin();

    const body =
      (await request.json()) as UpdateLeadBody;

    const phone =
      typeof body.phone === "string"
        ? normalizePhone(body.phone)
        : "";

    if (!phone) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "رقم واتساب مطلوب.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isLeadStatus(body.status)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "حالة المتابعة غير صالحة.",
        },
        {
          status: 400,
        },
      );
    }

    const note =
      normalizeNote(body.note);

    const prisma =
      getPrismaClient();

    /*
     * نحاول ربط الرقم بحساب Customer
     * لو الرقم موجود في عنوان أو طلب سابق.
     */
    const phoneSuffix =
      phone.length > 10
        ? phone.slice(-10)
        : phone;

    const address =
      await prisma.customerAddress.findFirst({
        where: {
          OR: [
            {
              phone: {
                endsWith:
                  phoneSuffix,
              },
            },
            {
              alternativePhone: {
                endsWith:
                  phoneSuffix,
              },
            },
          ],
        },
        select: {
          customerId: true,
        },
      });

    let customerId =
      address?.customerId ?? null;

    if (!customerId) {
      const order =
        await prisma.order.findFirst({
          where: {
            customerId: {
              not: null,
            },
            OR: [
              {
                phone: {
                  endsWith:
                    phoneSuffix,
                },
              },
              {
                alternativePhone: {
                  endsWith:
                    phoneSuffix,
                },
              },
            ],
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            customerId: true,
          },
        });

      customerId =
        order?.customerId ?? null;
    }

    const log =
      await prisma.customerAuditLog.create({
        data: {
          customerId,
          actorType: "STAFF",
          action:
            "WHATSAPP_LEAD_STATUS_UPDATED",
          targetType:
            "WHATSAPP_LEAD",
          targetId:
            customerId,
          metadata: {
            phone,
            status: body.status,
            note:
              note || null,
            source:
              "ADMIN_CUSTOMERS",
            staffUserId:
              actor.id,
          },
        },
        select: {
          id: true,
          customerId: true,
          createdAt: true,
          metadata: true,
        },
      });

    return NextResponse.json({
      ok: true,
      lead: {
        id: log.id,
        phone,
        status: body.status,
        note,
        customerId:
          log.customerId,
        updatedAt:
          log.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "[whatsapp-lead-update]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "UPDATE_FAILED",
      },
      {
        status: 400,
      },
    );
  }
}