import { BlobKnowledgeExportStore } from "@/lib/knowledge/export/blob-knowledge-export-store";
import { FilesystemKnowledgeExportStore } from "@/lib/knowledge/export/filesystem-knowledge-export-store";
import type { KnowledgeExportStore } from "@/lib/knowledge/knowledge-export-store";

export function createKnowledgeExportStore(): KnowledgeExportStore {
  const mode =
    process.env.KNOWLEDGE_EXPORT_STORE ??
    (process.env.NODE_ENV === "production"
      ? "blob"
      : "filesystem");

  switch (mode) {
    case "filesystem":
      return new FilesystemKnowledgeExportStore(
        process.env.KNOWLEDGE_FILESYSTEM_EXPORT_ROOT,
      );

    case "blob":
      return new BlobKnowledgeExportStore();

    default:
      throw new Error(
        "KNOWLEDGE_EXPORT_STORE must be filesystem or blob.",
      );
  }
}