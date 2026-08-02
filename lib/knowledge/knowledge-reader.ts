import type { KnowledgeExportStore } from "@/lib/knowledge/knowledge-export-store";
import { KnowledgeReadError } from "@/lib/knowledge/knowledge-errors";
import { checksum } from "@/lib/knowledge/stable-json";
import {
  knowledgeFileNames,
  type KnowledgeManifest,
  type KnowledgeReleaseSnapshot,
  type KnowledgeSnapshot,
} from "@/lib/knowledge/knowledge-types";
import { knowledgeEntityTypes, validateKnowledgeEntityEnvelope, type KnowledgeEntityEnvelope } from "@/schemas/knowledge-entity-envelope";

export class KnowledgeReader {
  constructor(private readonly store: KnowledgeExportStore) {}

  async readActiveSnapshot(): Promise<KnowledgeSnapshot> {
    const pointer = await this.store.readCurrentPointer();
    if (!pointer || pointer.formatVersion !== 1 || !pointer.releaseVersion || !pointer.manifestChecksum) {
      throw new KnowledgeReadError("Knowledge current pointer is invalid.");
    }
    return (await this.readReleaseSnapshot(pointer.releaseVersion, pointer.manifestChecksum)).snapshot;
  }

  async readActiveRelease(): Promise<KnowledgeReleaseSnapshot> {
    const pointer = await this.store.readCurrentPointer();
    if (!pointer || pointer.formatVersion !== 1 || !pointer.releaseVersion || !pointer.manifestChecksum) {
      throw new KnowledgeReadError("Knowledge current pointer is invalid.");
    }
    return this.readReleaseSnapshot(pointer.releaseVersion, pointer.manifestChecksum);
  }

  async readReleaseSnapshot(releaseVersion: string, manifestChecksum: string): Promise<KnowledgeReleaseSnapshot> {
    const manifestBytes = await this.store.readReleaseFile(releaseVersion, "manifest.json");
    if (checksum(manifestBytes) !== manifestChecksum) throw new KnowledgeReadError("Knowledge manifest checksum does not match the requested release.");
    const manifest = JSON.parse(Buffer.from(manifestBytes).toString("utf8")) as KnowledgeManifest;
    if (manifest.formatVersion !== 1 || manifest.releaseVersion !== releaseVersion) throw new KnowledgeReadError("Knowledge manifest is invalid.");

    const snapshot = Object.fromEntries(knowledgeEntityTypes.map((type) => [type, []])) as unknown as KnowledgeSnapshot;
    for (const type of knowledgeEntityTypes) {
      const fileName = knowledgeFileNames[type];
      const bytes = await this.store.readReleaseFile(releaseVersion, fileName);
      const expected = manifest.files[fileName];
      if (!expected || checksum(bytes) !== expected.checksum) throw new KnowledgeReadError(`Knowledge checksum validation failed: ${fileName}`);
      const entities = JSON.parse(Buffer.from(bytes).toString("utf8")) as KnowledgeEntityEnvelope[];
      if (!Array.isArray(entities) || entities.some((entity) => entity.type !== type)) throw new KnowledgeReadError(`Knowledge entity file is invalid: ${fileName}`);
      entities.forEach(validateKnowledgeEntityEnvelope);
      if (entities.length !== expected.entityCount) throw new KnowledgeReadError(`Knowledge entity count is invalid: ${fileName}`);
      snapshot[type] = entities;
    }
    return { releaseVersion, manifestChecksum, contentChecksum: manifest.contentChecksum, snapshot };
  }
}
