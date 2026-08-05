export type ArabicLeafAge =
  | "NEW"
  | "OLD"
  | "ALL"
  | "UNKNOWN";

export type ArabicVeinColor =
  | "GREEN"
  | "YELLOW"
  | "UNKNOWN";

export type ArabicPlantPart =
  | "LEAVES"
  | "STEMS"
  | "ROOTS"
  | "FRUIT"
  | "FLOWERS"
  | "WHOLE_PLANT"
  | "UNKNOWN";

export type ArabicSymptomSignal =
  | "YELLOWING"
  | "INTERVEINAL_CHLOROSIS"
  | "BROWN_SPOTS"
  | "BLACK_SPOTS"
  | "WHITE_POWDER"
  | "EDGE_BURN"
  | "WILTING"
  | "LEAF_CURL"
  | "DISTORTED_NEW_GROWTH"
  | "TIP_DEATH"
  | "ROOT_ROT"
  | "STEM_ROT"
  | "FRUIT_ROT"
  | "STUNTING"
  | "LEAF_DROP"
  | "FRUIT_DROP"
  | "VISIBLE_INSECTS"
  | "WHITEFLY"
  | "APHIDS"
  | "THRIPS"
  | "MITES"
  | "MEALYBUG"
  | "SCALE_INSECTS"
  | "LEAF_MINER"
  | "BORER"
  | "UNKNOWN";

export type ArabicPlantHint = {
  canonical: string;
  aliases: string[];
};

export type ArabicNlpResult = {
  originalText: string;
  normalizedText: string;
  correctedText: string;
  plantHints: string[];
  symptoms: ArabicSymptomSignal[];
  leafAge: ArabicLeafAge;
  veinColor: ArabicVeinColor;
  plantPart: ArabicPlantPart;
  severity?: "LOW" | "MODERATE" | "HIGH";
  timing?: string;
  explicitFacts: string[];
};

const commonPlantHints: Record<
  string,
  string[]
> = {
  mango: [
    "مانجو",
    "منجا",
    "مانجا",
    "مانجوه",
    "مناجو",
  ],
  tomato: [
    "طماطم",
    "طماطمايه",
  ],
  pepper: [
    "فلفل",
    "فلفله",
  ],
  cucumber: [
    "خيار",
    "خياره",
  ],
  potato: [
    "بطاطس",
    "بطاطا",
  ],
  strawberry: [
    "فراوله",
    "فراولة",
  ],
  grape: [
    "عنب",
  ],
  lemon: [
    "ليمون",
    "لمون",
    "ليمونه",
  ],
  orange: [
    "برتقال",
  ],
  mandarin: [
    "يوسفي",
    "يوسفى",
    "ماندرين",
  ],
  guava: [
    "جوافه",
    "جوافة",
  ],
  olive: [
    "زيتون",
  ],
  banana: [
    "موز",
  ],
  "date-palm": [
    "نخيل",
    "نخيل التمر",
    "بلح",
  ],
  fig: [
    "تين",
  ],
  pomegranate: [
    "رمان",
  ],
  apple: [
    "تفاح",
  ],
  pear: [
    "كمثري",
    "كمثرى",
  ],
  wheat: [
    "قمح",
  ],
  maize: [
    "ذره",
    "ذرة",
  ],
  rice: [
    "ارز",
    "أرز",
    "رز",
  ],
  cotton: [
    "قطن",
  ],
  onion: [
    "بصل",
  ],
  garlic: [
    "ثوم",
  ],
  carrot: [
    "جزر",
  ],
  lettuce: [
    "خس",
  ],
  spinach: [
    "سبانخ",
  ],
  eggplant: [
    "باذنجان",
  ],
  zucchini: [
    "كوسه",
    "كوسة",
  ],
  watermelon: [
    "بطيخ",
  ],
  melon: [
    "شمام",
    "كنتالوب",
  ],
  bean: [
    "فاصوليا",
    "فاصوليه",
  ],
  pea: [
    "بسله",
    "بازلاء",
    "بازلا",
  ],
  rose: [
    "ورد",
    "ورده",
  ],
  "snake-plant": [
    "سانسيفيريا",
    "سانسيفريا",
    "جلد النمر",
  ],
  fittonia: [
    "فيتونيا",
  ],
  dieffenbachia: [
    "ديفنباخيا",
    "ديفمباخيا",
  ],
  pothos: [
    "بوتس",
    "باثوس",
  ],
  monstera: [
    "مونستيرا",
  ],
  "peace-lily": [
    "زنبق السلام",
    "سباثيفيلوم",
  ],
  "spider-plant": [
    "نبات العنكبوت",
    "كلوروفيتم",
  ],
  "rubber-plant": [
    "فيكس مطاط",
    "نبات المطاط",
  ],
  "aloe-vera": [
    "الوفيرا",
    "ألوفيرا",
    "صبار الالوفيرا",
  ],
};

