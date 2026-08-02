export const knowledgeEntityTypes = ["PLANT", "DISEASE", "PEST", "DEFICIENCY", "PRODUCT"] as const;
export const knowledgePublicationStates = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type KnowledgeEntityType = (typeof knowledgeEntityTypes)[number];
export type KnowledgePublicationState = (typeof knowledgePublicationStates)[number];
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type KnowledgeEntityEnvelope = {
  id: string;
  type: KnowledgeEntityType;
  slug: string;
  name: string;
  payload: JsonValue;
  schemaVersion: number;
  publicationState: KnowledgePublicationState;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeEntityInput = Omit<KnowledgeEntityEnvelope, "createdAt" | "updatedAt"> & {
  createdAt?: string;
  updatedAt?: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.values(value).every(isJsonValue);
}

export function validateKnowledgeEntityEnvelope(value: KnowledgeEntityEnvelope | KnowledgeEntityInput): void {
  if (!value.id.trim()) throw new Error("Knowledge entity id is required.");
  if (!knowledgeEntityTypes.includes(value.type)) throw new Error("Knowledge entity type is invalid.");
  if (!slugPattern.test(value.slug)) throw new Error("Knowledge entity slug is invalid.");
  if (!value.name.trim()) throw new Error("Knowledge entity name is required.");
  if (!isJsonValue(value.payload)) throw new Error("Knowledge entity payload must be JSON-compatible.");
  if (!Number.isInteger(value.schemaVersion) || value.schemaVersion < 1) throw new Error("Knowledge entity schema version is invalid.");
  if (!knowledgePublicationStates.includes(value.publicationState)) throw new Error("Knowledge entity publication state is invalid.");
}
