import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { createKnowledgeExportStore } from "@/lib/knowledge/export/knowledge-export-store-factory";
import { KnowledgeGenerator } from "@/lib/knowledge/knowledge-generator";
import { createPrismaKnowledgeEntityRepository } from "@/lib/knowledge/prisma/prisma-knowledge-repository";
import { PrismaKnowledgeReleaseRepository } from "@/lib/knowledge/prisma/prisma-knowledge-release-repository";
import { toPlantSlug } from "@/lib/plants/plant-slug";
import { normalizePlantAlias, validatePlantInput, type PlantInput } from "@/schemas/plant";

export class PlantService {
  constructor(private readonly prisma: PrismaClient = getPrismaClient(), private readonly generate = () => new KnowledgeGenerator(createPrismaKnowledgeEntityRepository(this.prisma), new PrismaKnowledgeReleaseRepository(this.prisma), createKnowledgeExportStore()).generate()) {}

  async create(input: PlantInput, actor: { id: string; role: UserRole }) {
    validatePlantInput(input);
    const slug = toPlantSlug(input.slug || input.name);
    if (!slug) throw new Error("Plant slug is invalid.");
    const id = randomUUID();
    const publicationState = actor.role === UserRole.AGRONOMIST ? "DRAFT" : input.publicationState ?? "DRAFT";
    const plant = await this.prisma.$transaction(async (tx) => {
      await tx.knowledgeEntity.create({ data: { id, type: "PLANT", slug, name: input.name.trim(), payload: {}, schemaVersion: 1, publicationState } });
      return tx.plant.create({ data: { id, category: input.category, scientificName: input.scientificName?.trim() || null, description: input.description?.trim() || null, createdByUserId: actor.id, aliases: { create: (input.aliases ?? []).map((alias) => ({ value: alias.value.trim(), normalizedValue: normalizePlantAlias(alias.value), locale: alias.locale?.trim() || null })) }, syncState: { create: { status: "PENDING" } } }, include: { entity: true, aliases: true, syncState: true } });
    });
    await this.sync(id);
    return plant;
  }

  async sync(plantId: string) {
    await this.prisma.plantKnowledgeSync.update({ where: { plantId }, data: { status: "PENDING", diagnosticCode: null } });
    try {
      await this.generate();
      await this.prisma.plantKnowledgeSync.update({ where: { plantId }, data: { status: "SYNCED", lastSyncedAt: new Date(), diagnosticCode: null } });
    } catch {
      await this.prisma.plantKnowledgeSync.update({ where: { plantId }, data: { status: "FAILED", diagnosticCode: "KNOWLEDGE_EXPORT_FAILED" } });
      throw new Error("Knowledge export failed.");
    }
  }
}
