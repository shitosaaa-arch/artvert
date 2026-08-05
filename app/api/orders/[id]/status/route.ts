import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Prisma } from "@prisma/client";

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

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UnknownRecord = Record<string, unknown>;

type UpdateOrderPayload = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

class OrderStatusValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderStatusValidationError";
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    ORDER_STATUSES.includes(value as OrderStatus)
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

function validatePayload(value: unknown): UpdateOrderPayload {
  if (!isRecord(value)) {
    throw new OrderStatusValidationError(
      "بيانات التحديث غير صحيحة.",
    );
  }

  const hasStatus = value.status !== undefined;
  const hasPaymentStatus =
    value.paymentStatus !== undefined;

  if (!hasStatus && !hasPaymentStatus) {
    throw new OrderStatusValidationError(
      "يجب إرسال حالة الطلب أو حالة الدفع.",
    );
  }

  if (hasStatus && !isOrderStatus(value.status)) {
    throw new OrderStatusValidationError(
      "حالة الطلب غير مدعومة.",
    );
  }

  if (
    hasPaymentStatus &&
    !isPaymentStatus(value.paymentStatus)
  ) {
    throw new OrderStatusValidationError(
      "حالة الدفع غير مدعومة.",
    );
  }

  return {
    ...(hasStatus
      ? {
          status: value.status as OrderStatus,
        }
      : {}),
    ...(hasPaymentStatus
      ? {
          paymentStatus:
            value.paymentStatus as PaymentStatus,
        }
      : {}),
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
            "ليس لديك صلاحية لتعديل الطلبات.",
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

function buildOrderStatusDates(
  status: OrderStatus,
  currentOrder: {
    confirmedAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
  },
) {
  const now = new Date();

  switch (status) {
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
            "يجب إرسال بيانات التحديث بصيغة JSON.",
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
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        source: true,
        customerName: true,
        phone: true,
        totalItems: true,
        confirmedAt: true,
        shippedAt: true,
        deliveredAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
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

    const statusChanged =
      payload.status !== undefined &&
      payload.status !== currentOrder.status;

    const paymentStatusChanged =
      payload.paymentStatus !== undefined &&
      payload.paymentStatus !==
        currentOrder.paymentStatus;

    if (!statusChanged && !paymentStatusChanged) {
      return NextResponse.json({
        success: true,
        unchanged: true,
        message: "لا توجد تغييرات جديدة على الطلب.",
        order: {
          ...currentOrder,
          createdAt:
            currentOrder.createdAt.toISOString(),
          updatedAt:
            currentOrder.updatedAt.toISOString(),
          confirmedAt:
            currentOrder.confirmedAt?.toISOString() ??
            null,
          shippedAt:
            currentOrder.shippedAt?.toISOString() ??
            null,
          deliveredAt:
            currentOrder.deliveredAt?.toISOString() ??
            null,
          cancelledAt:
            currentOrder.cancelledAt?.toISOString() ??
            null,
        },
        changes: {
          previousStatus: currentOrder.status,
          currentStatus: currentOrder.status,
          previousPaymentStatus:
            currentOrder.paymentStatus,
          currentPaymentStatus:
            currentOrder.paymentStatus,
        },
      });
    }

    const statusDateUpdates =
      statusChanged && payload.status
        ? buildOrderStatusDates(
            payload.status,
            currentOrder,
          )
        : {};

    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        ...(statusChanged && payload.status
          ? {
              status: payload.status,
              ...statusDateUpdates,
            }
          : {}),
        ...(paymentStatusChanged &&
        payload.paymentStatus
          ? {
              paymentStatus:
                payload.paymentStatus,
            }
          : {}),
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        source: true,
        customerName: true,
        phone: true,
        totalItems: true,
        confirmedAt: true,
        shippedAt: true,
        deliveredAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      unchanged: false,
      message: "تم تحديث الطلب بنجاح.",
      order: {
        ...updatedOrder,
        createdAt:
          updatedOrder.createdAt.toISOString(),
        updatedAt:
          updatedOrder.updatedAt.toISOString(),
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
      },
      changes: {
        previousStatus: currentOrder.status,
        currentStatus: updatedOrder.status,
        previousPaymentStatus:
          currentOrder.paymentStatus,
        currentPaymentStatus:
          updatedOrder.paymentStatus,
      },
    });
  } catch (error) {
    if (
      error instanceof OrderStatusValidationError
    ) {
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
            "صيغة بيانات التحديث غير صحيحة.",
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

    console.error(
      "PATCH /api/orders/[id]/status failed",
      error,
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          "تعذر تحديث الطلب حاليًا. حاول مرة أخرى.",
      },
      {
        status: 500,
      },
    );
  }
}