const correctionRules: Array<[
  RegExp,
  string,
]> = [
  [/(?<![\p{L}\p{N}])(الورق|ورق|الورقه|ورقه|الاوراق)(?![\p{L}\p{N}])/gu, "اوراق"],
  [/(?<![\p{L}\p{N}])(الجديد|الجديده|حديث|حديثه|الحديث|الحديثه)(?![\p{L}\p{N}])/gu, "حديثه"],
  [/(?<![\p{L}\p{N}])(القديم|القديمه|قديم|قديمه)(?![\p{L}\p{N}])/gu, "قديمه"],
  [/(?<![\p{L}\p{N}])(اصفر|صفراء|صفرا|مصفر|مصفره|اصفرار)(?![\p{L}\p{N}])/gu, "اصفرار"],
  [/(?<![\p{L}\p{N}])(اخضر|خضراء|خضرا|خضره)(?![\p{L}\p{N}])/gu, "خضراء"],
  [/(?<![\p{L}\p{N}])(العروق|عروق)(?![\p{L}\p{N}])/gu, "عروق"],
  [/(?<![\p{L}\p{N}])(بنيه|بني|بنيّه)(?![\p{L}\p{N}])/gu, "بنيه"],
  [/(?<![\p{L}\p{N}])(سوده|سودا|اسود|سوداء)(?![\p{L}\p{N}])/gu, "سوداء"],
  [/(?<![\p{L}\p{N}])(ذابله|دابل|مدبل|مدبله|ذابلة)(?![\p{L}\p{N}])/gu, "ذبول"],
  [/(?<![\p{L}\p{N}])(الحواف|اطراف|الاطراف)(?![\p{L}\p{N}])/gu, "حواف"],
  [/(?<![\p{L}\p{N}])(حرق|محروقه|محروقة)(?![\p{L}\p{N}])/gu, "احتراق"],
  [/(?<![\p{L}\p{N}])(منجا|مانجا|مانجوه|مناجو)(?![\p{L}\p{N}])/gu, "مانجو"],
  [/(?<![\p{L}\p{N}])(لمون|ليمونه)(?![\p{L}\p{N}])/gu, "ليمون"],
  [/(?<![\p{L}\p{N}])(طماطمايه)(?![\p{L}\p{N}])/gu, "طماطم"],
  [/(?<![\p{L}\p{N}])(فلفله)(?![\p{L}\p{N}])/gu, "فلفل"],
  [/(?<![\p{L}\p{N}])(خياره)(?![\p{L}\p{N}])/gu, "خيار"],
  [/(?<![\p{L}\p{N}])(دبانه بيضا|دبان ابيض|ذبابه بيضا)(?![\p{L}\p{N}])/gu, "ذبابة بيضاء"],
  [/(?<![\p{L}\p{N}])(المن|حشره المن|حشرة المن)(?![\p{L}\p{N}])/gu, "حشرة المن"],
  [/(?<![\p{L}\p{N}])(ترابس|تريبس)(?![\p{L}\p{N}])/gu, "تربس"],
  [/(?<![\p{L}\p{N}])(عنكبوت احمر|عناكب حمراء)(?![\p{L}\p{N}])/gu, "اكاروس"],
  [/(?<![\p{L}\p{N}])(بق دقيقي|حشره قطنيه|حشرة قطنية)(?![\p{L}\p{N}])/gu, "بق دقيقي"],
  [/(?<![\p{L}\p{N}])(قشريه|حشرات قشريه|حشرات قشرية)(?![\p{L}\p{N}])/gu, "حشرات قشرية"],
  [/(?<![\p{L}\p{N}])(صانع انفاق|صانعه انفاق|صانعات الانفاق)(?![\p{L}\p{N}])/gu, "صانعات الانفاق"],
];

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

