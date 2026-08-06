import { NextResponse } from "next/server";

import {
  getGeminiAgriculturalAssistant,
  type AgriculturalAssistantMessage,
  type AgriculturalImageInput,
  type AgriculturalProductContext,
} from "@/engine/doctor/ai/gemini-agricultural-assistant";
import {
  appendDoctorMessage,
  appendUserMessage,
  trimConversationHistory,
} from "@/engine/doctor/conversation/conversation-manager";
import {
  createDoctorSession,
  normalizeDoctorSessionState,
  updateDoctorSession,
} from "@/engine/doctor/conversation/session-manager";
import { createKnowledgeEngine } from "@/engine/knowledge/knowledge-engine";
import { enforceRateLimit } from "@/lib/customers/rate-limit";
import { requestIpHash } from "@/lib/customers/security";
import { getPrismaClient } from "@/lib/db/prisma";
import { getDoctorSessionStore } from "@/lib/doctor/session-store";
import { getTemporaryVisionImageStore } from "@/lib/doctor/vision/image-store";
import { createKnowledgeExportStore } from "@/lib/knowledge/export/knowledge-export-store-factory";
import { reportError, requestId } from "@/lib/platform/observability";
import { parseDoctorChatRequest } from "@/schemas/doctor";

type UnknownRecord = Record<string, unknown>;

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function turnText(
  message: string | undefined,
  answers:
    | Record<string, string | string[]>
    | undefined,
) {
  if (message?.trim()) {
    return message.trim();
  }

  if (answers) {
    return Object.values(answers)
      .flatMap((answer) =>
        Array.isArray(answer)
          ? answer
          : [answer],
      )
      .join("، ")
      .trim();
  }

  return "";
}

function historyForGemini(
  value: unknown,
): AgriculturalAssistantMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((entry) => {
      const role =
        entry.role === "assistant" ||
        entry.role === "doctor"
          ? "assistant"
          : "user";

      const text =
        typeof entry.message === "string"
          ? entry.message
          : typeof entry.text === "string"
            ? entry.text
            : "";

      return {
        role,
        text: text.trim(),
      } satisfies AgriculturalAssistantMessage;
    })
    .filter((entry) =>
      Boolean(entry.text),
    )
    .slice(-20);
}

function optionalString(
  value: unknown,
) {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : undefined;
}

