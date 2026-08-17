import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { getPrismaClient } from "@/lib/db/prisma";
import { requireCustomerAdmin } from "@/lib/customers/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_RECIPIENTS = 10000;

const PHONE_COLUMN_NAMES = [
  "phone",
  "mobile",
  "telephone",
  "whatsapp",
  "whatsapp number",
  "phone number",
  "mobile number",
  "رقم",
  "رقم الهاتف",
  "رقم الموبايل",
  "رقم المحمول",
  "الهاتف",
  "الموبايل",
  "المحمول",
  "واتساب",
  "رقم واتساب",
];

const NAME_COLUMN_NAMES = [
  "name",
  "customer",
  "customer name",
  "full name",
  "client",
  "client name",
  "الاسم",
  "اسم العميل",
  "العميل",
  "اسم",
];

type ExcelRow = Record<string, unknown>;

type ImportedRecipient = {
  phone: string;
  displayName: string | null;
};

type OptOutMetadata = {
  phone?: unknown;
};

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => {
      const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
      return String(
        arabicDigits.indexOf(digit),
      );
    })
    .replace(/[^\d+]/g, "");
}

function normalizeEgyptianPhone(
  rawValue: unknown,
): string | null {
  if (
    rawValue === null ||
    rawValue === undefined
  ) {
    return null;
  }

  let value =
    typeof rawValue === "number"
      ? Math.trunc(rawValue).toString()
      : String(rawValue);

  value = normalizeDigits(value).trim();

  if (!value) {
    return null;
  }

  /*
   * إزالة + فقط، لأن WhatsApp Cloud API
   * تريد الرقم بصيغة دولية أرقام فقط.
   */
  value = value.replace(/^\+/, "");

  /*
   * بعض ملفات Excel قد تحتوي 0020...
   */
  if (value.startsWith("00")) {
    value = value.slice(2);
  }

  /*
   * رقم مصري محلي:
   * 01012345678
   * يصبح:
   * 201012345678
   */
  if (
    value.startsWith("01") &&
    value.length === 11
  ) {
    value = `20${value.slice(1)}`;
  }

  /*
   * أحيانًا الرقم يُكتب:
   * 1012345678
   * بدون الصفر الأول.
   */
  if (
    value.startsWith("1") &&
    value.length === 10
  ) {
    value = `20${value}`;
  }

  /*
   * صيغة +20 أو 20 تظل كما هي.
   */
  if (
    value.startsWith("20") &&
    value.length === 12
  ) {
    return value;
  }

  /*
   * السماح بأرقام دولية أخرى
   * وفق E.164 بشكل مبسط.
   */
  if (
    /^\d{10,15}$/.test(value)
  ) {
    return value;
  }

  return null;
}

function getPhoneSuffix(phone: string) {
  const normalized =
    phone.replace(/[^\d]/g, "");

  if (normalized.length <= 10) {
    return normalized;
  }

  return normalized.slice(-10);
}

function findColumn(
  headers: string[],
  candidates: string[],
) {
  const normalizedCandidates =
    new Set(
      candidates.map(
        normalizeHeader,
      ),
    );

  return (
    headers.find((header) =>
      normalizedCandidates.has(
        normalizeHeader(header),
      ),
    ) ?? null
  );
}

function normalizeDisplayName(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const name =
    String(value)
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 200);

  return name || null;
}

