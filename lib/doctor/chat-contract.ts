export type DoctorStatus =
  | "needs_information"
  | "differential_ready"
  | "insufficient_information"
  | "unavailable"
  | "session_expired"
  | "knowledge_release_unavailable";

export type ConfidenceBand = "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";
export type DoctorAnswer = string | string[];

export type DoctorChatRequest = {
  sessionId?: string;
  imageRef?: string;
  message?: string;
  answers?: Record<string, DoctorAnswer>;
  context?: { plant?: string; symptoms?: string[]; location?: string; timing?: string; severity?: string };
};

export type DoctorEvidence = { key: string; value: string; detail: string };
export type DoctorCandidate = {
  id: string;
  type: "DISEASE" | "PEST" | "DEFICIENCY";
  name: string;
  slug: string;
  confidence: ConfidenceBand;
  explanation: string;
  matchedEvidence: DoctorEvidence[];
  missingEvidence: string[];
  contradictions: string[];
  excludedEvidence: string[];
};

export type DoctorQuestion = {
  id: string;
  prompt: string;
  answerShape: "short_text" | "single_choice" | "multiple_choice" | "yes_no";
  options?: string[];
  why: string;
};

export type DoctorChatResponse = {
  sessionId?: string;
  status: DoctorStatus;
  error?: string;
  retryable?: boolean;
  knowledgeRelease: { version: string; manifestChecksum: string; contentChecksum: string };
  plant: { resolved?: { id: string; name: string; slug: string }; alternatives: { id: string; name: string; slug: string }[] };
  candidates: DoctorCandidate[];
  followUpQuestions: DoctorQuestion[];
  treatment: {
    immediateActions: string[];
    monitoringSteps: string[];
    treatmentGuidance: string[];
    products: { productId: string; name: string; reason: string; priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL"; compatibilityWarning?: string }[];
    contraindications: string[];
    unknownCompatibilityWarnings: string[];
  };
  emergencyFlags: string[];
  disclaimer: string;
};

export type DoctorCharacterState = "WELCOME" | "THINKING" | "ASKING" | "DIAGNOSIS_READY" | "WARNING" | "UNAVAILABLE" | "SESSION_EXPIRED";

export function characterStateFor(status: DoctorStatus | "welcome" | "thinking", hasWarnings = false): DoctorCharacterState {
  if (status === "welcome") return "WELCOME";
  if (status === "thinking") return "THINKING";
  if (status === "unavailable" || status === "knowledge_release_unavailable") return "UNAVAILABLE";
  if (status === "session_expired") return "SESSION_EXPIRED";
  if (hasWarnings) return "WARNING";
  if (status === "needs_information") return "ASKING";
  return "DIAGNOSIS_READY";
}

const statuses: readonly DoctorStatus[] = ["needs_information", "differential_ready", "insufficient_information", "unavailable", "session_expired", "knowledge_release_unavailable"];
const bands: readonly ConfidenceBand[] = ["HIGH", "MODERATE", "LOW", "INSUFFICIENT"];
const answerShapes = ["short_text", "single_choice", "multiple_choice", "yes_no"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;
}

function evidence(value: unknown): DoctorEvidence[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((item) => isRecord(item) && typeof item.key === "string" && typeof item.value === "string" && typeof item.detail === "string")
    ? value as DoctorEvidence[]
    : null;
}

function candidates(value: unknown): DoctorCandidate[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((item) => isRecord(item)
    && typeof item.id === "string" && typeof item.name === "string" && typeof item.slug === "string" && typeof item.explanation === "string"
    && ["DISEASE", "PEST", "DEFICIENCY"].includes(String(item.type)) && bands.includes(item.confidence as ConfidenceBand)
    && evidence(item.matchedEvidence) !== null && strings(item.missingEvidence) !== null && strings(item.contradictions) !== null && strings(item.excludedEvidence) !== null)
    ? value as DoctorCandidate[]
    : null;
}

function emptyResponse(status: Extract<DoctorStatus, "unavailable" | "session_expired" | "knowledge_release_unavailable">, error?: string): DoctorChatResponse {
  return { sessionId: undefined, status, error, knowledgeRelease: { version: "", manifestChecksum: "", contentChecksum: "" }, plant: { alternatives: [] }, candidates: [], followUpQuestions: [], treatment: { immediateActions: [], monitoringSteps: [], treatmentGuidance: [], products: [], contraindications: [], unknownCompatibilityWarnings: [] }, emergencyFlags: [], disclaimer: "" };
}

export function parseDoctorChatResponse(value: unknown): DoctorChatResponse {
  if (!isRecord(value) || !statuses.includes(value.status as DoctorStatus)) throw new Error("استجابة الطبيب غير صالحة. حاول مرة أخرى.");
  const status = value.status as DoctorStatus;
  if (status === "unavailable" || status === "session_expired" || status === "knowledge_release_unavailable") {
    return emptyResponse(status, typeof value.error === "string" ? value.error : undefined);
  }
  const release = value.knowledgeRelease;
  const plant = value.plant;
  const treatment = value.treatment;
  const parsedCandidates = candidates(value.candidates);
  if (!isRecord(release) || !isRecord(plant) || !isRecord(treatment) || !parsedCandidates
    || typeof release.version !== "string" || typeof release.manifestChecksum !== "string" || typeof release.contentChecksum !== "string"
    || !Array.isArray(plant.alternatives) || !strings(treatment.immediateActions) || !strings(treatment.monitoringSteps) || !strings(treatment.treatmentGuidance)
    || !strings(treatment.contraindications) || !strings(treatment.unknownCompatibilityWarnings) || !strings(value.emergencyFlags) || typeof value.disclaimer !== "string") {
    throw new Error("استجابة الطبيب غير صالحة. حاول مرة أخرى.");
  }
  const followUpQuestions = value.followUpQuestions;
  if (!Array.isArray(followUpQuestions) || !followUpQuestions.every((question) => isRecord(question) && typeof question.id === "string" && typeof question.prompt === "string" && typeof question.why === "string" && answerShapes.includes(question.answerShape as typeof answerShapes[number]) && (question.options === undefined || strings(question.options)))) throw new Error("استجابة الطبيب غير صالحة. حاول مرة أخرى.");
  const products = treatment.products;
  if (!Array.isArray(products) || !products.every((product) => isRecord(product) && typeof product.productId === "string" && typeof product.name === "string" && typeof product.reason === "string" && ["LOW", "NORMAL", "HIGH", "CRITICAL"].includes(String(product.priority)))) throw new Error("استجابة الطبيب غير صالحة. حاول مرة أخرى.");
  return value as DoctorChatResponse;
}
