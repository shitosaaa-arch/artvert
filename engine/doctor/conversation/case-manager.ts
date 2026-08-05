import type { KnowledgeEntityEnvelope } from "@/schemas/knowledge-entity-envelope";

import type {
  DoctorCase,
  DoctorEvidence,
  DoctorSessionState,
} from "@/engine/doctor/doctor-types";

type CaseManagerInput = {
  prior?: DoctorSessionState;
  requestedCaseId?: string;
  currentPlant?: KnowledgeEntityEnvelope;
  currentFacts: DoctorEvidence[];
  now: string;
};

type CaseSelection = {
  activeCaseId: string;
  selectedCase?: DoctorCase;
  existingCase?: DoctorCase;
  baseFacts: DoctorEvidence[];
  shouldCreateCase: boolean;
};

function normalizeValue(
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
    .trim()
    .replace(/[\s\p{P}\p{S}]+/gu, " ")
    .trim();
}

function createCaseId(
  now: string,
  plantSlug?: string,
) {
  const suffix = Math.random()
    .toString(36)
    .slice(2, 8);

  return `case-${plantSlug ?? "unknown"}-${Date.parse(now)}-${suffix}`;
}

export function normalizeDoctorSession(
  prior: DoctorSessionState | undefined,
): DoctorSessionState | undefined {
  if (!prior) {
    return undefined;
  }

  return {
    ...prior,
    cases:
      Array.isArray(prior.cases)
        ? prior.cases
        : [],
    conversationHistory:
      Array.isArray(
        prior.conversationHistory,
      )
        ? prior.conversationHistory
        : [],
  };
}

function findRequestedCase(
  prior: DoctorSessionState,
  requestedCaseId: string,
) {
  return prior.cases.find(
    (item) =>
      item.id === requestedCaseId,
  );
}

function findLatestPlantCase(
  prior: DoctorSessionState,
  plantSlug: string,
) {
  return prior.cases
    .slice()
    .reverse()
    .find(
      (item) =>
        item.plant?.slug ===
        plantSlug,
    );
}

function findActiveCase(
  prior: DoctorSessionState,
) {
  if (!prior.activeCaseId) {
    return prior.cases.at(-1);
  }

  return prior.cases.find(
    (item) =>
      item.id ===
      prior.activeCaseId,
  );
}

function currentPlantFact(
  currentFacts: DoctorEvidence[],
) {
  return currentFacts.find(
    (item) =>
      item.key === "plant",
  );
}

function casePlantMatchesCurrentFact(
  currentFacts: DoctorEvidence[],
  doctorCase: DoctorCase,
) {
  const plantFact =
    currentPlantFact(currentFacts);

  if (
    !plantFact ||
    !doctorCase.plant
  ) {
    return true;
  }

  const factValue =
    normalizeValue(
      plantFact.value,
    );

  return [
    doctorCase.plant.id,
    doctorCase.plant.slug,
    doctorCase.plant.name,
  ]
    .map(normalizeValue)
    .includes(factValue);
}

export function selectDoctorCase(
  input: CaseManagerInput,
): CaseSelection {
  const safePrior =
    normalizeDoctorSession(
      input.prior,
    );

  if (!safePrior) {
    return {
      activeCaseId:
        createCaseId(
          input.now,
          input.currentPlant?.slug,
        ),
      baseFacts: [],
      shouldCreateCase: true,
    };
  }

  if (input.requestedCaseId) {
    const requested =
      findRequestedCase(
        safePrior,
        input.requestedCaseId,
      );

    if (requested) {
      return {
        activeCaseId:
          requested.id,
        selectedCase:
          requested,
        existingCase:
          requested,
        baseFacts:
          requested.facts,
        shouldCreateCase:
          false,
      };
    }
  }

  if (input.currentPlant) {
    const plantCase =
      findLatestPlantCase(
        safePrior,
        input.currentPlant.slug,
      );

    if (plantCase) {
      return {
        activeCaseId:
          plantCase.id,
        selectedCase:
          plantCase,
        existingCase:
          plantCase,
        baseFacts:
          plantCase.facts,
        shouldCreateCase:
          false,
      };
    }

    return {
      activeCaseId:
        createCaseId(
          input.now,
          input.currentPlant.slug,
        ),
      baseFacts: [],
      shouldCreateCase: true,
    };
  }

  const activeCase =
    findActiveCase(safePrior);

  if (
    activeCase &&
    casePlantMatchesCurrentFact(
      input.currentFacts,
      activeCase,
    )
  ) {
    return {
      activeCaseId:
        activeCase.id,
      selectedCase:
        activeCase,
      existingCase:
        activeCase,
      baseFacts:
        activeCase.facts,
      shouldCreateCase:
        false,
    };
  }

  return {
    activeCaseId:
      createCaseId(
        input.now,
      ),
    baseFacts: [],
    shouldCreateCase: true,
  };
}

export function upsertDoctorCase(
  cases: DoctorCase[],
  updatedCase: DoctorCase,
) {
  return [
    ...cases.filter(
      (item) =>
        item.id !==
        updatedCase.id,
    ),
    updatedCase,
  ];
}

export function buildDoctorCaseTitle(
  plant:
    | KnowledgeEntityEnvelope
    | undefined,
  facts: DoctorEvidence[],
) {
  const symptom =
    facts.find(
      (item) =>
        item.key === "symptom",
    )?.value;

  if (
    plant &&
    symptom
  ) {
    return `${plant.name} - ${symptom}`;
  }

  if (plant) {
    return plant.name;
  }

  if (symptom) {
    return `حالة غير محددة النبات - ${symptom}`;
  }

  return "حالة تشخيصية جديدة";
}

export function resolvedPlantForCase(
  plant:
    | KnowledgeEntityEnvelope
    | undefined,
) {
  return plant
    ? {
        id: plant.id,
        name: plant.name,
        slug: plant.slug,
      }
    : undefined;
}
