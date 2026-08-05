import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  KnowledgeEntityType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const PAYMENT_METHODS = [
  "CASH_ON_DELIVERY",
  "VODAFONE_CASH",
  "INSTAPAY",
  "BANK_TRANSFER",
  "ONLINE_PAYMENT",
  "OTHER",
] as const;

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;

const MAX_ORDER_ITEMS = 100;
const MAX_QUANTITY_PER_ITEM = 100;

type OrderStatus = (typeof ORDER_STATUSES)[number];
type PaymentMethod = (typeof PAYMENT_METHODS)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UnknownRecord = Record<string, unknown>;

type UpdateOrderItem = {
  id: string | null;
  productSlug: string;
  quantity: number;
};

type UpdateOrderPayload = {
  customerName: string;
  phone: string;
  alternativePhone: string | null;
  governorate: string;
  city: string;
  addressLine: string;
  notes: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: UpdateOrderItem[];
};

class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function cleanRequiredString(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  if (typeof value !== "string") {
    throw new OrderValidationError(
      `حقل ${fieldName} مطلوب.`,
    );
  }

  const cleanedValue = value.trim();

  if (!cleanedValue) {
    throw new OrderValidationError(
      `حقل ${fieldName} مطلوب.`,
    );
  }

  if (cleanedValue.length > maxLength) {
    throw new OrderValidationError(
      `حقل ${fieldName} أطول من الحد المسموح.`,
    );
  }

  return cleanedValue;
}

function cleanOptionalString(
  value: unknown,
  maxLength: number,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    throw new OrderValidationError(
      "إحدى البيانات الاختيارية غير صحيحة.",
    );
  }

  const cleanedValue = value.trim();

  if (!cleanedValue) {
    return null;
  }

  if (cleanedValue.length > maxLength) {
    throw new OrderValidationError(
      "إحدى البيانات الاختيارية أطول من الحد المسموح.",
    );
  }

  return cleanedValue;
}

function normalizeEgyptianPhone(
  value: unknown,
  fieldName: string,
  required: boolean,
) {
  if (
    !required &&
    (value === undefined ||
      value === null ||
      value === "")
  ) {
    return null;
  }

  const rawPhone = cleanRequiredString(
    value,
    fieldName,
    20,
  ).replace(/[^\d+]/g, "");

  const match = rawPhone.match(
    /^(?:\+?20|0)?(1[0125]\d{8})$/,
  );

  if (!match) {
    throw new OrderValidationError(
      `رقم ${fieldName} غير صحيح.`,
    );
  }

  return `+20${match[1]}`;
}

function isOrderStatus(
  value: unknown,
): value is OrderStatus {
  return (
    typeof value === "string" &&
    ORDER_STATUSES.includes(value as OrderStatus)
  );
}

function isPaymentMethod(
  value: unknown,
): value is PaymentMethod {
  return (
    typeof value === "string" &&
    PAYMENT_METHODS.includes(value as PaymentMethod)
  );
}

function isPaymentStatus(
  value: unknown,
): value is PaymentStatus {
  return (
    typeof value === "string" &&
    PAYMENT_STATUSES.includes(value as PaymentStatus)
  );
}

function validateItems(value: unknown): UpdateOrderItem[] {
  if (!Array.isArray(value)) {
    throw new OrderValidationError(
      "قائمة منتجات الطلب غير صحيحة.",
    );
  }

  if (value.length === 0) {
    throw new OrderValidationError(
      "لا يمكن حفظ طلب بدون منتجات.",
    );
  }

  if (value.length > MAX_ORDER_ITEMS) {
    throw new OrderValidationError(
      "عدد المنتجات في الطلب أكبر من الحد المسموح.",
    );
  }

  const items = value.map(
    (item, index): UpdateOrderItem => {
      if (!isRecord(item)) {
        throw new OrderValidationError(
          `بيانات المنتج رقم ${index + 1} غير صحيحة.`,
        );
      }

      const id =
        item.id === undefined ||
        item.id === null ||
        item.id === ""
          ? null
          : cleanRequiredString(
              item.id,
              `معرّف عنصر الطلب رقم ${index + 1}`,
              100,
            );

      const productSlug = cleanRequiredString(
        item.productSlug,
        `رابط المنتج رقم ${index + 1}`,
        160,
      );

      const quantity = item.quantity;

      if (
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_QUANTITY_PER_ITEM
      ) {
        throw new OrderValidationError(
          `كمية المنتج رقم ${index + 1} غير صحيحة.`,
        );
      }

      return {
        id,
        productSlug,
        quantity,
      };
    },
  );

  const uniqueSlugs = new Set(
    items.map((item) => item.productSlug),
  );

  if (uniqueSlugs.size !== items.length) {
    throw new OrderValidationError(
      "لا يمكن إضافة نفس المنتج أكثر من مرة داخل الطلب.",
    );
  }

  const existingIds = items
    .map((item) => item.id)
    .filter((id): id is string => Boolean(id));

  if (new Set(existingIds).size !== existingIds.length) {
    throw new OrderValidationError(
      "يوجد عنصر طلب مكرر داخل بيانات التعديل.",
    );
  }

  return items;
}

