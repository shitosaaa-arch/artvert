import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type SendTemplateBody = {
  to?: string;
};

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function getPhoneSuffix(value: string) {
  const normalized = normalizePhoneNumber(value);

  if (normalized.length <= 10) {
    return normalized;
  }

  return normalized.slice(-10);
}

async function hasWhatsAppOptedOut(phone: string) {
  const suffix = getPhoneSuffix(phone);

  if (!suffix) {
    return false;
  }

  const recentLogs =
    await prisma.customerAuditLog.findMany({
      where: {
        action: {
          in: [
            "WHATSAPP_INTERESTED",
            "WHATSAPP_OPT_OUT",
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
      select: {
        action: true,
        metadata: true,
      },
    });

  for (const log of recentLogs) {
    if (
      !log.metadata ||
      typeof log.metadata !== "object" ||
      Array.isArray(log.metadata)
    ) {
      continue;
    }

    const metadata =
      log.metadata as Record<
        string,
        unknown
      >;

    const rawPhone =
      typeof metadata.phone === "string"
        ? metadata.phone
        : "";

    if (!rawPhone) {
      continue;
    }

    const logPhoneSuffix =
      getPhoneSuffix(rawPhone);

    if (
      logPhoneSuffix &&
      logPhoneSuffix === suffix
    ) {
      return (
        log.action ===
        "WHATSAPP_OPT_OUT"
      );
    }
  }

  return false;
}

export async function POST(
  request: NextRequest,
) {
  try {
    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN;

    const phoneNumberId =
      process.env
        .WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "WHATSAPP_ACCESS_TOKEN is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    if (!phoneNumberId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "WHATSAPP_PHONE_NUMBER_ID is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    const body =
      (await request.json()) as SendTemplateBody;

    const rawPhone =
      body.to?.trim() ?? "";

    if (!rawPhone) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "رقم الهاتف مطلوب.",
        },
        {
          status: 400,
        },
      );
    }

    const to =
      normalizePhoneNumber(
        rawPhone,
      );

    if (!to) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "رقم الهاتف غير صالح.",
        },
        {
          status: 400,
        },
      );
    }

    const optedOut =
      await hasWhatsAppOptedOut(
        to,
      );

    if (optedOut) {
      console.warn(
        `WhatsApp send blocked for opted-out customer: ${to}`,
      );

      return NextResponse.json(
        {
          ok: false,
          blocked: true,
          reason:
            "WHATSAPP_OPT_OUT",
          error:
            "تم إيقاف الإرسال لهذا الرقم لأن العميل طلب إيقاف الرسائل.",
        },
        {
          status: 403,
        },
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          messaging_product:
            "whatsapp",
          recipient_type:
            "individual",
          to,
          type: "template",
          template: {
            name:
              "artvert_customer_followup",
            language: {
              code: "ar_EG",
            },
          },
        }),
      },
    );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "WhatsApp send error:",
        data,
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "فشل إرسال رسالة واتساب.",
          details: data,
        },
        {
          status:
            response.status,
        },
      );
    }

    console.log(
      `WhatsApp template sent successfully to ${to}.`,
    );

    return NextResponse.json({
      ok: true,
      message:
        "تم إرسال قالب واتساب بنجاح.",
      data,
    });
  } catch (error) {
    console.error(
      "WhatsApp template route error:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "حدث خطأ غير متوقع أثناء إرسال رسالة واتساب.",
      },
      {
        status: 500,
      },
    );
  }
}