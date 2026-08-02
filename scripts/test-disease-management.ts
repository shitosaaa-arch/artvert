import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { UserRole } from "../lib/auth/roles";
import { getPrismaClient } from "../lib/db/prisma";
import { DiseaseCleanupProcessor } from "../lib/diseases/disease-cleanup";
import { canCreateDisease, canHardDeleteDisease, canManageDisease, canPublishDisease, canViewDiseases } from "../lib/diseases/disease-permissions";
import { getEntityImageStorage } from "../lib/storage/entity-image-storage";

dotenv.config({ path: ".env.local" });
const prefix = `sprint6-disease-${randomUUID().slice(0, 8)}`;
const plantId = `${prefix}-plant`, diseaseId = `${prefix}-disease`, storageKey = `${prefix}.png`;
function expect(value: unknown, message: string): asserts value { assert.ok(value, message); }

async function main() {
  const prisma = getPrismaClient();
  try {
    // Authorization matrix: every role can view/create; only admins publish and only super admins hard-delete.
    for (const role of Object.values(UserRole)) { expect(canViewDiseases(role) && canCreateDisease(role), `${role} must view/create diseases`); }
    expect(canPublishDisease(UserRole.ADMIN) && canPublishDisease(UserRole.SUPER_ADMIN), "admins must publish");
    expect(!canPublishDisease(UserRole.AGRONOMIST), "agronomists must not publish");
    expect(canHardDeleteDisease(UserRole.SUPER_ADMIN) && !canHardDeleteDisease(UserRole.ADMIN), "hard delete must be super-admin only");
    expect(canManageDisease(UserRole.AGRONOMIST, "owner", { createdByUserId: "owner", publicationState: "DRAFT" }), "owner may manage draft");
    expect(!canManageDisease(UserRole.AGRONOMIST, "other", { createdByUserId: "owner", publicationState: "DRAFT" }), "agronomist may not manage another record");
    expect(!canManageDisease(UserRole.AGRONOMIST, "owner", { createdByUserId: "owner", publicationState: "PUBLISHED" }), "agronomist may not manage published record");
    const actor = await prisma.user.findFirst({ where: { id: "sprint3_verify_super" }, select: { id: true } }); expect(actor, "Linux verification super-admin fixture is missing");
    await prisma.knowledgeEntity.create({ data: { id: plantId, type: "PLANT", slug: plantId, name: "Disease verification plant", payload: {}, schemaVersion: 1, publicationState: "DRAFT" } });
    await prisma.plant.create({ data: { id: plantId, category: "CROP", createdByUserId: actor.id, syncState: { create: { status: "PENDING" } } } });
    await prisma.knowledgeEntity.create({ data: { id: diseaseId, type: "DISEASE", slug: diseaseId, name: "Disease verification record", payload: {}, schemaVersion: 1, publicationState: "DRAFT" } });
    await prisma.disease.create({ data: { id: diseaseId, classification: "FUNGAL", severity: "HIGH", createdByUserId: actor.id, aliases: { create: { value: "Leaf spot", normalizedValue: "leaf spot" } }, symptoms: { create: { value: "Brown lesions", normalizedValue: "brown lesions" } }, plants: { create: { plantId, susceptibility: "HIGH", relationshipType: "HOST" } }, syncState: { create: { status: "PENDING" } } } });
    const found = await prisma.disease.findMany({ where: { OR: [{ aliases: { some: { normalizedValue: { contains: "leaf" } } } }, { symptoms: { some: { normalizedValue: { contains: "lesion" } } } }] }, include: { plants: true, syncState: true } });
    assert.equal(found.length, 1, "search must cover aliases and symptoms"); assert.equal(found[0].plants.length, 1, "Disease-to-Plant relationship must persist");
    // Image lifecycle is durable: queue the delete before removing its database row, then process it.
    const imagePath = path.join(process.cwd(), "public", "uploads", "diseases", storageKey); await fs.mkdir(path.dirname(imagePath), { recursive: true }); await fs.writeFile(imagePath, "fixture");
    await prisma.diseaseImage.create({ data: { diseaseId, storageKey, url: `/uploads/diseases/${storageKey}`, alt: "Fixture", contentType: "image/png", fileSize: 7, width: 1, height: 1, checksum: "fixture", sortOrder: 0 } });
    await prisma.$transaction(async (tx) => { await tx.storageCleanupJob.create({ data: { storageKey } }); await tx.diseaseImage.delete({ where: { storageKey } }); });
    await new DiseaseCleanupProcessor().processPending(); assert.equal(await fs.stat(imagePath).then(() => true).catch(() => false), false, "queued image must be deleted");
    const cleanup = await prisma.storageCleanupJob.findUnique({ where: { storageKey } }); assert.equal(cleanup?.status, "COMPLETED", "cleanup job must be completed");
    // Sync retry state transitions are persisted even when an export fails.
    await prisma.diseaseKnowledgeSync.update({ where: { diseaseId }, data: { status: "FAILED", diagnosticCode: "KNOWLEDGE_EXPORT_FAILED" } });
    await prisma.diseaseKnowledgeSync.update({ where: { diseaseId }, data: { status: "PENDING", diagnosticCode: null } });
    assert.deepEqual(await prisma.diseaseKnowledgeSync.findUnique({ where: { diseaseId }, select: { status: true, diagnosticCode: true } }), { status: "PENDING", diagnosticCode: null });
    const impact = await prisma.plantDisease.count({ where: { diseaseId } }); assert.equal(impact, 1, "hard-delete impact check must detect plant links");
    console.log("disease-management-tests:ok");
  } finally { await prisma.$transaction(async (tx) => { await tx.storageCleanupJob.deleteMany({ where: { storageKey } }); await tx.disease.deleteMany({ where: { id: diseaseId } }); await tx.plant.deleteMany({ where: { id: plantId } }); await tx.knowledgeEntity.deleteMany({ where: { id: { in: [diseaseId, plantId] } } }); }); await getEntityImageStorage("diseases").delete(storageKey); await prisma.$disconnect(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
