import { randomUUID } from "node:crypto";

import type { KnowledgeReleaseStatus, PrismaClient } from "@prisma/client";

import { getPrismaClient } from "@/lib/db/prisma";
import { KnowledgeGenerationLockedError, KnowledgeReleaseTransitionError } from "@/lib/knowledge/knowledge-errors";

const lockId = "knowledge-generator";
const lockLifetimeMs = 5 * 60 * 1000;

export type KnowledgeRelease = { id: string; version: string; generation: number; status: KnowledgeReleaseStatus; contentChecksum: string | null; manifestChecksum: string | null };
export type GenerationLease = { token: string; release: KnowledgeRelease };

function toRelease(release: { id: string; version: string; generation: number; status: KnowledgeReleaseStatus; contentChecksum: string | null; manifestChecksum: string | null }): KnowledgeRelease {
  return release;
}

export class PrismaKnowledgeReleaseRepository {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}

  async acquire(versionPrefix = "knowledge-v1"): Promise<GenerationLease> {
    const token = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + lockLifetimeMs);
    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.knowledgeGenerationLock.updateMany({
        where: { id: lockId, OR: [{ ownerToken: null }, { expiresAt: { lt: now } }] },
        data: { ownerToken: token, expiresAt },
      });
      if (locked.count !== 1) throw new KnowledgeGenerationLockedError("A knowledge generation is already running.");
      const state = await tx.knowledgeGenerationLock.update({ where: { id: lockId }, data: { latestGeneration: { increment: 1 } } });
      const release = await tx.knowledgeRelease.create({
        data: { version: `${versionPrefix}-${state.latestGeneration}`, generation: state.latestGeneration },
      });
      return { token, release: toRelease(release) };
    });
  }

  async markExported(releaseId: string, token: string, contentChecksum: string, manifestChecksum: string): Promise<void> {
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const lock = await tx.knowledgeGenerationLock.updateMany({ where: { id: lockId, ownerToken: token, expiresAt: { gt: now } }, data: { expiresAt: new Date(now.getTime() + lockLifetimeMs) } });
      if (lock.count !== 1) throw new KnowledgeReleaseTransitionError("Knowledge generation lease has expired.");
      return tx.knowledgeRelease.updateMany({ where: { id: releaseId, status: "GENERATING" }, data: { contentChecksum, manifestChecksum } });
    });
    if (result.count !== 1) throw new KnowledgeReleaseTransitionError("Knowledge release cannot be marked exported.");
  }

  async activate(releaseId: string, token: string): Promise<{ previousVersion: string | null }> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const lock = await tx.knowledgeGenerationLock.findUnique({ where: { id: lockId } });
      if (!lock || lock.ownerToken !== token || !lock.expiresAt || lock.expiresAt <= now) throw new KnowledgeReleaseTransitionError("Knowledge generation lease has expired.");
      const release = await tx.knowledgeRelease.findUnique({ where: { id: releaseId } });
      if (!release || release.status !== "GENERATING" || release.generation !== lock.latestGeneration || !release.manifestChecksum) {
        throw new KnowledgeReleaseTransitionError("Stale or invalid knowledge release activation.");
      }
      const previous = await tx.knowledgeRelease.findFirst({ where: { status: "ACTIVE" } });
      if (previous) await tx.knowledgeRelease.update({ where: { id: previous.id }, data: { status: "SUPERSEDED" } });
      await tx.knowledgeRelease.update({ where: { id: release.id }, data: { status: "ACTIVE", activatedAt: now } });
      await tx.knowledgeGenerationLock.update({ where: { id: lockId }, data: { activeReleaseId: release.id } });
      return { previousVersion: previous?.version ?? null };
    });
  }

  async activateExisting(version: string, token: string): Promise<{ previousVersion: string | null }> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const lock = await tx.knowledgeGenerationLock.findUnique({ where: { id: lockId } });
      if (!lock || lock.ownerToken !== token || !lock.expiresAt || lock.expiresAt <= now) throw new KnowledgeReleaseTransitionError("Knowledge generation lease has expired.");
      const release = await tx.knowledgeRelease.findUnique({ where: { version } });
      if (!release || !release.manifestChecksum || (release.status !== "SUPERSEDED" && release.status !== "ACTIVE")) {
        throw new KnowledgeReleaseTransitionError("Knowledge release rollback target is invalid.");
      }
      const previous = await tx.knowledgeRelease.findFirst({ where: { status: "ACTIVE" } });
      if (previous && previous.id !== release.id) await tx.knowledgeRelease.update({ where: { id: previous.id }, data: { status: "SUPERSEDED" } });
      if (release.status !== "ACTIVE") await tx.knowledgeRelease.update({ where: { id: release.id }, data: { status: "ACTIVE", activatedAt: now } });
      await tx.knowledgeGenerationLock.update({ where: { id: lockId }, data: { activeReleaseId: release.id } });
      return { previousVersion: previous?.version ?? null };
    });
  }

  async restorePrevious(releaseId: string, previousVersion: string | null, token: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const lock = await tx.knowledgeGenerationLock.findUnique({ where: { id: lockId } });
      if (!lock || lock.ownerToken !== token) return;
      const release = await tx.knowledgeRelease.findUnique({ where: { id: releaseId } });
      if (release?.status === "ACTIVE") await tx.knowledgeRelease.update({ where: { id: releaseId }, data: { status: "FAILED", failureReason: "Current pointer update failed." } });
      if (previousVersion) {
        const previous = await tx.knowledgeRelease.findUnique({ where: { version: previousVersion } });
        if (previous) {
          await tx.knowledgeRelease.update({ where: { id: previous.id }, data: { status: "ACTIVE" } });
          await tx.knowledgeGenerationLock.update({ where: { id: lockId }, data: { activeReleaseId: previous.id } });
        }
      } else {
        await tx.knowledgeGenerationLock.update({ where: { id: lockId }, data: { activeReleaseId: null } });
      }
    });
  }

  async markFailed(releaseId: string): Promise<void> {
    await this.prisma.knowledgeRelease.updateMany({ where: { id: releaseId, status: "GENERATING" }, data: { status: "FAILED", failureReason: "Knowledge export failed." } });
  }

  async release(token: string): Promise<void> {
    await this.prisma.knowledgeGenerationLock.updateMany({ where: { id: lockId, ownerToken: token }, data: { ownerToken: null, expiresAt: null } });
  }
}
