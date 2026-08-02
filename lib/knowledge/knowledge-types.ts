import type { KnowledgeEntityEnvelope, KnowledgeEntityType } from "@/schemas/knowledge-entity-envelope";

export type KnowledgeFileName = "plants.json" | "diseases.json" | "pests.json" | "deficiencies.json" | "products.json";

export type KnowledgeManifest = {
  formatVersion: 1;
  releaseVersion: string;
  contentChecksum: string;
  files: Record<KnowledgeFileName, { checksum: string; entityCount: number }>;
};

export type KnowledgeCurrentPointer = {
  formatVersion: 1;
  releaseVersion: string;
  manifestChecksum: string;
};

export type KnowledgeReleaseArtifacts = {
  version: string;
  manifest: KnowledgeManifest;
  manifestBytes: Uint8Array;
  files: Record<KnowledgeFileName, Uint8Array>;
};

export type KnowledgeSnapshot = Record<KnowledgeEntityType, KnowledgeEntityEnvelope[]>;

export type KnowledgeReleaseSnapshot = {
  releaseVersion: string;
  manifestChecksum: string;
  contentChecksum: string;
  snapshot: KnowledgeSnapshot;
};

export const knowledgeFileNames: Record<KnowledgeEntityType, KnowledgeFileName> = {
  PLANT: "plants.json",
  DISEASE: "diseases.json",
  PEST: "pests.json",
  DEFICIENCY: "deficiencies.json",
  PRODUCT: "products.json",
};
