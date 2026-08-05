import type {
  DoctorConversationEntry,
  DoctorConversationRole,
} from "@/engine/doctor/doctor-types";

type AppendConversationInput = {
  history: DoctorConversationEntry[];
  role: DoctorConversationRole;
  message: string;
  caseId?: string;
  createdAt?: string;
};

function createEntryId(
  role: DoctorConversationRole,
  createdAt: string,
) {
  const suffix = Math.random()
    .toString(36)
    .slice(2, 8);

  return `${role.toLowerCase()}-${Date.parse(createdAt)}-${suffix}`;
}

export function appendConversationEntry(
  input: AppendConversationInput,
): DoctorConversationEntry[] {
  const message =
    input.message.trim();

  if (!message) {
    return input.history;
  }

  const createdAt =
    input.createdAt ??
    new Date().toISOString();

  const entry:
    DoctorConversationEntry = {
    id: createEntryId(
      input.role,
      createdAt,
    ),
    role: input.role,
    caseId: input.caseId,
    message,
    createdAt,
  };

  return [
    ...input.history,
    entry,
  ];
}

export function appendUserMessage(
  history: DoctorConversationEntry[],
  message: string | undefined,
  caseId?: string,
  createdAt?: string,
) {
  if (!message?.trim()) {
    return history;
  }

  return appendConversationEntry({
    history,
    role: "USER",
    message,
    caseId,
    createdAt,
  });
}

export function appendDoctorMessage(
  history: DoctorConversationEntry[],
  message: string | undefined,
  caseId?: string,
  createdAt?: string,
) {
  if (!message?.trim()) {
    return history;
  }

  return appendConversationEntry({
    history,
    role: "DOCTOR",
    message,
    caseId,
    createdAt,
  });
}

export function appendSystemMessage(
  history: DoctorConversationEntry[],
  message: string | undefined,
  caseId?: string,
  createdAt?: string,
) {
  if (!message?.trim()) {
    return history;
  }

  return appendConversationEntry({
    history,
    role: "SYSTEM",
    message,
    caseId,
    createdAt,
  });
}

export function conversationForCase(
  history: DoctorConversationEntry[],
  caseId: string,
) {
  return history.filter(
    (entry) =>
      entry.caseId === caseId,
  );
}

export function latestConversationEntry(
  history: DoctorConversationEntry[],
  role?: DoctorConversationRole,
) {
  const entries = role
    ? history.filter(
        (entry) =>
          entry.role === role,
      )
    : history;

  return entries.at(-1);
}

export function trimConversationHistory(
  history: DoctorConversationEntry[],
  maximumEntries = 200,
) {
  if (
    history.length <=
    maximumEntries
  ) {
    return history;
  }

  return history.slice(
    history.length -
      maximumEntries,
  );
}
