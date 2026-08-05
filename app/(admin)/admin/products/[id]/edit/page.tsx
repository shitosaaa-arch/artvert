import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  FilePenLine,
  Package,
} from "lucide-react";

import DeleteProductButton from "@/components/admin/DeleteProductButton";
import { prisma } from "@/lib/prisma";

import ProductEditForm from "./ProductEditForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PublicationState =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

function readJsonStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0,
  );
}

function normalizePublicationState(
  value: string,
): PublicationState {
  if (
    value === "DRAFT" ||
    value === "PUBLISHED" ||
    value === "ARCHIVED"
  ) {
    return value;
  }

  return "DRAFT";
}

export default async function ProductEditPage({
  params,
}: ProductEditPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      category: true,
      nameAr: true,
      nameEn: true,
      shortDescription: true,
      description: true,
      composition: true,
      dosage: true,
      packageSize: true,
      price: true,
      comparePrice: true,
      benefits: true,
      crops: true,

      entity: {
        select: {
          slug: true,
          publicationState: true,
        },
      },

      aliases: {
        orderBy: {
          value: "asc",
        },
        select: {
          value: true,
        },
      },

      images: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          url: true,
          alt: true,
          sortOrder: true,
          isPrimary: true,
          objectFit: true,
          objectPosition: true,
          zoom: true,
          cropX: true,
          cropY: true,
          rotation: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const benefits = readJsonStringArray(
    product.benefits,
  );

  const crops = readJsonStringArray(
    product.crops,
  );

  const initialProduct = {
    id: product.id,
    slug: product.entity.slug,
    category: product.category,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    shortDescription:
      product.shortDescription,
    description: product.description,
    composition: product.composition,
    dosage: product.dosage,
    packageSize: product.packageSize,
    price: String(product.price),
    comparePrice:
      product.comparePrice == null
        ? null
        : String(product.comparePrice),
    publicationState:
      normalizePublicationState(
        product.entity.publicationState,
      ),
    aliases: product.aliases.map(
      (alias) => alias.value,
    ),
    benefits,
    crops,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
      objectFit: image.objectFit,
      objectPosition: image.objectPosition,
      zoom: image.zoom,
      cropX: image.cropX,
      cropY: image.cropY,
      rotation: image.rotation,
    })),
  };

  return (
    <main
      className="min-h-screen bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href={`/admin/products/${product.id}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-white/55 transition hover:text-lime-300"
            >
              <ArrowRight
                aria-hidden="true"
                size={17}
              />

              العودة إلى تفاصيل المنتج
            </Link>

            <span className="mt-5 block text-sm font-black text-lime-300">
              إدارة المنتجات
            </span>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              تعديل {product.nameAr}
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-white/55">
              عدّل بيانات المنتج والسعر والصور
              والفوائد والمحاصيل وحالة النشر،
              وسيتم حفظ كل التغييرات داخل
              PostgreSQL.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-2xl border border-lime-300/15 bg-lime-300/[.05] px-5 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <FilePenLine
                  aria-hidden="true"
                  size={20}
                />
              </div>

              <div>
                <span className="block text-xs text-white/40">
                  المنتج
                </span>

                <strong className="mt-1 block">
                  {product.nameAr}
                </strong>
              </div>
            </div>

            <DeleteProductButton
              productId={product.id}
              productName={product.nameAr}
              redirectTo="/admin/products"
            />
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-4">
          <div className="flex items-start gap-3">
            <Package
              aria-hidden="true"
              size={19}
              className="mt-1 shrink-0 text-lime-300"
            />

            <p className="text-sm leading-7 text-white/50">
              النموذج يعرض القيم الحالية من Prisma.
              عند الحفظ سيتم تحديث المنتج وبيانات
              KnowledgeEntity والصور والأسماء البديلة،
              وإعادة حالة مزامنة Doctor إلى PENDING.
            </p>
          </div>
        </section>

        <div className="mt-8">
          <ProductEditForm
            product={initialProduct}
          />
        </div>
      </div>
    </main>
  );
}