function applyCorrections(
  value: string,
) {
  return correctionRules.reduce(
    (
      current,
      [pattern, replacement],
    ) =>
      current.replace(
        pattern,
        replacement,
      ),
    value,
  );
}

function containsAny(
  text: string,
  values: string[],
) {
  return values.some((value) =>
    text.includes(
      normalizeArabic(value),
    ),
  );
}

function unique<T>(
  values: T[],
) {
  return Array.from(
    new Set(values),
  );
}

function editDistance(
  left: string,
  right: string,
) {
  const a =
    normalizeArabic(left);
  const b =
    normalizeArabic(right);

  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous =
    Array.from(
      {
        length:
          b.length + 1,
      },
      (_, index) => index,
    );

  for (
    let row = 1;
    row <= a.length;
    row += 1
  ) {
    const current = [row];

    for (
      let column = 1;
      column <= b.length;
      column += 1
    ) {
      const substitution =
        previous[column - 1] +
        (
          a[row - 1] ===
          b[column - 1]
            ? 0
            : 1
        );

      current[column] =
        Math.min(
          current[column - 1] +
            1,
          previous[column] + 1,
          substitution,
        );
    }

    for (
      let column = 0;
      column <
      current.length;
      column += 1
    ) {
      previous[column] =
        current[column];
    }
  }

  return previous[b.length];
}

function detectPlantHints(
  text: string,
) {
  const words =
    text.split(" ");

  const matches:
    string[] = [];

  for (const [
    canonical,
    aliases,
  ] of Object.entries(
    commonPlantHints,
  )) {
    const found =
      aliases.some((alias) => {
        const normalizedAlias =
          normalizeArabic(alias);

        if (
          text.includes(
            normalizedAlias,
          )
        ) {
          return true;
        }

        const threshold =
          normalizedAlias.length <= 4
            ? 1
            : 2;

        return words.some(
          (word) =>
            editDistance(
              word,
              normalizedAlias,
            ) <= threshold,
        );
      });

    if (found) {
      matches.push(
        canonical,
      );
    }
  }

  return unique(matches);
}

function detectLeafAge(
  text: string,
): ArabicLeafAge {
  if (
    containsAny(text, [
      "اوراق حديثه",
      "اوراق جديده",
      "ورق حديثه",
      "الورق حديثه",
      "ورقه حديثه",
      "الورقه حديثه",
      "النمو الحديث",
      "القمم الناميه",
      "الورق الجديد",
      "الورق الجديده",
    ])
  ) {
    return "NEW";
  }

  if (
    containsAny(text, [
      "اوراق قديمه",
      "الاوراق السفليه",
      "الورق القديم",
    ])
  ) {
    return "OLD";
  }

  if (
    containsAny(text, [
      "كل الاوراق",
      "النبات كله",
      "الاوراق كلها",
    ])
  ) {
    return "ALL";
  }

  return "UNKNOWN";
}

function detectVeinColor(
  text: string,
): ArabicVeinColor {
  if (
    containsAny(text, [
      "عروق خضراء",
      "العروق خضراء",
      "عروق خضرا",
      "العروق خضرا",
      "عروق خضره",
      "العروق خضره",
      "بقاء العروق خضراء",
    ])
  ) {
    return "GREEN";
  }

  if (
    containsAny(text, [
      "العروق صفراء",
      "عروق صفراء",
    ])
  ) {
    return "YELLOW";
  }

  return "UNKNOWN";
}

