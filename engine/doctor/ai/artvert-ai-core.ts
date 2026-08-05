import {
  analyzeArabicPlantMessage,
} from "@/engine/doctor/arabic-nlp";
import {
  ConversationBrain,
  type ConversationBrainDecision,
  type ConversationModel,
} from "@/engine/doctor/conversation/conversation-brain";
import { DoctorEngine } from "@/engine/doctor/doctor-engine";
import type {
  DoctorResult,
  DoctorSessionState,
  DoctorTurn,
} from "@/engine/doctor/doctor-types";
import type { KnowledgeReader } from "@/lib/knowledge/knowledge-reader";

export type ArtVertAiCoreInput = {
  turn: DoctorTurn;
  session?: DoctorSessionState;
};

export type ArtVertAiCoreResult = {
  mode:
    | "conversation"
    | "diagnosis";
  decision:
    ConversationBrainDecision;
  reply: string;
  diagnosis?: DoctorResult;
};

function emptyMessageReply() {
  return "أنا معاك 🌱 قولّي عايز تسأل عن إيه.";
}

function userMessage(
  turn: DoctorTurn,
) {
  if (turn.message?.trim()) {
    return turn.message.trim();
  }

  if (turn.answers) {
    return Object.values(
      turn.answers,
    )
      .flatMap((answer) =>
        Array.isArray(answer)
          ? answer
          : [answer],
      )
      .join("، ");
  }

  return "";
}

function isSocialIntent(
  decision: ConversationBrainDecision,
) {
  return (
    decision.intent === "SOCIAL"
  );
}

function hasAgriculturalSignal(
  message: string,
) {
  const analysis =
    analyzeArabicPlantMessage(
      message,
    );

  return {
    analysis,
    hasPlant:
      analysis.plantHints.length >
      0,
    hasSymptoms:
      analysis.symptoms.some(
        (symptom) =>
          symptom !== "UNKNOWN",
      ),
  };
}

function forceDiagnosisDecision(
  original:
    ConversationBrainDecision,
  plant?: string,
  symptoms: string[] = [],
): ConversationBrainDecision {
  return {
    ...original,
    intent:
      original.intent ===
        "FOLLOW_UP"
        ? "FOLLOW_UP"
        : "DIAGNOSIS",
    reply: "",
    shouldRunDiagnosis: true,
    shouldUseActiveCase:
      original.intent ===
        "FOLLOW_UP" ||
      (!plant &&
        original.shouldUseActiveCase),
    detectedPlant:
      plant ??
      original.detectedPlant,
    detectedSymptoms:
      symptoms.length > 0
        ? symptoms
        : original.detectedSymptoms,
    confidence:
      Math.max(
        original.confidence,
        0.99,
      ),
  };
}

function confidenceCopy(
  confidence:
    DoctorResult["candidates"][number]["confidence"],
) {
  if (confidence === "HIGH") {
    return "مرجح جدًا";
  }

  if (
    confidence === "MODERATE"
  ) {
    return "محتمل";
  }

  if (confidence === "LOW") {
    return "احتمال ضعيف";
  }

  return "المعلومات لسه مش كفاية";
}

function cleanText(
  value: string,
) {
  return value
    .replace(
      /plant-required-label-required/gi,
      "لازم تتأكد إن المنتج مسجل للمحصول والحالة وتلتزم ببطاقة الاستخدام.",
    )
    .replace(
      /plant-required/gi,
      "لازم تتأكد إن المنتج مناسب للمحصول.",
    )
    .replace(
      /Active recommendation for likely/gi,
      "موصى به للحالة الأقرب:",
    )
    .trim();
}

function followUpReply(
  diagnosis: DoctorResult,
) {
  const question =
    diagnosis.followUpQuestions[0];

  if (!question) {
    return undefined;
  }

  const plantName =
    diagnosis.plant.resolved?.name;

  if (plantName) {
    return `تمام، فهمت إن المشكلة في ${plantName}. ${question.prompt}`;
  }

  return question.prompt;
}

