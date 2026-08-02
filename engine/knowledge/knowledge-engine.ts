import type { KnowledgeExportStore } from "@/lib/knowledge/knowledge-export-store";
import { KnowledgeReader } from "@/lib/knowledge/knowledge-reader";

// This is the only knowledge entry point intended for the future Doctor engine.
export function createKnowledgeEngine(store: KnowledgeExportStore) {
  return new KnowledgeReader(store);
}
