import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTERESTED_FOLLOWUP_MESSAGE = `أهلاً بحضرتك 🌱💚
حابين نطمن عليك ونعرف تجربتك مع بلانت جرو كانت إيه؟ وأخبار الزرع معاك إيه؟ 😊

ولو حابب تعمل طلب جديد أو عندك أي سؤال أو استشارة عن زرعك ابعتلنا وإحنا تحت أمرك 🌿

منتجاتنا وخدماتنا على:
www.artvertegypt.com

ArtVert Egypt 💚`;

type WhatsAppSendResponse = {
  messaging_product?: string;

  contacts?: Array<{
    input?: string;
    wa_id?: string;
  }>;

  messages?: Array<{
    id?: string;
    message_status?: string;
  }>;

  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;

    error_data?: {
      details?: string;
    };
  };
};

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

function getPhoneSuffix(value: string) {
  const normalized = normalizePhone(value);

  if (normalized.length <= 10) {
    return normalized;
  }

  return normalized.slice(-10);
}

function normalizeArabic(value: string) {
  return value
    .trim()
    .replace(/[إأآ]/g, "ا")
    .replace(/\s+/g, " ");
}

function getWhatsAppErrorMessage(
  data: WhatsAppSendResponse,
) {
  const message = data.error?.message;
  const details =
    data.error?.error_data?.details;

  if (message && details) {
    return `${message} - ${details}`;
  }

  if (message) {
    return message;
  }

  if (details) {
    return details;
  }

  return "WHATSAPP_SEND_FAILED";
}

async function findCustomerByWhatsAppPhone(
  phone: string,
) {
  const suffix = getPhoneSuffix(phone);

  if (!suffix) {
    return null;
  }

  const address =
    await prisma.customerAddress.findFirst({
      where: {
        OR: [
          {
            phone: {
              endsWith: suffix,
            },
          },
          {
            alternativePhone: {
              endsWith: suffix,
            },
          },
        ],
      },

      select: {
        customerId: true,

        customer: {
          select: {
            id: true,
            email: true,
            displayName: true,
            marketingOptIn: true,
          },
        },
      },
    });

  if (address?.customer) {
    return address.customer;
  }

  const order =
    await prisma.order.findFirst({
      where: {
        customerId: {
          not: null,
        },

        OR: [
          {
            phone: {
              endsWith: suffix,
            },
          },
          {
            alternativePhone: {
              endsWith: suffix,
            },
          },
        ],
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        customer: {
          select: {
            id: true,
            email: true,
            displayName: true,
            marketingOptIn: true,
          },
        },
      },
    });

  return order?.customer ?? null;
}

/**
 * Meta قد تعيد إرسال نفس حدث الضغط أكثر من مرة.
 * نتحقق من messageId حتى لا نسجل أو نرسل الرد مرتين.
 */
async function wasWhatsAppInterestedAlreadyProcessed(
  messageId?: string,
) {
  if (!messageId) {
    return false;
  }

  const existing =
    await prisma.customerAuditLog.findFirst({
      where: {
        action: "WHATSAPP_INTERESTED",

        metadata: {
          path: ["messageId"],
          equals: messageId,
        },
      },

      select: {
        id: true,
      },
    });

  return Boolean(existing);
}

/**
 * إرسال رسالة نصية تلقائية بعد ضغط العميل "مهتم".
 * لا نعيد إرسال قالب الحملة حتى لا ندخل في Loop.
 */
