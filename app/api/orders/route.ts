import { NextRequest, NextResponse } from "next/server";
import {
  KnowledgeEntityType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYMENT_METHODS = [
  "CASH_ON_DELIVERY",
  "VODAFONE_CASH",
  "INSTAPAY",
  "BANK_TRANSFER",
  "ONLINE_PAYMENT",
  "OTHER",
] as const;

const MAX_ORDER_ITEMS = 100;
const MAX_QUANTITY_PER_ITEM = 100;

const WHATSAPP_GRAPH_VERSION =
  process.env.WHATSAPP_GRAPH_VERSION ?? "v25.0";

type InvoiceItem = {
  slug: string;
  nameAr: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type PaymentMethod =
  (typeof PAYMENT_METHODS)[number];

type UnknownRecord =
  Record<string, unknown>;

type CreateOrderItem = {
  slug: string;
  quantity: number;
};

type CustomerPayload = {
  fullName: string;
  phone: string;
  alternativePhone: string | null;
  governorate: string;
  city: string;
  address: string;
  notes: string | null;
};

type CreateOrderPayload = {
  customer: CustomerPayload;
  items: CreateOrderItem[];
  paymentMethod: PaymentMethod;
};

class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
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

  const cleanedValue =
    value.trim();

  if (!cleanedValue) {
    throw new OrderValidationError(
      `حقل ${fieldName} مطلوب.`,
    );
  }

  if (
    cleanedValue.length >
    maxLength
  ) {
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

  const cleanedValue =
    value.trim();

  if (!cleanedValue) {
    return null;
  }

  if (
    cleanedValue.length >
    maxLength
  ) {
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
    (
      value === undefined ||
      value === null ||
      value === ""
    )
  ) {
    return null;
  }

  const rawPhone =
    cleanRequiredString(
      value,
      fieldName,
      20,
    ).replace(
      /[^\d+]/g,
      "",
    );

  const match =
    rawPhone.match(
      /^(?:\+?20|0)?(1[0125]\d{8})$/,
    );

  if (!match) {
    throw new OrderValidationError(
      `رقم ${fieldName} غير صحيح.`,
    );
  }

  return `+20${match[1]}`;
}

function isPaymentMethod(
  value: unknown,
): value is PaymentMethod {
  return (
    typeof value === "string" &&
    PAYMENT_METHODS.includes(
      value as PaymentMethod,
    )
  );
}

function validateCustomer(
  value: unknown,
): CustomerPayload {
  if (!isRecord(value)) {
    throw new OrderValidationError(
      "بيانات العميل غير صحيحة.",
    );
  }

  const phone =
    normalizeEgyptianPhone(
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
    fullName:
      cleanRequiredString(
        value.fullName,
        "الاسم",
        120,
      ),
    phone,
    alternativePhone:
      normalizeEgyptianPhone(
        value.alternativePhone,
        "الهاتف البديل",
        false,
      ),
    governorate:
      cleanRequiredString(
        value.governorate,
        "المحافظة",
        100,
      ),
    city:
      cleanRequiredString(
        value.city,
        "المدينة أو المنطقة",
        120,
      ),
    address:
      cleanRequiredString(
        value.address,
        "العنوان",
        500,
      ),
    notes:
      cleanOptionalString(
        value.notes,
        1000,
      ),
  };
}

function validateItems(
  value: unknown,
): CreateOrderItem[] {
  if (!Array.isArray(value)) {
    throw new OrderValidationError(
      "قائمة منتجات الطلب غير صحيحة.",
    );
  }

  if (value.length === 0) {
    throw new OrderValidationError(
      "لا يمكن إنشاء طلب بدون منتجات.",
    );
  }

  if (
    value.length >
    MAX_ORDER_ITEMS
  ) {
    throw new OrderValidationError(
      "عدد المنتجات في الطلب أكبر من الحد المسموح.",
    );
  }

  const items =
    value.map(
      (
        item,
        index,
      ): CreateOrderItem => {
        if (!isRecord(item)) {
          throw new OrderValidationError(
            `بيانات المنتج رقم ${index + 1} غير صحيحة.`,
          );
        }

        const slug =
          cleanRequiredString(
            item.slug,
            `رابط المنتج رقم ${index + 1}`,
            160,
          );

        const quantity =
          item.quantity;

        if (
          typeof quantity !==
            "number" ||
          !Number.isInteger(
            quantity,
          ) ||
          quantity < 1 ||
          quantity >
            MAX_QUANTITY_PER_ITEM
        ) {
          throw new OrderValidationError(
            `كمية المنتج رقم ${index + 1} غير صحيحة.`,
          );
        }

        return {
          slug,
          quantity,
        };
      },
    );

  const uniqueSlugs =
    new Set(
      items.map(
        (item) =>
          item.slug,
      ),
    );

  if (
    uniqueSlugs.size !==
    items.length
  ) {
    throw new OrderValidationError(
      "لا يمكن إضافة نفس المنتج أكثر من مرة داخل الطلب.",
    );
  }

  return items;
}

function validatePayload(
  value: unknown,
): CreateOrderPayload {
  if (!isRecord(value)) {
    throw new OrderValidationError(
      "بيانات الطلب غير صحيحة.",
    );
  }

  const paymentMethod =
    value.paymentMethod ===
      undefined ||
    value.paymentMethod ===
      null ||
    value.paymentMethod ===
      ""
      ? "CASH_ON_DELIVERY"
      : value.paymentMethod;

  if (
    !isPaymentMethod(
      paymentMethod,
    )
  ) {
    throw new OrderValidationError(
      "طريقة الدفع غير مدعومة.",
    );
  }

  return {
    customer:
      validateCustomer(
        value.customer,
      ),
    items:
      validateItems(
        value.items,
      ),
    paymentMethod,
  };
}

function paymentMethodLabel(
  method: PaymentMethod,
) {
  switch (method) {
    case "VODAFONE_CASH":
      return "Vodafone Cash";
    case "INSTAPAY":
      return "InstaPay";
    case "BANK_TRANSFER":
      return "تحويل بنكي";
    case "ONLINE_PAYMENT":
      return "دفع أونلاين";
    case "OTHER":
      return "طريقة دفع أخرى";
    default:
      return "الدفع عند الاستلام";
  }
}

function formatEgp(
  value: number,
) {
  return new Intl.NumberFormat(
    "ar-EG",
    {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function normalizeWhatsAppRecipient(
  value: string,
) {
  return value.replace(/\D/g, "");
}

function buildWhatsAppInvoiceMessage({
  orderNumber,
  customer,
  items,
  totalItems,
  subtotal,
  paymentMethod,
}: {
  orderNumber: string;
  customer: CustomerPayload;
  items: InvoiceItem[];
  totalItems: number;
  subtotal: number;
  paymentMethod: PaymentMethod;
}) {
  const productLines = items.map(
    (item, index) =>
      `${index + 1}) ${item.nameAr}\nالكمية: ${item.quantity}\nسعر الوحدة: ${formatEgp(item.unitPrice)}\nالإجمالي: ${formatEgp(item.lineTotal)}`,
  );

  return [
    "🧾 فاتورة طلب جديدة - ArtVert Egypt",
    "",
    `رقم الطلب: ${orderNumber}`,
    `الاسم: ${customer.fullName}`,
    `الهاتف: ${customer.phone}`,
    customer.alternativePhone
      ? `الهاتف البديل: ${customer.alternativePhone}`
      : null,
    `المحافظة: ${customer.governorate}`,
    `المدينة/المنطقة: ${customer.city}`,
    `العنوان: ${customer.address}`,
    customer.notes ? `ملاحظات: ${customer.notes}` : null,
    "",
    "📦 المنتجات:",
    ...productLines,
    "",
    `إجمالي عدد القطع: ${totalItems}`,
    `إجمالي المنتجات: ${formatEgp(subtotal)}`,
    `طريقة الدفع: ${paymentMethodLabel(paymentMethod)}`,
  ]
    .filter((line): line is string => typeof line === "string")
    .join("\n");
}

async function sendWhatsAppInvoice(
  message: string,
) {
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const orderTo =
    process.env.WHATSAPP_ORDER_TO?.trim();

  if (!phoneNumberId || !accessToken || !orderTo) {
    console.warn(
      "WhatsApp invoice skipped: missing WhatsApp environment variables.",
    );
    return { sent: false, reason: "MISSING_CONFIGURATION" } as const;
  }

  const recipient = normalizeWhatsAppRecipient(orderTo);
  if (!recipient) {
    console.warn("WhatsApp invoice skipped: invalid recipient.");
    return { sent: false, reason: "INVALID_RECIPIENT" } as const;
  }

  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    },
  );

  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("WhatsApp invoice send failed:", {
      status: response.status,
      body: responseBody,
    });
    return { sent: false, reason: "WHATSAPP_API_ERROR" } as const;
  }

  return { sent: true, reason: null } as const;
}

function generateOrderNumber() {
  const now =
    new Date();

  const datePart =
    [
      now.getFullYear(),
      String(
        now.getMonth() + 1,
      ).padStart(2, "0"),
      String(
        now.getDate(),
      ).padStart(2, "0"),
    ].join("");

  const timePart =
    [
      String(
        now.getHours(),
      ).padStart(2, "0"),
      String(
        now.getMinutes(),
      ).padStart(2, "0"),
      String(
        now.getSeconds(),
      ).padStart(2, "0"),
    ].join("");

  const randomPart =
    Math.floor(
      1000 +
        Math.random() *
          9000,
    );

  return `ART-${datePart}-${timePart}-${randomPart}`;
}

function isUniqueConflict(
  error: unknown,
) {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isForeignKeyConflict(
  error: unknown,
) {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    const contentType =
      request.headers.get(
        "content-type",
      ) ?? "";

    if (
      !contentType
        .toLowerCase()
        .includes(
          "application/json",
        )
    ) {
      return NextResponse.json(
        {
          error:
            "UNSUPPORTED_MEDIA_TYPE",
          message:
            "يجب إرسال بيانات الطلب بصيغة JSON.",
        },
        {
          status: 415,
        },
      );
    }

    const rawBody: unknown =
      await request.json();

    const payload =
      validatePayload(
        rawBody,
      );

    const requestedSlugs =
      payload.items.map(
        (item) =>
          item.slug,
      );

    const productEntities =
      await prisma.knowledgeEntity.findMany(
        {
          where: {
            type:
              KnowledgeEntityType.PRODUCT,
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
                price: true,
                images: {
                  orderBy: [
                    {
                      isPrimary:
                        "desc",
                    },
                    {
                      sortOrder:
                        "asc",
                    },
                  ],
                  take: 1,
                  select: {
                    url: true,
                    avifUrl:
                      true,
                    webpUrl:
                      true,
                  },
                },
              },
            },
          },
        },
      );

    const productsBySlug =
      new Map(
        productEntities
          .filter(
            (
              entity,
            ): entity is typeof entity & {
              product: NonNullable<
                typeof entity.product
              >;
            } =>
              entity.product !==
              null,
          )
          .map(
            (entity) => [
              entity.slug,
              entity.product,
            ],
          ),
      );

    const missingSlug =
      requestedSlugs.find(
        (slug) =>
          !productsBySlug.has(
            slug,
          ),
      );

    if (missingSlug) {
      return NextResponse.json(
        {
          error:
            "PRODUCT_NOT_FOUND",
          message:
            `المنتج المرتبط بالرابط "${missingSlug}" غير موجود أو غير صالح.`,
        },
        {
          status: 400,
        },
      );
    }

    const totalItems =
      payload.items.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.quantity,
        0,
      );

    const invoiceItems: InvoiceItem[] =
      payload.items.map(
        (item) => {
          const product =
            productsBySlug.get(
              item.slug,
            );

          if (!product) {
            throw new OrderValidationError(
              "تعذر تحميل بيانات أحد المنتجات.",
            );
          }

          const unitPrice = Number(product.price);

          if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new OrderValidationError(
              `سعر المنتج "${product.nameAr}" غير صالح.`,
            );
          }

          return {
            slug: item.slug,
            nameAr: product.nameAr,
            quantity: item.quantity,
            unitPrice,
            lineTotal: unitPrice * item.quantity,
          };
        },
      );

    const subtotal = invoiceItems.reduce(
      (total, item) => total + item.lineTotal,
      0,
    );

    const orderItems =
      payload.items.map(
        (item) => {
          const product =
            productsBySlug.get(
              item.slug,
            );

          if (!product) {
            throw new OrderValidationError(
              "تعذر تحميل بيانات أحد المنتجات.",
            );
          }

          const firstImage =
            product.images[0];

          const productImage =
            firstImage
              ? firstImage.avifUrl ??
                firstImage.webpUrl ??
                firstImage.url
              : null;

          return {
            productId:
              product.id,
            productSlug:
              item.slug,
            productNameAr:
              product.nameAr,
            productNameEn:
              product.nameEn,
            productImage,
            category:
              product.category,
            packageSize:
              product.packageSize,
            quantity:
              item.quantity,
          };
        },
      );

    let createdOrder:
      | Awaited<
          ReturnType<
            typeof prisma.order.create
          >
        >
      | null = null;

    for (
      let attempt = 0;
      attempt < 3;
      attempt += 1
    ) {
      try {
        const orderNumber =
          generateOrderNumber();

        createdOrder =
          await prisma.order.create(
            {
              data: {
                orderNumber,
                source:
                  "WEBSITE",
                status:
                  "PENDING",
                paymentMethod:
                  payload.paymentMethod,
                paymentStatus:
                  "PENDING",
                customerName:
                  payload.customer
                    .fullName,
                phone:
                  payload.customer
                    .phone,
                alternativePhone:
                  payload.customer
                    .alternativePhone,
                governorate:
                  payload.customer
                    .governorate,
                city:
                  payload.customer
                    .city,
                addressLine:
                  payload.customer
                    .address,
                notes:
                  payload.customer
                    .notes,
                totalItems,
                items: {
                  create:
                    orderItems,
                },
              },
              include: {
                items: {
                  orderBy: {
                    createdAt:
                      "asc",
                  },
                },
              },
            },
          );

        break;
      } catch (error) {
        if (
          isUniqueConflict(
            error,
          ) &&
          attempt < 2
        ) {
          continue;
        }

        throw error;
      }
    }

    if (!createdOrder) {
      return NextResponse.json(
        {
          error:
            "ORDER_NUMBER_CONFLICT",
          message:
            "تعذر إنشاء رقم طلب جديد. حاول مرة أخرى.",
        },
        {
          status: 409,
        },
      );
    }

    const whatsappMessage =
      buildWhatsAppInvoiceMessage({
        orderNumber: createdOrder.orderNumber,
        customer: payload.customer,
        items: invoiceItems,
        totalItems,
        subtotal,
        paymentMethod: payload.paymentMethod,
      });

    let whatsappNotification: {
      sent: boolean;
      reason: string | null;
    };

    try {
      whatsappNotification = await sendWhatsAppInvoice(whatsappMessage);
    } catch (error) {
      console.error(
        "WhatsApp invoice notification failed unexpectedly:",
        error,
      );
      whatsappNotification = {
        sent: false,
        reason: "UNEXPECTED_ERROR",
      };
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "تم تسجيل الطلب بنجاح.",
        order: {
          id:
            createdOrder.id,
          orderNumber:
            createdOrder.orderNumber,
          status:
            createdOrder.status,
          paymentMethod:
            createdOrder.paymentMethod,
          paymentStatus:
            createdOrder.paymentStatus,
          totalItems:
            createdOrder.totalItems,
          subtotal,
          createdAt:
            createdOrder.createdAt.toISOString(),
        },
        whatsappNotification,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (
      error instanceof
      OrderValidationError
    ) {
      return NextResponse.json(
        {
          error:
            "VALIDATION_ERROR",
          message:
            error.message,
        },
        {
          status: 400,
        },
      );
    }

    if (
      error instanceof
        SyntaxError ||
      (
        error instanceof
          Error &&
        error.message
          .toLowerCase()
          .includes("json")
      )
    ) {
      return NextResponse.json(
        {
          error:
            "INVALID_JSON",
          message:
            "صيغة بيانات الطلب غير صحيحة.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      isForeignKeyConflict(
        error,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "ORDER_CREATE_CONFLICT",
          message:
            "تعذر إنشاء الطلب بسبب ارتباط غير صالح بأحد المنتجات.",
        },
        {
          status: 409,
        },
      );
    }

    console.error(
      "POST /api/orders failed",
      error,
    );

    return NextResponse.json(
      {
        error:
          "INTERNAL_SERVER_ERROR",
        message:
          "تعذر حفظ الطلب حاليًا بسبب مشكلة في الخادم. حاول مرة أخرى.",
      },
      {
        status: 500,
      },
    );
  }
}
