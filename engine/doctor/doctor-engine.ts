import type { KnowledgeEntityEnvelope, JsonValue } from "@/schemas/knowledge-entity-envelope";

import { KnowledgeReader } from "@/lib/knowledge/knowledge-reader";

import type {
  CandidateKind,
  ConfidenceBand,
  DoctorCandidate,
  DoctorEvidence,
  DoctorProductRecommendation,
  DoctorQuestion,
  DoctorResult,
  DoctorSessionState,
  DoctorTreatmentPlan,
  DoctorTurn,
} from "@/engine/doctor/doctor-types";

export const diagnosisWeights = {
  plantCompatibility: 24,
  exactSymptom: 18,
  partialSymptom: 7,
  locationContext: 8,
  timing: 6,
  severity: 4,
  contradictionPenalty: 30,
  missingEvidencePenalty: 5,
} as const;

type JsonRecord = Record<string, JsonValue>;
type ScoredCandidate = DoctorCandidate & { score: number; entity: KnowledgeEntityEnvelope };

const disclaimer = "This is decision support, not a certain diagnosis. Inspect plants and labels, follow local regulations, and consult an agronomist for severe or rapidly spreading problems.";

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().trim().replace(/[\s\p{P}]+/gu, " ").trim();
}

function record(value: JsonValue): JsonRecord | null {
  return value && !Array.isArray(value) && typeof value === "object" ? value as JsonRecord : null;
}

function strings(value: JsonValue | undefined): string[] {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") return [item];
    const itemRecord = record(item);
    return itemRecord && typeof itemRecord.value === "string" ? [itemRecord.value] : [];
  });
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

