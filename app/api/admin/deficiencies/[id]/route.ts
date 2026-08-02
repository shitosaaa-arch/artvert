import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { DeficiencyCleanupProcessor } from "@/lib/deficiencies/deficiency-cleanup";
import {
  canHardDeleteDeficiency,
  canManageDeficiency,
  canPublishDeficiency,
  canViewDeficiencies,
} from "@/lib/deficiencies/deficiency-permissions";
import { DeficiencyRepository } from "@/lib/deficiencies/deficiency-repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function actor() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    id: session.user.id,
    role: session.user.role as UserRole,
  };
}

function valueRows(deficiencyId: string, values: string[]) {
  return values.map((value) => ({
    deficiencyId,
    value: value.trim(),
    normalizedValue: value.trim().toLowerCase(),
  }));
}

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const current = await actor();

    if (!canViewDeficiencies(current.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deficiency = await new DeficiencyRepository().find((await params).id);

    return deficiency
      ? NextResponse.json(deficiency)
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Access denied" }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const current = await actor();
    const prisma = getPrismaClient();
    const { id } = await params;
    const existing = await prisma.deficiency.findUnique({
      where: { id },
      include: { entity: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      !canManageDeficiency(current.role, current.id, {
        createdByUserId: existing.createdByUserId,
        publicationState: existing.entity.publicationState,
      })
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const publicationState = body.publicationState ?? existing.entity.publicationState;

    if (
      publicationState !== existing.entity.publicationState &&
      !canPublishDeficiency(current.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.knowledgeEntity.update({
        where: { id },
        data: {
          name: (body.nutrientNameEn ?? existing.nutrientNameEn).trim(),
          slug: body.slug ?? existing.entity.slug,
          publicationState,
        },
      });

      if (body.aliases) {
        await tx.deficiencyAlias.deleteMany({ where: { deficiencyId: id } });
        await tx.deficiencyAlias.createMany({
          data: valueRows(id, body.aliases),
        });
      }

      if (body.visualPatterns) {
        await tx.deficiencyVisualPattern.deleteMany({ where: { deficiencyId: id } });
        await tx.deficiencyVisualPattern.createMany({
          data: valueRows(id, body.visualPatterns),
        });
      }

      if (body.causes) {
        await tx.deficiencyCause.deleteMany({ where: { deficiencyId: id } });
        await tx.deficiencyCause.createMany({
          data: valueRows(id, body.causes),
        });
      }

      if (body.aggravatingConditions) {
        await tx.deficiencyAggravatingCondition.deleteMany({
          where: { deficiencyId: id },
        });
        await tx.deficiencyAggravatingCondition.createMany({
          data: valueRows(id, body.aggravatingConditions),
        });
      }

      if (body.symptoms) {
        await tx.deficiencySymptom.deleteMany({ where: { deficiencyId: id } });
        await tx.deficiencySymptom.createMany({
          data: body.symptoms.map(
            (symptom: { value: string; locations?: string[] }) => ({
              deficiencyId: id,
              value: symptom.value.trim(),
              normalizedValue: symptom.value.trim().toLowerCase(),
              locations: symptom.locations ?? [],
            }),
          ),
        });
      }

      if (body.plants) {
        await tx.plantDeficiency.deleteMany({ where: { deficiencyId: id } });
        await tx.plantDeficiency.createMany({
          data: body.plants.map((plant: object) => ({
            ...plant,
            deficiencyId: id,
          })),
        });
      }

      return tx.deficiency.update({
        where: { id },
        data: {
          nutrientCode: body.nutrientCode?.trim().toUpperCase() ?? existing.nutrientCode,
          nutrientNameAr: body.nutrientNameAr?.trim() ?? existing.nutrientNameAr,
          nutrientNameEn: body.nutrientNameEn?.trim() ?? existing.nutrientNameEn,
          scientificName: body.scientificName?.trim() || null,
          classification: body.classification ?? existing.classification,
          mobility: body.mobility ?? existing.mobility,
          description: body.description?.trim() || null,
          soilContext: body.soilContext,
          phContext: body.phContext,
          updatedByUserId: current.id,
        },
        include: {
          entity: true,
          aliases: true,
          symptoms: true,
          visualPatterns: true,
          causes: true,
          aggravatingConditions: true,
          plants: true,
          images: true,
          syncState: true,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Deficiency could not be updated" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const current = await actor();
    const prisma = getPrismaClient();
    const { id } = await params;
    const hard = new URL(request.url).searchParams.get("hard") === "true";
    const deficiency = await prisma.deficiency.findUnique({
      where: { id },
      include: {
        entity: true,
        images: { select: { storageKey: true } },
        plants: { select: { plantId: true } },
      },
    });

    if (!deficiency) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!hard) {
      if (!canPublishDeficiency(current.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await prisma.knowledgeEntity.update({
        where: { id },
        data: { publicationState: "ARCHIVED" },
      });

      return new NextResponse(null, { status: 204 });
    }

    if (!canHardDeleteDeficiency(current.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (deficiency.plants.length) {
      return NextResponse.json(
        {
          error: "Remove plant relationships before permanently deleting this deficiency.",
          impact: {
            plantRelationships: deficiency.plants.length,
            images: deficiency.images.length,
          },
        },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        deficiency.images.map((image) =>
          tx.storageCleanupJob.upsert({
            where: { storageKey: image.storageKey },
            create: { storageKey: image.storageKey },
            update: { status: "PENDING" },
          }),
        ),
      );

      await tx.deficiency.delete({ where: { id } });
      await tx.knowledgeEntity.delete({ where: { id } });
    });

    await new DeficiencyCleanupProcessor().processPending();

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Deficiency could not be deleted" },
      { status: 400 },
    );
  }
}