async function sendInterestedFollowupMessage(
  toPhone: string,
) {
  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken) {
    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured.",
    );
  }

  if (!phoneNumberId) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID is not configured.",
    );
  }

  const to = normalizePhone(toPhone);

  if (!to) {
    throw new Error(
      "INVALID_WHATSAPP_PHONE_NUMBER",
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
        type: "text",

        text: {
          preview_url: true,
          body: INTERESTED_FOLLOWUP_MESSAGE,
        },
      }),
    },
  );

  const data =
    (await response.json()) as WhatsAppSendResponse;

  if (!response.ok) {
    const errorMessage =
      getWhatsAppErrorMessage(data);

    console.error(
      `[WhatsApp interested follow-up] Failed for ${to}:`,
      data,
    );

    throw new Error(errorMessage);
  }

  const metaMessageId =
    data.messages?.[0]?.id ?? null;

  console.log(
    `[WhatsApp interested follow-up] Text message sent successfully to ${to}.`,
    {
      metaMessageId,
    },
  );

  return {
    metaMessageId,
  };
}

async function recordWhatsAppAction(args: {
  from: string;

  action:
    | "WHATSAPP_INTERESTED"
    | "WHATSAPP_OPT_OUT";

  buttonText: string;
  buttonPayload: string;
  messageId?: string;
  timestamp?: string;
}) {
  const customer =
    await findCustomerByWhatsAppPhone(
      args.from,
    );

  const metadata = {
    phone: args.from,
    buttonText: args.buttonText,
    buttonPayload: args.buttonPayload,
    messageId: args.messageId ?? null,
    timestamp: args.timestamp ?? null,
    source: "WHATSAPP_WEBHOOK",
  };

  if (
    args.action === "WHATSAPP_OPT_OUT" &&
    customer
  ) {
    await prisma.$transaction([
      prisma.customer.update({
        where: {
          id: customer.id,
        },

        data: {
          marketingOptIn: false,
        },
      }),

      prisma.customerAuditLog.create({
        data: {
          customerId: customer.id,
          actorType:
            "WHATSAPP_CUSTOMER",
          action: args.action,
          targetType: "CUSTOMER",
          targetId: customer.id,
          metadata,
        },
      }),
    ]);

    console.log(
      `WhatsApp customer ${args.from} opted out. Customer ${customer.id} marketingOptIn set to false.`,
    );

    return;
  }

  await prisma.customerAuditLog.create({
    data: {
      customerId:
        customer?.id ?? null,

      actorType:
        "WHATSAPP_CUSTOMER",

      action: args.action,

      targetType:
        customer
          ? "CUSTOMER"
          : "WHATSAPP_CONTACT",

      targetId:
        customer?.id ?? null,

      metadata,
    },
  });

  if (
    args.action === "WHATSAPP_INTERESTED"
  ) {
    console.log(
      customer
        ? `WhatsApp customer ${args.from} is interested. Linked customer: ${customer.id}.`
        : `WhatsApp customer ${args.from} is interested. No matching customer account found.`,
    );
  } else {
    console.log(
      customer
        ? `WhatsApp customer ${args.from} requested opt-out. Linked customer: ${customer.id}.`
        : `WhatsApp customer ${args.from} requested opt-out. No matching customer account found.`,
    );
  }
}

async function processButtonReply(args: {
  from: string;
  text: string;
  payload: string;
  messageId?: string;
  timestamp?: string;
}) {
  const text =
    normalizeArabic(args.text);

  const payload =
    normalizeArabic(args.payload);

  if (
    text === "مهتم" ||
    payload === "مهتم"
  ) {
    const alreadyProcessed =
      await wasWhatsAppInterestedAlreadyProcessed(
        args.messageId,
      );

    if (alreadyProcessed) {
      console.log(
        `[WhatsApp interested follow-up] Duplicate webhook ignored. Message ID: ${args.messageId}`,
      );

      return;
    }

    /*
     * نسجل ضغط العميل على "مهتم" أولًا.
     */
    await recordWhatsAppAction({
      from: args.from,
      action: "WHATSAPP_INTERESTED",
      buttonText: args.text.trim(),
      buttonPayload: args.payload.trim(),
      messageId: args.messageId,
      timestamp: args.timestamp,
    });

    /*
     * ثم نرسل رسالة المتابعة النصية فقط.
     * لا نعيد إرسال قالب artvert_customer_followup.
     */
    try {
      await sendInterestedFollowupMessage(
        args.from,
      );
    } catch (error) {
      console.error(
        `[WhatsApp interested follow-up] Automatic text message failed for ${args.from}:`,
        error,
      );
    }

    return;
  }

  if (
    text === "ايقاف الرسائل" ||
    payload === "ايقاف الرسائل"
  ) {
    await recordWhatsAppAction({
      from: args.from,
      action: "WHATSAPP_OPT_OUT",
      buttonText: args.text.trim(),
      buttonPayload: args.payload.trim(),
      messageId: args.messageId,
      timestamp: args.timestamp,
    });
  }
}