async function getOptedOutPhones() {
  const prisma =
    getPrismaClient();

  /*
   * نقرأ أحداث الاهتمام وإيقاف الرسائل
   * من الأحدث إلى الأقدم.
   * أول حدث لكل رقم هو حالته الحالية.
   */
  const logs =
    await prisma.customerAuditLog.findMany({
      where: {
        action: {
          in: [
            "WHATSAPP_INTERESTED",
            "WHATSAPP_OPT_OUT",
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        action: true,
        metadata: true,
      },
    });

  const latestStatusByPhone =
    new Map<string, string>();

  for (const log of logs) {
    if (
      !log.metadata ||
      typeof log.metadata !== "object" ||
      Array.isArray(log.metadata)
    ) {
      continue;
    }

    const metadata =
      log.metadata as OptOutMetadata;

    const rawPhone =
      typeof metadata.phone === "string"
        ? metadata.phone
        : "";

    if (!rawPhone) {
      continue;
    }

    const normalized =
      normalizeEgyptianPhone(
        rawPhone,
      );

    if (!normalized) {
      continue;
    }

    const suffix =
      getPhoneSuffix(normalized);

    if (
      latestStatusByPhone.has(
        suffix,
      )
    ) {
      continue;
    }

    latestStatusByPhone.set(
      suffix,
      log.action,
    );
  }

  const optedOut =
    new Set<string>();

  for (
    const [phone, action]
    of latestStatusByPhone
  ) {
    if (
      action ===
      "WHATSAPP_OPT_OUT"
    ) {
      optedOut.add(phone);
    }
  }

  return optedOut;
}

export async function POST(
  request: Request,
) {
  try {
    await requireCustomerAdmin();

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const requestedName =
      typeof formData.get(
        "name",
      ) === "string"
        ? String(
            formData.get("name"),
          ).trim()
        : "";

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ملف Excel مطلوب.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "الملف فارغ.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "حجم الملف أكبر من الحد المسموح وهو 10 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const lowerName =
      file.name.toLowerCase();

    const supported =
      lowerName.endsWith(
        ".xlsx",
      ) ||
      lowerName.endsWith(
        ".xls",
      ) ||
      lowerName.endsWith(
        ".csv",
      );

    if (!supported) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "الملف يجب أن يكون Excel أو CSV.",
        },
        {
          status: 400,
        },
      );
    }

    const buffer =
      Buffer.from(
        await file.arrayBuffer(),
      );

    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(
        buffer,
        {
          type: "buffer",
          cellDates: false,
          raw: false,
        },
      );
    } catch (error) {
      console.error(
        "[whatsapp-campaign-import-read]",
        error,
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "تعذر قراءة ملف Excel.",
        },
        {
          status: 400,
        },
      );
    }

    const sheetName =
      workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "لا توجد صفحات داخل ملف Excel.",
        },
        {
          status: 400,
        },
      );
    }

    const worksheet =
      workbook.Sheets[
        sheetName
      ];

    if (!worksheet) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "تعذر قراءة الصفحة الأولى من الملف.",
        },
        {
          status: 400,
        },
      );
    }

    const rows =
      XLSX.utils.sheet_to_json<ExcelRow>(
        worksheet,
        {
          defval: "",
          raw: false,
        },
      );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ملف Excel لا يحتوي على بيانات.",
        },
        {
          status: 400,
        },
      );
    }

    const headers =
      Object.keys(rows[0]);

    const phoneColumn =
      findColumn(
        headers,
        PHONE_COLUMN_NAMES,
      );

    if (!phoneColumn) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "لم أجد عمود رقم الهاتف في الملف.",
          availableColumns:
            headers,
          expectedColumns:
            PHONE_COLUMN_NAMES,
        },
        {
          status: 400,
        },
      );
    }

    const nameColumn =
      findColumn(
        headers,
        NAME_COLUMN_NAMES,
      );

    const recipientsByPhone =
      new Map<
        string,
        ImportedRecipient
      >();

    let invalidRows = 0;
    let duplicateRows = 0;

    for (const row of rows) {
      const phone =
        normalizeEgyptianPhone(
          row[phoneColumn],
        );

      if (!phone) {
        invalidRows += 1;
        continue;
      }

      if (
        recipientsByPhone.has(
          phone,
        )
      ) {
        duplicateRows += 1;
        continue;
      }

      recipientsByPhone.set(
        phone,
        {
          phone,
          displayName:
            nameColumn
              ? normalizeDisplayName(
                  row[nameColumn],
                )
              : null,
        },
      );

      if (
        recipientsByPhone.size >
        MAX_RECIPIENTS
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              `الحد الأقصى للحملة الواحدة هو ${MAX_RECIPIENTS.toLocaleString(
                "ar-EG",
              )} رقم.`,
          },
          {
            status: 400,
          },
        );
      }
    }

    const recipients =
      Array.from(
        recipientsByPhone.values(),
      );

    if (
      recipients.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "لم يتم العثور على أرقام هاتف صالحة في الملف.",
        },
        {
          status: 400,
        },
      );
    }

    const optedOutPhones =
      await getOptedOutPhones();

    const pendingRecipients:
      ImportedRecipient[] = [];

    const blockedRecipients:
      ImportedRecipient[] = [];

    for (
      const recipient
      of recipients
    ) {
      const suffix =
        getPhoneSuffix(
          recipient.phone,
        );

      if (
        optedOutPhones.has(
          suffix,
        )
      ) {
        blockedRecipients.push(
          recipient,
        );
      } else {
        pendingRecipients.push(
          recipient,
        );
      }
    }

    const prisma =
      getPrismaClient();

    const campaignName =
      requestedName ||
      `حملة واتساب ${new Intl.DateTimeFormat(
        "ar-EG",
        {
          dateStyle:
            "medium",
          timeStyle:
            "short",
          timeZone:
            "Africa/Cairo",
        },
      ).format(new Date())}`;

    const campaign =
      await prisma.$transaction(
        async (tx) => {
          const created =
            await tx.whatsAppCampaign.create({
              data: {
                name:
                  campaignName.slice(
                    0,
                    200,
                  ),
                templateName:
                  "artvert_customer_followup",
                languageCode:
                  "ar_EG",
                status:
                  pendingRecipients.length >
                  0
                    ? "READY"
                    : "COMPLETED",
                totalRecipients:
                  recipients.length,
                pendingCount:
                  pendingRecipients.length,
                sentCount: 0,
                failedCount: 0,
                blockedCount:
                  blockedRecipients.length,
                sourceFileName:
                  file.name.slice(
                    0,
                    255,
                  ),
                completedAt:
                  pendingRecipients.length ===
                  0
                    ? new Date()
                    : null,
              },
            });

          if (
            pendingRecipients.length >
            0
          ) {
            await tx.whatsAppCampaignRecipient.createMany(
              {
                data:
                  pendingRecipients.map(
                    (
                      recipient,
                    ) => ({
                      campaignId:
                        created.id,
                      phone:
                        recipient.phone,
                      displayName:
                        recipient.displayName,
                      status:
                        "PENDING",
                    }),
                  ),
              },
            );
          }

          if (
            blockedRecipients.length >
            0
          ) {
            await tx.whatsAppCampaignRecipient.createMany(
              {
                data:
                  blockedRecipients.map(
                    (
                      recipient,
                    ) => ({
                      campaignId:
                        created.id,
                      phone:
                        recipient.phone,
                      displayName:
                        recipient.displayName,
                      status:
                        "BLOCKED",
                      blockedReason:
                        "WHATSAPP_OPT_OUT",
                    }),
                  ),
              },
            );
          }

          return created;
        },
      );

    return NextResponse.json({
      ok: true,
      campaign: {
        id:
          campaign.id,
        name:
          campaign.name,
        status:
          campaign.status,
        templateName:
          campaign.templateName,
        languageCode:
          campaign.languageCode,
        sourceFileName:
          campaign.sourceFileName,
        createdAt:
          campaign.createdAt,
      },
      import: {
        sheet:
          sheetName,
        phoneColumn,
        nameColumn,
        rowsRead:
          rows.length,
        validUnique:
          recipients.length,
        pending:
          pendingRecipients.length,
        blocked:
          blockedRecipients.length,
        invalid:
          invalidRows,
        duplicates:
          duplicateRows,
      },
    });
  } catch (error) {
    console.error(
      "[whatsapp-campaign-import]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "CAMPAIGN_IMPORT_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}