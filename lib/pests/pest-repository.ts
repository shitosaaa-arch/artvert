import type { Prisma, PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
export const pestInclude = { entity: true, aliases: true, symptoms: true, damagePatterns: true, lifecycleStages: { orderBy: { sortOrder: "asc" as const } }, plants: true, images: { orderBy: { sortOrder: "asc" as const } }, syncState: true };
export class PestRepository {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}
  find(id: string) { return this.prisma.pest.findUnique({ where: { id }, include: pestInclude }); }
  async list(query: { page: number; pageSize: number; q?: string; classification?: string; severity?: string; economicImpact?: string; publicationState?: string; syncStatus?: string; sort: "updatedAt" | "createdAt" | "name"; direction: Prisma.SortOrder }) {
    const q = query.q?.trim(); const where: Prisma.PestWhereInput = { ...(query.classification ? { classification: query.classification as never } : {}), ...(query.severity ? { severity: query.severity as never } : {}), ...(query.economicImpact ? { economicImpact: query.economicImpact as never } : {}), ...(query.publicationState ? { entity: { publicationState: query.publicationState as never } } : {}), ...(query.syncStatus ? { syncState: { is: { status: query.syncStatus as never } } } : {}), ...(q ? { OR: [{ entity: { name: { contains: q, mode: "insensitive" } } }, { scientificName: { contains: q, mode: "insensitive" } }, { aliases: { some: { normalizedValue: { contains: q.toLowerCase() } } } }, { symptoms: { some: { normalizedValue: { contains: q.toLowerCase() } } } }, { damagePatterns: { some: { normalizedValue: { contains: q.toLowerCase() } } } }] } : {}) };
    const [items, total] = await Promise.all([this.prisma.pest.findMany({ where, include: pestInclude, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: query.sort === "name" ? { entity: { name: query.direction } } : { [query.sort]: query.direction } }), this.prisma.pest.count({ where })]); return { items, total, page: query.page, pageSize: query.pageSize, pageCount: Math.max(1, Math.ceil(total / query.pageSize)) };
  }
}