function factsForTurn(turn: DoctorTurn): DoctorEvidence[] {
  const facts: DoctorEvidence[] = [];
  if (turn.message?.trim()) facts.push(fact("message", turn.message, "USER_INFERRED", "User-described observation; not treated as a confirmed symptom."));
  if (turn.context?.plant) facts.push(fact("plant", turn.context.plant, "USER_EXPLICIT", "Plant supplied by the user."));
  for (const symptom of turn.context?.symptoms ?? []) facts.push(fact("symptom", symptom, "USER_EXPLICIT", "Symptom supplied by the user."));
  for (const [key, value] of Object.entries(turn.answers ?? {}).sort(([left], [right]) => left.localeCompare(right))) {
    for (const answer of Array.isArray(value) ? value : [value]) facts.push(fact(`answer:${key}`, answer, "USER_EXPLICIT", "Answer supplied by the user."));
  }
  if (turn.context?.location) facts.push(fact("location", turn.context.location, "USER_EXPLICIT", "Location supplied by the user."));
  if (turn.context?.timing) facts.push(fact("timing", turn.context.timing, "USER_EXPLICIT", "Timing supplied by the user."));
  if (turn.context?.severity) facts.push(fact("severity", turn.context.severity, "USER_EXPLICIT", "Severity supplied by the user."));
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

function confidence(score: number, evidenceCount: number, margin: number): ConfidenceBand {
  if (evidenceCount === 0 || score < diagnosisWeights.plantCompatibility) return "INSUFFICIENT";
  if (score >= 50 && margin >= 12) return "HIGH";
  if (score >= 25) return "MODERATE";
  return "LOW";
}

function scoreCandidate(entity: KnowledgeEntityEnvelope, plant: KnowledgeEntityEnvelope | undefined, facts: DoctorEvidence[]): ScoredCandidate {
  const type = candidateType(entity)!;
  const matchedEvidence: DoctorEvidence[] = [];
  const contradictions: string[] = [];
  const excludedEvidence: string[] = [];
  let score = 0;
  const symptoms = symptomValues(entity).map(normalize).filter(Boolean);
  const plantValues = relationValues(entity).map(normalize);

  if (plant) {
    const plantMatches = [plant.id, plant.slug, plant.name].map(normalize);
    if (plantValues.some((value) => plantMatches.includes(value))) {
      score += diagnosisWeights.plantCompatibility;
      matchedEvidence.push(fact("plant", plant.name, "KNOWLEDGE_MATCH", "Known plant relationship matched."));
    } else if (plantValues.length > 0) {
      contradictions.push("The selected plant is not listed as compatible with this candidate.");
      score -= diagnosisWeights.contradictionPenalty;
    }
  }

  for (const symptomFact of facts.filter((item) => item.key === "symptom")) {
    if (symptoms.includes(symptomFact.value)) {
      score += diagnosisWeights.exactSymptom;
      matchedEvidence.push(fact("symptom", symptomFact.value, "KNOWLEDGE_MATCH", "Exact symptom match."));
    } else if (symptoms.some((value) => value.includes(symptomFact.value) || symptomFact.value.includes(value))) {
      score += diagnosisWeights.partialSymptom;
      matchedEvidence.push(fact("symptom", symptomFact.value, "KNOWLEDGE_MATCH", "Partial symptom match."));
    } else {
      excludedEvidence.push(`No matching knowledge symptom for “${symptomFact.value}”.`);
    }
  }

  const context = payloadStrings(entity, ["locations", "soilContext", "phContext"]);
  for (const contextFact of facts.filter((item) => item.key === "location")) {
    if (context.map(normalize).some((value) => value.includes(contextFact.value))) {
      score += diagnosisWeights.locationContext;
      matchedEvidence.push(fact("location", contextFact.value, "KNOWLEDGE_MATCH", "Location/context match."));
    }
  }

  const timingValues = payloadStrings(entity, ["timing", "seasonalContext", "lifecycle"]);
  for (const timingFact of facts.filter((item) => item.key === "timing")) {
    if (timingValues.map(normalize).some((value) => value.includes(timingFact.value))) {
      score += diagnosisWeights.timing;
      matchedEvidence.push(fact("timing", timingFact.value, "KNOWLEDGE_MATCH", "Timing match."));
    }
  }

  const severityValues = payloadStrings(entity, ["severity"]);
  for (const severityFact of facts.filter((item) => item.key === "severity")) {
    if (severityValues.map(normalize).includes(severityFact.value)) score += diagnosisWeights.severity;
  }

  const missingEvidence = facts.some((item) => item.key === "symptom") ? [] : ["A specific symptom is needed to compare candidates."];
  score -= missingEvidence.length * diagnosisWeights.missingEvidencePenalty;
  return {
    id: entity.id,
    type,
    name: entity.name,
    slug: entity.slug,
    confidence: "INSUFFICIENT",
    matchedEvidence,
    missingEvidence,
    contradictions,
    excludedEvidence,
    explanation: "Evidence is evaluated deterministically from the pinned knowledge release.",
    score,
    entity,
  };
}

function questions(candidates: ScoredCandidate[], plant: KnowledgeEntityEnvelope | undefined, state: DoctorSessionState): DoctorQuestion[] {
  const answered = new Set(state.answeredQuestionIds);
  const next: DoctorQuestion[] = [];
  if (!plant && !answered.has("plant")) next.push({ id: "plant", prompt: "Which plant is affected?", answerShape: "short_text", why: "Plant identity removes incompatible candidates." });
  if (!state.facts.some((item) => item.key === "symptom") && !answered.has("symptom")) next.push({ id: "symptom", prompt: "What is the most visible symptom?", answerShape: "short_text", why: "A specific symptom most strongly separates diseases, pests, and deficiencies." });
  if (candidates.length > 1 && !answered.has("symptom_location")) next.push({ id: "symptom_location", prompt: "Where on the plant is the symptom most visible?", answerShape: "single_choice", options: ["leaves", "stems", "roots", "fruit", "whole plant"], why: "Location helps distinguish the leading candidates." });
  if (candidates.length > 1 && !answered.has("timing")) next.push({ id: "timing", prompt: "When did the problem begin or worsen?", answerShape: "short_text", why: "Timing can distinguish seasonal, lifecycle, and nutrient-related patterns." });
  return next.slice(0, 1);
}

function treatment(candidates: ScoredCandidate[], snapshotProducts: KnowledgeEntityEnvelope[], plant: KnowledgeEntityEnvelope | undefined): DoctorTreatmentPlan {
  const leader = candidates[0];
  if (!leader || leader.confidence === "INSUFFICIENT") return { immediateActions: [], monitoringSteps: ["Gather the next requested observation before selecting a treatment."], treatmentGuidance: [], products: [], contraindications: [], unknownCompatibilityWarnings: ["Product compatibility is unknown until sufficient evidence is available."] };
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
      if (typeof recommendation.contraindications === "string" && recommendation.contraindications) { contraindications.push(`${product.name}: ${recommendation.contraindications}`); continue; }
      const priority = recommendation.priority === "LOW" || recommendation.priority === "HIGH" || recommendation.priority === "CRITICAL" ? recommendation.priority : "NORMAL";
      products.push({ productId: product.id, name: product.name, priority, reason: `Active recommendation for likely ${leader.name}.`, compatibilityWarning: compatibility || undefined });
    }
  }
  products.sort((left, right) => ("CRITICAL,HIGH,NORMAL,LOW".indexOf(left.priority) - "CRITICAL,HIGH,NORMAL,LOW".indexOf(right.priority)) || left.name.localeCompare(right.name));
  return { immediateActions, monitoringSteps, treatmentGuidance, products, contraindications, unknownCompatibilityWarnings };
}

export class DoctorEngine {
  constructor(private readonly reader: KnowledgeReader) {}

