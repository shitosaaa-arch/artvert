import type { KnowledgeExportStore } from "@/lib/knowledge/knowledge-export-store";
import { KnowledgeExportError } from "@/lib/knowledge/knowledge-errors";
import type { KnowledgeEntityRepository } from "@/lib/knowledge/knowledge-repository";
import { PrismaKnowledgeReleaseRepository } from "@/lib/knowledge/prisma/prisma-knowledge-release-repository";
import { checksum, stableJsonBytes } from "@/lib/knowledge/stable-json";
import { knowledgeFileNames, type KnowledgeCurrentPointer, type KnowledgeManifest, type KnowledgeReleaseArtifacts, type KnowledgeSnapshot } from "@/lib/knowledge/knowledge-types";
import { knowledgeEntityTypes, validateKnowledgeEntityEnvelope, type KnowledgeEntityEnvelope } from "@/schemas/knowledge-entity-envelope";

function snapshotEntities(entities: KnowledgeEntityEnvelope[]): KnowledgeSnapshot {
  const snapshot = Object.fromEntries(knowledgeEntityTypes.map((type) => [type, []])) as unknown as KnowledgeSnapshot;
  for (const entity of entities) {
    validateKnowledgeEntityEnvelope(entity);
    snapshot[entity.type].push(entity);
  }
  for (const type of knowledgeEntityTypes) snapshot[type].sort((left, right) => left.slug.localeCompare(right.slug) || left.id.localeCompare(right.id));
  return snapshot;
}

function artifactsFor(version: string, snapshot: KnowledgeSnapshot): KnowledgeReleaseArtifacts {
  const files = Object.fromEntries(knowledgeEntityTypes.map((type) => [knowledgeFileNames[type], stableJsonBytes(snapshot[type])])) as KnowledgeReleaseArtifacts["files"];
  const fileEntries = Object.entries(files).map(([fileName, bytes]) => ({ fileName, checksum: checksum(bytes), entityCount: JSON.parse(Buffer.from(bytes).toString("utf8")).length }));
  const contentChecksum = checksum(Buffer.from(fileEntries.map((entry) => `${entry.fileName}:${entry.checksum}`).sort().join("\n"), "utf8"));
  const manifest: KnowledgeManifest = {
    formatVersion: 1,
    releaseVersion: version,
    contentChecksum,
    files: Object.fromEntries(fileEntries.map((entry) => [entry.fileName, { checksum: entry.checksum, entityCount: entry.entityCount }])) as KnowledgeManifest["files"],
  };
  return { version, manifest, manifestBytes: stableJsonBytes(manifest), files };
}

export class KnowledgeGenerator {
  constructor(
    private readonly entities: KnowledgeEntityRepository,
    private readonly releases: PrismaKnowledgeReleaseRepository,
    private readonly store: KnowledgeExportStore,
    private readonly versionPrefix = "knowledge-v1",
  ) {}

  async generate(): Promise<{ version: string; contentChecksum: string }> {
    const lease = await this.releases.acquire(this.versionPrefix);
    try {
      // This short repeatable-read transaction completes before any filesystem or Blob export begins.
      const snapshot = snapshotEntities(await this.entities.materializePublishedSnapshot());
      const artifacts = artifactsFor(lease.release.version, snapshot);
      await this.store.writeRelease(artifacts);
      await this.releases.markExported(lease.release.id, lease.token, artifacts.manifest.contentChecksum, checksum(artifacts.manifestBytes));
      const activation = await this.releases.activate(lease.release.id, lease.token);
      const pointer: KnowledgeCurrentPointer = { formatVersion: 1, releaseVersion: artifacts.version, manifestChecksum: checksum(artifacts.manifestBytes) };
      try {
        await this.store.writeCurrentPointer(pointer);
      } catch (error) {
        await this.releases.restorePrevious(lease.release.id, activation.previousVersion, lease.token);
        throw new KnowledgeExportError("Knowledge release activation could not update the current pointer.");
      }
      return { version: artifacts.version, contentChecksum: artifacts.manifest.contentChecksum };
    } catch (error) {
      await this.releases.markFailed(lease.release.id);
      throw error;
    } finally {
      await this.releases.release(lease.token);
    }
  }

  async rollback(version: string): Promise<void> {
    const lease = await this.releases.acquire(`${this.versionPrefix}-rollback`);
    try {
      await this.releases.markFailed(lease.release.id);
      await this.releases.activateExisting(version, lease.token);
      const manifestBytes = await this.store.readReleaseFile(version, "manifest.json");
      await this.store.writeCurrentPointer({ formatVersion: 1, releaseVersion: version, manifestChecksum: checksum(manifestBytes) });
    } finally {
      await this.releases.release(lease.token);
    }
  }
}
