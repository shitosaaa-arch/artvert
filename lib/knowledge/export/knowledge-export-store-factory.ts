import { FilesystemKnowledgeExportStore } from "@/lib/knowledge/export/filesystem-knowledge-export-store";
import type { KnowledgeExportStore } from "@/lib/knowledge/knowledge-export-store";

export function createKnowledgeExportStore(): KnowledgeExportStore {
  const mode = process.env.KNOWLEDGE_EXPORT_STORE ?? (process.env.NODE_ENV === "production" ? "blob" : "filesystem");
  if (mode === "filesystem") return new FilesystemKnowledgeExportStore(process.env.KNOWLEDGE_FILESYSTEM_EXPORT_ROOT);
  if (mode === "blob") {
    throw new Error("KNOWLEDGE_EXPORT_STORE=blob requires a configured Vercel Blob implementation.");
  }
  throw new Error("KNOWLEDGE_EXPORT_STORE must be filesystem or blob.");
}
