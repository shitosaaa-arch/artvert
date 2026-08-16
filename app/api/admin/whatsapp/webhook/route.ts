import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Meta تستخدم GET للتحقق من الـ Webhook
 * عند ربطه لأول مرة من Meta Developers.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error("WHATSAPP_VERIFY_TOKEN is not configured.");

    return new NextResponse("Webhook verify token is not configured.", {
      status: 500,
    });
  }

  if (
    mode === "subscribe" &&
    token === verifyToken &&
    challenge
  ) {
    console.log("WhatsApp webhook verified successfully.");

    return new NextResponse(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new NextResponse("Forbidden", {
    status: 403,
  });
}

/**
 * Meta تستخدم POST لإرسال أحداث ورسائل WhatsApp
 * إلى الموقع، ومنها ضغط أزرار Quick Reply.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(
      "WhatsApp webhook event:",
      JSON.stringify(body, null, 2),
    );

    const entries = Array.isArray(body?.entry)
      ? body.entry
      : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes)
        ? entry.changes
        : [];

      for (const change of changes) {
        const value = change?.value;

        const messages = Array.isArray(value?.messages)
          ? value.messages
          : [];

        for (const message of messages) {
          const from =
            typeof message?.from === "string"
              ? message.from
              : "";

          if (!from) {
            continue;
          }

          /*
           * ردود أزرار القالب Quick Reply
           */
          if (
            message?.type === "button" &&
            message?.button
          ) {
            const buttonText =
              typeof message.button.text === "string"
                ? message.button.text.trim()
                : "";

            const buttonPayload =
              typeof message.button.payload === "string"
                ? message.button.payload.trim()
                : "";

            console.log("WhatsApp quick reply:", {
              from,
              buttonText,
              buttonPayload,
            });

            if (
              buttonText === "مهتم" ||
              buttonPayload === "مهتم"
            ) {
              console.log(
                `WhatsApp customer ${from} is interested.`,
              );
            }

            if (
              buttonText === "إيقاف الرسائل" ||
              buttonPayload === "إيقاف الرسائل"
            ) {
              console.log(
                `WhatsApp customer ${from} requested opt-out.`,
              );
            }

            continue;
          }

          /*
           * بعض أنواع الرسائل التفاعلية قد تصل
           * في interactive بدل button.
           */
          if (
            message?.type === "interactive" &&
            message?.interactive
          ) {
            const buttonReply =
              message.interactive.button_reply;

            if (buttonReply) {
              const title =
                typeof buttonReply.title === "string"
                  ? buttonReply.title.trim()
                  : "";

              const id =
                typeof buttonReply.id === "string"
                  ? buttonReply.id.trim()
                  : "";

              console.log(
                "WhatsApp interactive button reply:",
                {
                  from,
                  title,
                  id,
                },
              );

              if (
                title === "مهتم" ||
                id === "مهتم"
              ) {
                console.log(
                  `WhatsApp customer ${from} is interested.`,
                );
              }

              if (
                title === "إيقاف الرسائل" ||
                id === "إيقاف الرسائل"
              ) {
                console.log(
                  `WhatsApp customer ${from} requested opt-out.`,
                );
              }
            }
          }
        }
      }
    }

    /*
     * مهم:
     * Meta تحتاج استجابة 200 بسرعة حتى لا تعيد إرسال الحدث.
     */
    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);

    /*
     * حتى لو كان Event غير متوقع،
     * لا نريد Meta أن تدخل في retries مستمرة.
     */
    return NextResponse.json({
      received: true,
    });
  }
}