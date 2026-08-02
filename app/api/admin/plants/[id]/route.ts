import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { canHardDeletePlant, canManagePlant, canPublishPlant, canViewPlants } from "@/lib/plants/plant-permissions";
import { PlantCleanupProcessor } from "@/lib/plants/plant-cleanup";
import { normalizePlantAlias, plantCategories, validatePlantInput } from "@/schemas/plant";
import { toPlantSlug } from "@/lib/plants/plant-slug";

async function actor() { const session = await getServerSession(authOptions); if (!session?.user?.id || !session.user.role) throw new Error("UNAUTHORIZED"); return { id: session.user.id, role: session.user.role as UserRole }; }
const include = { entity: true, aliases: true, images: { orderBy: { sortOrder: "asc" as const } }, syncState: true };

export async function GET(_: Request, { params }: RouteContext<"/api/admin/plants/[id]">) {
  try {
    const current = await actor();
    if (!canViewPlants(current.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const plant = await getPrismaClient().plant.findUnique({ where: { id: (await params).id }, include });
    return plant ? NextResponse.json(plant) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch { return NextResponse.json({ error: "Access denied" }, { status: 401 }); }
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/plants/[id]">) {
  try {
    const current = await actor(); const prisma = getPrismaClient(); const id = (await params).id;
    const existing = await prisma.plant.findUnique({ where: { id }, include: { entity: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canManagePlant(current.role, current.id, { createdByUserId: existing.createdByUserId, publicationState: existing.entity.publicationState })) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();
    const publicationState = body.publicationState ?? existing.entity.publicationState;
    if (publicationState !== existing.entity.publicationState && !canPublishPlant(current.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const input = { name: body.name ?? existing.entity.name, slug: body.slug ?? existing.entity.slug, category: body.category ?? existing.category, scientificName: body.scientificName ?? existing.scientificName ?? undefined, description: body.description ?? existing.description ?? undefined, aliases: body.aliases, publicationState };
    validatePlantInput({ ...input, aliases: input.aliases ?? [] });
    if (!plantCategories.includes(input.category)) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    const slug = toPlantSlug(input.slug || input.name);
    if (!slug) return NextResponse.json({ error: "Plant slug is invalid" }, { status: 400 });
    const updated = await prisma.$transaction(async (tx) => {
      await tx.knowledgeEntity.update({ where: { id }, data: { name: input.name.trim(), slug, publicationState } });
      if (input.aliases) await tx.plantAlias.deleteMany({ where: { plantId: id } });
      return tx.plant.update({ where: { id }, data: { category: input.category, scientificName: input.scientificName?.trim() || null, description: input.description?.trim() || null, updatedByUserId: current.id, ...(input.aliases ? { aliases: { create: input.aliases.map((alias: { value: string; locale?: string }) => ({ value: alias.value.trim(), normalizedValue: normalizePlantAlias(alias.value), locale: alias.locale?.trim() || null })) } } : {}) }, include });
    });
    return NextResponse.json(updated);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Plant could not be updated" }, { status: 400 }); }
}

export async function DELETE(request: Request, { params }: RouteContext<"/api/admin/plants/[id]">) {
  try {
    const current = await actor(); const prisma = getPrismaClient(); const id = (await params).id; const hard = new URL(request.url).searchParams.get("hard") === "true";
    const plant = await prisma.plant.findUnique({ where: { id }, include: { entity: true, images: { select: { storageKey: true } } } });
    if (!plant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (hard) {
      if (!canHardDeletePlant(current.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      await prisma.$transaction(async (tx) => { await Promise.all(plant.images.map((image) => tx.storageCleanupJob.upsert({ where: { storageKey: image.storageKey }, create: { storageKey: image.storageKey }, update: { status: "PENDING", diagnosticCode: null } }))); await tx.plant.delete({ where: { id } }); await tx.knowledgeEntity.delete({ where: { id } }); });
      await new PlantCleanupProcessor().processPending();
    } else {
      if (!canPublishPlant(current.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      await prisma.knowledgeEntity.update({ where: { id }, data: { publicationState: "ARCHIVED" } });
    }
    return new NextResponse(null, { status: 204 });
  } catch { return NextResponse.json({ error: "Plant could not be deleted" }, { status: 400 }); }
}