function diagnosisReply(
  diagnosis: DoctorResult,
) {
  const leader =
    diagnosis.candidates[0];

  const question =
    diagnosis.followUpQuestions[0];

  if (!leader) {
    return (
      question?.prompt ??
      "قولّي اسم النبات وإيه العرض اللي ظاهر عليه، وأنا هكمل معاك خطوة بخطوة."
    );
  }

  const plantName =
    diagnosis.plant.resolved?.name;

  const evidence =
    leader.matchedEvidence
      .map((item) =>
        cleanText(item.detail),
      )
      .filter(Boolean)
      .slice(0, 2);

  const actions = [
    ...diagnosis.treatment
      .immediateActions,
    ...diagnosis.treatment
      .treatmentGuidance,
  ]
    .map(cleanText)
    .filter(Boolean)
    .slice(0, 4);

  const products =
    diagnosis.treatment.products
      .slice(0, 3);

  const parts: string[] = [];

  parts.push(
    plantName
      ? `بالنسبة لـ${plantName}، أقرب احتمال هو ${leader.name}، ودرجة الترجيح ${confidenceCopy(
          leader.confidence,
        )}.`
      : `أقرب احتمال هو ${leader.name}، ودرجة الترجيح ${confidenceCopy(
          leader.confidence,
        )}.`,
  );

  if (evidence.length > 0) {
    parts.push(
      `السبب: ${evidence.join(
        " ",
      )}`,
    );
  } else if (
    leader.explanation?.trim()
  ) {
    parts.push(
      cleanText(
        leader.explanation,
      ),
    );
  }

  if (actions.length > 0) {
    parts.push(
      `اعمل الآتي: ${actions
        .map(
          (
            item,
            index,
          ) =>
            `${index + 1}) ${item}`,
        )
        .join(" ")}`,
    );
  }

  if (products.length > 0) {
    const productText =
      products
        .map((product) => {
          const reason =
            cleanText(
              product.reason,
            );

          return reason
            ? `${product.name}: ${reason}`
            : product.name;
        })
        .join(" — ");

    parts.push(
      `ومن منتجات ArtVert المرتبطة بالحالة: ${productText}`,
    );
  }

  if (
    diagnosis.emergencyFlags
      .length > 0
  ) {
    parts.push(
      `تنبيه: ${diagnosis.emergencyFlags
        .map(cleanText)
        .join(" ")}`,
    );
  }

  if (question) {
    parts.push(
      question.prompt,
    );
  }

  return parts.join("\n\n");
}

export class ArtVertAiCore {
  private readonly brain:
    ConversationBrain;

  private readonly doctor:
    DoctorEngine;

  constructor(
    reader: KnowledgeReader,
    model: ConversationModel,
  ) {
    this.brain =
      new ConversationBrain(
        model,
      );

    this.doctor =
      new DoctorEngine(
        reader,
      );
  }

  async respond(
    input: ArtVertAiCoreInput,
  ): Promise<ArtVertAiCoreResult> {
    const message =
      userMessage(input.turn);

    if (!message) {
      const decision:
        ConversationBrainDecision = {
        intent: "UNKNOWN",
        reply:
          emptyMessageReply(),
        shouldRunDiagnosis:
          false,
        shouldUseActiveCase:
          Boolean(
            input.session
              ?.activeCaseId,
          ),
        detectedSymptoms:
          [],
        confidence: 1,
      };

      return {
        mode: "conversation",
        decision,
        reply:
          decision.reply,
      };
    }

    const modelDecision =
      await this.brain.understand({
        message,
        session:
          input.session,
      });

    const {
      analysis,
      hasPlant,
      hasSymptoms,
    } =
      hasAgriculturalSignal(
        message,
      );

    /*
     * التحية والدردشة تظل اجتماعية فقط.
     * لكن وجود نبات أو عرض زراعي واضح يلغي أي تصنيف اجتماعي خاطئ.
     */
    const shouldForceDiagnosis =
      !isSocialIntent(
        modelDecision,
      ) &&
      (
        hasPlant ||
        hasSymptoms ||
        modelDecision.intent ===
          "FOLLOW_UP"
      );

    const decision =
      shouldForceDiagnosis
        ? forceDiagnosisDecision(
            modelDecision,
            analysis.plantHints[0],
            analysis.symptoms.filter(
              (symptom) =>
                symptom !==
                "UNKNOWN",
            ),
          )
        : modelDecision;

    if (
      !decision.shouldRunDiagnosis
    ) {
      return {
        mode: "conversation",
        decision,
        reply:
          decision.reply ||
          emptyMessageReply(),
      };
    }

    const diagnosisTurn:
      DoctorTurn = {
      ...input.turn,
      message,
      context: {
        ...input.turn.context,

        /*
         * لو المستخدم ذكر نباتًا جديدًا، لا نرسل caseId القديم.
         * Case Manager سيفتح حالة مستقلة تلقائيًا.
         */
        caseId:
          decision.detectedPlant
            ? undefined
            : (
                decision.targetCaseId ??
                input.turn.context
                  ?.caseId
              ),

        plant:
          decision.detectedPlant ??
          input.turn.context?.plant,

        symptoms:
          decision.detectedSymptoms
            .length > 0
            ? decision.detectedSymptoms
            : input.turn.context
                ?.symptoms,
      },
    };

    const diagnosis =
      await this.doctor.diagnose(
        diagnosisTurn,
        input.session,
      );

    /*
     * لو المحرك محتاج معلومة، نظهر سؤالًا واحدًا فقط.
     * لا نسمح لأي موديل باختراع تشخيص أو منتجات قبل اكتمال الأدلة.
     */
    if (
      diagnosis.status ===
        "needs_information" ||
      diagnosis.status ===
        "insufficient_information"
    ) {
      const reply =
        followUpReply(
          diagnosis,
        );

      if (reply) {
        return {
          mode: "diagnosis",
          decision,
          reply,
          diagnosis,
        };
      }
    }

    /*
     * صياغة التشخيص هنا محلية وحاسمة.
     * Gemini مسؤول عن فهم المحادثة فقط، وليس عن اختراع التشخيص أو المنتجات.
     */
    return {
      mode: "diagnosis",
      decision,
      reply:
        diagnosisReply(
          diagnosis,
        ),
      diagnosis,
    };
  }
}
