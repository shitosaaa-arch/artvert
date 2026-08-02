export type ConfidenceBand = "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";
export type DoctorStatus =
  | "needs_information"
  | "differential_ready"
  | "insufficient_information"
  | "unavailable"
  | "session_expired"
  | "knowledge_release_unavailable";
export type EvidenceProvenance =
  | "USER_EXPLICIT"
  | "USER_INFERRED"
  | "KNOWLEDGE_MATCH"
  | "FUTURE_VISION"
  | "SYSTEM_CONTEXT";
export type CandidateKind = "DISEASE" | "PEST" | "DEFICIENCY";

export type DoctorEvidence = {
  key: string;
  value: string;
  provenance: EvidenceProvenance;
  detail: string;
};

export type DoctorCandidate = {
  id: string;
  type: CandidateKind;
  name: string;
  slug: string;
  confidence: ConfidenceBand;
  matchedEvidence: DoctorEvidence[];
  missingEvidence: string[];
  contradictions: string[];
  excludedEvidence: string[];
  explanation: string;
};

export type DoctorQuestion = {
  id: string;
  prompt: string;
  answerShape: "short_text" | "single_choice" | "multiple_choice" | "yes_no";
  options?: string[];
  why: string;
};

export type DoctorProductRecommendation = {
  productId: string;
  name: string;
  reason: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  compatibilityWarning?: string;
};

export type DoctorTreatmentPlan = {
  immediateActions: string[];
  monitoringSteps: string[];
  treatmentGuidance: string[];
  products: DoctorProductRecommendation[];
  contraindications: string[];
  unknownCompatibilityWarnings: string[];
};

export type DoctorSessionState = {
  releaseVersion: string;
  manifestChecksum: string;
  contentChecksum: string;
  facts: DoctorEvidence[];
  answeredQuestionIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type DoctorTurn = {
  message?: string;
  answers?: Record<string, string | string[]>;
  context?: {
    plant?: string;
    symptoms?: string[];
    location?: string;
    timing?: string;
    severity?: string;
    soilContext?: Record<string, string>;
    phContext?: Record<string, string>;
  };
};

export type DoctorResult = {
  status: DoctorStatus;
  knowledgeRelease: { version: string; manifestChecksum: string; contentChecksum: string };
  session: DoctorSessionState;
  plant: { resolved?: { id: string; name: string; slug: string }; alternatives: { id: string; name: string; slug: string }[] };
  candidates: DoctorCandidate[];
  followUpQuestions: DoctorQuestion[];
  treatment: DoctorTreatmentPlan;
  emergencyFlags: string[];
  disclaimer: string;
};
