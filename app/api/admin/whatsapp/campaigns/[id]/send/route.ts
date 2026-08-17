import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/db/prisma";
import { requireCustomerAdmin } from "@/lib/customers/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * بالنسبة لك: ضغطة واحدة = إرسال الحملة كلها.
 * داخليًا بنرسل في مجموعات صغيرة متوازية حتى لا نضغط
 * على WhatsApp API أو السيرفر في نفس اللحظة.
 */
const SEND_CONCURRENCY = 10;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

type AuditMetadata = {
  phone?: unknown;
};

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function getPhoneSuffix(value: string) {
  const normalized =
    normalizePhoneNumber(value);

  if (normalized.length <= 10) {
    return normalized;
  }

  return normalized.slice(-10);
}

function getErrorMessage(
  data: WhatsAppSendResponse,
) {
  const details =
    data.error?.error_data?.details;

  const message =
    data.error?.message;

  if (details && message) {
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

async function getOptedOutPhones() {
  const prisma =
    getPrismaClient();

  /*
   * نقرأ أحدث حالة واتساب لكل رقم.
   * لو أحدث حدث هو WHATSAPP_OPT_OUT
   * يبقى الرقم ممنوع من الحملات.
   */
  const logs =
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
      select: {
        action: true,
        metadata: true,
      },
    });

  const latestStatusByPhone =
    new Map<string, string>();

  for (const log of logs) {
    if (
      !log.metadata ||
      typeof log.metadata !== "object" ||
      Array.isArray(log.metadata)
    ) {
      continue;
    }

    const metadata =
      log.metadata as AuditMetadata;

    const rawPhone =
      typeof metadata.phone === "string"
        ? metadata.phone
        : "";

    if (!rawPhone) {
      continue;
    }

    const suffix =
      getPhoneSuffix(rawPhone);

    if (!suffix) {
      continue;
    }

    /*
     * النتائج مرتبة من الأحدث للأقدم.
     * لذلك أول حدث نراه للرقم هو حالته الحالية.
     */
    if (
      latestStatusByPhone.has(
        suffix,
      )
    ) {
      continue;
    }

    latestStatusByPhone.set(
      suffix,
      log.action,
    );
  }

  const optedOutPhones =
    new Set<string>();

  for (
    const [phone, action]
    of latestStatusByPhone
  ) {
    if (
      action ===
      "WHATSAPP_OPT_OUT"
    ) {
      optedOutPhones.add(
        phone,
      );
    }
  }

  return optedOutPhones;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (
    item: T,
    index: number,
  ) => Promise<void>,
) {
  let cursor = 0;

  async function runWorker() {
    while (true) {
      const index = cursor;

      cursor += 1;

      if (index >= items.length) {
        return;
      }

      await worker(
        items[index],
        index,
      );
    }
  }

  const workers =
    Array.from(
      {
        length: Math.min(
          concurrency,
          items.length,
        ),
      },
      () => runWorker(),
    );

  await Promise.all(workers);
}

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const prisma =
    getPrismaClient();

  let campaignId = "";

  try {
    /*
     * حماية Route بحيث موظف الإدارة فقط
     * يقدر يبدأ حملة.
     */
    await requireCustomerAdmin();

    const params =
      await context.params;

    campaignId =
      params.id?.trim() ?? "";

    if (!campaignId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "معرف الحملة مطلوب.",
        },
        {
          status: 400,
        },
      );
    }

    const accessToken =
      process.env
        .WHATSAPP_ACCESS_TOKEN;

    const phoneNumberId =
      process.env
        .WHATSAPP_PHONE_NUMBER_ID;

    const environmentDiagnostics = {
      vercelEnv:
        process.env.VERCEL_ENV ?? "unknown",
      nodeEnv:
        process.env.NODE_ENV ?? "unknown",
      hasWhatsAppAccessToken:
        Boolean(accessToken),
      whatsAppAccessTokenLength:
        accessToken?.length ?? 0,
      hasWhatsAppPhoneNumberId:
        Boolean(phoneNumberId),
      whatsAppPhoneNumberIdLength:
        phoneNumberId?.length ?? 0,
    };

    console.log(
      "[whatsapp-campaign-env]",
      environmentDiagnostics,
    );

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "WHATSAPP_ACCESS_TOKEN is not configured.",
          diagnostics:
            environmentDiagnostics,
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
          diagnostics:
            environmentDiagnostics,
        },
        {
          status: 500,
        },
      );
    }

    /*
     * نقرأ الحملة أولًا.
     */
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
          startedAt: true,
          completedAt: true,
        },
      });

    if (!campaign) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "الحملة غير موجودة.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * منع تشغيل نفس الحملة مرتين في نفس الوقت.
     */
    if (
      campaign.status ===
      "SENDING"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "الحملة قيد الإرسال بالفعل.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      campaign.status ===
        "COMPLETED" ||
      campaign.status ===
        "CANCELLED"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            campaign.status ===
            "COMPLETED"
              ? "تم إرسال هذه الحملة بالفعل."
              : "الحملة ملغاة.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * نسمح بالإرسال للحملات الجاهزة،
     * أو إعادة محاولة الأرقام PENDING لو الحملة
     * انتهت جزئيًا في محاولة سابقة.
     */
    if (
      campaign.status !== "READY" &&
      campaign.status !==
        "PARTIALLY_COMPLETED" &&
      campaign.status !== "FAILED"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `لا يمكن إرسال الحملة وهي في الحالة ${campaign.status}.`,
        },
        {
          status: 409,
        },
      );
    }

    /*
     * تغيير الحالة إلى SENDING بشكل شرطي.
     * ده يمنع ضغط الزر مرتين بسرعة وتشغيل نسختين.
     */
    const locked =
      await prisma.whatsAppCampaign.updateMany({
        where: {
          id: campaignId,
          status: {
            in: [
              "READY",
              "PARTIALLY_COMPLETED",
              "FAILED",
            ],
          },
        },
        data: {
          status: "SENDING",
          startedAt:
            campaign.startedAt ??
            new Date(),
          completedAt: null,
        },
      });

    if (locked.count !== 1) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "تعذر بدء الحملة لأنها تغيرت بالفعل.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * لا نلمس SENT / FAILED / BLOCKED القديمة.
     * الإرسال هنا للأرقام PENDING فقط.
     */
    const recipients =
      await prisma.whatsAppCampaignRecipient.findMany({
        where: {
          campaignId,
          status: "PENDING",
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          phone: true,
          displayName: true,
        },
      });

    /*
     * ممكن تكون الحملة READY لكن مفيش PENDING
     * بسبب تحديث سابق أو حالة غير متوقعة.
     */
    if (
      recipients.length === 0
    ) {
      const [
        pendingCount,
        sentCount,
        failedCount,
        blockedCount,
      ] = await Promise.all([
        prisma.whatsAppCampaignRecipient.count({
          where: {
            campaignId,
            status: "PENDING",
          },
        }),

        prisma.whatsAppCampaignRecipient.count({
          where: {
            campaignId,
            status: "SENT",
          },
        }),

        prisma.whatsAppCampaignRecipient.count({
          where: {
            campaignId,
            status: "FAILED",
          },
        }),

        prisma.whatsAppCampaignRecipient.count({
          where: {
            campaignId,
            status: "BLOCKED",
          },
        }),
      ]);

      const finalStatus =
        pendingCount === 0 &&
        failedCount === 0
          ? "COMPLETED"
          : "PARTIALLY_COMPLETED";

      const updated =
        await prisma.whatsAppCampaign.update({
          where: {
            id: campaignId,
          },
          data: {
            status:
              finalStatus,
            pendingCount,
            sentCount,
            failedCount,
            blockedCount,
            completedAt:
              new Date(),
          },
        });

      return NextResponse.json({
        ok: true,
        message:
          "لا توجد أرقام جديدة في انتظار الإرسال.",
        campaign: {
          id: updated.id,
          status:
            updated.status,
          sentCount:
            updated.sentCount,
          failedCount:
            updated.failedCount,
          blockedCount:
            updated.blockedCount,
          pendingCount:
            updated.pendingCount,
        },
      });
    }

    /*
     * نعمل فحص Opt-out مرة أخرى وقت الإرسال،
     * حتى لو العميل ضغط إيقاف الرسائل بعد رفع Excel.
     */
    const optedOutPhones =
      await getOptedOutPhones();

    let sentThisRun = 0;
    let failedThisRun = 0;
    let blockedThisRun = 0;

    await runWithConcurrency(
      recipients,
      SEND_CONCURRENCY,
      async (recipient) => {
        const phone =
          normalizePhoneNumber(
            recipient.phone,
          );

        const phoneSuffix =
          getPhoneSuffix(phone);

        /*
         * آخر فحص قبل Meta API.
         */
        if (
          optedOutPhones.has(
            phoneSuffix,
          )
        ) {
          await prisma.whatsAppCampaignRecipient.update({
            where: {
              id: recipient.id,
            },
            data: {
              status:
                "BLOCKED",
              blockedReason:
                "WHATSAPP_OPT_OUT",
              failureReason:
                null,
              lastAttemptAt:
                new Date(),
            },
          });

          blockedThisRun += 1;

          console.log(
            `[whatsapp-campaign] blocked opted-out phone ${phone}`,
          );

          return;
        }

        const attemptAt =
          new Date();

        try {
          /*
           * زيادة attemptCount قبل المحاولة.
           */
          await prisma.whatsAppCampaignRecipient.update({
            where: {
              id: recipient.id,
            },
            data: {
              attemptCount: {
                increment: 1,
              },
              lastAttemptAt:
                attemptAt,
            },
          });

          const response =
            await fetch(
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
                  to: phone,
                  type: "template",
                  template: {
                    name:
                      campaign.templateName,
                    language: {
                      code:
                        campaign.languageCode,
                    },
                  },
                }),
              },
            );

          const data =
            (await response.json()) as WhatsAppSendResponse;

          if (!response.ok) {
            const failureReason =
              getErrorMessage(data);

            console.error(
              `[whatsapp-campaign] send failed for ${phone}:`,
              data,
            );

            await prisma.whatsAppCampaignRecipient.update({
              where: {
                id: recipient.id,
              },
              data: {
                status:
                  "FAILED",
                failureReason:
                  failureReason.slice(
                    0,
                    2000,
                  ),
                metaMessageId:
                  null,
              },
            });

            failedThisRun += 1;

            return;
          }

          const metaMessageId =
            data.messages?.[0]?.id ??
            null;

          await prisma.whatsAppCampaignRecipient.update({
            where: {
              id: recipient.id,
            },
            data: {
              status: "SENT",
              sentAt:
                new Date(),
              failureReason:
                null,
              blockedReason:
                null,
              metaMessageId,
            },
          });

          sentThisRun += 1;

          console.log(
            `[whatsapp-campaign] sent to ${phone}`,
          );
        } catch (sendError) {
          const message =
            sendError instanceof Error
              ? sendError.message
              : "WHATSAPP_SEND_EXCEPTION";

          console.error(
            `[whatsapp-campaign] exception for ${phone}:`,
            sendError,
          );

          await prisma.whatsAppCampaignRecipient.update({
            where: {
              id: recipient.id,
            },
            data: {
              status: "FAILED",
              failureReason:
                message.slice(
                  0,
                  2000,
                ),
            },
          });

          failedThisRun += 1;
        }
      },
    );

    /*
     * الحساب النهائي من قاعدة البيانات نفسها
     * وليس من counters الذاكرة فقط.
     */
    const [
      pendingCount,
      sentCount,
      failedCount,
      blockedCount,
    ] = await Promise.all([
      prisma.whatsAppCampaignRecipient.count({
        where: {
          campaignId,
          status: "PENDING",
        },
      }),

      prisma.whatsAppCampaignRecipient.count({
        where: {
          campaignId,
          status: "SENT",
        },
      }),

      prisma.whatsAppCampaignRecipient.count({
        where: {
          campaignId,
          status: "FAILED",
        },
      }),

      prisma.whatsAppCampaignRecipient.count({
        where: {
          campaignId,
          status: "BLOCKED",
        },
      }),
    ]);

    let finalStatus:
      | "COMPLETED"
      | "PARTIALLY_COMPLETED"
      | "FAILED";

    if (
      pendingCount === 0 &&
      failedCount === 0
    ) {
      finalStatus =
        "COMPLETED";
    } else if (
      sentCount === 0 &&
      pendingCount === 0 &&
      failedCount > 0
    ) {
      finalStatus =
        "FAILED";
    } else {
      finalStatus =
        "PARTIALLY_COMPLETED";
    }

    const updatedCampaign =
      await prisma.whatsAppCampaign.update({
        where: {
          id: campaignId,
        },
        data: {
          status:
            finalStatus,
          pendingCount,
          sentCount,
          failedCount,
          blockedCount,
          completedAt:
            pendingCount === 0
              ? new Date()
              : null,
        },
        select: {
          id: true,
          name: true,
          status: true,
          totalRecipients: true,
          pendingCount: true,
          sentCount: true,
          failedCount: true,
          blockedCount: true,
          startedAt: true,
          completedAt: true,
        },
      });

    return NextResponse.json({
      ok: true,

      message:
        finalStatus ===
        "COMPLETED"
          ? "تم إرسال الحملة بنجاح."
          : "انتهى إرسال الحملة مع وجود بعض الأرقام التي تحتاج مراجعة.",

      run: {
        attempted:
          recipients.length,
        sent:
          sentThisRun,
        failed:
          failedThisRun,
        blocked:
          blockedThisRun,
      },

      campaign: {
        id:
          updatedCampaign.id,
        name:
          updatedCampaign.name,
        status:
          updatedCampaign.status,
        totalRecipients:
          updatedCampaign.totalRecipients,
        pendingCount:
          updatedCampaign.pendingCount,
        sentCount:
          updatedCampaign.sentCount,
        failedCount:
          updatedCampaign.failedCount,
        blockedCount:
          updatedCampaign.blockedCount,
        startedAt:
          updatedCampaign.startedAt,
        completedAt:
          updatedCampaign.completedAt,
      },
    });
  } catch (error) {
    console.error(
      "[whatsapp-campaign-send]",
      error,
    );

    /*
     * لو حصل Error عام بعد قفل الحملة على SENDING،
     * نحاول نرجعها لحالة تسمح بالمراجعة وإعادة المحاولة.
     */
    if (campaignId) {
      try {
        await prisma.whatsAppCampaign.updateMany({
          where: {
            id: campaignId,
            status: "SENDING",
          },
          data: {
            status:
              "PARTIALLY_COMPLETED",
          },
        });
      } catch (
        recoveryError
      ) {
        console.error(
          "[whatsapp-campaign-send-recovery]",
          recoveryError,
        );
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "CAMPAIGN_SEND_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}