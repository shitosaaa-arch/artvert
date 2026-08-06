export type AgriculturalAssistantRole =
  | "user"
  | "assistant";

export type AgriculturalAssistantMessage = {
  role: AgriculturalAssistantRole;
  text: string;
};

export type AgriculturalImageInput = {
  mimeType:
    | "image/jpeg"
    | "image/png"
    | "image/webp";
  base64Data: string;
};

export type AgriculturalProductContext = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string;
  category?: string;
  composition?: string;
  dosage?: string;
  benefits?: string[];
  crops?: string[];
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  image?: string;
  productUrl?: string;
  inStock?: boolean;
  stockQuantity?: number;
  reason?: string;
  warnings?: string[];
};

export type AgriculturalKnowledgeContext = {
  sourceId: string;
  title: string;
  content: string;
};

export type GeminiAgriculturalAssistantInput = {
  message: string;
  history?: AgriculturalAssistantMessage[];
  image?: AgriculturalImageInput;
  products?: AgriculturalProductContext[];
  knowledge?: AgriculturalKnowledgeContext[];
};

export type GeminiAgriculturalAssistantResult = {
  intent:
    | "SOCIAL"
    | "GENERAL_AGRICULTURE"
    | "PLANT_CARE"
    | "DIAGNOSIS"
    | "FOLLOW_UP"
    | "PRODUCT_QUESTION"
    | "UNKNOWN";
  reply: string;
  plant?: string;
  observedSymptoms: string[];
  imageObservations: string[];
  possibleDiagnoses: Array<{
    name: string;
    confidence:
      | "HIGH"
      | "MODERATE"
      | "LOW";
    reasoning: string;
    supportingEvidence: string[];
    missingEvidence: string[];
  }>;
  followUpQuestion?: string;
  immediateActions: string[];
  treatmentGuidance: string[];
  recommendedProductIds: string[];
  warning?: string;
};

type GeminiAssistantOptions = {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
};

type GeminiApiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
};

const DEFAULT_TIMEOUT_MS =
  45_000;

function requiredEnvironmentValue(
  name: string,
  explicitValue?: string,
) {
  const value =
    explicitValue?.trim() ||
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is required.`,
    );
  }

  return value;
}

function cleanJsonText(
  value: string,
) {
  const trimmed =
    value.trim();

  if (
    trimmed.startsWith("```")
  ) {
    return trimmed
      .replace(
        /^```(?:json)?\s*/i,
        "",
      )
      .replace(
        /\s*```$/,
        "",
      )
      .trim();
  }

  return trimmed;
}

