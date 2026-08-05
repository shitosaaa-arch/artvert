import type { Metadata } from "next";

import AdminSidebar from "@/components/admin/AdminSidebar";
import PlantManager from "@/components/admin/PlantManager";
import { UserRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "إدارة النباتات",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlantsPageProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
    state?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 20;

function normalizePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export default async function PlantsPage({
  searchParams,
}: PlantsPageProps) {
  await requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.AGRONOMIST,
  );

  const params = await searchParams;

  const search = (params.search ?? "").trim();
  const category = params.category ?? "ALL";
  const state = params.state ?? "ALL";
  const requestedPage = normalizePage(params.page);

  const where = {
    ...(category !== "ALL"
      ? {
          category: category as
            | "CROP"
            | "HOME_PLANT"
            | "ORNAMENTAL",
        }
      : {}),
    entity: {
      is: {
        type: "PLANT" as const,
        ...(state !== "ALL"
          ? {
              publicationState: state as
                | "DRAFT"
                | "PUBLISHED"
                | "ARCHIVED",
            }
          : {}),
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  slug: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      },
    },
    ...(search
      ? {
          OR: [
            {
              scientificName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              aliases: {
                some: {
                  value: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [
    totalPlants,
    cropCount,
    homePlantCount,
    ornamentalCount,
    publishedCount,
    draftCount,
    archivedCount,
    filteredCount,
  ] = await Promise.all([
    prisma.plant.count(),
    prisma.plant.count({
      where: {
        category: "CROP",
      },
    }),
    prisma.plant.count({
      where: {
        category: "HOME_PLANT",
      },
    }),
    prisma.plant.count({
      where: {
        category: "ORNAMENTAL",
      },
    }),
    prisma.knowledgeEntity.count({
      where: {
        type: "PLANT",
        publicationState: "PUBLISHED",
      },
    }),
    prisma.knowledgeEntity.count({
      where: {
        type: "PLANT",
        publicationState: "DRAFT",
      },
    }),
    prisma.knowledgeEntity.count({
      where: {
        type: "PLANT",
        publicationState: "ARCHIVED",
      },
    }),
    prisma.plant.count({
      where,
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCount / PAGE_SIZE),
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const plants = await prisma.plant.findMany({
    where,
    orderBy: {
      updatedAt: "desc",
    },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      category: true,
      scientificName: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      entity: {
        select: {
          slug: true,
          name: true,
          publicationState: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
        select: {
          url: true,
          alt: true,
        },
      },
      aliases: {
        orderBy: {
          value: "asc",
        },
        take: 5,
        select: {
          id: true,
          value: true,
        },
      },
      _count: {
        select: {
          diseases: true,
          pests: true,
          deficiencies: true,
          images: true,
          savedByCustomers: true,
        },
      },
    },
  });

  return (
    <div className="lg:flex">
      <AdminSidebar />

      <PlantManager
        search={search}
        category={category}
        state={state}
        currentPage={currentPage}
        totalPages={totalPages}
        filteredCount={filteredCount}
        stats={{
          totalPlants,
          cropCount,
          homePlantCount,
          ornamentalCount,
          publishedCount,
          draftCount,
          archivedCount,
        }}
        plants={plants.map((plant) => ({
          id: plant.id,
          slug: plant.entity.slug,
          name: plant.entity.name,
          publicationState:
            plant.entity.publicationState,
          category: plant.category,
          scientificName: plant.scientificName,
          description: plant.description,
          imageUrl:
            plant.images[0]?.url ?? null,
          imageAlt:
            plant.images[0]?.alt ?? null,
          aliases: plant.aliases,
          diseaseCount:
            plant._count.diseases,
          pestCount: plant._count.pests,
          deficiencyCount:
            plant._count.deficiencies,
          imageCount: plant._count.images,
          savedCount:
            plant._count.savedByCustomers,
          createdAt:
            plant.createdAt.toISOString(),
          updatedAt:
            plant.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