/**
 * Meta تستخدم GET للتحقق من الـ Webhook.
 */
export async function GET(
  request: NextRequest,
) {
  const searchParams =
    request.nextUrl.searchParams;

  const mode =
    searchParams.get("hub.mode");

  const token =
    searchParams.get(
      "hub.verify_token",
    );

  const challenge =
    searchParams.get(
      "hub.challenge",
    );

  const verifyToken =
    process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error(
      "WHATSAPP_VERIFY_TOKEN is not configured.",
    );

    return new NextResponse(
      "Webhook verify token is not configured.",
      {
        status: 500,
      },
    );
  }

  if (
    mode === "subscribe" &&
    token === verifyToken &&
    challenge
  ) {
    console.log(
      "WhatsApp webhook verified successfully.",
    );

    return new NextResponse(
      challenge,
      {
        status: 200,

        headers: {
          "Content-Type":
            "text/plain",
        },
      },
    );
  }

  return new NextResponse(
    "Forbidden",
    {
      status: 403,
    },
  );
}

/**
 * Meta تستخدم POST لإرسال أحداث ورسائل WhatsApp.
 */
export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      await request.json();

    console.log(
      "WhatsApp webhook event:",
      JSON.stringify(
        body,
        null,
        2,
      ),
    );

    const entries =
      Array.isArray(body?.entry)
        ? body.entry
        : [];

    for (const entry of entries) {
      const changes =
        Array.isArray(entry?.changes)
          ? entry.changes
          : [];

      for (const change of changes) {
        const value =
          change?.value;

        const messages =
          Array.isArray(value?.messages)
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

          const messageId =
            typeof message?.id === "string"
              ? message.id
              : undefined;

          const timestamp =
            typeof message?.timestamp === "string"
              ? message.timestamp
              : undefined;

          /*
           * Quick Reply الخاص بقالب WhatsApp.
           */
          if (
            message?.type === "button" &&
            message?.button
          ) {
            const buttonText =
              typeof message.button.text === "string"
                ? message.button.text
                : "";

            const buttonPayload =
              typeof message.button.payload === "string"
                ? message.button.payload
                : "";

            console.log(
              "WhatsApp quick reply:",
              {
                from,
                buttonText,
                buttonPayload,
              },
            );

            await processButtonReply({
              from,
              text: buttonText,
              payload: buttonPayload,
              messageId,
              timestamp,
            });

            continue;
          }

          /*
           * بعض الردود التفاعلية تصل كـ interactive.
           */
          if (
            message?.type === "interactive" &&
            message?.interactive
          ) {
            const buttonReply =
              message.interactive.button_reply;

            if (!buttonReply) {
              continue;
            }

            const title =
              typeof buttonReply.title === "string"
                ? buttonReply.title
                : "";

            const id =
              typeof buttonReply.id === "string"
                ? buttonReply.id
                : "";

            console.log(
              "WhatsApp interactive button reply:",
              {
                from,
                title,
                id,
              },
            );

            await processButtonReply({
              from,
              text: title,
              payload: id,
              messageId,
              timestamp,
            });
          }
        }
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "WhatsApp webhook error:",
      error,
    );

    return NextResponse.json({
      received: true,
    });
  }
}