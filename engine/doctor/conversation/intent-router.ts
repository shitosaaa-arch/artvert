export type DoctorConversationIntent =
  | "GREETING"
  | "THANKS"
  | "GOODBYE"
  | "HELP_REQUEST"
  | "PROBLEM_OPENING"
  | "GENERAL_AGRICULTURE_QUESTION"
  | "PRODUCT_QUESTION"
  | "DIAGNOSTIC_MESSAGE"
  | "FOLLOW_UP"
  | "UNKNOWN";

export type IntentRouterInput = {
  message?: string;
  hasActiveCase?: boolean;
  hasPlantHint?: boolean;
  hasSymptomHint?: boolean;
  hasProductHint?: boolean;
};

export type IntentRouterResult = {
  intent: DoctorConversationIntent;
  confidence:
    | "HIGH"
    | "MODERATE"
    | "LOW";
  shouldRunDiagnosis: boolean;
  shouldUseActiveCase: boolean;
  naturalReply?: string;
};

function normalizeArabic(
  value: string,
) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ar")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/ـ/gu, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ؤ/gu, "و")
    .replace(/ئ/gu, "ي")
    .replace(/ة/gu, "ه")
    .replace(/[\s\p{P}\p{S}]+/gu, " ")
    .trim();
}

function includesAny(
  text: string,
  values: string[],
) {
  return values.some((value) =>
    text.includes(
      normalizeArabic(value),
    ),
  );
}

function isOnlyShortSocialMessage(
  text: string,
) {
  return (
    text.split(" ").length <= 5 &&
    !/[0-9]/u.test(text)
  );
}

function greetingReply(
  text: string,
) {
  if (
    includesAny(text, [
      "صباح الخير",
      "صباح الفل",
      "صباح النور",
    ])
  ) {
    return "صباح النور والفل عليك 🌱 أنا بخير الحمد لله، أقدر أساعدك إزاي؟";
  }

  if (
    includesAny(text, [
      "مساء الخير",
      "مساء الفل",
      "مساء النور",
    ])
  ) {
    return "مساء النور عليك 🌱 أنا بخير الحمد لله، أقدر أساعدك إزاي؟";
  }

  return "أنا بخير الحمد لله 🌱 أقدر أساعدك إزاي؟";
}

