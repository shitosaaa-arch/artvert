import type { KnowledgeEntityEnvelope, JsonValue } from "@/schemas/knowledge-entity-envelope";

import { KnowledgeReader } from "@/lib/knowledge/knowledge-reader";
import {
  analyzeArabicPlantMessage,
  type ArabicNlpResult,
} from "@/engine/doctor/arabic-nlp";
import {
  buildDoctorCaseTitle,
  resolvedPlantForCase,
  selectDoctorCase,
  upsertDoctorCase,
} from "@/engine/doctor/conversation/case-manager";
import {
  appendUserMessage,
  trimConversationHistory,
} from "@/engine/doctor/conversation/conversation-manager";
import {
  createDoctorSession,
  normalizeDoctorSessionState,
  updateDoctorSession,
} from "@/engine/doctor/conversation/session-manager";

import type {
  CandidateKind,
  ConfidenceBand,
  DoctorCandidate,
  DoctorCase,
  DoctorEvidence,
  DoctorProductRecommendation,
  DoctorQuestion,
  DoctorResult,
  DoctorSessionState,
  DoctorStatus,
  DoctorTreatmentPlan,
  DoctorTurn,
} from "@/engine/doctor/doctor-types";

export const diagnosisWeights = {
  plantCompatibility: 4,
  exactSymptom: 18,
  partialSymptom: 7,
  locationContext: 8,
  timing: 6,
  severity: 4,
  contradictionPenalty: 30,
  missingEvidencePenalty: 5,
  strongRuleMatch: 48,
  mediumRuleMatch: 30,
  weakRuleMatch: 14,
  wrongNamedHostPenalty: 120,
  genericDiseasePenalty: 24,
  genericPestPenalty: 18,
  explicitEntityName: 36,
} as const;

type JsonRecord = Record<string, JsonValue>;
type ScoredCandidate = DoctorCandidate & { score: number; entity: KnowledgeEntityEnvelope };

const disclaimer =
  "هذا دعم لاتخاذ القرار وليس تشخيصًا مؤكدًا. افحص النبات جيدًا، والتزم ببطاقة المنتج والقوانين المحلية، واستشر مهندسًا زراعيًا عند شدة الإصابة أو انتشارها السريع.";

function normalize(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .toLocaleLowerCase("ar")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/ـ/gu, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ؤ/gu, "و")
    .replace(/ئ/gu, "ي")
    .replace(/ة/gu, "ه")
    .trim()
    .replace(/[\s\p{P}\p{S}]+/gu, " ")
    .trim();

  const replacements: Array<[RegExp, string]> = [
    [/\b(الورق|ورق|الورقه|ورقه|الاوراق)\b/gu, "اوراق"],
    [/\b(الجديد|الجديده|حديث|حديثه|الحديث|الحديثه)\b/gu, "حديثه"],
    [/\b(القديم|القديمه|قديم|قديمه)\b/gu, "قديمه"],
    [/\b(اصفر|صفراء|صفرا|مصفر|مصفره|اصفرار)\b/gu, "اصفرار"],
    [/\b(اخضر|خضراء|خضرا|خضره)\b/gu, "خضراء"],
    [/\b(العروق|عروق)\b/gu, "عروق"],
    [/\b(بنيه|بني|بنيّه)\b/gu, "بنيه"],
    [/\b(ذابله|دابل|مدبل|مدبله)\b/gu, "ذبول"],
    [/\b(الحواف|اطراف|الاطراف)\b/gu, "حواف"],
    [/\b(حرق|محروقه)\b/gu, "احتراق"],
    [/\b(منجا|مانجا|مانجوه|مناجو)\b/gu, "مانجو"],
    [/\b(لمون|ليمونه)\b/gu, "ليمون"],
    [/\b(طماطمايه)\b/gu, "طماطم"],
    [/\b(فلفله)\b/gu, "فلفل"],
    [/\b(خياره)\b/gu, "خيار"],
  ];

  return replacements.reduce(
    (current, [pattern, replacement]) =>
      current.replace(pattern, replacement),
    normalized,
  );
}

function record(value: JsonValue): JsonRecord | null {
  return value && !Array.isArray(value) && typeof value === "object" ? value as JsonRecord : null;
}

function strings(value: JsonValue | undefined, depth = 0): string[] {
  if (depth > 3 || value === undefined || value === null) return [];
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];

  if (Array.isArray(value)) {
    return value.flatMap((item) => strings(item, depth + 1));
  }

  const valueRecord = record(value);
  if (!valueRecord) return [];

  const preferredKeys = [
    "value",
    "name",
    "nameAr",
    "nameEn",
    "slug",
    "id",
    "plantId",
    "plantSlug",
    "scientificName",
    "notes",
    "seasonalContext",
  ];

  const preferred = preferredKeys.flatMap((key) =>
    strings(valueRecord[key], depth + 1),
  );

  if (preferred.length > 0) return preferred;

  return Object.values(valueRecord).flatMap((item) =>
    strings(item, depth + 1),
  );
}

function payloadStrings(entity: KnowledgeEntityEnvelope, keys: string[]): string[] {
  const payload = record(entity.payload);
  if (!payload) return [];
  return keys.flatMap((key) => strings(payload[key]));
}

function fact(key: string, value: string, provenance: DoctorEvidence["provenance"], detail: string): DoctorEvidence {
  return { key, value: normalize(value), provenance, detail };
}

