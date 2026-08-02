import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { canManagePlant } from "@/lib/plants/plant-permissions";
import { PlantService } from "@/lib/plants/plant-service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions); if (!session?.user?.id || !session.user.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = (await params).id; const plant = await getPrismaClient().plant.findUnique({ where: { id }, include: { entity: true } });
    if (!plant || !canManagePlant(session.user.role as UserRole, session.user.id, { createdByUserId: plant.createdByUserId, publicationState: plant.entity.publicationState })) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await new PlantService().sync(id);
    return NextResponse.json(await getPrismaClient().plantKnowledgeSync.findUnique({ where: { plantId: id } }));
  } catch { return NextResponse.json({ error: "Sync retry failed" }, { status: 502 }); }
}
