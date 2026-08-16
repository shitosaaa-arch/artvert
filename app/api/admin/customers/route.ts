import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/db/prisma";
import { requireCustomerAdmin } from "@/lib/customers/staff";
import { auditCustomer } from "@/lib/customers/audit";

/**
 * Staff receive only operational metadata.
 * Customer diagnoses, images, exports, tokens and sessions
 * are never selected here.
 */

type WhatsAppMetadata = {
  phone?: unknown;
  buttonText?: unknown;
  buttonPayload?: unknown;
  messageId?: unknown;
  timestamp?: unknown;
  source?: unknown;
};

function getMetadataString(
  metadata: WhatsAppMetadata | null,
  key: keyof WhatsAppMetadata,
) {
  const value = metadata?.[key];

  return typeof value === "string"
    ? value
    : null;
}

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

export async function GET(request: Request) {
  try {
    await requireCustomerAdmin();

    const params =
      new URL(request.url).searchParams;

    const page = Math.max(
      1,
      Number(params.get("page") ?? 1),
    );

    const query = (
      params.get("q") ?? ""
    )
      .trim()
      .slice(0, 100);

    const where = query
      ? {
          OR: [
            {
              email: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
            {
              displayName: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    const prisma = getPrismaClient();

    const [
      items,
      total,
      whatsappAuditLogs,
    ] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          active: true,
          emailVerifiedAt: true,
          createdAt: true,
          deletionRequestedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
        skip: (page - 1) * 50,
      }),

      prisma.customer.count({
        where,
      }),

      prisma.customerAuditLog.findMany({
        where: {
          action: {
            in: [
              "WHATSAPP_INTERESTED",
              "WHATSAPP_OPT_OUT",
            ],
          },
        },
        select: {
          id: true,
          action: true,
          customerId: true,
          metadata: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              email: true,
              displayName: true,
              active: true,
              marketingOptIn: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        /*
         * نقرأ آخر الأحداث فقط ثم نحدد
         * أحدث حالة لكل رقم واتساب.
         */
        take: 1000,
      }),
    ]);

    /*
     * بما إن النتائج مرتبة من الأحدث للأقدم،
     * أول Event لكل رقم هو حالته الحالية.
     */
    const latestByPhone = new Map<
      string,
      (typeof whatsappAuditLogs)[number]
    >();

    for (const log of whatsappAuditLogs) {
      const metadata =
        log.metadata &&
        typeof log.metadata === "object" &&
        !Array.isArray(log.metadata)
          ? (log.metadata as WhatsAppMetadata)
          : null;

      const rawPhone =
        getMetadataString(
          metadata,
          "phone",
        );

      if (!rawPhone) {
        continue;
      }

      const phone =
        normalizePhone(rawPhone);

      if (!phone) {
        continue;
      }

      if (!latestByPhone.has(phone)) {
        latestByPhone.set(
          phone,
          log,
        );
      }
    }

    const normalizedQuery =
      query.toLowerCase();

    const whatsappItems = Array.from(
      latestByPhone.entries(),
    )
      /*
       * لو أحدث إجراء هو إيقاف الرسائل،
       * لا نعرضه ضمن قائمة المهتمين.
       */
      .filter(
        ([, log]) =>
          log.action ===
          "WHATSAPP_INTERESTED",
      )
      .map(([phone, log]) => {
        const metadata =
          log.metadata &&
          typeof log.metadata === "object" &&
          !Array.isArray(log.metadata)
            ? (log.metadata as WhatsAppMetadata)
            : null;

        return {
          id: log.id,
          phone,
          status: "INTERESTED",
          source: "WHATSAPP",
          createdAt:
            log.createdAt,
          messageId:
            getMetadataString(
              metadata,
              "messageId",
            ),
          buttonText:
            getMetadataString(
              metadata,
              "buttonText",
            ),
          linkedCustomerId:
            log.customer?.id ??
            log.customerId ??
            null,
          linkedCustomerName:
            log.customer
              ?.displayName ??
            null,
          linkedCustomerEmail:
            log.customer?.email ??
            null,
          linkedCustomerActive:
            log.customer?.active ??
            null,
          marketingOptIn:
            log.customer
              ?.marketingOptIn ??
            null,
        };
      })
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        return (
          item.phone
            .toLowerCase()
            .includes(
              normalizedQuery,
            ) ||
          item.linkedCustomerName
            ?.toLowerCase()
            .includes(
              normalizedQuery,
            ) ||
          item.linkedCustomerEmail
            ?.toLowerCase()
            .includes(
              normalizedQuery,
            )
        );
      });

    return NextResponse.json({
      items,
      total,
      page,

      whatsappItems,
      whatsappTotal:
        whatsappItems.length,
    });
  } catch (error) {
    console.error(
      "[admin-customers-get]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "STAFF_FORBIDDEN",
      },
      {
        status: 403,
      },
    );
  }
}

export async function PATCH(
  request: Request,
) {
  try {
    const actor =
      await requireCustomerAdmin();

    const body =
      await request.json();

    if (
      typeof body.id !==
        "string" ||
      typeof body.active !==
        "boolean"
    ) {
      throw new Error(
        "INVALID_CUSTOMER_UPDATE",
      );
    }

    const prisma =
      getPrismaClient();

    const customer =
      await prisma.customer.update({
        where: {
          id: body.id,
        },
        data: {
          active: body.active,
        },
      });

    if (!body.active) {
      await prisma.customerSession.updateMany(
        {
          where: {
            customerId:
              customer.id,
            revokedAt: null,
          },
          data: {
            revokedAt:
              new Date(),
          },
        },
      );
    }

    await auditCustomer(
      "STAFF_CUSTOMER_STATUS_CHANGED",
      "Customer",
      {
        customerId:
          customer.id,
        targetId: actor.id,
        actorType: "STAFF",
        metadata: {
          active: body.active,
        },
      },
    );

    return NextResponse.json({
      id: customer.id,
      active: customer.active,
    });
  } catch (error) {
    return NextResponse.json(
      {
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