function parseJsonResult(
  value: string,
): GeminiAgriculturalAssistantResult {
  const cleaned =
    cleanJsonText(value);

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(cleaned);
  } catch {
    const firstBrace =
      cleaned.indexOf("{");

    const lastBrace =
      cleaned.lastIndexOf("}");

    if (
      firstBrace < 0 ||
      lastBrace <= firstBrace
    ) {
      throw new Error(
        "Gemini returned invalid JSON.",
      );
    }

    parsed =
      JSON.parse(
        cleaned.slice(
          firstBrace,
          lastBrace + 1,
        ),
      );
  }

  if (
    !parsed ||
    typeof parsed !== "object"
  ) {
    throw new Error(
      "Gemini returned an invalid assistant result.",
    );
  }

  const result =
    parsed as Partial<GeminiAgriculturalAssistantResult>;

  if (
    typeof result.reply !==
    "string"
  ) {
    throw new Error(
      "Gemini response is missing reply.",
    );
  }

  return {
    intent:
      result.intent ??
      "UNKNOWN",
    reply:
      result.reply.trim(),
    plant:
      typeof result.plant ===
        "string" &&
      result.plant.trim()
        ? result.plant.trim()
        : undefined,
    observedSymptoms:
      Array.isArray(
        result.observedSymptoms,
      )
        ? result.observedSymptoms.filter(
            (
              item,
            ): item is string =>
              typeof item ===
              "string",
          )
        : [],
    imageObservations:
      Array.isArray(
        result.imageObservations,
      )
        ? result.imageObservations.filter(
            (
              item,
            ): item is string =>
              typeof item ===
              "string",
          )
        : [],
    possibleDiagnoses:
      Array.isArray(
        result.possibleDiagnoses,
      )
        ? result.possibleDiagnoses
            .filter(
              (
                item,
              ): item is GeminiAgriculturalAssistantResult["possibleDiagnoses"][number] =>
                Boolean(
                  item &&
                    typeof item ===
                      "object" &&
                    typeof (
                      item as {
                        name?: unknown;
                      }
                    ).name ===
                      "string",
                ),
            )
            .slice(0, 3)
        : [],
    followUpQuestion:
      typeof result.followUpQuestion ===
        "string" &&
      result.followUpQuestion.trim()
        ? result.followUpQuestion.trim()
        : undefined,
    immediateActions:
      Array.isArray(
        result.immediateActions,
      )
        ? result.immediateActions.filter(
            (
              item,
            ): item is string =>
              typeof item ===
              "string",
          )
        : [],
    treatmentGuidance:
      Array.isArray(
        result.treatmentGuidance,
      )
        ? result.treatmentGuidance.filter(
            (
              item,
            ): item is string =>
              typeof item ===
              "string",
          )
        : [],
    recommendedProductIds:
      Array.isArray(
        result.recommendedProductIds,
      )
        ? result.recommendedProductIds.filter(
            (
              item,
            ): item is string =>
              typeof item ===
              "string",
          )
        : [],
    warning:
      typeof result.warning ===
        "string" &&
      result.warning.trim()
        ? result.warning.trim()
        : undefined,
  };
}

function systemPrompt() {
  return `
أنت دكتور ArtVert، مساعد زراعي شخصي ذكي يتحدث بالعربية المصرية الطبيعية ويفهم اللهجات العربية والأخطاء الإملائية.

مسؤولياتك:
- إجراء محادثة طبيعية وغير متكررة.
- فهم اسم النبات حتى لو كُتب بصيغة عامية أو بها خطأ.
- تحليل وصف المستخدم والصورة إن وُجدت.
- اقتراح تشخيص تفريقي زراعي بحد أقصى 3 احتمالات.
- توضيح درجة الثقة والأدلة والنواقص.
- سؤال سؤال متابعة واحد فقط عند الحاجة.
- تقديم إجراءات آمنة وعلاج إرشادي.
- اختيار منتجات ArtVert من قائمة المنتجات المرسلة فقط.

قواعد صارمة:
- لا تخترع اسم منتج أو جرعة أو تركيب.
- recommendedProductIds يجب أن تحتوي فقط على IDs موجودة في products.
- لا تعتبر الصورة وحدها تشخيصًا مؤكدًا.
- لو الصورة غير واضحة، اذكر ذلك واطلب صورة أفضل.
- لا تنقل أعراض حالة قديمة إلى نبات جديد.
- لو المستخدم يتحدث اجتماعيًا، رد اجتماعيًا فقط.
- لا تستخدم أسلوب خدمة العملاء أو التكرار.
- لا تقل "يا باشمهندس" أو "يا فندم" إلا إذا طلب المستخدم ذلك.
- لا تدّعِ دقة 100%.
- اجعل reply ردًا عربيًا واحدًا طبيعيًا ومفيدًا.
- لو المعلومات غير كافية، لا تخمن؛ اسأل السؤال الأهم.
- استخدم المعرفة المرسلة كمرجع مساعد، ولا تنسب إليها ما ليس فيها.

أعد JSON فقط بالشكل التالي:
{
  "intent": "SOCIAL | GENERAL_AGRICULTURE | PLANT_CARE | DIAGNOSIS | FOLLOW_UP | PRODUCT_QUESTION | UNKNOWN",
  "reply": "string",
  "plant": "string or omitted",
  "observedSymptoms": ["string"],
  "imageObservations": ["string"],
  "possibleDiagnoses": [
    {
      "name": "string",
      "confidence": "HIGH | MODERATE | LOW",
      "reasoning": "string",
      "supportingEvidence": ["string"],
      "missingEvidence": ["string"]
    }
  ],
  "followUpQuestion": "string or omitted",
  "immediateActions": ["string"],
  "treatmentGuidance": ["string"],
  "recommendedProductIds": ["string"],
  "warning": "string or omitted"
}
`.trim();
}

