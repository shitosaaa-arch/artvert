import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type SendTemplateBody = {
  to?: string;
};

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "WHATSAPP_ACCESS_TOKEN is not configured.",
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
          error: "WHATSAPP_PHONE_NUMBER_ID is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    const body = (await request.json()) as SendTemplateBody;

    const rawPhone = body.to?.trim() ?? "";

    if (!rawPhone) {
      return NextResponse.json(
        {
          ok: false,
          error: "رقم الهاتف مطلوب.",
        },
        {
          status: 400,
        },
      );
    }

    const to = normalizePhoneNumber(rawPhone);

    if (!to) {
      return NextResponse.json(
        {
          ok: false,
          error: "رقم الهاتف غير صالح.",
        },
        {
          status: 400,
        },
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "template",
          template: {
            name: "artvert_customer_followup",
            language: {
              code: "ar_EG",
            },
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp send error:", data);

      return NextResponse.json(
        {
          ok: false,
          error: "فشل إرسال رسالة واتساب.",
          details: data,
        },
        {
          status: response.status,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "تم إرسال قالب واتساب بنجاح.",
      data,
    });
  } catch (error) {
    console.error("WhatsApp template route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "حدث خطأ غير متوقع أثناء إرسال رسالة واتساب.",
      },
      {
        status: 500,
      },
    );
  }
}