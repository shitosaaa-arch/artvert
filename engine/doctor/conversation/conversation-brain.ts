import type {
  DoctorCase,
  DoctorConversationEntry,
  DoctorSessionState,
} from "@/engine/doctor/doctor-types";

export type ConversationIntent =
  | "SOCIAL"
  | "START_PROBLEM"
  | "DIAGNOSIS"
  | "FOLLOW_UP"
  | "GENERAL_QUESTION"
  | "PRODUCT_QUESTION"
  | "SWITCH_CASE"
  | "RETURN_TO_CASE"
  | "UNKNOWN";

export type ConversationBrainDecision = {
  intent: ConversationIntent;
  reply: string;
  shouldRunDiagnosis: boolean;
  shouldUseActiveCase: boolean;
  targetCaseId?: string;
  detectedPlant?: string;
  detectedSymptoms: string[];
  confidence: number;
};

export type ConversationBrainInput = {
  message: string;
  session?: DoctorSessionState;
};

export type ConversationModelInput = {
  systemPrompt: string;
  userPrompt: string;
};

export type ConversationModel = {
  generateJson<T>(
    input: ConversationModelInput,
  ): Promise<T>;
};

type RawConversationDecision = {
  intent?: string;
  reply?: string;
  shouldRunDiagnosis?: boolean;
  shouldUseActiveCase?: boolean;
  targetCaseId?: string;
  detectedPlant?: string;
  detectedSymptoms?: unknown;
  confidence?: number;
};

const validIntents = new Set<ConversationIntent>([
  "SOCIAL",
  "START_PROBLEM",
  "DIAGNOSIS",
  "FOLLOW_UP",
  "GENERAL_QUESTION",
  "PRODUCT_QUESTION",
  "SWITCH_CASE",
  "RETURN_TO_CASE",
  "UNKNOWN",
]);

function normalizeIntent(
  value: unknown,
): ConversationIntent {
  if (
    typeof value === "string" &&
    validIntents.has(
      value as ConversationIntent,
    )
  ) {
    return value as ConversationIntent;
  }

  return "UNKNOWN";
}

function normalizeConfidence(
  value: unknown,
) {
  if (
    typeof value !== "number" ||
    Number.isNaN(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, value),
  );
}

function normalizeSymptoms(
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
    .filter(Boolean)
    .slice(0, 12);
}

function caseSummary(
  doctorCase: DoctorCase,
) {
  return {
    id: doctorCase.id,
    title: doctorCase.title,
    plant: doctorCase.plant
      ? {
          name: doctorCase.plant.name,
          slug: doctorCase.plant.slug,
        }
      : undefined,
    status: doctorCase.status,
    latestDiagnosis:
      doctorCase.latestCandidates[0]
        ? {
            name:
              doctorCase.latestCandidates[0].name,
            type:
              doctorCase.latestCandidates[0].type,
            confidence:
              doctorCase.latestCandidates[0]
                .confidence,
          }
        : undefined,
    facts: doctorCase.facts
      .filter((fact) =>
        [
          "plant",
          "symptom",
          "location",
          "timing",
          "severity",
          "leaf_age",
          "vein_color",
        ].includes(fact.key),
      )
      .slice(-20)
      .map((fact) => ({
        key: fact.key,
        value: fact.value,
      })),
  };
}

function recentConversation(
  history: DoctorConversationEntry[],
) {
  return history
    .slice(-20)
    .map((entry) => ({
      role: entry.role,
      caseId: entry.caseId,
      message: entry.message,
    }));
}