function validatePayload(
  value: unknown,
): UpdateOrderPayload {
  if (!isRecord(value)) {
    throw new OrderValidationError(
      "بيانات تعديل الطلب غير صحيحة.",
    );
  }

  if (!isOrderStatus(value.status)) {
    throw new OrderValidationError(
      "حالة الطلب غير مدعومة.",
    );
  }

  if (!isPaymentMethod(value.paymentMethod)) {
    throw new OrderValidationError(
      "طريقة الدفع غير مدعومة.",
    );
  }

  if (!isPaymentStatus(value.paymentStatus)) {
    throw new OrderValidationError(
      "حالة الدفع غير مدعومة.",
    );
  }

  const phone = normalizeEgyptianPhone(
    value.phone,
    "الهاتف",
    true,
  );

  if (!phone) {
    throw new OrderValidationError(
      "رقم الهاتف مطلوب.",
    );
  }

  return {
    customerName: cleanRequiredString(
      value.customerName,
      "اسم العميل",
      120,
    ),
    phone,
    alternativePhone: normalizeEgyptianPhone(
      value.alternativePhone,
      "الهاتف البديل",
      false,
    ),
    governorate: cleanRequiredString(
      value.governorate,
      "المحافظة",
      100,
    ),
    city: cleanRequiredString(
      value.city,
      "المدينة أو المنطقة",
      120,
    ),
    addressLine: cleanRequiredString(
      value.addressLine,
      "العنوان",
      500,
    ),
    notes: cleanOptionalString(
      value.notes,
      1000,
    ),
    status: value.status,
    paymentMethod: value.paymentMethod,
    paymentStatus: value.paymentStatus,
    items: validateItems(value.items),
  };
}

async function authorizeAdmin(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  if (
    typeof token.sessionExpiresAt !== "number" ||
    token.sessionExpiresAt <= Date.now()
  ) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          error: "SESSION_EXPIRED",
          message:
            "انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const role =
    typeof token.role === "string"
      ? token.role.toUpperCase()
      : "";

  if (
    role !== "ADMIN" &&
    role !== "SUPER_ADMIN" &&
    role !== "OWNER"
  ) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          error: "FORBIDDEN",
          message:
            "ليس لديك صلاحية لإدارة الطلبات.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    authorized: true as const,
    token,
  };
}

function isRecordNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function isForeignKeyConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

