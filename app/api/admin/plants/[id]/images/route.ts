import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { canManagePlant } from "@/lib/plants/plant-permissions";
import { getPlantImageStorage } from "@/lib/plants/plant-image-storage";

const accepted = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
const maxBytes = 5 * 1024 * 1024;

function dimensions(bytes: Uint8Array, type: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (type === "image/png" && bytes.length >= 24) return { width: view.getUint32(16), height: view.getUint32(20) };
  if (type === "image/jpeg") {
    for (let offset = 2; offset + 9 < bytes.length;) { if (bytes[offset] !== 0xff) break; const marker = bytes[offset + 1]; const length = view.getUint16(offset + 2); if (marker >= 0xc0 && marker <= 0xc3) return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) }; offset += 2 + length; }
  }
  return { width: 0, height: 0 };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions); if (!session?.user?.id || !session.user.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const plantId = (await params).id; const prisma = getPrismaClient(); const plant = await prisma.plant.findUnique({ where: { id: plantId }, include: { entity: true } });
    if (!plant || !canManagePlant(session.user.role as UserRole, session.user.id, { createdByUserId: plant.createdByUserId, publicationState: plant.entity.publicationState })) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const form = await request.formData(); const file = form.get("file"); const alt = String(form.get("alt") ?? "").trim();
    if (!(file instanceof File) || !accepted.has(file.type) || file.size === 0 || file.size > maxBytes || !alt) return NextResponse.json({ error: "Upload a JPEG, PNG, or WebP image under 5 MB with alt text." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer()); const size = dimensions(bytes, file.type);
    if (!size.width || !size.height) return NextResponse.json({ error: "The image dimensions could not be read." }, { status: 400 });
    const stored = await getPlantImageStorage().put(bytes, file.type, accepted.get(file.type)!);
    try {
      const image = await prisma.plantImage.create({ data: { plantId, storageKey: stored.storageKey, url: stored.url, alt, contentType: file.type, fileSize: file.size, width: size.width, height: size.height, checksum: createHash("sha256").update(bytes).digest("hex"), sortOrder: (await prisma.plantImage.count({ where: { plantId } })) } });
      return NextResponse.json(image, { status: 201 });
    } catch (error) { await getPlantImageStorage().delete(stored.storageKey); throw error; }
  } catch { return NextResponse.json({ error: "Image could not be uploaded" }, { status: 400 }); }
}