function detectPlantPart(
  text: string,
): ArabicPlantPart {
  if (
    containsAny(text, [
      "اوراق",
      "ورقه",
      "ورق",
    ])
  ) {
    return "LEAVES";
  }

  if (
    containsAny(text, [
      "ساق",
      "سيقان",
      "الافرع",
      "الفروع",
    ])
  ) {
    return "STEMS";
  }

  if (
    containsAny(text, [
      "جذر",
      "جذور",
    ])
  ) {
    return "ROOTS";
  }

  if (
    containsAny(text, [
      "ثمره",
      "ثمار",
      "الثمر",
    ])
  ) {
    return "FRUIT";
  }

  if (
    containsAny(text, [
      "زهره",
      "ازهار",
      "زهور",
    ])
  ) {
    return "FLOWERS";
  }

  if (
    containsAny(text, [
      "النبات كله",
      "النبات بالكامل",
      "كل النبات",
    ])
  ) {
    return "WHOLE_PLANT";
  }

  return "UNKNOWN";
}

function detectSymptoms(
  text: string,
): ArabicSymptomSignal[] {
  const symptoms:
    ArabicSymptomSignal[] = [];

  const add = (
    signal:
      ArabicSymptomSignal,
    values: string[],
  ) => {
    if (
      containsAny(
        text,
        values,
      )
    ) {
      symptoms.push(signal);
    }
  };

  add(
    "YELLOWING",
    [
      "اصفرار",
      "مصفر",
      "مصفره",
      "اوراق صفراء",
      "الورق اصفر",
      "الورق مصفر",
    ],
  );

  add(
    "INTERVEINAL_CHLOROSIS",
    [
      "بين العروق",
      "اصفرار بين العروق",
      "عروق خضراء",
      "العروق خضراء",
      "عروق خضرا",
      "العروق خضرا",
    ],
  );

  add(
    "BROWN_SPOTS",
    [
      "بقع بنيه",
      "تبقع بني",
    ],
  );

  add(
    "BLACK_SPOTS",
    [
      "بقع سوداء",
      "تبقع اسود",
    ],
  );

  add(
    "WHITE_POWDER",
    [
      "بودره بيضاء",
      "مسحوق ابيض",
      "دقيق ابيض",
      "بياض دقيقي",
    ],
  );

  add(
    "EDGE_BURN",
    [
      "احتراق حواف",
      "حواف محروقه",
      "جفاف الحواف",
    ],
  );

  add(
    "WILTING",
    [
      "ذبول",
      "النبات مدبل",
    ],
  );

  add(
    "LEAF_CURL",
    [
      "التفاف الاوراق",
      "الورق ملفوف",
      "تجعد الاوراق",
    ],
  );

  add(
    "DISTORTED_NEW_GROWTH",
    [
      "تشوه النمو الحديث",
      "اوراق حديثه مشوهه",
      "التفاف النمو الحديث",
    ],
  );

  add(
    "TIP_DEATH",
    [
      "موت القمه",
      "جفاف القمه",
      "موت البرعم الطرفي",
    ],
  );

  add(
    "ROOT_ROT",
    [
      "تعفن جذور",
      "الجذور سوداء",
      "رائحه الجذور",
    ],
  );

  add(
    "STEM_ROT",
    [
      "تعفن ساق",
      "تعفن السيقان",
    ],
  );

  add(
    "FRUIT_ROT",
    [
      "تعفن ثمار",
      "الثمره بتتعفن",
    ],
  );

  add(
    "STUNTING",
    [
      "تقزم",
      "النمو ضعيف",
      "النبات مش بيكبر",
    ],
  );

  add(
    "LEAF_DROP",
    [
      "تساقط الاوراق",
      "الورق بيقع",
    ],
  );

  add(
    "FRUIT_DROP",
    [
      "تساقط الثمار",
      "الثمر بيقع",
    ],
  );

  add(
    "VISIBLE_INSECTS",
    [
      "حشرات ظاهره",
      "في حشرات",
      "حشرات علي الورق",
    ],
  );

  add(
    "WHITEFLY",
    [
      "ذبابة بيضاء",
      "دبان ابيض",
    ],
  );

  add(
    "APHIDS",
    [
      "حشره المن",
      "حشرة المن",
      "المن على الاوراق",
      "مستعمرات المن",
    ],
  );

  add(
    "THRIPS",
    [
      "تربس",
      "ترابس",
      "تريبس",
    ],
  );

  add(
    "MITES",
    [
      "اكاروس",
      "عنكبوت احمر",
    ],
  );

  add(
    "MEALYBUG",
    [
      "بق دقيقي",
      "حشره قطنيه",
    ],
  );

  add(
    "SCALE_INSECTS",
    [
      "حشرات قشريه",
      "قشريه",
    ],
  );

  add(
    "LEAF_MINER",
    [
      "صانعات الانفاق",
      "انفاق في الورق",
    ],
  );

  add(
    "BORER",
    [
      "حفار",
      "ثقب في الساق",
      "نفق داخل الساق",
    ],
  );

  return symptoms.length > 0
    ? unique(symptoms)
    : ["UNKNOWN"];
}

