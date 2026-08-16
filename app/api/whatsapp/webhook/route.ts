import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function findCustomerByWhatsAppPhone(phone: string) {
  const suffix = getPhoneSuffix(phone);

  if (!suffix) {
    return null;
  }

  const address = await prisma.customerAddress.findFirst({
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

  const order = await prisma.order.findFirst({
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

async function recordWhatsAppAction(args: {
  from: string;
  action: "WHATSAPP_INTERESTED" | "WHATSAPP_OPT_OUT";
  buttonText: string;
  buttonPayload: string;
  messageId?: string;
  timestamp?: string;
}) {
  const customer = await findCustomerByWhatsAppPhone(
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
          actorType: "WHATSAPP_CUSTOMER",
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
      customerId: customer?.id ?? null,
      actorType: "WHATSAPP_CUSTOMER",
      action: args.action,
      targetType: customer
        ? "CUSTOMER"
        : "WHATSAPP_CONTACT",
      targetId: customer?.id ?? null,
      metadata,
    },
  });

  if (args.action === "WHATSAPP_INTERESTED") {
    console.log(
      customer
        ? `WhatsApp customer ${args.from} is interested. Linked customer: ${customer.id}.`
        : `WhatsApp customer ${args.from} is interested. No matching customer account found.`,
    );
  } else {
    console.log(
      `WhatsApp customer ${args.from} requested opt-out. No matching customer account found.`,
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
  const text = args.text.trim();
  const payload = args.payload.trim();

  if (
    text === "مهتم" ||
    payload === "مهتم"
  ) {
    await recordWhatsAppAction({
      from: args.from,
      action: "WHATSAPP_INTERESTED",
      buttonText: text,
      buttonPayload: payload,
      messageId: args.messageId,
      timestamp: args.timestamp,
    });

    return;
  }

  if (
    text === "إيقاف الرسائل" ||
    payload === "إيقاف الرسائل"
  ) {
    await recordWhatsAppAction({
      from: args.from,
      action: "WHATSAPP_OPT_OUT",
      buttonText: text,
      buttonPayload: payload,
      messageId: args.messageId,
      timestamp: args.timestamp,
    });
  }
}

/**
 * Meta تستخدم GET للتحقق من الـ Webhook.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

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
 * Meta تستخدم POST لإرسال أحداث ورسائل WhatsApp.
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

    /*
     * نرجع 200 حتى لا تدخل Meta في retries مستمرة
     * أثناء مرحلة التشغيل الحالية.
     */
    return NextResponse.json({
      received: true,
    });
  }
}