import type { KnowledgeCurrentPointer, KnowledgeReleaseArtifacts } from "@/lib/knowledge/knowledge-types";

export interface KnowledgeExportStore {
  writeRelease(artifacts: KnowledgeReleaseArtifacts): Promise<void>;
  readReleaseFile(version: string, fileName: string): Promise<Uint8Array>;
  writeCurrentPointer(pointer: KnowledgeCurrentPointer): Promise<void>;
  readCurrentPointer(): Promise<KnowledgeCurrentPointer | null>;
  removeCurrentPointer(): Promise<void>;
}