export function routeDoctorIntent(
  input: IntentRouterInput,
): IntentRouterResult {
  const rawMessage =
    input.message?.trim() ?? "";

  const text =
    normalizeArabic(rawMessage);

  if (!text) {
    return {
      intent: "UNKNOWN",
      confidence: "LOW",
      shouldRunDiagnosis: false,
      shouldUseActiveCase:
        Boolean(input.hasActiveCase),
      naturalReply:
        "أنا معاك 🌱 اكتب سؤالك أو احكيلي المشكلة اللي عندك.",
    };
  }

  if (
    includesAny(text, [
      "ازيك",
      "عامل ايه",
      "اخبارك",
      "السلام عليكم",
      "السلام عليكم ورحمة الله",
      "اهلا",
      "اهلين",
      "هاي",
      "صباح الخير",
      "صباح الفل",
      "مساء الخير",
      "مساء الفل",
    ])
  ) {
    return {
      intent: "GREETING",
      confidence: "HIGH",
      shouldRunDiagnosis: false,
      shouldUseActiveCase: false,
      naturalReply:
        greetingReply(text),
    };
  }

  if (
    includesAny(text, [
      "شكرا",
      "متشكر",
      "تسلم",
      "ربنا يباركلك",
      "تمام كده",
      "كتر خيرك",
    ])
  ) {
    return {
      intent: "THANKS",
      confidence: "HIGH",
      shouldRunDiagnosis: false,
      shouldUseActiveCase:
        Boolean(input.hasActiveCase),
      naturalReply:
        "العفو، تحت أمرك دائمًا 🌱",
    };
  }

  if (
    includesAny(text, [
      "سلام",
      "مع السلامه",
      "باي",
      "اشوفك بعدين",
    ])
  ) {
    return {
      intent: "GOODBYE",
      confidence: "HIGH",
      shouldRunDiagnosis: false,
      shouldUseActiveCase: false,
      naturalReply:
        "مع السلامة 🌱 وأنا موجود وقت ما تحتاجني.",
    };
  }

  if (
    includesAny(text, [
      "تقدر تساعدني",
      "ممكن تساعدني",
      "عايز مساعده",
      "محتاج مساعده",
      "ممكن اسالك",
      "عندي سؤال",
    ])
  ) {
    return {
      intent: "HELP_REQUEST",
      confidence: "HIGH",
      shouldRunDiagnosis: false,
      shouldUseActiveCase:
        Boolean(input.hasActiveCase),
      naturalReply:
        "أكيد طبعًا 🌱 قولّي سؤالك أو احكيلي المشكلة بالتفصيل.",
    };
  }

  if (
    includesAny(text, [
      "عندي مشكله",
      "في مشكله",
      "عندي حاجه غريبه",
      "النبات تعبان",
      "الزرع تعبان",
      "مش عارف ماله",
      "مش عارف ايه المشكله",
    ]) &&
    !input.hasPlantHint &&
    !input.hasSymptomHint
  ) {
    return {
      intent: "PROBLEM_OPENING",
      confidence: "HIGH",
      shouldRunDiagnosis: false,
      shouldUseActiveCase:
        Boolean(input.hasActiveCase),
      naturalReply:
        "خير إن شاء الله 🌱 قولّي اسم النبات، وإيه اللي لاحظته عليه بالظبط؟",
    };
  }

  if (
    input.hasProductHint ||
    includesAny(text, [
      "المنتج",
      "منتج",
      "الجرعه",
      "الجرعة",
      "السعر",
      "التركيب",
      "ينفع استخدم",
      "استخدم ايه",
      "ارشحلي منتج",
      "منتجات ارت فيرت",
      "بلانت جرو",
      "كال ارت",
      "سيتو زنك",
      "فولامين",
      "توربيد",
      "لمبادا",
    ])
  ) {
    return {
      intent: "PRODUCT_QUESTION",
      confidence: "MODERATE",
      shouldRunDiagnosis:
        Boolean(
          input.hasPlantHint ||
          input.hasSymptomHint,
        ),
      shouldUseActiveCase:
        Boolean(input.hasActiveCase),
    };
  }

  if (
    input.hasPlantHint ||
    input.hasSymptomHint
  ) {
    return {
      intent: "DIAGNOSTIC_MESSAGE",
      confidence: "HIGH",
      shouldRunDiagnosis: true,
      shouldUseActiveCase:
        Boolean(input.hasActiveCase),
    };
  }

  if (
    input.hasActiveCase &&
    (
      includesAny(text, [
        "ايوه",
        "اه",
        "لا",
        "مش واضح",
        "القديم",
        "الجديد",
        "الورق",
        "الجذور",
        "الساق",
        "الثمر",
        "من امبارح",
        "من يومين",
        "من اسبوع",
      ]) ||
      isOnlyShortSocialMessage(text)
    )
  ) {
    return {
      intent: "FOLLOW_UP",
      confidence: "MODERATE",
      shouldRunDiagnosis: true,
      shouldUseActiveCase: true,
    };
  }

  if (
    includesAny(text, [
      "ازرع",
      "الري",
      "التسميد",
      "التربه",
      "التربة",
      "موعد الزراعه",
      "ميعاد الزراعه",
      "طريقة الزراعه",
      "طريقه الزراعه",
      "العنايه",
      "العناية",
      "يتزرع امتى",
      "يسقي كام مره",
    ])
  ) {
    return {
      intent:
        "GENERAL_AGRICULTURE_QUESTION",
      confidence: "MODERATE",
      shouldRunDiagnosis: false,
      shouldUseActiveCase:
        Boolean(input.hasActiveCase),
      naturalReply:
        "أكيد أقدر أساعدك 🌱 اكتب اسم النبات أو المحصول وسؤالك بالتفصيل عشان أديك إجابة دقيقة.",
    };
  }

  return {
    intent: "UNKNOWN",
    confidence: "LOW",
    shouldRunDiagnosis: false,
    shouldUseActiveCase:
      Boolean(input.hasActiveCase),
    naturalReply:
      "فهمت إنك بتسأل في موضوع زراعي، لكن محتاج منك توضيح بسيط أكتر عشان أرد عليك بشكل دقيق.",
  };
}