function buildSystemPrompt() {
  return `
أنت العقل الحواري لدكتور ArtVert، مساعد زراعي مصري ذكي وطبيعي.

دورك الأساسي:
- تفهم رسالة المستخدم حتى لو عامية، مختصرة، ناقصة، أو فيها أخطاء إملائية.
- تتكلم باللهجة المصرية البسيطة، كأنك شخص حقيقي محترم وودود.
- تفرق بين الدردشة العادية، بداية المشكلة، المتابعة، السؤال الزراعي، والسؤال عن منتج.
- تشغّل محرك التشخيص فقط عند وجود مشكلة نباتية أو إجابة متابعة مرتبطة بحالة زراعية.
- تحافظ على الحالات السابقة في الخلفية من غير ما تخلطها بالدردشة الحالية.

قواعد الأسلوب:
- رد قصير وطبيعي، غالبًا من 3 إلى 18 كلمة.
- ممنوع الأسلوب الرسمي أو خدمة العملاء.
- ممنوع عبارات مثل:
  "شكرًا على إبلاغك"
  "عاوز تعرف على مشكلتك"
  "فهمت إنك بتسأل في موضوع زراعي"
  "يرجى التوضيح"
  "نحن سعداء بخدمتك"
- لا تكرر نفس الجملة كل مرة.
- لا تذكر أنك نموذج أو نظام أو محرك.
- لا تضف معلومات زراعية من نفسك.
- لو الرسالة اجتماعية، رد اجتماعي فقط حتى لو هناك حالة زراعية نشطة.
- لو الرسالة إجابة قصيرة على آخر سؤال زراعي، اعتبرها FOLLOW_UP وشغّل التشخيص.
- لو المستخدم بدأ موضوعًا جديدًا أو ذكر نباتًا جديدًا، لا تخلطه بالحالة السابقة.
- لو المستخدم رجع لنبات سابق، اختر الحالة المطابقة إن وُجدت.
- reply يكون فارغًا عندما shouldRunDiagnosis=true، لأن محرك ArtVert سيكوّن الرد النهائي.

أمثلة إلزامية على السلوك:

المستخدم: "هلا"
النتيجة:
{
  "intent": "SOCIAL",
  "reply": "أهلًا بيك 🌱 عامل إيه؟",
  "shouldRunDiagnosis": false,
  "shouldUseActiveCase": false,
  "detectedSymptoms": [],
  "confidence": 0.99
}

المستخدم: "عامل اى"
النتيجة:
{
  "intent": "SOCIAL",
  "reply": "بخير الحمد لله، إنت أخبارك إيه؟",
  "shouldRunDiagnosis": false,
  "shouldUseActiveCase": false,
  "detectedSymptoms": [],
  "confidence": 0.99
}

المستخدم: "الدنيا ايه"
النتيجة:
{
  "intent": "SOCIAL",
  "reply": "تمام الحمد لله 🌱 وإنت الدنيا معاك إيه؟",
  "shouldRunDiagnosis": false,
  "shouldUseActiveCase": false,
  "detectedSymptoms": [],
  "confidence": 0.98
}

المستخدم: "عندي مشكله"
النتيجة:
{
  "intent": "START_PROBLEM",
  "reply": "خير، احكيلي المشكلة.",
  "shouldRunDiagnosis": false,
  "shouldUseActiveCase": false,
  "detectedSymptoms": [],
  "confidence": 0.99
}

المستخدم: "الطماطم عندي ورقها مصفر"
النتيجة:
{
  "intent": "DIAGNOSIS",
  "reply": "",
  "shouldRunDiagnosis": true,
  "shouldUseActiveCase": false,
  "detectedPlant": "طماطم",
  "detectedSymptoms": ["اصفرار الأوراق"],
  "confidence": 0.99
}

لو آخر رد للدكتور كان:
"الاصفرار ظاهر أكتر في الأوراق الحديثة ولا القديمة؟"
ثم قال المستخدم:
"الحديثه"
فالنتيجة:
{
  "intent": "FOLLOW_UP",
  "reply": "",
  "shouldRunDiagnosis": true,
  "shouldUseActiveCase": true,
  "detectedSymptoms": ["الأوراق الحديثة"],
  "confidence": 0.99
}

لو توجد حالة طماطم نشطة ثم قال المستخدم:
"ازيك"
فالنتيجة:
{
  "intent": "SOCIAL",
  "reply": "أنا بخير الحمد لله 🌱 إنت عامل إيه؟",
  "shouldRunDiagnosis": false,
  "shouldUseActiveCase": false,
  "detectedSymptoms": [],
  "confidence": 0.99
}

لو قال المستخدم:
"ارجع للمانجو"
فالنتيجة:
{
  "intent": "RETURN_TO_CASE",
  "reply": "تمام، رجعنا لحالة المانجو.",
  "shouldRunDiagnosis": false,
  "shouldUseActiveCase": true,
  "targetCaseId": "استخدم رقم حالة المانجو من الحالات المتاحة",
  "detectedPlant": "مانجو",
  "detectedSymptoms": [],
  "confidence": 0.99
}

أعد JSON فقط بالشكل التالي:
{
  "intent": "SOCIAL | START_PROBLEM | DIAGNOSIS | FOLLOW_UP | GENERAL_QUESTION | PRODUCT_QUESTION | SWITCH_CASE | RETURN_TO_CASE | UNKNOWN",
  "reply": "string",
  "shouldRunDiagnosis": true,
  "shouldUseActiveCase": true,
  "targetCaseId": "string or undefined",
  "detectedPlant": "string or undefined",
  "detectedSymptoms": ["string"],
  "confidence": 0.0
}
`.trim();
}

function buildUserPrompt(
  input: ConversationBrainInput,
) {
  const session = input.session;

  return JSON.stringify(
    {
      message: input.message,
      activeCaseId:
        session?.activeCaseId,
      cases:
        session?.cases.map(
          caseSummary,
        ) ?? [],
      recentConversation:
        recentConversation(
          session?.conversationHistory ?? [],
        ),
    },
    null,
    2,
  );
}

export class ConversationBrain {
  constructor(
    private readonly model: ConversationModel,
  ) {}

  async understand(
    input: ConversationBrainInput,
  ): Promise<ConversationBrainDecision> {
    const message =
      input.message.trim();

    if (!message) {
      return {
        intent: "UNKNOWN",
        reply:
          "أنا معاك 🌱 قولّي عايز تسأل عن إيه.",
        shouldRunDiagnosis: false,
        shouldUseActiveCase:
          Boolean(
            input.session?.activeCaseId,
          ),
        detectedSymptoms: [],
        confidence: 1,
      };
    }

    const raw =
      await this.model.generateJson<RawConversationDecision>(
        {
          systemPrompt:
            buildSystemPrompt(),
          userPrompt:
            buildUserPrompt(input),
        },
      );

    return {
      intent:
        normalizeIntent(
          raw.intent,
        ),
      reply:
        typeof raw.reply === "string"
          ? raw.reply.trim()
          : "",
      shouldRunDiagnosis:
        Boolean(
          raw.shouldRunDiagnosis,
        ),
      shouldUseActiveCase:
        Boolean(
          raw.shouldUseActiveCase,
        ),
      targetCaseId:
        typeof raw.targetCaseId ===
        "string"
          ? raw.targetCaseId
          : undefined,
      detectedPlant:
        typeof raw.detectedPlant ===
        "string"
          ? raw.detectedPlant.trim() ||
            undefined
          : undefined,
      detectedSymptoms:
        normalizeSymptoms(
          raw.detectedSymptoms,
        ),
      confidence:
        normalizeConfidence(
          raw.confidence,
        ),
    };
  }
}