function userPrompt(
  input: GeminiAgriculturalAssistantInput,
) {
  return JSON.stringify(
    {
      currentMessage:
        input.message,
      conversationHistory:
        input.history?.slice(-20) ??
        [],
      availableProducts:
        input.products ?? [],
      retrievedKnowledge:
        input.knowledge ?? [],
      hasImage:
        Boolean(input.image),
    },
    null,
    2,
  );
}

function responseText(
  payload: GeminiApiResponse,
) {
  return (
    payload.candidates?.[0]
      ?.content?.parts
      ?.map(
        (part) =>
          part.text ?? "",
      )
      .join("")
      .trim() ?? ""
  );
}

export class GeminiAgriculturalAssistant {
  private readonly apiKey:
    string;

  private readonly model:
    string;

  private readonly timeoutMs:
    number;

  constructor(
    options:
      GeminiAssistantOptions = {},
  ) {
    this.apiKey =
      requiredEnvironmentValue(
        "GEMINI_API_KEY",
        options.apiKey,
      );

    /*
     * لا نضع اسم موديل ثابت حتى لا يتعطل المشروع عند إيقاف موديل.
     * يتم اختيار الموديل من .env.local أو إعدادات Vercel.
     */
    this.model =
      requiredEnvironmentValue(
        "GEMINI_MODEL",
        options.model,
      );

    this.timeoutMs =
      options.timeoutMs ??
      DEFAULT_TIMEOUT_MS;
  }

  async respond(
    input: GeminiAgriculturalAssistantInput,
  ): Promise<GeminiAgriculturalAssistantResult> {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        this.timeoutMs,
      );

    try {
      const parts: Array<
        | {
            text: string;
          }
        | {
            inlineData: {
              mimeType: string;
              data: string;
            };
          }
      > = [];

      if (input.image) {
        parts.push({
          inlineData: {
            mimeType:
              input.image.mimeType,
            data:
              input.image.base64Data,
          },
        });
      }

      parts.push({
        text:
          userPrompt(input),
      });

      const response =
        await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            this.model,
          )}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              "x-goog-api-key":
                this.apiKey,
            },
            body:
              JSON.stringify({
                systemInstruction: {
                  parts: [
                    {
                      text:
                        systemPrompt(),
                    },
                  ],
                },
                contents: [
                  {
                    role: "user",
                    parts,
                  },
                ],
                generationConfig: {
                  maxOutputTokens:
                    1800,
                  responseMimeType:
                    "application/json",
                },
              }),
            signal:
              controller.signal,
          },
        );

      const payload =
        (await response.json()) as
          GeminiApiResponse;

      if (!response.ok) {
        throw new Error(
          payload.error
            ?.message ||
            `Gemini request failed with status ${response.status}.`,
        );
      }

      if (
        payload.promptFeedback
          ?.blockReason
      ) {
        throw new Error(
          `Gemini blocked the request: ${payload.promptFeedback.blockReason}.`,
        );
      }

      const text =
        responseText(payload);

      if (!text) {
        const finishReason =
          payload.candidates?.[0]
            ?.finishReason;

        throw new Error(
          finishReason
            ? `Gemini returned an empty response (${finishReason}).`
            : "Gemini returned an empty response.",
        );
      }

      return parseJsonResult(
        text,
      );
    } catch (error) {
      if (
        error instanceof
          DOMException &&
        error.name ===
          "AbortError"
      ) {
        throw new Error(
          "Gemini agricultural assistant timed out.",
        );
      }

      throw error;
    } finally {
      clearTimeout(
        timeout,
      );
    }
  }
}

let sharedAssistant:
  | GeminiAgriculturalAssistant
  | undefined;

export function getGeminiAgriculturalAssistant() {
  if (!sharedAssistant) {
    sharedAssistant =
      new GeminiAgriculturalAssistant();
  }

  return sharedAssistant;
}