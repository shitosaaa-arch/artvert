import dotenv from "dotenv";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { getPrismaClient } from "../lib/db/prisma";
import { FilesystemKnowledgeExportStore } from "../lib/knowledge/export/filesystem-knowledge-export-store";
import type { KnowledgeExportStore } from "../lib/knowledge/knowledge-export-store";
import { KnowledgeGenerator } from "../lib/knowledge/knowledge-generator";
import { KnowledgeReader } from "../lib/knowledge/knowledge-reader";
import { createPrismaKnowledgeEntityRepository } from "../lib/knowledge/prisma/prisma-knowledge-repository";
import { PrismaKnowledgeReleaseRepository } from "../lib/knowledge/prisma/prisma-knowledge-release-repository";
import type { KnowledgeReleaseArtifacts } from "../lib/knowledge/knowledge-types";

dotenv.config({ path: ".env.local" });

const prefix = `sprint4-test-${randomUUID().slice(0, 8)}`;
const root = path.join(os.tmpdir(), prefix);
const ids = [`${prefix}-plant`, `${prefix}-disease`];

class FailingStore implements KnowledgeExportStore {
  constructor(private readonly delegate: KnowledgeExportStore) {}
  writeRelease(_artifacts: KnowledgeReleaseArtifacts): Promise<void> { return Promise.reject(new Error("Intentional export failure.")); }
  readReleaseFile(version: string, fileName: string) { return this.delegate.readReleaseFile(version, fileName); }
  writeCurrentPointer(pointer: Parameters<KnowledgeExportStore["writeCurrentPointer"]>[0]) { return this.delegate.writeCurrentPointer(pointer); }
  readCurrentPointer() { return this.delegate.readCurrentPointer(); }
  removeCurrentPointer() { return this.delegate.removeCurrentPointer(); }
}

async function rejects(action: () => Promise<unknown>) {
  await assert.rejects(action);
}

async function main() {
  const prisma = getPrismaClient();
  const entities = createPrismaKnowledgeEntityRepository(prisma);
  const releases = new PrismaKnowledgeReleaseRepository(prisma);
  const store = new FilesystemKnowledgeExportStore(root);
  const generator = new KnowledgeGenerator(entities, releases, store, prefix);
  const originalActive = await prisma.knowledgeRelease.findFirst({ where: { status: "ACTIVE" }, select: { version: true } });

  try {
    await rejects(() => entities.create({ id: `${prefix}-invalid`, type: "PLANT", slug: "Invalid Slug", name: "Invalid", payload: {}, schemaVersion: 1, publicationState: "PUBLISHED" }));
    await entities.create({ id: ids[0], type: "PLANT", slug: `${prefix}-plant`, name: "Verification Plant", payload: { z: 2, a: 1 }, schemaVersion: 1, publicationState: "PUBLISHED" });
    await entities.create({ id: ids[1], type: "DISEASE", slug: `${prefix}-disease`, name: "Verification Disease", payload: { symptoms: ["spot"] }, schemaVersion: 1, publicationState: "PUBLISHED" });

    const first = await generator.generate();
    const firstPointer = await store.readCurrentPointer();
    assert.equal(firstPointer?.releaseVersion, first.version);
    assert.equal((await new KnowledgeReader(store).readActiveSnapshot()).PLANT.length, 1);

    const second = await generator.generate();
    assert.equal(first.contentChecksum, second.contentChecksum, "Repeated exports must be deterministic.");
    const secondPointer = await store.readCurrentPointer();
    assert.equal(secondPointer?.releaseVersion, second.version, "Filesystem current pointer must update atomically to the completed release.");

    const plantFile = path.join(root, "releases", second.version, "plants.json");
    const originalPlant = await fs.readFile(plantFile);
    await fs.writeFile(plantFile, "[]\n", "utf8");
    await rejects(() => new KnowledgeReader(store).readActiveSnapshot());
    await fs.writeFile(plantFile, originalPlant);
    await fs.rm(plantFile);
    await rejects(() => new KnowledgeReader(store).readActiveSnapshot());
    await fs.writeFile(plantFile, originalPlant);

    await fs.writeFile(path.join(root, "current.json"), "{\"formatVersion\":1}\n", "utf8");
    await rejects(() => new KnowledgeReader(store).readActiveSnapshot());
    await store.writeCurrentPointer(secondPointer!);
    await store.writeCurrentPointer({ formatVersion: 1, releaseVersion: "missing-release", manifestChecksum: "missing" });
    await rejects(() => new KnowledgeReader(store).readActiveSnapshot());
    await store.writeCurrentPointer(secondPointer!);

    await rejects(() => new KnowledgeGenerator(entities, releases, new FailingStore(store), prefix).generate());
    assert.equal((await store.readCurrentPointer())?.releaseVersion, second.version, "Failed export must not replace the current release.");

    const locked = await releases.acquire(`${prefix}-lock`);
    await rejects(() => generator.generate());
    await releases.markFailed(locked.release.id);
    await releases.release(locked.token);

    const stale = await releases.acquire(`${prefix}-stale`);
    await prisma.knowledgeGenerationLock.update({ where: { id: "knowledge-generator" }, data: { latestGeneration: { increment: 1 } } });
    await rejects(() => releases.activate(stale.release.id, stale.token));
    await releases.markFailed(stale.release.id);
    await releases.release(stale.token);

    await generator.rollback(first.version);
    assert.equal((await store.readCurrentPointer())?.releaseVersion, first.version, "Rollback must restore a prior immutable release.");

    const readerSource = await fs.readFile(path.join(process.cwd(), "lib", "knowledge", "knowledge-reader.ts"), "utf8");
    assert.ok(!/prisma|repository|admin|middleware/i.test(readerSource), "KnowledgeReader must remain isolated from persistence and UI layers.");
    console.log("knowledge-foundation-tests:ok");
  } finally {
    if (originalActive) {
      const restorationLease = await releases.acquire(`${prefix}-restore`);
      try {
        await releases.markFailed(restorationLease.release.id);
        await releases.activateExisting(originalActive.version, restorationLease.token);
      } finally {
        await releases.release(restorationLease.token);
      }
    }
    await prisma.$transaction(async (tx) => {
      const lock = await tx.knowledgeGenerationLock.findUnique({ where: { id: "knowledge-generator" } });
      if (lock?.activeReleaseId) {
        const active = await tx.knowledgeRelease.findUnique({ where: { id: lock.activeReleaseId } });
        if (active?.version.startsWith(prefix)) await tx.knowledgeGenerationLock.update({ where: { id: "knowledge-generator" }, data: { activeReleaseId: null } });
      }
      await tx.knowledgeGenerationLock.update({ where: { id: "knowledge-generator" }, data: { ownerToken: null, expiresAt: null } });
      await tx.knowledgeRelease.deleteMany({ where: { version: { startsWith: prefix } } });
      await tx.knowledgeEntity.deleteMany({ where: { id: { in: ids } } });
    });
    await fs.rm(root, { recursive: true, force: true });
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error("Knowledge foundation tests failed.");
  process.exitCode = 1;
});
