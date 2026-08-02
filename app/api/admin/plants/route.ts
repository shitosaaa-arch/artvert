import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { canCreatePlant, canViewPlants } from "@/lib/plants/plant-permissions";
import { PlantService } from "@/lib/plants/plant-service";

async function actor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) throw new Error("UNAUTHORIZED");
  return { id: session.user.id, role: session.user.role as UserRole };
}
const first = (value: string | null, allowed: readonly string[]) => value && allowed.includes(value) ? value : undefined;

export async function GET(request: Request) {
  try {
    const current = await actor();
    if (!canViewPlants(current.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(params.get("pageSize") ?? "20", 10) || 20));
    const query = (params.get("q") ?? "").trim();
    const category = first(params.get("category"), ["CROP", "HOME_PLANT", "ORNAMENTAL"]);
    const publicationState = first(params.get("publicationState"), ["DRAFT", "PUBLISHED", "ARCHIVED"]);
    const syncStatus = first(params.get("syncStatus"), ["PENDING", "SYNCED", "FAILED"]);
    const sort = first(params.get("sort"), ["updatedAt", "createdAt", "name"]) ?? "updatedAt";
    const direction: Prisma.SortOrder = params.get("direction") === "asc" ? "asc" : "desc";
    const where: Prisma.PlantWhereInput = {
      ...(category ? { category: category as Prisma.EnumPlantCategoryFilter["equals"] } : {}),
      ...(publicationState ? { entity: { publicationState: publicationState as Prisma.EnumKnowledgePublicationStateFilter["equals"] } } : {}),
      ...(syncStatus ? { syncState: { is: { status: syncStatus as Prisma.EnumKnowledgeSyncStatusFilter["equals"] } } } : {}),
      ...(query ? { OR: [{ entity: { name: { contains: query, mode: "insensitive" } } }, { scientificName: { contains: query, mode: "insensitive" } }, { aliases: { some: { normalizedValue: { contains: query.toLowerCase() } } } }] } : {}),
    };
    const orderBy: Prisma.PlantOrderByWithRelationInput = sort === "name" ? { entity: { name: direction } } : { [sort]: direction };
    const prisma = getPrismaClient();
    const [items, total] = await Promise.all([prisma.plant.findMany({ where, include: { entity: true, aliases: true, images: { orderBy: { sortOrder: "asc" } }, syncState: true }, skip: (page - 1) * pageSize, take: pageSize, orderBy }), prisma.plant.count({ where })]);
    return NextResponse.json({ items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) });
  } catch { return NextResponse.json({ error: "Access denied" }, { status: 401 }); }
}

export async function POST(request: Request) {
  try {
    const current = await actor();
    if (!canCreatePlant(current.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const created = await new PlantService().create(await request.json(), current);
    return NextResponse.json(created, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Plant could not be created" }, { status: 400 }); }
}
