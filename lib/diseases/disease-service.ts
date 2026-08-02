import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { UserRole } from "@/lib/auth/roles";
import { toPlantSlug } from "@/lib/plants/plant-slug";
import { createKnowledgeExportStore } from "@/lib/knowledge/export/knowledge-export-store-factory";
import { KnowledgeGenerator } from "@/lib/knowledge/knowledge-generator";
import { createPrismaKnowledgeEntityRepository } from "@/lib/knowledge/prisma/prisma-knowledge-repository";
import { PrismaKnowledgeReleaseRepository } from "@/lib/knowledge/prisma/prisma-knowledge-release-repository";
import { normalizeDiseaseValue, validateDiseaseInput, type DiseaseInput } from "@/schemas/disease";

export class DiseaseService {
  constructor(private readonly prisma: PrismaClient = getPrismaClient(), private readonly generate = () => new KnowledgeGenerator(createPrismaKnowledgeEntityRepository(this.prisma), new PrismaKnowledgeReleaseRepository(this.prisma), createKnowledgeExportStore()).generate()) {}
  async create(input: DiseaseInput, actor: { id: string; role: UserRole }) {
    validateDiseaseInput(input); const id = randomUUID(), slug = toPlantSlug(input.slug || input.name);
    if (!slug) throw new Error("Disease slug is invalid.");
    const publicationState = actor.role === UserRole.AGRONOMIST ? "DRAFT" : input.publicationState ?? "DRAFT";
    const disease = await this.prisma.$transaction(async (tx) => { await tx.knowledgeEntity.create({ data: { id, type: "DISEASE", slug, name: input.name.trim(), payload: {}, schemaVersion: 1, publicationState } }); return tx.disease.create({ data: { id, classification: input.classification, severity: input.severity, scientificName: input.scientificName?.trim() || null, pathogenGenus: input.pathogenGenus?.trim() || null, pathogenSpecies: input.pathogenSpecies?.trim() || null, lifecycle: input.lifecycle?.trim() || null, createdByUserId: actor.id, aliases: { create: (input.aliases ?? []).map((value) => ({ value, normalizedValue: normalizeDiseaseValue(value) })) }, symptoms: { create: (input.symptoms ?? []).map((value) => ({ value, normalizedValue: normalizeDiseaseValue(value) })) }, causes: { create: (input.causes ?? []).map((value) => ({ value, normalizedValue: normalizeDiseaseValue(value) })) }, plantParts: { create: (input.plantParts ?? []).map((value) => ({ value, normalizedValue: normalizeDiseaseValue(value) })) }, riskFactors: { create: (input.riskFactors ?? []).map((value) => ({ value, normalizedValue: normalizeDiseaseValue(value) })) }, plants: { create: input.plants ?? [] }, syncState: { create: { status: "PENDING" } } }, include: { entity: true, syncState: true } }); });
    await this.sync(id); return disease;
  }
  async sync(diseaseId: string) { await this.prisma.diseaseKnowledgeSync.update({ where: { diseaseId }, data: { status: "PENDING", diagnosticCode: null } }); try { await this.generate(); await this.prisma.diseaseKnowledgeSync.update({ where: { diseaseId }, data: { status: "SYNCED", lastSyncedAt: new Date(), diagnosticCode: null } }); } catch { await this.prisma.diseaseKnowledgeSync.update({ where: { diseaseId }, data: { status: "FAILED", diagnosticCode: "KNOWLEDGE_EXPORT_FAILED" } }); throw new Error("Knowledge export failed."); } }
}
