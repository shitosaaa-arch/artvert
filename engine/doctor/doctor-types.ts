export type ConfidenceBand =
  | "HIGH"
  | "MODERATE"
  | "LOW"
  | "INSUFFICIENT";

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

export type CandidateKind =
  | "DISEASE"
  | "PEST"
  | "DEFICIENCY";

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
  answerShape:
    | "short_text"
    | "single_choice"
    | "multiple_choice"
    | "yes_no";
  options?: string[];
  why: string;
};

export type DoctorProductRecommendation = {
  productId: string;
  name: string;
  reason: string;
  priority:
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "CRITICAL";
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

export type DoctorResolvedPlant = {
  id: string;
  name: string;
  slug: string;
};

export type DoctorCaseStatus =
  | "NEW"
  | "COLLECTING_INFORMATION"
  | "DIAGNOSIS_READY"
  | "CLOSED";

export type DoctorCase = {
  id: string;

  /*
   * اسم مختصر للحالة يظهر في الواجهة لاحقًا.
   * مثال:
   * مانجو - اصفرار الأوراق
   */
  title: string;

  plant?: DoctorResolvedPlant;

  /*
   * كل الأدلة الخاصة بهذه الحالة فقط.
   * لا يتم خلطها مع حالة نبات أخرى.
   */
  facts: DoctorEvidence[];

  answeredQuestionIds: string[];

  latestCandidates: DoctorCandidate[];

  latestTreatment?: DoctorTreatmentPlan;

  latestStatus?: DoctorStatus;

  status: DoctorCaseStatus;

  createdAt: string;
  updatedAt: string;
};

export type DoctorConversationRole =
  | "USER"
  | "DOCTOR"
  | "SYSTEM";

export type DoctorConversationEntry = {
  id: string;
  role: DoctorConversationRole;

  /*
   * الحالة التي تنتمي إليها الرسالة.
   * يمكن أن تكون undefined في الأسئلة العامة.
   */
  caseId?: string;

  message: string;
  createdAt: string;
};

export type DoctorSessionState = {
  releaseVersion: string;
  manifestChecksum: string;
  contentChecksum: string;

  /*
   * الحالة النشطة حاليًا.
   * تتغير تلقائيًا عند ذكر نبات جديد
   * أو الرجوع إلى نبات تمت مناقشته سابقًا.
   */
  activeCaseId?: string;

  /*
   * كل الحالات التي ناقشها المستخدم داخل نفس الجلسة.
   */
  cases: DoctorCase[];

  /*
   * سجل المحادثة بالكامل.
   * سيتم استخدامه لاحقًا في الواجهة والذاكرة والسياق.
   */
  conversationHistory: DoctorConversationEntry[];

  /*
   * الحقول القديمة محفوظة مؤقتًا للتوافق
   * مع الكود الحالي أثناء الانتقال إلى Case Manager.
   *
   * بعد الانتهاء من تعديل DoctorEngine
   * يمكن حذفها نهائيًا.
   */
  facts: DoctorEvidence[];
  answeredQuestionIds: string[];

  createdAt: string;
  updatedAt: string;
};

export type DoctorTurn = {
  message?: string;

  answers?: Record<
    string,
    string | string[]
  >;

  context?: {
    /*
     * يسمح للواجهة بتحديد الحالة المقصودة صراحة.
     */
    caseId?: string;

    plant?: string;
    symptoms?: string[];
    location?: string;
    timing?: string;
    severity?: string;

    soilContext?: Record<
      string,
      string
    >;

    phContext?: Record<
      string,
      string
    >;
  };
};

export type DoctorResult = {
  status: DoctorStatus;

  knowledgeRelease: {
    version: string;
    manifestChecksum: string;
    contentChecksum: string;
  };

  session: DoctorSessionState;

  /*
   * الحالة التي تم التعامل معها في الرسالة الحالية.
   */
  activeCaseId?: string;

  plant: {
    resolved?: DoctorResolvedPlant;

    alternatives: DoctorResolvedPlant[];
  };

  candidates: DoctorCandidate[];

  followUpQuestions: DoctorQuestion[];

  treatment: DoctorTreatmentPlan;

  emergencyFlags: string[];

  disclaimer: string;
};