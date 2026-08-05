"use client";

import type {
  DoctorCandidate,
  DoctorChatResponse,
} from "@/lib/doctor/chat-contract";

const confidenceCopy = {
  HIGH: "مرجح جدًا",
  MODERATE: "محتمل",
  LOW: "احتمال ضعيف",
  INSUFFICIENT: "المعلومات غير كافية",
} as const;

const candidateTypeCopy = {
  DISEASE: "مرض",
  PEST: "آفة",
  DEFICIENCY: "نقص عنصر",
} as const;

function unique(items: string[]) {
  return Array.from(
    new Set(
      items
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function cleanEnglishFallback(value: string) {
  const normalized = value.trim();

  const translations: Record<string, string> = {
    "Gather the next requested observation before selecting a treatment.":
      "أجب عن سؤال المتابعة التالي قبل اختيار أي معاملة.",
    "Product compatibility is unknown until sufficient evidence is available.":
      "لا يمكن تأكيد توافق المنتجات قبل توفر معلومات تشخيصية كافية.",
    "Active recommendation for likely":
      "منتج موصى به للحالة الأقرب",
  };

  return (
    translations[normalized] ??
    normalized
  );
}

function candidateReason(
  candidate: DoctorCandidate,
) {
  const evidence = unique(
    candidate.matchedEvidence
      .map((item) => item.detail)
      .map(cleanEnglishFallback),
  );

  if (evidence.length > 0) {
    return evidence
      .slice(0, 3)
      .join(" ");
  }

  if (
    candidate.explanation?.trim()
  ) {
    return cleanEnglishFallback(
      candidate.explanation,
    );
  }

  return "تم ترشيح هذا الاحتمال بناءً على المعلومات المتاحة حتى الآن.";
}

function renderProductReason(
  reason: string,
  candidate?: DoctorCandidate,
) {
  const cleaned =
    cleanEnglishFallback(reason);

  if (
    cleaned !== reason ||
    !candidate
  ) {
    return cleaned;
  }

  if (
    reason
      .toLowerCase()
      .includes(
        "active recommendation",
      )
  ) {
    return `موصى به للحالة الأقرب: ${candidate.name}.`;
  }

  return cleaned;
}

function topUsefulCandidate(
  result: DoctorChatResponse,
) {
  return (
    result.candidates.find(
      (candidate) =>
        candidate.confidence !==
        "INSUFFICIENT",
    ) ??
    result.candidates[0]
  );
}

function buildSummary(
  result: DoctorChatResponse,
) {
  const leader =
    topUsefulCandidate(result);

  const plantName =
    result.plant.resolved?.name;

  const immediateActions = unique(
    result.treatment.immediateActions.map(
      cleanEnglishFallback,
    ),
  );

  const monitoringSteps = unique(
    result.treatment.monitoringSteps.map(
      cleanEnglishFallback,
    ),
  );

  const treatmentGuidance = unique(
    result.treatment.treatmentGuidance.map(
      cleanEnglishFallback,
    ),
  );

  const contraindications = unique([
    ...result.treatment.contraindications,
    ...result.treatment
      .unknownCompatibilityWarnings,
  ]).map(cleanEnglishFallback);

  return {
    leader,
    plantName,
    immediateActions,
    monitoringSteps,
    treatmentGuidance,
    contraindications,
  };
}

function ProductRecommendation({
  result,
  candidate,
}: {
  result: DoctorChatResponse;
  candidate?: DoctorCandidate;
}) {
  if (
    result.treatment.products.length ===
    0
  ) {
    return null;
  }

  const products =
    result.treatment.products.slice(
      0,
      3,
    );

  return (
    <div className="mt-5">
      <h3 className="font-black text-lime-200">
        منتجات ArtVert المقترحة
      </h3>

      <div className="mt-3 space-y-3">
        {products.map((product) => (
          <div
            key={product.productId}
            className="rounded-2xl border border-lime-300/30 bg-lime-300/10 p-4"
          >
            <p className="font-black text-white">
              <bdi>{product.name}</bdi>
            </p>

            <p className="mt-2 text-sm leading-7 text-green-50/85">
              {renderProductReason(
                product.reason,
                candidate,
              )}
            </p>

            {product.compatibilityWarning ? (
              <p className="mt-2 text-xs leading-6 text-amber-100">
                تنبيه:{" "}
                {cleanEnglishFallback(
                  product.compatibilityWarning,
                )}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DoctorResult({
  result,
}: {
  result: DoctorChatResponse;
}) {
  const unavailable =
    result.status ===
      "unavailable" ||
    result.status ===
      "session_expired" ||
    result.status ===
      "knowledge_release_unavailable";

  if (unavailable) {
    return (
      <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4">
        <p className="text-sm leading-7 text-amber-100">
          {result.error ||
            "الخدمة غير متاحة حاليًا. حاول مرة أخرى بعد قليل."}
        </p>
      </div>
    );
  }

  const {
    leader,
    plantName,
    immediateActions,
    monitoringSteps,
    treatmentGuidance,
    contraindications,
  } = buildSummary(result);

  if (!leader) {
    return (
      <div className="rounded-2xl border border-green-700/60 bg-green-950/35 p-5">
        <p className="text-sm leading-8 text-green-50/90">
          صف المشكلة الظاهرة على النبات، ويفضل ذكر اسم النبات ومكان ظهور العرض وهل بدأ في الأوراق القديمة أم الحديثة.
        </p>
      </div>
    );
  }

  const needsMoreInformation =
    leader.confidence ===
      "INSUFFICIENT" ||
    result.status ===
      "insufficient_information";

  return (
    <article className="rounded-3xl border border-lime-300/45 bg-gradient-to-b from-green-950/70 to-black/20 p-5 shadow-xl shadow-black/20 sm:p-6">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-bold text-lime-200">
            ملخص دكتور ArtVert
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            {needsMoreInformation
              ? "نحتاج معلومة إضافية قبل تأكيد التشخيص"
              : "التشخيص الأقرب"}
          </h2>
        </div>

        {plantName ? (
          <p className="text-sm leading-7 text-green-50/90">
            <span className="font-black text-lime-200">
              النبات:
            </span>{" "}
            <bdi>{plantName}</bdi>
          </p>
        ) : null}

        <p className="text-sm leading-7 text-green-50/90">
          <span className="font-black text-lime-200">
            الاحتمال الأقرب:
          </span>{" "}
          <bdi>{leader.name}</bdi>{" "}
          <span className="text-green-50/65">
            (
            {candidateTypeCopy[
              leader.type
            ] ?? "تشخيص"}
            )
          </span>
        </p>

        <p className="text-sm leading-7 text-green-50/90">
          <span className="font-black text-lime-200">
            درجة الثقة:
          </span>{" "}
          {
            confidenceCopy[
              leader.confidence
            ]
          }
        </p>

        <p className="text-sm leading-8 text-green-50/90">
          <span className="font-black text-lime-200">
            سبب الترشيح:
          </span>{" "}
          {candidateReason(leader)}
        </p>

        {result.emergencyFlags.length >
        0 ? (
          <div
            role="alert"
            className="rounded-2xl border border-amber-300/50 bg-amber-500/10 p-4"
          >
            <p className="font-black text-amber-100">
              تنبيه عاجل
            </p>

            <p className="mt-2 text-sm leading-7 text-amber-50">
              {unique(
                result.emergencyFlags,
              ).join(" ")}
            </p>
          </div>
        ) : null}

        {immediateActions.length >
        0 ? (
          <div>
            <h3 className="font-black text-lime-200">
              الإجراء الفوري
            </h3>

            <p className="mt-2 text-sm leading-8 text-green-50/90">
              {immediateActions.join(
                " ",
              )}
            </p>
          </div>
        ) : null}

        {treatmentGuidance.length >
        0 ? (
          <div>
            <h3 className="font-black text-lime-200">
              الإرشاد العلاجي
            </h3>

            <p className="mt-2 text-sm leading-8 text-green-50/90">
              {treatmentGuidance.join(
                " ",
              )}
            </p>
          </div>
        ) : null}

        <ProductRecommendation
          result={result}
          candidate={leader}
        />

        {monitoringSteps.length > 0 ? (
          <div>
            <h3 className="font-black text-lime-200">
              المتابعة
            </h3>

            <p className="mt-2 text-sm leading-8 text-green-50/90">
              {monitoringSteps.join(
                " ",
              )}
            </p>
          </div>
        ) : null}

        {contraindications.length >
        0 ? (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
            <h3 className="font-black text-amber-100">
              تنبيه مهم
            </h3>

            <p className="mt-2 text-sm leading-7 text-amber-50">
              {contraindications.join(
                " ",
              )}
            </p>
          </div>
        ) : null}

        {result.disclaimer ? (
          <p
            role="note"
            className="border-t border-green-700/50 pt-4 text-xs leading-6 text-green-50/55"
          >
            {cleanEnglishFallback(
              result.disclaimer,
            )}
          </p>
        ) : null}
      </div>
    </article>
  );
}
