import type {
  DoctorCase,
  DoctorConversationEntry,
  DoctorEvidence,
  DoctorSessionState,
} from "@/engine/doctor/doctor-types";

type CreateSessionInput = {
  releaseVersion: string;
  manifestChecksum: string;
  contentChecksum: string;
  now?: string;
};

type UpdateSessionInput = {
  session: DoctorSessionState;
  activeCaseId?: string;
  cases?: DoctorCase[];
  conversationHistory?: DoctorConversationEntry[];
  facts?: DoctorEvidence[];
  answeredQuestionIds?: string[];
  now?: string;
};

export function createDoctorSession(
  input: CreateSessionInput,
): DoctorSessionState {
  const now =
    input.now ??
    new Date().toISOString();

  return {
    releaseVersion:
      input.releaseVersion,
    manifestChecksum:
      input.manifestChecksum,
    contentChecksum:
      input.contentChecksum,
    activeCaseId: undefined,
    cases: [],
    conversationHistory: [],
    facts: [],
    answeredQuestionIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeDoctorSessionState(
  session: DoctorSessionState,
): DoctorSessionState {
  return {
    ...session,
    cases:
      Array.isArray(session.cases)
        ? session.cases
        : [],
    conversationHistory:
      Array.isArray(
        session.conversationHistory,
      )
        ? session.conversationHistory
        : [],
    facts:
      Array.isArray(session.facts)
        ? session.facts
        : [],
    answeredQuestionIds:
      Array.isArray(
        session.answeredQuestionIds,
      )
        ? session.answeredQuestionIds
        : [],
  };
}

export function updateDoctorSession(
  input: UpdateSessionInput,
): DoctorSessionState {
  const now =
    input.now ??
    new Date().toISOString();

  const session =
    normalizeDoctorSessionState(
      input.session,
    );

  return {
    ...session,
    activeCaseId:
      input.activeCaseId ??
      session.activeCaseId,
    cases:
      input.cases ??
      session.cases,
    conversationHistory:
      input.conversationHistory ??
      session.conversationHistory,
    facts:
      input.facts ??
      session.facts,
    answeredQuestionIds:
      input.answeredQuestionIds ??
      session.answeredQuestionIds,
    updatedAt: now,
  };
}

export function activeDoctorCase(
  session: DoctorSessionState,
) {
  const normalized =
    normalizeDoctorSessionState(
      session,
    );

  if (!normalized.activeCaseId) {
    return normalized.cases.at(-1);
  }

  return normalized.cases.find(
    (doctorCase) =>
      doctorCase.id ===
      normalized.activeCaseId,
  );
}

export function doctorCaseById(
  session: DoctorSessionState,
  caseId: string,
) {
  return normalizeDoctorSessionState(
    session,
  ).cases.find(
    (doctorCase) =>
      doctorCase.id === caseId,
  );
}

export function doctorCasesForPlant(
  session: DoctorSessionState,
  plantSlug: string,
) {
  return normalizeDoctorSessionState(
    session,
  ).cases.filter(
    (doctorCase) =>
      doctorCase.plant?.slug ===
      plantSlug,
  );
}

export function closeDoctorCase(
  session: DoctorSessionState,
  caseId: string,
  now = new Date().toISOString(),
): DoctorSessionState {
  const normalized =
    normalizeDoctorSessionState(
      session,
    );

  const cases =
    normalized.cases.map(
      (doctorCase) =>
        doctorCase.id === caseId
          ? {
              ...doctorCase,
              status:
                "CLOSED" as const,
              updatedAt: now,
            }
          : doctorCase,
    );

  const activeCaseId =
    normalized.activeCaseId ===
    caseId
      ? cases
          .slice()
          .reverse()
          .find(
            (doctorCase) =>
              doctorCase.status !==
              "CLOSED",
          )?.id
      : normalized.activeCaseId;

  return {
    ...normalized,
    activeCaseId,
    cases,
    updatedAt: now,
  };
}
