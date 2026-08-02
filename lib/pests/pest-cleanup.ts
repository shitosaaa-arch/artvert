import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { getEntityImageStorage, type EntityImageStorage } from "@/lib/storage/entity-image-storage";
export class PestCleanupProcessor {
  constructor(private readonly prisma: PrismaClient = getPrismaClient(), private readonly storage: EntityImageStorage = getEntityImageStorage("pests")) {}
  async processPending(limit = 25) { const jobs = await this.prisma.storageCleanupJob.findMany({ where: { status: { in: ["PENDING", "FAILED"] } }, orderBy: { createdAt: "asc" }, take: limit }); for (const job of jobs) try { await this.storage.delete(job.storageKey); await this.prisma.storageCleanupJob.update({ where: { id: job.id }, data: { status: "COMPLETED", completedAt: new Date(), diagnosticCode: null } }); } catch { await this.prisma.storageCleanupJob.update({ where: { id: job.id }, data: { status: "FAILED", retryCount: { increment: 1 }, diagnosticCode: "STORAGE_DELETE_FAILED" } }); } return jobs.length; }
  async queue(storageKey: string) { return this.prisma.storageCleanupJob.upsert({ where: { storageKey }, create: { storageKey }, update: { status: "PENDING", diagnosticCode: null } }); }
  async queueOrphans() { const [keys, images] = await Promise.all([this.storage.listKeys(), this.prisma.pestImage.findMany({ select: { storageKey: true } })]); const known = new Set(images.map((image) => image.storageKey)); const orphans = keys.filter((key) => !known.has(key)); await Promise.all(orphans.map((key) => this.queue(key))); return orphans.length; }
}