function buildStatusDateUpdates(
  nextStatus: OrderStatus,
  currentOrder: {
    confirmedAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
  },
) {
  const now = new Date();

  switch (nextStatus) {
    case "CONFIRMED":
      return currentOrder.confirmedAt
        ? {}
        : {
            confirmedAt: now,
          };

    case "SHIPPED":
      return {
        ...(currentOrder.confirmedAt
          ? {}
          : {
              confirmedAt: now,
            }),
        ...(currentOrder.shippedAt
          ? {}
          : {
              shippedAt: now,
            }),
      };

    case "DELIVERED":
      return {
        ...(currentOrder.confirmedAt
          ? {}
          : {
              confirmedAt: now,
            }),
        ...(currentOrder.shippedAt
          ? {}
          : {
              shippedAt: now,
            }),
        ...(currentOrder.deliveredAt
          ? {}
          : {
              deliveredAt: now,
            }),
      };

    case "CANCELLED":
      return currentOrder.cancelledAt
        ? {}
        : {
            cancelledAt: now,
          };

    default:
      return {};
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const authorization = await authorizeAdmin(request);

    if (!authorization.authorized) {
      return authorization.response;
    }

    const { id } = await context.params;
    const orderId = id.trim();

    if (!orderId) {
      return NextResponse.json(
        {
          error: "INVALID_ORDER_ID",
          message: "معرّف الطلب غير صحيح.",
        },
        {
          status: 400,
        },
      );
    }

    const contentType =
      request.headers.get("content-type") ?? "";

    if (
      !contentType
        .toLowerCase()
        .includes("application/json")
    ) {
      return NextResponse.json(
        {
          error: "UNSUPPORTED_MEDIA_TYPE",
          message:
            "يجب إرسال بيانات التعديل بصيغة JSON.",
        },
        {
          status: 415,
        },
      );
    }

    const rawBody: unknown = await request.json();
    const payload = validatePayload(rawBody);

    const currentOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,
        customerId: true,
        addressId: true,
        status: true,
        confirmedAt: true,
        shippedAt: true,
        deliveredAt: true,
        cancelledAt: true,
        items: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!currentOrder) {
      return NextResponse.json(
        {
          error: "ORDER_NOT_FOUND",
          message: "الطلب غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    const currentItemIds = new Set(
      currentOrder.items.map((item) => item.id),
    );

    const invalidExistingItem = payload.items.find(
      (item) =>
        item.id !== null &&
        !currentItemIds.has(item.id),
    );

    if (invalidExistingItem) {
      return NextResponse.json(
        {
          error: "INVALID_ORDER_ITEM",
          message:
            "أحد عناصر الطلب لا ينتمي إلى هذا الطلب.",
        },
        {
          status: 400,
        },
      );
    }

    const requestedSlugs = payload.items.map(
      (item) => item.productSlug,
    );

    const productEntities =
      await prisma.knowledgeEntity.findMany({
        where: {
          type: KnowledgeEntityType.PRODUCT,
          slug: {
            in: requestedSlugs,
          },
          product: {
            isNot: null,
          },
        },
        select: {
          slug: true,
          product: {
            select: {
              id: true,
              category: true,
              nameAr: true,
              nameEn: true,
              packageSize: true,
              images: {
                orderBy: {
                  sortOrder: "asc",
                },
                take: 1,
                select: {
                  url: true,
                },
              },
            },
          },
        },
      });

    const productsBySlug = new Map(
      productEntities
        .filter(
          (
            entity,
          ): entity is typeof entity & {
            product: NonNullable<typeof entity.product>;
          } => entity.product !== null,
        )
        .map((entity) => [
          entity.slug,
          entity.product,
        ]),
    );

    const missingSlug = requestedSlugs.find(
      (slug) => !productsBySlug.has(slug),
    );

    if (missingSlug) {
      return NextResponse.json(
        {
          error: "PRODUCT_NOT_FOUND",
          message:
            `المنتج المرتبط بالرابط "${missingSlug}" غير موجود أو غير صالح.`,
        },
        {
          status: 400,
        },
      );
    }

    const totalItems = payload.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const retainedItemIds = payload.items
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id));

    const statusDateUpdates =
      payload.status !== currentOrder.status
        ? buildStatusDateUpdates(
            payload.status,
            currentOrder,
          )
        : {};

    await prisma.$transaction(
      async (transaction) => {
        await transaction.orderItem.deleteMany({
          where: {
            orderId,
            ...(retainedItemIds.length > 0
              ? {
                  id: {
                    notIn: retainedItemIds,
                  },
                }
              : {}),
          },
        });

        for (const item of payload.items) {
          const product = productsBySlug.get(
            item.productSlug,
          );

          if (!product) {
            throw new OrderValidationError(
              "تعذر تحميل بيانات أحد المنتجات.",
            );
          }

          const snapshot = {
            productId: product.id,
            productSlug: item.productSlug,
            productNameAr: product.nameAr,
            productNameEn: product.nameEn,
            productImage:
              product.images[0]?.url ?? null,
            category: product.category,
            packageSize: product.packageSize,
            quantity: item.quantity,
          };

          if (item.id) {
            await transaction.orderItem.update({
              where: {
                id: item.id,
              },
              data: snapshot,
            });
          } else {
            await transaction.orderItem.create({
              data: {
                orderId,
                ...snapshot,
              },
            });
          }
        }

        await transaction.order.update({
          where: {
            id: orderId,
          },
          data: {
            customerName: payload.customerName,
            phone: payload.phone,
            alternativePhone:
              payload.alternativePhone,
            governorate: payload.governorate,
            city: payload.city,
            addressLine: payload.addressLine,
            notes: payload.notes,
            status: payload.status,
            paymentMethod:
              payload.paymentMethod,
            paymentStatus:
              payload.paymentStatus,
            totalItems,
            ...statusDateUpdates,
          },
        });

        if (
          currentOrder.addressId &&
          currentOrder.customerId
        ) {
          await transaction.customerAddress.update({
            where: {
              id: currentOrder.addressId,
            },
            data: {
              recipientName:
                payload.customerName,
              phone: payload.phone,
              alternativePhone:
                payload.alternativePhone,
              governorate:
                payload.governorate,
              city: payload.city,
              addressLine:
                payload.addressLine,
            },
          });
        }

        if (currentOrder.customerId) {
          await transaction.customer.update({
            where: {
              id: currentOrder.customerId,
            },
            data: {
              displayName:
                payload.customerName,
            },
          });
        }
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    const updatedOrder =
      await prisma.order.findUniqueOrThrow({
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
          totalItems: true,
          confirmedAt: true,
          shippedAt: true,
          deliveredAt: true,
          cancelledAt: true,
          updatedAt: true,
          items: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              productId: true,
              productSlug: true,
              productNameAr: true,
              productNameEn: true,
              productImage: true,
              category: true,
              packageSize: true,
              quantity: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message: "تم تعديل الطلب والمنتجات بنجاح.",
      order: {
        ...updatedOrder,
        confirmedAt:
          updatedOrder.confirmedAt?.toISOString() ??
          null,
        shippedAt:
          updatedOrder.shippedAt?.toISOString() ??
          null,
        deliveredAt:
          updatedOrder.deliveredAt?.toISOString() ??
          null,
        cancelledAt:
          updatedOrder.cancelledAt?.toISOString() ??
          null,
        updatedAt:
          updatedOrder.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      console.error(
        "PATCH /api/orders/[id] validation failed:",
        error.message,
      );

      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: error.message,
        },
        {
          status: 400,
        },
      );
    }

    if (
      error instanceof SyntaxError ||
      (error instanceof Error &&
        error.message
          .toLowerCase()
          .includes("json"))
    ) {
      return NextResponse.json(
        {
          error: "INVALID_JSON",
          message:
            "صيغة بيانات تعديل الطلب غير صحيحة.",
        },
        {
          status: 400,
        },
      );
    }

    if (isRecordNotFound(error)) {
      return NextResponse.json(
        {
          error: "ORDER_NOT_FOUND",
          message: "الطلب غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    if (isForeignKeyConflict(error)) {
      return NextResponse.json(
        {
          error: "ORDER_UPDATE_CONFLICT",
          message:
            "تعذر تعديل الطلب بسبب ارتباط غير صالح.",
        },
        {
          status: 409,
        },
      );
    }

    console.error(
      "PATCH /api/orders/[id] failed",
      error,
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          "تعذر تعديل الطلب حاليًا. حاول مرة أخرى.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const authorization = await authorizeAdmin(request);

    if (!authorization.authorized) {
      return authorization.response;
    }

    const { id } = await context.params;
    const orderId = id.trim();

    if (!orderId) {
      return NextResponse.json(
        {
          error: "INVALID_ORDER_ID",
          message: "معرّف الطلب غير صحيح.",
        },
        {
          status: 400,
        },
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        paymentStatus: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error: "ORDER_NOT_FOUND",
          message: "الطلب غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      order.paymentStatus === "PAID" &&
      order.status !== "CANCELLED"
    ) {
      return NextResponse.json(
        {
          error: "PAID_ORDER_DELETE_BLOCKED",
          message:
            "لا يمكن حذف طلب مدفوع قبل إلغائه أو معالجة حالة الدفع.",
        },
        {
          status: 409,
        },
      );
    }

    await prisma.order.delete({
      where: {
        id: orderId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف الطلب نهائيًا.",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        deletedItems:
          order._count.items,
      },
    });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json(
        {
          error: "ORDER_NOT_FOUND",
          message: "الطلب غير موجود.",
        },
        {
          status: 404,
        },
      );
    }

    if (isForeignKeyConflict(error)) {
      return NextResponse.json(
        {
          error: "ORDER_DELETE_CONFLICT",
          message:
            "تعذر حذف الطلب لأنه مرتبط ببيانات أخرى.",
        },
        {
          status: 409,
        },
      );
    }

    console.error(
      "DELETE /api/orders/[id] failed",
      error,
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          "تعذر حذف الطلب حاليًا. حاول مرة أخرى.",
      },
      {
        status: 500,
      },
    );
  }
}
