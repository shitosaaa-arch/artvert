import { put } from "@vercel/blob";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

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
          success: false,
          error: "UNAUTHORIZED",
          message: "يجب تسجيل الدخول أولًا.",
        },
        { status: 401 },
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
          success: false,
          error: "SESSION_EXPIRED",
          message: "انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى.",
        },
        { status: 401 },
      ),
    };
  }

  const role =
    typeof token.role === "string"
      ? token.role.toUpperCase()
      : "";

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN",
          message: "ليس لديك صلاحية لرفع صور المنتجات.",
        },
        { status: 403 },
      ),
    };
  }

  return { authorized: true as const };
}

function sanitizeFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  const extension =
    dotIndex >= 0
      ? fileName.slice(dotIndex).toLowerCase()
      : "";
  const baseName =
    dotIndex >= 0
      ? fileName.slice(0, dotIndex)
      : fileName;

  const safeBaseName =
    baseName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u0600-\u06ff-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "product-image";

  return `${safeBaseName}${extension}`;
}

function buildStoragePath(fileName: string) {
  const now = new Date();
  const year = now.getUTCFullYear().toString();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");

  return `products/${year}/${month}/${sanitizeFileName(fileName)}`;
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeAdmin(request);

    if (!authorization.authorized) {
      return authorization.response;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: "BLOB_STORAGE_NOT_CONFIGURED",
          message:
            "متغير BLOB_READ_WRITE_TOKEN غير موجود. اربط Vercel Blob بالمشروع أولًا.",
        },
        { status: 503 },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          error: "UNSUPPORTED_MEDIA_TYPE",
          message: "يجب إرسال الصورة باستخدام FormData.",
        },
        { status: 415 },
      );
    }

    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "FILE_REQUIRED",
          message: "اختر صورة لرفعها.",
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(fileValue.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "UNSUPPORTED_IMAGE_TYPE",
          message: "الصيغ المسموحة: JPG وPNG وWEBP وAVIF.",
        },
        { status: 400 },
      );
    }

    if (fileValue.size <= 0 || fileValue.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_FILE_SIZE",
          message: "حجم الصورة يجب ألا يتجاوز 4 ميجابايت.",
        },
        { status: 400 },
      );
    }

    const blob = await put(buildStoragePath(fileValue.name), fileValue, {
      access: "public",
      addRandomSuffix: true,
      contentType: fileValue.type,
    });

    return NextResponse.json(
      {
        success: true,
        image: {
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          pathname: blob.pathname,
          contentType: fileValue.type,
          size: fileValue.size,
          originalName: fileValue.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/uploads failed", error);

    return NextResponse.json(
      {
        success: false,
        error: "UPLOAD_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "تعذر رفع الصورة حاليًا.",
      },
      { status: 500 },
    );
  }
}