function uniqueFacts(facts: DoctorEvidence[]): DoctorEvidence[] {
  const seen = new Set<string>();
  return facts.filter((item) => {
    const key = `${item.key}:${item.value}:${item.provenance}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function nlpSymptomFacts(
  analysis: ArabicNlpResult,
): DoctorEvidence[] {
  const facts: DoctorEvidence[] = [];

  const symptomCopy: Partial<
    Record<
      ArabicNlpResult["symptoms"][number],
      string
    >
  > = {
    YELLOWING: "اصفرار الأوراق",
    INTERVEINAL_CHLOROSIS:
      "اصفرار بين العروق مع بقاء العروق خضراء",
    BROWN_SPOTS: "بقع بنية",
    BLACK_SPOTS: "بقع سوداء",
    WHITE_POWDER: "مسحوق أبيض على الأوراق",
    EDGE_BURN: "احتراق حواف الأوراق",
    WILTING: "ذبول",
    LEAF_CURL: "التفاف الأوراق",
    DISTORTED_NEW_GROWTH:
      "تشوه النمو الحديث",
    TIP_DEATH: "موت القمة النامية",
    ROOT_ROT: "تعفن الجذور",
    STEM_ROT: "تعفن الساق",
    FRUIT_ROT: "تعفن الثمار",
    STUNTING: "تقزم وضعف النمو",
    LEAF_DROP: "تساقط الأوراق",
    FRUIT_DROP: "تساقط الثمار",
    VISIBLE_INSECTS: "وجود حشرات ظاهرة",
    WHITEFLY: "ذبابة بيضاء",
    APHIDS: "حشرة المن",
    THRIPS: "تربس",
    MITES: "أكاروس أو عنكبوت أحمر",
    MEALYBUG: "بق دقيقي",
    SCALE_INSECTS: "حشرات قشرية",
    LEAF_MINER: "صانعات الأنفاق",
    BORER: "حفار أو ثاقب",
  };

  for (const symptom of analysis.symptoms) {
    const value = symptomCopy[symptom];

    if (!value) continue;

    facts.push(
      fact(
        "symptom",
        value,
        "USER_INFERRED",
        "تم استخراج العرض تلقائيًا من رسالة المستخدم.",
      ),
    );
  }

  if (analysis.leafAge === "NEW") {
    facts.push(
      fact(
        "leaf_age",
        "NEW",
        "USER_INFERRED",
        "تم استنتاج أن العرض يظهر على الأوراق الحديثة.",
      ),
    );

    facts.push(
      fact(
        "symptom",
        "الأوراق الحديثة",
        "USER_INFERRED",
        "تم استنتاج أن العرض يظهر على الأوراق الحديثة.",
      ),
    );
  } else if (analysis.leafAge === "OLD") {
    facts.push(
      fact(
        "leaf_age",
        "OLD",
        "USER_INFERRED",
        "تم استنتاج أن العرض يظهر على الأوراق القديمة.",
      ),
    );

    facts.push(
      fact(
        "symptom",
        "الأوراق القديمة",
        "USER_INFERRED",
        "تم استنتاج أن العرض يظهر على الأوراق القديمة.",
      ),
    );
  } else if (analysis.leafAge === "ALL") {
    facts.push(
      fact(
        "leaf_age",
        "ALL",
        "USER_INFERRED",
        "تم استنتاج انتشار العرض على جميع الأوراق.",
      ),
    );

    facts.push(
      fact(
        "symptom",
        "كل الأوراق",
        "USER_INFERRED",
        "تم استنتاج انتشار العرض على جميع الأوراق.",
      ),
    );
  }

  if (analysis.veinColor === "GREEN") {
    facts.push(
      fact(
        "vein_color",
        "GREEN",
        "USER_INFERRED",
        "تم استنتاج بقاء العروق خضراء.",
      ),
    );

    facts.push(
      fact(
        "symptom",
        "العروق خضراء",
        "USER_INFERRED",
        "تم استنتاج بقاء العروق خضراء.",
      ),
    );
  } else if (analysis.veinColor === "YELLOW") {
    facts.push(
      fact(
        "vein_color",
        "YELLOW",
        "USER_INFERRED",
        "تم استنتاج اصفرار العروق.",
      ),
    );

    facts.push(
      fact(
        "symptom",
        "العروق صفراء",
        "USER_INFERRED",
        "تم استنتاج اصفرار العروق.",
      ),
    );
  }

  const plantPartCopy: Partial<
    Record<
      ArabicNlpResult["plantPart"],
      string
    >
  > = {
    LEAVES: "الأوراق",
    STEMS: "السيقان",
    ROOTS: "الجذور",
    FRUIT: "الثمار",
    FLOWERS: "الأزهار",
    WHOLE_PLANT: "النبات بالكامل",
  };

  const plantPart =
    plantPartCopy[analysis.plantPart];

  if (plantPart) {
    facts.push(
      fact(
        "location",
        plantPart,
        "USER_INFERRED",
        "تم استخراج مكان ظهور العرض من الرسالة.",
      ),
    );
  }

  if (analysis.severity) {
    facts.push(
      fact(
        "severity",
        analysis.severity,
        "USER_INFERRED",
        "تم تقدير شدة الحالة من وصف المستخدم.",
      ),
    );
  }

  return facts;
}

function factsForTurn(turn: DoctorTurn): DoctorEvidence[] {
  const facts: DoctorEvidence[] = [];

  if (turn.message?.trim()) {
    const analysis =
      analyzeArabicPlantMessage(
        turn.message,
      );

    facts.push(
      fact(
        "message",
        analysis.correctedText ||
          turn.message,
        "USER_INFERRED",
        "تم تنظيف وصف المستخدم وتصحيح الكلمات الشائعة قبل المطابقة.",
      ),
    );

    for (const plantHint of analysis.plantHints) {
      facts.push(
        fact(
          "plant",
          plantHint,
          "USER_INFERRED",
          "تم التعرف على النبات من رسالة المستخدم.",
        ),
      );
    }

    facts.push(
      ...nlpSymptomFacts(
        analysis,
      ),
    );
  }

  if (turn.context?.plant) {
    facts.push(
      fact(
        "plant",
        turn.context.plant,
        "USER_EXPLICIT",
        "اسم النبات الذي حدده المستخدم.",
      ),
    );
  }

  for (const symptom of turn.context?.symptoms ?? []) {
    facts.push(
      fact(
        "symptom",
        symptom,
        "USER_EXPLICIT",
        "عرض حدده المستخدم صراحة.",
      ),
    );
  }

  const answerKeyMap: Record<string, string> = {
    plant: "plant",
    symptom: "symptom",
    symptom_location: "location",
    location: "location",
    timing: "timing",
    severity: "severity",
    leaf_age: "symptom",
    vein_color: "symptom",
  };

  for (const [key, value] of Object.entries(turn.answers ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const factKey = answerKeyMap[key] ?? `answer:${key}`;

    for (const answer of Array.isArray(value) ? value : [value]) {
      facts.push(
        fact(
          factKey,
          answer,
          "USER_EXPLICIT",
          "إجابة المستخدم عن سؤال متابعة.",
        ),
      );
    }
  }

  if (turn.context?.location) {
    facts.push(
      fact(
        "location",
        turn.context.location,
        "USER_EXPLICIT",
        "مكان ظهور العرض على النبات.",
      ),
    );
  }

  if (turn.context?.timing) {
    facts.push(
      fact(
        "timing",
        turn.context.timing,
        "USER_EXPLICIT",
        "توقيت بداية المشكلة أو اشتدادها.",
      ),
    );
  }

  if (turn.context?.severity) {
    facts.push(
      fact(
        "severity",
        turn.context.severity,
        "USER_EXPLICIT",
        "درجة شدة المشكلة كما وصفها المستخدم.",
      ),
    );
  }

  return uniqueFacts(facts);
}

function candidateType(entity: KnowledgeEntityEnvelope): CandidateKind | null {
  return entity.type === "DISEASE" || entity.type === "PEST" || entity.type === "DEFICIENCY" ? entity.type : null;
}

function entityNames(entity: KnowledgeEntityEnvelope): string[] {
  return [entity.name, entity.slug, ...payloadStrings(entity, ["aliases", "names", "nameAr", "nameEn"])];
}

function relationValues(entity: KnowledgeEntityEnvelope): string[] {
  return payloadStrings(entity, ["plants", "plantIds", "plantSlugs", "compatiblePlants"]);
}

function symptomValues(entity: KnowledgeEntityEnvelope): string[] {
  return payloadStrings(entity, entity.type === "PEST"
    ? ["symptoms", "damagePatterns"]
    : entity.type === "DEFICIENCY"
      ? ["symptoms", "visualPatterns", "causes", "aggravatingConditions"]
      : ["symptoms", "causes", "plantParts", "riskFactors"]);
}

function meaningfulTokens(value: string): string[] {
  const stopWords = new Set([
    "في",
    "من",
    "علي",
    "على",
    "الى",
    "عن",
    "مع",
    "هو",
    "هي",
    "ده",
    "دي",
    "دا",
    "عندي",
    "عند",
    "النبات",
    "الزرع",
    "لسه",
    "بقي",
    "بقى",
    "جدا",
  ]);

  return normalize(value)
    .split(" ")
    .filter(
      (token) =>
        token.length >= 2 &&
        !stopWords.has(token),
    );
}

function textMatchStrength(observation: string, knowledgeValue: string): number {
  const left = normalize(observation);
  const right = normalize(knowledgeValue);

  if (!left || !right) return 0;
  if (left === right || left.includes(right) || right.includes(left)) return 2;

  const leftTokens = new Set(meaningfulTokens(left));
  const rightTokens = meaningfulTokens(right);

  if (leftTokens.size === 0 || rightTokens.length === 0) return 0;

  const matched = rightTokens.filter((token) => leftTokens.has(token)).length;
  const ratio = matched / Math.max(1, Math.min(leftTokens.size, rightTokens.length));

  const keyPairs = [
    ["اصفرار", "حديثه"],
    ["اصفرار", "قديمه"],
    ["اصفرار", "عروق"],
    ["بقع", "بنيه"],
    ["احتراق", "حواف"],
    ["ذبول", "جذور"],
  ];

  const pairedMatch = keyPairs.some(
    ([first, second]) =>
      leftTokens.has(first) &&
      leftTokens.has(second) &&
      rightTokens.includes(first) &&
      rightTokens.includes(second),
  );

  if (pairedMatch) return 2;
  if (matched >= 2 && ratio >= 0.4) return 2;
  if (matched >= 1) return 1;

  return 0;
}


type DiagnosticSignals = {
  yellowing: boolean;
  newLeaves: boolean;
  oldLeaves: boolean;
  greenVeins: boolean;
  interveinal: boolean;
  brownSpots: boolean;
  blackSpots: boolean;
  whitePowder: boolean;
  visibleInsects: boolean;
  edgeBurn: boolean;
  wilting: boolean;
  rootProblem: boolean;
  distortedNewGrowth: boolean;
  tipDeath: boolean;
};

function diagnosticText(
  facts: DoctorEvidence[],
) {
  return normalize(
    facts
      .filter((item) =>
        [
          "message",
          "symptom",
          "location",
          "timing",
          "severity",
        ].includes(item.key),
      )
      .map((item) => item.value)
      .join(" "),
  );
}

function extractSignals(
  facts: DoctorEvidence[],
): DiagnosticSignals {
  const text = diagnosticText(facts);

  const leafAge =
    facts.find(
      (item) =>
        item.key === "leaf_age",
    )?.value;

  const veinColor =
    facts.find(
      (item) =>
        item.key === "vein_color",
    )?.value;

  const hasAny = (
    values: string[],
  ) =>
    values.some((value) =>
      text.includes(normalize(value)),
    );

  return {
    yellowing: hasAny([
      "اصفرار",
      "ورق اصفر",
      "اوراق صفراء",
      "مصفر",
    ]),
    newLeaves:
      leafAge === normalize("NEW") ||
      hasAny([
        "اوراق حديثه",
        "النمو الحديث",
        "الورق الجديد",
        "القمه الناميه",
      ]),
    oldLeaves:
      leafAge === normalize("OLD") ||
      hasAny([
      "اوراق قديمه",
      "الورق القديم",
      "الاوراق السفليه",
    ]),
    greenVeins:
      veinColor === normalize("GREEN") ||
      hasAny([
      "عروق خضراء",
      "العروق خضراء",
      "بقاء العروق خضراء",
    ]),
    interveinal: hasAny([
      "بين العروق",
      "اصفرار بين العروق",
      "كلوروز بين العروق",
    ]),
    brownSpots: hasAny([
      "بقع بنيه",
      "تبقع بني",
    ]),
    blackSpots: hasAny([
      "بقع سوداء",
      "تبقع اسود",
    ]),
    whitePowder: hasAny([
      "بياض دقيقي",
      "مسحوق ابيض",
      "بودره بيضاء",
    ]),
    visibleInsects: hasAny([
      "حشره",
      "حشرات",
      "ذبابة بيضاء",
      "تربس",
      "اكاروس",
      "بق دقيقي",
      "حشرات قشريه",
      "صانعات الانفاق",
      "حفار",
    ]),
    edgeBurn: hasAny([
      "احتراق حواف",
      "حواف محروقه",
      "احتراق اطراف",
      "جفاف الحواف",
    ]),
    wilting: hasAny([
      "ذبول",
      "مدبل",
      "دابل",
    ]),
    rootProblem: hasAny([
      "تعفن جذور",
      "الجذور سوداء",
      "رائحه الجذور",
      "مشكله جذور",
    ]),
    distortedNewGrowth: hasAny([
      "تشوه النمو الحديث",
      "اوراق حديثه مشوهه",
      "التفاف النمو الحديث",
    ]),
    tipDeath: hasAny([
      "موت القمه",
      "جفاف القمه",
      "موت البرعم الطرفي",
    ]),
  };
}

function payloadString(
  entity: KnowledgeEntityEnvelope,
  key: string,
) {
  return payloadStrings(
    entity,
    [key],
  )[0];
}

function candidateDisplayName(
  entity: KnowledgeEntityEnvelope,
) {
  return (
    payloadString(
      entity,
      "nutrientNameAr",
    ) ||
    payloadString(
      entity,
      "nameAr",
    ) ||
    entity.name
  );
}

function nutrientCode(
  entity: KnowledgeEntityEnvelope,
) {
  const raw =
    payloadString(
      entity,
      "nutrientCode",
    ) ||
    entity.slug;

  return normalize(raw)
    .replace(/\s+/g, "")
    .toUpperCase();
}

function ruleScore(
  entity: KnowledgeEntityEnvelope,
  signals: DiagnosticSignals,
) {
  if (
    entity.type !== "DEFICIENCY"
  ) {
    return {
      score: 0,
      evidence: [] as DoctorEvidence[],
    };
  }

  const code =
    nutrientCode(entity);

  let score = 0;
  const evidence:
    DoctorEvidence[] = [];

  const add = (
    points: number,
    detail: string,
  ) => {
    score += points;
    evidence.push(
      fact(
        "rule",
        detail,
        "KNOWLEDGE_MATCH",
        detail,
      ),
    );
  };

  if (
    code === "FE" &&
    signals.yellowing &&
    signals.newLeaves &&
    (signals.greenVeins ||
      signals.interveinal)
  ) {
    add(
      96,
      "اصفرار الأوراق الحديثة مع بقاء العروق خضراء علامة تشخيصية قوية تتوافق مع نقص الحديد.",
    );
  }

  if (
    code === "MN" &&
    signals.yellowing &&
    signals.newLeaves &&
    (signals.greenVeins ||
      signals.interveinal)
  ) {
    add(
      54,
      "اصفرار بين العروق على النمو الحديث قد يتوافق مع نقص المنجنيز، لكنه أقل ترجيحًا من الحديد عند بقاء العروق خضراء بوضوح.",
    );
  }

  if (
    code === "MG" &&
    signals.yellowing &&
    signals.oldLeaves &&
    (signals.greenVeins ||
      signals.interveinal)
  ) {
    add(
      88,
      "اصفرار الأوراق القديمة بين العروق يتوافق بقوة مع نقص الماغنسيوم.",
    );
  }

  if (
    code === "N" &&
    signals.yellowing &&
    signals.oldLeaves
  ) {
    add(
      48,
      "بدء الاصفرار من الأوراق القديمة يتوافق مع نقص النيتروجين.",
    );
  }

  if (
    code === "K" &&
    signals.edgeBurn &&
    signals.oldLeaves
  ) {
    add(
      90,
      "احتراق حواف الأوراق القديمة يتوافق بقوة مع نقص البوتاسيوم.",
    );
  }

  if (
    code === "CA" &&
    (signals.distortedNewGrowth ||
      signals.tipDeath)
  ) {
    add(
      diagnosisWeights.mediumRuleMatch,
      "تشوه النمو الحديث أو موت القمة قد يتوافق مع نقص الكالسيوم.",
    );
  }

  if (
    code === "B" &&
    signals.tipDeath &&
    signals.distortedNewGrowth
  ) {
    add(
      diagnosisWeights.mediumRuleMatch,
      "موت القمة مع تشوه النمو الحديث قد يتوافق مع نقص البورون.",
    );
  }

  return {
    score,
    evidence,
  };
}

function namedHostValues(
  entity: KnowledgeEntityEnvelope,
) {
  const searchable =
    normalize(
      [
        entity.name,
        entity.slug,
        ...entityNames(entity),
      ].join(" "),
    );

  const matches:
    string[] = [];

  for (
    const [
      slug,
      aliases,
    ] of Object.entries(
      commonPlantAliases,
    )
  ) {
    if (
      aliases
        .map(normalize)
        .some((alias) =>
          searchable.includes(alias),
        )
    ) {
      matches.push(slug);
    }
  }

  return matches;
}

const commonPlantAliases: Record<string, string[]> = {
  mango: ["مانجو", "منجا", "مانجا", "مانجوه", "مناجو"],
  tomato: ["طماطم", "طماطمايه"],
  pepper: ["فلفل", "فلفله"],
  cucumber: ["خيار", "خياره"],
  potato: ["بطاطس", "بطاطا"],
  strawberry: ["فراوله", "فراولة"],
  grape: ["عنب"],
  lemon: ["ليمون", "لمون"],
  orange: ["برتقال"],
  mandarin: ["يوسفي", "ماندرين"],
  guava: ["جوافه", "جوافة"],
  olive: ["زيتون"],
  banana: ["موز"],
  "date-palm": ["نخيل", "نخيل التمر"],
  fig: ["تين"],
  pomegranate: ["رمان"],
  apple: ["تفاح"],
  pear: ["كمثري", "كمثرى"],
  wheat: ["قمح"],
  maize: ["ذره", "ذرة"],
  rice: ["ارز", "رز"],
  cotton: ["قطن"],
  onion: ["بصل"],
  garlic: ["ثوم"],
  carrot: ["جزر"],
  lettuce: ["خس"],
  spinach: ["سبانخ"],
  eggplant: ["باذنجان"],
  zucchini: ["كوسه", "كوسة"],
  watermelon: ["بطيخ"],
  melon: ["شمام", "كنتالوب"],
  rose: ["ورد", "ورده"],
  "snake-plant": ["سانسيفيريا", "جلد النمر"],
  fittonia: ["فيتونيا"],
  dieffenbachia: ["ديفنباخيا", "ديفمباخيا"],
  pothos: ["بوتس", "باثوس"],
  monstera: ["مونستيرا"],
  "peace-lily": ["زنبق السلام", "سباثيفيلوم"],
  "spider-plant": ["نبات العنكبوت", "كلوروفيتم"],
  "rubber-plant": ["فيكس مطاط", "نبات المطاط"],
  "aloe-vera": ["الوفيرا", "صبار الالوفيرا"],
};

function editDistance(left: string, right: string) {
  const a = normalize(left);
  const b = normalize(right);

  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from(
    { length: b.length + 1 },
    (_, index) => index,
  );

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];

    for (let j = 1; j <= b.length; j += 1) {
      const substitution =
        previous[j - 1] +
        (a[i - 1] === b[j - 1] ? 0 : 1);

      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        substitution,
      );
    }

    for (let j = 0; j < current.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function fuzzyNameMatch(
  message: string,
  candidate: string,
) {
  const normalizedMessage = normalize(message);
  const normalizedCandidate = normalize(candidate);

  if (
    normalizedMessage.includes(
      normalizedCandidate,
    )
  ) {
    return 3;
  }

  const words =
    normalizedMessage.split(" ");

  const threshold =
    normalizedCandidate.length <= 4
      ? 1
      : 2;

  return words.some(
    (word) =>
      editDistance(
        word,
        normalizedCandidate,
      ) <= threshold,
  )
    ? 2
    : 0;
}

function inferPlantFromMessage(
  plants: KnowledgeEntityEnvelope[],
  facts: DoctorEvidence[],
): {
  resolved?: KnowledgeEntityEnvelope;
  alternatives: KnowledgeEntityEnvelope[];
} {
  const explicitPlant = facts.find((item) => item.key === "plant");

  if (explicitPlant) {
    const matches = plants
      .map((entity) => {
        const names = [
          ...entityNames(entity),
          ...(commonPlantAliases[
            entity.slug
          ] ?? []),
        ];

        const strength =
          Math.max(
            0,
            ...names.map((name) =>
              Math.max(
                fuzzyNameMatch(
                  explicitPlant.value,
                  name,
                ),
                textMatchStrength(
                  explicitPlant.value,
                  name,
                ),
              ),
            ),
          );

        return {
          entity,
          strength,
        };
      })
      .filter(
        (item) =>
          item.strength > 0,
      )
      .sort(
        (left, right) =>
          right.strength -
            left.strength ||
          left.entity.slug.localeCompare(
            right.entity.slug,
          ),
      );

    const bestStrength =
      matches[0]?.strength ?? 0;

    const best =
      matches.filter(
        (item) =>
          item.strength ===
          bestStrength,
      );

    return {
      resolved:
        bestStrength >= 2 &&
        best.length === 1
          ? best[0].entity
          : undefined,
      alternatives: best
        .slice(0, 5)
        .map(
          (item) =>
            item.entity,
        ),
    };
  }

  const messageText = facts
    .filter((item) => item.key === "message")
    .map((item) => item.value)
    .join(" ");

  if (!messageText) {
    return {
      alternatives: [],
    };
  }

  const scored = plants
    .map((entity) => {
      const names = [
        ...entityNames(entity),
        ...(commonPlantAliases[
          entity.slug
        ] ?? []),
      ]
        .map(normalize)
        .filter(Boolean);

      const strength = Math.max(
        0,
        ...names.map((name) =>
          Math.max(
            fuzzyNameMatch(
              messageText,
              name,
            ),
            textMatchStrength(
              messageText,
              name,
            ),
          ),
        ),
      );

      return {
        entity,
        strength,
      };
    })
    .filter((item) => item.strength > 0)
    .sort(
      (left, right) =>
        right.strength - left.strength ||
        left.entity.slug.localeCompare(right.entity.slug) ||
        left.entity.id.localeCompare(right.entity.id),
    );

  const bestStrength = scored[0]?.strength ?? 0;
  const best = scored.filter(
    (item) => item.strength === bestStrength,
  );

  return {
    resolved:
      bestStrength >= 2 && best.length === 1
        ? best[0].entity
        : undefined,
    alternatives: best
      .slice(0, 5)
      .map((item) => item.entity),
  };
}

function confidence(
  score: number,
  evidenceCount: number,
  margin: number,
): ConfidenceBand {
  if (
    evidenceCount === 0 ||
    score < 12
  ) {
    return "INSUFFICIENT";
  }

  if (
    score >= 55 &&
    margin >= 10
  ) {
    return "HIGH";
  }

  if (score >= 28) {
    return "MODERATE";
  }

  return "LOW";
}

function plantMatchesCandidate(
  entity: KnowledgeEntityEnvelope,
  plant: KnowledgeEntityEnvelope,
) {
  const plantValues =
    relationValues(entity).map(normalize);

  if (plantValues.length === 0) {
    return undefined;
  }

  const plantMatches = [
    plant.id,
    plant.slug,
    plant.name,
    ...(commonPlantAliases[
      plant.slug
    ] ?? []),
  ].map(normalize);

  return plantValues.some((value) =>
    plantMatches.some(
      (match) =>
        value === match ||
        value.includes(match) ||
        match.includes(value),
    ),
  );
}

function explicitEntityNameMatch(
  entity: KnowledgeEntityEnvelope,
  facts: DoctorEvidence[],
) {
  const message = facts
    .filter(
      (item) =>
        item.key === "message",
    )
    .map((item) => item.value)
    .join(" ");

  if (!message) return false;

  return entityNames(entity)
    .map(normalize)
    .filter(
      (name) =>
        name.length >= 4,
    )
    .some((name) =>
      message.includes(name),
    );
}

function strongNutrientSignature(
  entity: KnowledgeEntityEnvelope,
  signals: DiagnosticSignals,
) {
  if (
    entity.type !== "DEFICIENCY"
  ) {
    return false;
  }

  const code = nutrientCode(entity);

  return (
    (
      code === "FE" &&
      signals.yellowing &&
      signals.newLeaves &&
      (
        signals.greenVeins ||
        signals.interveinal
      )
    ) ||
    (
      code === "MG" &&
      signals.yellowing &&
      signals.oldLeaves &&
      (
        signals.greenVeins ||
        signals.interveinal
      )
    ) ||
    (
      code === "K" &&
      signals.edgeBurn &&
      signals.oldLeaves
    )
  );
}

function hasExplicitPestEvidence(
  signals: DiagnosticSignals,
  facts: DoctorEvidence[],
) {
  const text = diagnosticText(facts);

  return (
    signals.visibleInsects ||
    [
      "حشره",
      "حشرات",
      "بق دقيقي",
      "حشرات قشريه",
      "ذبابة بيضاء",
      "تربس",
      "اكاروس",
      "عنكبوت احمر",
      "من على الاوراق",
      "صانعات الانفاق",
      "حفار",
    ].some((term) =>
      text.includes(normalize(term)),
    )
  );
}

function hasExplicitDiseaseEvidence(
  signals: DiagnosticSignals,
  facts: DoctorEvidence[],
) {
  const text = diagnosticText(facts);

  return (
    signals.brownSpots ||
    signals.blackSpots ||
    signals.whitePowder ||
    signals.rootProblem ||
    [
      "عفن",
      "بياض دقيقي",
      "بقع",
      "تبقع",
      "صدأ",
      "لفحه",
      "لفحة",
      "تعفن",
    ].some((term) =>
      text.includes(normalize(term)),
    )
  );
}

function candidateEligibility(
  entity: KnowledgeEntityEnvelope,
  plant: KnowledgeEntityEnvelope | undefined,
  facts: DoctorEvidence[],
  signals: DiagnosticSignals,
) {
  const namedHosts =
    namedHostValues(entity);

  if (
    plant &&
    namedHosts.length > 0 &&
    !namedHosts.includes(plant.slug)
  ) {
    return false;
  }

  if (plant) {
    const relationMatch =
      plantMatchesCandidate(
        entity,
        plant,
      );

    if (relationMatch === false) {
      return false;
    }
  }

  if (
    entity.type === "DEFICIENCY"
  ) {
    return true;
  }

  if (
    explicitEntityNameMatch(
      entity,
      facts,
    )
  ) {
    return true;
  }

  /*
   * وجود علاقة بالنبات وحده لا يكفي لترشيح مرض أو آفة.
   * لازم المستخدم يذكر علامة مرضية أو حشرية مناسبة.
   */
  if (
    entity.type === "PEST" &&
    !hasExplicitPestEvidence(
      signals,
      facts,
    )
  ) {
    return false;
  }

  if (
    entity.type === "DISEASE" &&
    !hasExplicitDiseaseEvidence(
      signals,
      facts,
    )
  ) {
    return false;
  }

  const symptoms =
    symptomValues(entity)
      .map(normalize)
      .filter(Boolean);

  const observation =
    diagnosticText(facts);

  const strongSymptomMatches =
    symptoms.filter(
      (symptom) =>
        textMatchStrength(
          observation,
          symptom,
        ) === 2,
    ).length;

  return strongSymptomMatches >= 1;
}

function scoreCandidate(
  entity: KnowledgeEntityEnvelope,
  plant: KnowledgeEntityEnvelope | undefined,
  facts: DoctorEvidence[],
  signals: DiagnosticSignals,
): ScoredCandidate {
  const type = candidateType(entity)!;
  const matchedEvidence: DoctorEvidence[] = [];
  const contradictions: string[] = [];
  const excludedEvidence: string[] = [];
  let score = 0;
  const symptoms = symptomValues(entity).map(normalize).filter(Boolean);
  const plantValues =
    relationValues(entity).map(normalize);

  if (plant) {
    const plantMatches = [
      plant.id,
      plant.slug,
      plant.name,
      ...(commonPlantAliases[
        plant.slug
      ] ?? []),
    ].map(normalize);

    if (
      plantValues.some((value) =>
        plantMatches.some(
          (match) =>
            value === match ||
            value.includes(match) ||
            match.includes(value),
        ),
      )
    ) {
      score +=
        diagnosisWeights.plantCompatibility;

      matchedEvidence.push(
        fact(
          "plant",
          plant.name,
          "KNOWLEDGE_MATCH",
          "هذا الاحتمال مرتبط بالنبات المحدد في قاعدة المعرفة.",
        ),
      );
    } else if (
      plantValues.length > 0
    ) {
      contradictions.push(
        "النبات المحدد غير مسجل كعائل لهذا الاحتمال.",
      );

      score -=
        diagnosisWeights.contradictionPenalty;
    }

    const namedHosts =
      namedHostValues(entity);

    if (
      namedHosts.length > 0 &&
      !namedHosts.includes(
        plant.slug,
      )
    ) {
      score -=
        diagnosisWeights.wrongNamedHostPenalty;

      contradictions.push(
        "اسم التشخيص يشير إلى نبات مختلف عن النبات المحدد.",
      );
    }
  }

  const rules =
    ruleScore(
      entity,
      signals,
    );

  score += rules.score;
  matchedEvidence.push(
    ...rules.evidence,
  );

  for (const symptomFact of facts.filter((item) => item.key === "symptom")) {
    if (symptoms.includes(symptomFact.value)) {
      score += diagnosisWeights.exactSymptom;
      matchedEvidence.push(
        fact(
          "symptom",
          symptomFact.value,
          "KNOWLEDGE_MATCH",
          "تطابق مباشر مع عرض مسجل في قاعدة المعرفة.",
        ),
      );
    } else if (
      symptoms.some(
        (value) =>
          value.includes(symptomFact.value) ||
          symptomFact.value.includes(value),
      )
    ) {
      score += diagnosisWeights.partialSymptom;
      matchedEvidence.push(
        fact(
          "symptom",
          symptomFact.value,
          "KNOWLEDGE_MATCH",
          "تطابق جزئي مع عرض مسجل في قاعدة المعرفة.",
        ),
      );
    } else {
      excludedEvidence.push(
        `لا يوجد تطابق واضح مع العرض: ${symptomFact.value}.`,
      );
    }
  }

  const messageFacts = facts.filter((item) => item.key === "message");
  let bestMessageMatch = 0;
  let bestMessageKnowledgeValue = "";

  for (const messageFact of messageFacts) {
    for (const symptom of symptoms) {
      const strength = textMatchStrength(messageFact.value, symptom);

      if (strength > bestMessageMatch) {
        bestMessageMatch = strength;
        bestMessageKnowledgeValue = symptom;
      }
    }

    for (const name of entityNames(entity)) {
      const strength = textMatchStrength(messageFact.value, name);

      if (strength > bestMessageMatch) {
        bestMessageMatch = strength;
        bestMessageKnowledgeValue = normalize(name);
      }
    }
  }

  if (
    entity.type !== "DEFICIENCY" &&
    bestMessageMatch === 1
  ) {
    score -=
      entity.type === "DISEASE"
        ? diagnosisWeights.genericDiseasePenalty
        : diagnosisWeights.genericPestPenalty;
  }

  if (
    explicitEntityNameMatch(
      entity,
      facts,
    )
  ) {
    score +=
      diagnosisWeights.explicitEntityName;

    matchedEvidence.push(
      fact(
        "entity-name",
        entity.name,
        "KNOWLEDGE_MATCH",
        "المستخدم ذكر اسم المرض أو الآفة صراحة.",
      ),
    );
  }

  if (bestMessageMatch === 2) {
    score += diagnosisWeights.exactSymptom;
    matchedEvidence.push(
      fact(
        "message",
        bestMessageKnowledgeValue,
        "KNOWLEDGE_MATCH",
        "وصف المستخدم يطابق عرضًا أو اسمًا مسجلًا في قاعدة المعرفة.",
      ),
    );
  } else if (bestMessageMatch === 1) {
    score += diagnosisWeights.partialSymptom;
    matchedEvidence.push(
      fact(
        "message",
        bestMessageKnowledgeValue,
        "KNOWLEDGE_MATCH",
        "وصف المستخدم يحتوي على كلمات مرتبطة بهذا الاحتمال.",
      ),
    );
  }

  const context = payloadStrings(entity, ["locations", "soilContext", "phContext"]);
  for (const contextFact of facts.filter((item) => item.key === "location")) {
    if (context.map(normalize).some((value) => value.includes(contextFact.value))) {
      score += diagnosisWeights.locationContext;
      matchedEvidence.push(fact("location", contextFact.value, "KNOWLEDGE_MATCH", "تطابق مكان ظهور العرض مع البيانات المسجلة."));
    }
  }

  const timingValues = payloadStrings(entity, ["timing", "seasonalContext", "lifecycle"]);
  for (const timingFact of facts.filter((item) => item.key === "timing")) {
    if (timingValues.map(normalize).some((value) => value.includes(timingFact.value))) {
      score += diagnosisWeights.timing;
      matchedEvidence.push(fact("timing", timingFact.value, "KNOWLEDGE_MATCH", "تطابق توقيت ظهور المشكلة مع البيانات المسجلة."));
    }
  }

  const severityValues = payloadStrings(entity, ["severity"]);
  for (const severityFact of facts.filter((item) => item.key === "severity")) {
    if (severityValues.map(normalize).includes(severityFact.value)) score += diagnosisWeights.severity;
  }

  const hasUsefulObservation = facts.some(
    (item) =>
      item.key === "symptom" ||
      (item.key === "message" && meaningfulTokens(item.value).length > 0),
  );

  const missingEvidence = hasUsefulObservation
    ? []
    : ["نحتاج إلى عرض واضح ومحدد حتى يمكن مقارنة الاحتمالات."];
  score -= missingEvidence.length * diagnosisWeights.missingEvidencePenalty;
  return {
    id: entity.id,
    type,
    name: candidateDisplayName(
      entity,
    ),
    slug: entity.slug,
    confidence: "INSUFFICIENT",
    matchedEvidence,
    missingEvidence,
    contradictions,
    excludedEvidence,
    explanation: "تم تقييم الأدلة بصورة حتمية من إصدار المعرفة المثبت للجلسة.",
    score,
    entity,
  };
}

function questions(
  candidates: ScoredCandidate[],
  plant: KnowledgeEntityEnvelope | undefined,
  state: DoctorSessionState,
): DoctorQuestion[] {
  const answered = new Set(state.answeredQuestionIds);
  const next: DoctorQuestion[] = [];

  if (!plant && !answered.has("plant")) {
    next.push({
      id: "plant",
      prompt: "ما اسم النبات أو المحصول المصاب؟",
      answerShape: "short_text",
      why: "تحديد النبات يستبعد الاحتمالات غير المناسبة لهذا العائل.",
    });
  }

  const hasObservation = state.facts.some(
    (item) =>
      item.key === "symptom" ||
      (item.key === "message" && meaningfulTokens(item.value).length > 0),
  );

  if (!hasObservation && !answered.has("symptom")) {
    next.push({
      id: "symptom",
      prompt: "ما أهم عرض ظاهر على النبات؟",
      answerShape: "short_text",
      why: "العرض المحدد هو أقوى معلومة للتمييز بين المرض والآفة ونقص العنصر.",
    });
  }

  const signals =
    extractSignals(
      state.facts,
    );

  if (
    signals.yellowing &&
    !state.facts.some(
      (item) =>
        item.key === "leaf_age",
    ) &&
    !answered.has("leaf_age")
  ) {
    next.push({
      id: "leaf_age",
      prompt: "الاصفرار يظهر أكثر في الأوراق الحديثة أم القديمة؟",
      answerShape: "single_choice",
      options: [
        "الأوراق الحديثة",
        "الأوراق القديمة",
        "كل الأوراق",
      ],
      why: "عمر الورقة المصابة يفرق بين أنواع نقص العناصر والمشكلات الجذرية.",
    });
  }

  if (
    signals.yellowing &&
    !state.facts.some(
      (item) =>
        item.key === "vein_color",
    ) &&
    !answered.has("vein_color")
  ) {
    next.push({
      id: "vein_color",
      prompt: "هل تظل العروق خضراء بينما المساحة بينها صفراء؟",
      answerShape: "single_choice",
      options: [
        "نعم",
        "لا",
        "غير واضح",
      ],
      why: "لون العروق من أهم العلامات للتمييز بين نقص الحديد والمنجنيز والماغنسيوم.",
    });
  }

  if (
    candidates.length > 1 &&
    !state.facts.some((item) => item.key === "location") &&
    !answered.has("symptom_location")
  ) {
    next.push({
      id: "symptom_location",
      prompt: "أين يظهر العرض بشكل أوضح؟",
      answerShape: "single_choice",
      options: ["الأوراق", "السيقان", "الجذور", "الثمار", "النبات بالكامل"],
      why: "مكان ظهور العرض يساعد على التمييز بين الاحتمالات المتقاربة.",
    });
  }

  if (
    candidates.length > 1 &&
    !state.facts.some((item) => item.key === "timing") &&
    !answered.has("timing")
  ) {
    next.push({
      id: "timing",
      prompt: "متى بدأت المشكلة أو زادت شدتها؟",
      answerShape: "short_text",
      why: "التوقيت قد يفرق بين الأمراض الموسمية والآفات واضطرابات التغذية.",
    });
  }

  return next.slice(0, 1);
}

function treatment(candidates: ScoredCandidate[], snapshotProducts: KnowledgeEntityEnvelope[], plant: KnowledgeEntityEnvelope | undefined): DoctorTreatmentPlan {
  const leader = candidates[0];
  if (!leader || leader.confidence === "INSUFFICIENT") {
    return {
      immediateActions: [],
      monitoringSteps: [
        "أجب عن سؤال المتابعة التالي قبل اختيار أي معاملة.",
      ],
      treatmentGuidance: [],
      products: [],
      contraindications: [],
      unknownCompatibilityWarnings: [
        "لا يمكن تأكيد توافق المنتجات قبل توفر أدلة تشخيصية كافية.",
      ],
    };
  }
  const immediateActions = payloadStrings(leader.entity, ["immediateActions", "actions"]);
  const monitoringSteps = payloadStrings(leader.entity, ["monitoring", "inspectionSteps"]);
  const treatmentGuidance = payloadStrings(leader.entity, ["treatmentGuidance", "treatments"]);
  const products: DoctorProductRecommendation[] = [];
  const contraindications: string[] = [];
  const unknownCompatibilityWarnings: string[] = [];
  for (const product of snapshotProducts.slice().sort((left, right) => left.slug.localeCompare(right.slug) || left.id.localeCompare(right.id))) {
    const payload = record(product.payload);
    const recommendations = payload && Array.isArray(payload.recommendations) ? payload.recommendations : [];
    for (const item of recommendations) {
      const recommendation = record(item);
      if (!recommendation) continue;
      const targetId = typeof recommendation.diseaseId === "string" ? recommendation.diseaseId : typeof recommendation.pestId === "string" ? recommendation.pestId : typeof recommendation.deficiencyId === "string" ? recommendation.deficiencyId : "";
      const state = typeof recommendation.state === "string" ? recommendation.state : "ACTIVE";
      if (targetId !== leader.id || ["NOT_RECOMMENDED", "CONTRAINDICATED", "DISABLED"].includes(state)) continue;
      const compatibility = typeof recommendation.compatibility === "string" ? recommendation.compatibility : "";
      if (compatibility.includes("plant-required") && !plant) { unknownCompatibilityWarnings.push(`${product.name}: plant compatibility is required but unknown.`); continue; }
      if (
        typeof recommendation.contraindications ===
          "string" &&
        recommendation.contraindications
      ) {
        contraindications.push(
          `${payloadString(product, "nameAr") || product.name}: ${recommendation.contraindications}`,
        );
      }

      const priority =
        recommendation.priority === "LOW" ||
        recommendation.priority === "HIGH" ||
        recommendation.priority === "CRITICAL"
          ? recommendation.priority
          : "NORMAL";

      products.push({
        productId: product.id,
        name:
          payloadString(
            product,
            "nameAr",
          ) || product.name,
        priority,
        reason: `موصى به للحالة الأقرب: ${leader.name}.`,
        compatibilityWarning:
          compatibility.includes("plant-required")
            ? "يجب التأكد من ملاءمة المنتج للمحصول والالتزام ببطاقة الاستخدام."
            : compatibility || undefined,
      });
    }
  }
  products.sort((left, right) => ("CRITICAL,HIGH,NORMAL,LOW".indexOf(left.priority) - "CRITICAL,HIGH,NORMAL,LOW".indexOf(right.priority)) || left.name.localeCompare(right.name));
  return { immediateActions, monitoringSteps, treatmentGuidance, products, contraindications, unknownCompatibilityWarnings };
}

function publicCandidateCopy(
  candidate: ScoredCandidate,
): DoctorCandidate {
  return {
    id: candidate.id,
    type: candidate.type,
    name: candidate.name,
    slug: candidate.slug,
    confidence:
      candidate.confidence,
    matchedEvidence:
      candidate.matchedEvidence,
    missingEvidence:
      candidate.missingEvidence,
    contradictions:
      candidate.contradictions,
    excludedEvidence:
      candidate.excludedEvidence,
    explanation:
      candidate.explanation,
  };
}

export class DoctorEngine {
  constructor(private readonly reader: KnowledgeReader) {}

  async diagnose(turn: DoctorTurn, prior?: DoctorSessionState): Promise<DoctorResult> {
    try {
      const release = prior
        ? await this.reader.readReleaseSnapshot(prior.releaseVersion, prior.manifestChecksum)
        : await this.reader.readActiveRelease();
      const now = new Date().toISOString();

      const safePrior =
        prior
          ? normalizeDoctorSessionState(
              prior,
            )
          : undefined;

      const currentFacts =
        factsForTurn(turn);

      /*
       * نحدد النبات من الرسالة الحالية وحدها أولًا.
       * بهذه الطريقة لا يطغى نبات الحالة السابقة على السؤال الجديد.
       */
      const currentPlantResolution =
        inferPlantFromMessage(
          release.snapshot.PLANT,
          currentFacts,
        );

      const currentPlant =
        currentPlantResolution.resolved;

      const caseSelection =
        selectDoctorCase({
          prior: safePrior,
          requestedCaseId:
            turn.context?.caseId,
          currentPlant,
          currentFacts,
          now,
        });

      const facts = uniqueFacts([
        ...caseSelection.baseFacts,
        ...currentFacts,
      ]);

      /*
       * بعد اختيار الحالة نعيد حل النبات من حقائق الحالة الحالية فقط.
       * لو الرسالة لم تذكر نباتًا، يحتفظ السياق بنبات الحالة النشطة.
       */
      const plantResolution =
        inferPlantFromMessage(
          release.snapshot.PLANT,
          facts,
        );

      const plant =
        currentPlant ??
        plantResolution.resolved ??
        (
          caseSelection.selectedCase?.plant
            ? release.snapshot.PLANT.find(
                (item) =>
                  item.slug ===
                  caseSelection.selectedCase?.plant?.slug,
              )
            : undefined
        );

      const factsWithResolvedPlant =
        plant
          ? uniqueFacts([
              ...facts.filter(
                (item) =>
                  item.key !== "plant" ||
                  normalize(item.value) ===
                    normalize(plant.name) ||
                  normalize(item.value) ===
                    normalize(plant.slug),
              ),
              fact(
                "plant",
                plant.name,
                "KNOWLEDGE_MATCH",
                "تم تحديد النبات للحالة الحالية.",
              ),
            ])
          : facts;

      const existingCase =
        caseSelection.existingCase;

      const activeCaseId =
        caseSelection.activeCaseId;

      const answeredQuestionIds =
        [
          ...new Set([
            ...(
              existingCase
                ?.answeredQuestionIds ??
              []
            ),
            ...Object.keys(
              turn.answers ?? {},
            ),
          ]),
        ].sort();

      const conversationHistory =
        trimConversationHistory(
          appendUserMessage(
            safePrior?.conversationHistory ??
              [],
            turn.message,
            activeCaseId,
            now,
          ),
        );

      const baseSession =
        safePrior ??
        createDoctorSession({
          releaseVersion:
            release.releaseVersion,
          manifestChecksum:
            release.manifestChecksum,
          contentChecksum:
            release.contentChecksum,
          now,
        });

      let state =
        updateDoctorSession({
          session: baseSession,
          activeCaseId,
          conversationHistory,
          facts:
            factsWithResolvedPlant,
          answeredQuestionIds,
          now,
        });

      const signals =
        extractSignals(
          factsWithResolvedPlant,
        );

      const scored = [
        ...release.snapshot.DISEASE,
        ...release.snapshot.PEST,
        ...release.snapshot.DEFICIENCY,
      ]
        .filter((entity) =>
          candidateEligibility(
            entity,
            plant,
            factsWithResolvedPlant,
            signals,
          ),
        )
        .map((entity) =>
          scoreCandidate(
            entity,
            plant,
            factsWithResolvedPlant,
            signals,
          ),
        )
        .sort(
          (left, right) =>
            right.score -
              left.score ||
            left.type.localeCompare(
              right.type,
            ) ||
            left.slug.localeCompare(
              right.slug,
            ) ||
            left.id.localeCompare(
              right.id,
            ),
        );

      const visible = scored
        .filter(
          (candidate) =>
            candidate.score >= 12,
        )
        .slice(0, 5);
      const secondScore = visible[1]?.score ?? 0;
      for (const candidate of visible) {
        candidate.confidence = confidence(candidate.score, candidate.matchedEvidence.length, candidate.score - secondScore);
        candidate.explanation =
          candidate.confidence === "INSUFFICIENT"
            ? "الأدلة المتطابقة غير كافية، ولذلك لا تُعد النتيجة تشخيصًا."
            : `${
                candidate.confidence === "HIGH"
                  ? "الاحتمال مرجح"
                  : candidate.confidence === "MODERATE"
                    ? "الاحتمال ممكن"
                    : "الاحتمال أقل ترجيحًا"
              } بناءً على التطابقات المسجلة والمعلومات التي ما زالت ناقصة.`;
      }
      const publicCandidates =
        visible.map(
          publicCandidateCopy,
        );
      const followUpQuestions = questions(visible, plant, state);
      const status: DoctorStatus =
        !visible[0] ||
        visible[0].confidence ===
          "INSUFFICIENT"
          ? "insufficient_information"
          : followUpQuestions.length
            ? "needs_information"
            : "differential_ready";
      const treatmentPlan =
        treatment(
          visible,
          release.snapshot.PRODUCT.filter(
            (product) =>
              product.publicationState ===
              "PUBLISHED",
          ),
          plant,
        );

      const caseStatus =
        status === "differential_ready"
          ? "DIAGNOSIS_READY"
          : "COLLECTING_INFORMATION";

      const updatedCase: DoctorCase = {
        id: activeCaseId,
        title:
          buildDoctorCaseTitle(
            plant,
            factsWithResolvedPlant,
          ),
        plant:
          resolvedPlantForCase(
            plant,
          ),
        facts:
          factsWithResolvedPlant,
        answeredQuestionIds,
        latestCandidates:
          publicCandidates,
        latestTreatment:
          treatmentPlan,
        latestStatus: status,
        status:
          caseStatus as
            | "COLLECTING_INFORMATION"
            | "DIAGNOSIS_READY",
        createdAt:
          existingCase?.createdAt ??
          now,
        updatedAt: now,
      };

      state =
        updateDoctorSession({
          session: state,
          cases:
            upsertDoctorCase(
              safePrior?.cases ??
                [],
              updatedCase,
            ),
          activeCaseId,
          facts:
            factsWithResolvedPlant,
          answeredQuestionIds,
          conversationHistory,
          now,
        });

      const text = factsWithResolvedPlant
        .map((item) => item.value)
        .join(" ");

      const emergencyFlags = [
        ["انتشار سريع", "تم الإبلاغ عن انتشار سريع؛ يلزم فحص عاجل."],
        ["ذبول شديد", "تم الإبلاغ عن ذبول شديد؛ يلزم فحص عاجل."],
        ["تلف الجذور", "تم الإبلاغ عن تلف واضح بالجذور أو التاج؛ يلزم فحص عاجل."],
        ["فقد المحصول", "يوجد خطر مرتفع على المحصول؛ يلزم تدخل مهندس زراعي."],
        ["rapid spread", "تم الإبلاغ عن انتشار سريع؛ يلزم فحص عاجل."],
        ["severe wilting", "تم الإبلاغ عن ذبول شديد؛ يلزم فحص عاجل."],
        ["root damage", "تم الإبلاغ عن تلف واضح بالجذور أو التاج؛ يلزم فحص عاجل."],
        ["crop loss", "يوجد خطر مرتفع على المحصول؛ يلزم تدخل مهندس زراعي."],
      ].filter(([term]) => text.includes(normalize(term))).map(([, message]) => message);
      return {
        status,
        knowledgeRelease: { version: release.releaseVersion, manifestChecksum: release.manifestChecksum, contentChecksum: release.contentChecksum },
        session: state,
        activeCaseId,
        plant: {
          resolved: plant
            ? {
                id: plant.id,
                name: plant.name,
                slug: plant.slug,
              }
            : undefined,
          alternatives: plant
            ? []
            : plantResolution.alternatives.map((item) => ({
                id: item.id,
                name: item.name,
                slug: item.slug,
              })),
        },
        candidates: publicCandidates,
        followUpQuestions,
        treatment:
          treatmentPlan,
        emergencyFlags,
        disclaimer,
      };
    } catch {
      const now = new Date().toISOString();
      const session: DoctorSessionState =
        prior
          ? normalizeDoctorSessionState(
              prior,
            )
          : createDoctorSession({
              releaseVersion: "",
              manifestChecksum: "",
              contentChecksum: "",
              now,
            });

      return {
        status: prior
          ? "knowledge_release_unavailable"
          : "unavailable",
        knowledgeRelease: {
          version:
            session.releaseVersion,
          manifestChecksum:
            session.manifestChecksum,
          contentChecksum:
            session.contentChecksum,
        },
        session,
        activeCaseId:
          session.activeCaseId,
        plant: {
          alternatives: [],
        },
        candidates: [],
        followUpQuestions: [],
        treatment: {
          immediateActions: [],
          monitoringSteps: [],
          treatmentGuidance: [],
          products: [],
          contraindications: [],
          unknownCompatibilityWarnings: [],
        },
        emergencyFlags: [],
        disclaimer:
          "قاعدة المعرفة غير متاحة مؤقتًا. أعد المحاولة بعد توفر إصدار معرفة صالح.",
      };
    }
  }
}