function stringArray(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBase64(
  value: unknown,
): string | undefined {
  if (
    typeof value === "string" &&
    value.trim()
  ) {
    const trimmed = value.trim();

    const dataUrlMatch =
      /^data:[^;]+;base64,(.+)$/u.exec(
        trimmed,
      );

    return dataUrlMatch?.[1] ??
      trimmed;
  }

  if (Buffer.isBuffer(value)) {
    return value.toString("base64");
  }

  if (
    value instanceof Uint8Array
  ) {
    return Buffer.from(value).toString(
      "base64",
    );
  }

  if (
    value instanceof ArrayBuffer
  ) {
    return Buffer.from(
      value,
    ).toString("base64");
  }

  return undefined;
}

function imageInputFromUpload(
  uploaded: unknown,
): AgriculturalImageInput | undefined {
  if (!uploaded) {
    return undefined;
  }

  if (
    Buffer.isBuffer(uploaded) ||
    uploaded instanceof Uint8Array ||
    uploaded instanceof ArrayBuffer ||
    typeof uploaded === "string"
  ) {
    const base64Data =
      toBase64(uploaded);

    if (!base64Data) {
      return undefined;
    }

    return {
      mimeType: "image/jpeg",
      base64Data,
    };
  }

  if (!isRecord(uploaded)) {
    return undefined;
  }

  const mimeType =
    optionalString(
      uploaded.mimeType,
    ) ??
    optionalString(
      uploaded.contentType,
    ) ??
    optionalString(uploaded.type);

  const supportedMimeType =
    mimeType === "image/png" ||
    mimeType === "image/webp" ||
    mimeType === "image/jpeg"
      ? mimeType
      : "image/jpeg";

  const binary =
    uploaded.buffer ??
    uploaded.data ??
    uploaded.bytes ??
    uploaded.body ??
    uploaded.file;

  const base64Data =
    toBase64(binary);

  if (!base64Data) {
    return undefined;
  }

  return {
    mimeType:
      supportedMimeType,
    base64Data,
  };
}

async function loadPublishedProducts(): Promise<
  AgriculturalProductContext[]
> {
  const prisma =
    getPrismaClient();

  const products =
    await prisma.product.findMany({
      where: {
        entity: {
          publicationState:
            "PUBLISHED",
        },
      },
      include: {
        entity: true,
        images: {
          orderBy: [
            { isPrimary: "desc" },
            { sortOrder: "asc" },
          ],
          take: 1,
        },
      },
      orderBy: {
        nameAr: "asc",
      },
      take: 100,
    });

  return products.map((product) => ({
    id: product.id,
    slug: product.entity.slug,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    category: product.category,
    composition:
      product.composition,
    dosage: product.dosage,
    benefits:
      stringArray(
        product.benefits,
      ),
    crops:
      stringArray(product.crops),
    price: Number(product.price),
    compareAtPrice:
      product.comparePrice === null
        ? undefined
        : Number(product.comparePrice),
    currency: "EGP",
    image:
      product.images[0]?.url,
    productUrl:
      `/products/${product.entity.slug}`,
    warnings: [],
  }));
}

function approvedProducts(
  requestedIds: string[],
  products:
    AgriculturalProductContext[],
) {
  const allowed =
    new Map(
      products.map((product) => [
        product.id,
        product,
      ]),
    );

  return requestedIds
    .map((id) =>
      allowed.get(id),
    )
    .filter(
      (
        product,
      ): product is AgriculturalProductContext =>
        Boolean(product),
    );
}


function shouldRecommendAutomatically(
  diagnoses:
    Array<{
      confidence:
        | "HIGH"
        | "MODERATE"
        | "LOW";
    }>,
) {
  const leader =
    diagnoses[0];

  return (
    leader?.confidence ===
      "HIGH" ||
    leader?.confidence ===
      "MODERATE"
  );
}

function productRecommendationText(
  products:
    AgriculturalProductContext[],
) {
  if (products.length === 0) {
    return "";
  }

  const lines =
    products
      .slice(0, 3)
      .map((product) => {
        const reason =
          product.reason?.trim() ||
          product.benefits?.[0]?.trim() ||
          product.composition?.trim() ||
          "منتج مناسب للحالة وفق البيانات المسجلة في ArtVert.";

        const priceText =
          typeof product.price === "number"
            ? ` — ${product.price.toLocaleString("ar-EG")} ${product.currency ?? "جنيه"}`
            : "";

        const linkText =
          product.productUrl
            ? `\n  ${product.productUrl}`
            : "";

        return `• ${product.nameAr}${priceText}: ${reason}${linkText}`;
      });

  return [
    "المنتجات المقترحة من ArtVert:",
    ...lines,
    "استخدم المنتجات حسب الجرعة المدونة على العبوة، وتأكد من ملاءمتها للمحصول والحالة.",
  ].join("\n");
}

function finalReplyWithProducts(
  reply: string,
  diagnoses:
    Array<{
      confidence:
        | "HIGH"
        | "MODERATE"
        | "LOW";
    }>,
  products:
    AgriculturalProductContext[],
) {
  if (
    !shouldRecommendAutomatically(
      diagnoses,
    ) ||
    products.length === 0
  ) {
    return reply.trim();
  }

  const productText =
    productRecommendationText(
      products,
    );

  if (!productText) {
    return reply.trim();
  }

  return `${reply.trim()}\n\n${productText}`;
}

export async function POST(
  request: Request,
) {
  try {
    enforceRateLimit(
      "doctor-chat",
      requestIpHash(request),
      30,
      60 * 1000,
    );

    const input =
      parseDoctorChatRequest(
        await request.json(),
      );

    const message =
      turnText(
        input.message,
        input.answers,
      );

    if (
      !message &&
      !input.imageRef
    ) {
      return NextResponse.json(
        {
          status:
            "invalid_request",
          error:
            "اكتب رسالة أو ارفع صورة للنبات.",
        },
        {
          status: 400,
        },
      );
    }

    const sessions =
      getDoctorSessionStore();

    const existing =
      input.sessionId
        ? await sessions.get(
            input.sessionId,
          )
        : null;

    if (
      input.sessionId &&
      !existing
    ) {
      return NextResponse.json(
        {
          status:
            "session_expired",
          error:
            "انتهت الجلسة. ابدأ محادثة جديدة.",
        },
        {
          status: 409,
        },
      );
    }

    const currentState =
      existing
        ? normalizeDoctorSessionState(
            existing.state,
          )
        : undefined;

    let image:
      | AgriculturalImageInput
      | undefined;

    if (input.imageRef) {
      if (!existing) {
        return NextResponse.json(
          {
            status:
              "image_invalid",
            error:
              "ابدأ الجلسة أولًا ثم ارفع الصورة مرة أخرى.",
          },
          {
            status: 400,
          },
        );
      }

      const uploaded =
        getTemporaryVisionImageStore().take(
          existing.id,
          input.imageRef,
        );

      image =
        imageInputFromUpload(
          uploaded,
        );

      if (!image) {
        return NextResponse.json(
          {
            status:
              "image_invalid",
            error:
              "تعذر قراءة الصورة أو انتهت صلاحيتها.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const products =
      await loadPublishedProducts();

    const assistant =
      getGeminiAgriculturalAssistant();

    const result =
      await assistant.respond({
        message:
          message ||
          "حلل صورة النبات المرفوعة وساعدني في معرفة المشكلة.",
        history:
          historyForGemini(
            currentState
              ?.conversationHistory,
          ),
        image,
        products,
        knowledge: [],
      });

    const selectedProducts =
      approvedProducts(
        result.recommendedProductIds,
        products,
      );

    const finalReply =
      finalReplyWithProducts(
        result.reply,
        result.possibleDiagnoses,
        selectedProducts,
      );

    const now =
      new Date().toISOString();

    let baseState =
      currentState;

    if (!baseState) {
      const reader =
        createKnowledgeEngine(
          createKnowledgeExportStore(),
        );

      const release =
        await reader.readActiveRelease();

      baseState =
        createDoctorSession({
          releaseVersion:
            release.releaseVersion,
          manifestChecksum:
            release.manifestChecksum,
          contentChecksum:
            release.contentChecksum,
          now,
        });
    }

    const conversationHistory =
      trimConversationHistory(
        appendDoctorMessage(
          appendUserMessage(
            baseState.conversationHistory,
            message ||
              "أرسلت صورة للنبات.",
            baseState.activeCaseId,
            now,
          ),
          finalReply,
          baseState.activeCaseId,
          now,
        ),
      );

    const nextState =
      updateDoctorSession({
        session: baseState,
        conversationHistory,
        now,
      });

    const session =
      existing
        ? await sessions.update(
            existing.id,
            nextState,
          )
        : await sessions.create(
            nextState,
          );

    if (!session) {
      return NextResponse.json(
        {
          status:
            "session_expired",
          error:
            "انتهت الجلسة. ابدأ محادثة جديدة.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      status:
        result.followUpQuestion
          ? "needs_information"
          : "differential_ready",
      mode: "gemini_assistant",
      intent: result.intent,
      reply: finalReply,
      plant: result.plant
        ? {
            resolved: {
              id:
                result.plant,
              name:
                result.plant,
              slug:
                result.plant,
            },
            alternatives: [],
          }
        : {
            alternatives: [],
          },
      image: image
        ? {
            status:
              "image_analyzed",
            observations:
              result.imageObservations,
          }
        : undefined,
      observedSymptoms:
        result.observedSymptoms,
      possibleDiagnoses:
        result.possibleDiagnoses,
      followUpQuestion:
        result.followUpQuestion,
      immediateActions:
        result.immediateActions,
      treatmentGuidance:
        result.treatmentGuidance,
      products:
        selectedProducts,
      warning: result.warning,

      /*
       * الحقول التالية موجودة للحفاظ على توافق الواجهة الحالية.
       * الرد الأساسي المعروض للمستخدم هو reply.
       */
      knowledgeRelease: {
        version:
          nextState.releaseVersion,
        manifestChecksum:
          nextState.manifestChecksum,
        contentChecksum:
          nextState.contentChecksum,
      },
      candidates: [],
      followUpQuestions: [],
      treatment: {
        immediateActions:
          result.immediateActions,
        monitoringSteps: [],
        treatmentGuidance:
          result.treatmentGuidance,
        products:
          selectedProducts.map(
            (product) => ({
              productId:
                product.id,
              name:
                product.nameAr,
              reason:
                "اختاره Gemini من قائمة منتجات ArtVert المنشورة والمتاحة فقط.",
              priority:
                "NORMAL" as const,
            }),
          ),
        contraindications:
          result.warning
            ? [result.warning]
            : [],
        unknownCompatibilityWarnings:
          [],
      },
      emergencyFlags: [],
      disclaimer:
        "التشخيص عن بُعد إرشادي، ويُفضّل الفحص الميداني عند شدة الإصابة أو انتشارها.",
    });
  } catch (error) {
    reportError(error, {
      requestId:
        requestId(
          request.headers,
        ),
      route:
        "doctor-chat",
    });

    const message =
      error instanceof Error
        ? error.message
        : "دكتور ArtVert غير متاح حاليًا.";

    return NextResponse.json(
      {
        status:
          "unavailable",
        error: message,
        retryable: true,
      },
      {
        status: 503,
      },
    );
  }
}
