import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  FilePenLine,
  ShoppingBag,
} from "lucide-react";
import {
  KnowledgeEntityType,
  KnowledgePublicationState,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import OrderEditForm from "./OrderEditForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderEditPage({
  params,
}: OrderEditPageProps) {
  const { id } = await params;
  const orderId = id.trim();

  if (!orderId) {
    notFound();
  }

  const [order, productEntities] = await Promise.all([
    prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        phone: true,
        alternativePhone: true,
        governorate: true,
        city: true,
        addressLine: true,
        notes: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        items: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            productSlug: true,
            productNameAr: true,
            productNameEn: true,
            packageSize: true,
            quantity: true,
          },
        },
      },
    }),

    prisma.knowledgeEntity.findMany({
      where: {
        type: KnowledgeEntityType.PRODUCT,
        publicationState: {
          not: KnowledgePublicationState.ARCHIVED,
        },
        product: {
          isNot: null,
        },
      },
      orderBy: [
        {
          name: "asc",
        },
        {
          slug: "asc",
        },
      ],
      select: {
        slug: true,
        product: {
          select: {
            nameAr: true,
            nameEn: true,
            packageSize: true,
          },
        },
      },
    }),
  ]);

  if (!order) {
    notFound();
  }

  const products = productEntities.flatMap((entity) => {
    if (!entity.product) {
      return [];
    }

    return [
      {
        slug: entity.slug,
        nameAr: entity.product.nameAr,
        nameEn: entity.product.nameEn,
        packageSize: entity.product.packageSize,
      },
    ];
  });

  return (
    <main
      className="min-h-screen bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1300px]">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-white/55 transition hover:text-lime-300"
            >
              <ArrowRight
                aria-hidden="true"
                size={17}
              />

              العودة إلى تفاصيل الطلب
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                <FilePenLine
                  aria-hidden="true"
                  size={24}
                />
              </div>

              <div>
                <span className="text-sm font-black text-lime-300">
                  إدارة الطلبات
                </span>

                <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                  تعديل الطلب
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-3xl leading-7 text-white/55">
              تعديل بيانات العميل والعنوان وحالة الطلب والدفع،
              وإضافة أو حذف المنتجات وتغيير الكميات.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.03] px-5 py-4">
            <span className="flex items-center gap-2 text-xs font-bold text-white/40">
              <ShoppingBag
                aria-hidden="true"
                size={15}
              />

              رقم الطلب
            </span>

            <strong
              className="mt-2 block text-lg font-black text-lime-300"
              dir="ltr"
            >
              {order.orderNumber}
            </strong>
          </div>
        </header>

        <OrderEditForm
          order={{
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            phone: order.phone,
            alternativePhone:
              order.alternativePhone,
            governorate: order.governorate,
            city: order.city,
            addressLine: order.addressLine,
            notes: order.notes,
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            items: order.items,
          }}
          products={products}
        />
      </div>
    </main>
  );
}