  async diagnose(turn: DoctorTurn, prior?: DoctorSessionState): Promise<DoctorResult> {
    try {
      const release = prior
        ? await this.reader.readReleaseSnapshot(prior.releaseVersion, prior.manifestChecksum)
        : await this.reader.readActiveRelease();
      const now = new Date().toISOString();
      const facts = uniqueFacts([...(prior?.facts ?? []), ...factsForTurn(turn)]);
      const state: DoctorSessionState = {
        releaseVersion: release.releaseVersion,
        manifestChecksum: release.manifestChecksum,
        contentChecksum: release.contentChecksum,
        facts,
        answeredQuestionIds: [...new Set([...(prior?.answeredQuestionIds ?? []), ...Object.keys(turn.answers ?? {})])].sort(),
        createdAt: prior?.createdAt ?? now,
        updatedAt: now,
      };
      const plantFact = facts.find((item) => item.key === "plant");
      const plants = release.snapshot.PLANT.filter((entity) => plantFact && entityNames(entity).map(normalize).includes(plantFact.value));
      const plant = plants.length === 1 ? plants[0] : undefined;
      const scored = [...release.snapshot.DISEASE, ...release.snapshot.PEST, ...release.snapshot.DEFICIENCY]
        .map((entity) => scoreCandidate(entity, plant, facts))
        .sort((left, right) => right.score - left.score || left.type.localeCompare(right.type) || left.slug.localeCompare(right.slug) || left.id.localeCompare(right.id));
      const visible = scored.filter((candidate) => candidate.score > -diagnosisWeights.contradictionPenalty).slice(0, 5);
      const secondScore = visible[1]?.score ?? 0;
      for (const candidate of visible) {
        candidate.confidence = confidence(candidate.score, candidate.matchedEvidence.length, candidate.score - secondScore);
        candidate.explanation = candidate.confidence === "INSUFFICIENT" ? "Insufficient matching evidence; this is not a diagnosis." : `${candidate.confidence === "HIGH" ? "Likely" : candidate.confidence === "MODERATE" ? "Possible" : "Less likely"} because of the listed knowledge matches and missing evidence.`;
      }
      const publicCandidates = visible.map((candidate) => ({
        id: candidate.id,
        type: candidate.type,
        name: candidate.name,
        slug: candidate.slug,
        confidence: candidate.confidence,
        matchedEvidence: candidate.matchedEvidence,
        missingEvidence: candidate.missingEvidence,
        contradictions: candidate.contradictions,
        excludedEvidence: candidate.excludedEvidence,
        explanation: candidate.explanation,
      }));
      const followUpQuestions = questions(visible, plant, state);
      const status = visible[0]?.confidence === "INSUFFICIENT" ? "insufficient_information" : followUpQuestions.length ? "needs_information" : "differential_ready";
      const text = facts.map((item) => item.value).join(" ");
      const emergencyFlags = [
        ["rapid spread", "Rapid spread reported; escalate inspection."],
        ["severe wilting", "Severe wilting reported; escalate inspection."],
        ["root damage", "Extensive root or crown damage reported; escalate inspection."],
        ["crop loss", "High crop-loss risk reported; escalate inspection."],
      ].filter(([term]) => text.includes(term)).map(([, message]) => message);
      return {
        status,
        knowledgeRelease: { version: release.releaseVersion, manifestChecksum: release.manifestChecksum, contentChecksum: release.contentChecksum },
        session: state,
        plant: { resolved: plant ? { id: plant.id, name: plant.name, slug: plant.slug } : undefined, alternatives: plants.slice(0, 5).map((item) => ({ id: item.id, name: item.name, slug: item.slug })) },
        candidates: publicCandidates,
        followUpQuestions,
        treatment: treatment(visible, release.snapshot.PRODUCT.filter((product) => product.publicationState === "PUBLISHED"), plant),
        emergencyFlags,
        disclaimer,
      };
    } catch {
      const now = new Date().toISOString();
      const session = prior ?? { releaseVersion: "", manifestChecksum: "", contentChecksum: "", facts: [], answeredQuestionIds: [], createdAt: now, updatedAt: now };
      return { status: prior ? "knowledge_release_unavailable" : "unavailable", knowledgeRelease: { version: session.releaseVersion, manifestChecksum: session.manifestChecksum, contentChecksum: session.contentChecksum }, session, plant: { alternatives: [] }, candidates: [], followUpQuestions: [], treatment: { immediateActions: [], monitoringSteps: [], treatmentGuidance: [], products: [], contraindications: [], unknownCompatibilityWarnings: [] }, emergencyFlags: [], disclaimer: "Diagnostic knowledge is temporarily unavailable. Restart or refresh the conversation when a validated knowledge release is available." };
    }
  }
}
