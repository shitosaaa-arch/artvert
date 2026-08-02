import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { PlantCleanupProcessor } from "@/lib/plants/plant-cleanup";
import { canManagePlant } from "@/lib/plants/plant-permissions";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  try {
    const session = await getServerSession(authOptions); if (!session?.user?.id || !session.user.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, imageId } = await params; const prisma = getPrismaClient(); const plant = await prisma.plant.findUnique({ where: { id }, include: { entity: true } });
    const image = await prisma.plantImage.findFirst({ where: { id: imageId, plantId: id } });
    if (!plant || !image || !canManagePlant(session.user.role as UserRole, session.user.id, { createdByUserId: plant.createdByUserId, publicationState: plant.entity.publicationState })) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.$transaction(async (tx) => { await tx.storageCleanupJob.upsert({ where: { storageKey: image.storageKey }, create: { storageKey: image.storageKey }, update: { status: "PENDING", diagnosticCode: null } }); await tx.plantImage.delete({ where: { id: image.id } }); });
    await new PlantCleanupProcessor().processPending();
    return new NextResponse(null, { status: 204 });
  } catch { return NextResponse.json({ error: "Image could not be deleted" }, { status: 400 }); }
}