function detectSeverity(
  text: string,
) {
  if (
    containsAny(text, [
      "شديد",
      "جدا",
      "منتشر",
      "كل النبات",
      "بيموت",
    ])
  ) {
    return "HIGH" as const;
  }

  if (
    containsAny(text, [
      "متوسط",
      "كام ورقه",
      "بعض الاوراق",
    ])
  ) {
    return "MODERATE" as const;
  }

  if (
    containsAny(text, [
      "بسيط",
      "ورقه واحده",
      "خفيف",
    ])
  ) {
    return "LOW" as const;
  }

  return undefined;
}

function explicitFacts(
  result: Omit<
    ArabicNlpResult,
    "explicitFacts"
  >,
) {
  const facts:
    string[] = [];

  if (
    result.plantHints.length > 0
  ) {
    facts.push(
      `plant:${result.plantHints.join("|")}`,
    );
  }

  if (
    result.leafAge !==
    "UNKNOWN"
  ) {
    facts.push(
      `leafAge:${result.leafAge}`,
    );
  }

  if (
    result.veinColor !==
    "UNKNOWN"
  ) {
    facts.push(
      `veinColor:${result.veinColor}`,
    );
  }

  if (
    result.plantPart !==
    "UNKNOWN"
  ) {
    facts.push(
      `plantPart:${result.plantPart}`,
    );
  }

  for (
    const symptom of
    result.symptoms
  ) {
    if (
      symptom !== "UNKNOWN"
    ) {
      facts.push(
        `symptom:${symptom}`,
      );
    }
  }

  if (result.severity) {
    facts.push(
      `severity:${result.severity}`,
    );
  }

  if (result.timing) {
    facts.push(
      `timing:${result.timing}`,
    );
  }

  return unique(facts);
}

export function analyzeArabicPlantMessage(
  message: string,
): ArabicNlpResult {
  const originalText =
    message.trim();

  const normalizedText =
    normalizeArabic(
      originalText,
    );

  const correctedText =
    applyCorrections(
      normalizedText,
    );

  const base = {
    originalText,
    normalizedText,
    correctedText,
    plantHints:
      detectPlantHints(
        correctedText,
      ),
    symptoms:
      detectSymptoms(
        correctedText,
      ),
    leafAge:
      detectLeafAge(
        correctedText,
      ),
    veinColor:
      detectVeinColor(
        correctedText,
      ),
    plantPart:
      detectPlantPart(
        correctedText,
      ),
    severity:
      detectSeverity(
        correctedText,
      ),
    timing:
      undefined,
  };

  return {
    ...base,
    explicitFacts:
      explicitFacts(base),
  };
}
