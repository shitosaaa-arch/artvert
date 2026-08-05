import { NextResponse } from "next/server";

import {
  createDoctorSession,
} from "@/engine/doctor/conversation/session-manager";
import { createKnowledgeEngine } from "@/engine/knowledge/knowledge-engine";
import { enforceRateLimit } from "@/lib/customers/rate-limit";
import { requestIpHash } from "@/lib/customers/security";
import { getDoctorSessionStore } from "@/lib/doctor/session-store";
import { processDoctorImage } from "@/lib/doctor/vision/image-processor";
import { getTemporaryVisionImageStore } from "@/lib/doctor/vision/image-store";
import { createKnowledgeExportStore } from "@/lib/knowledge/export/knowledge-export-store-factory";
import { flags } from "@/lib/platform/flags";
import {
  reportError,
  requestId,
} from "@/lib/platform/observability";

export const runtime = "nodejs";

function isValidSessionId(
  value: FormDataEntryValue | null,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

async function getOrCreateSession(
  requestedSessionId:
    | string
    | undefined,
) {
  const sessions =
    getDoctorSessionStore();

  if (requestedSessionId) {
    const existing =
      await sessions.get(
        requestedSessionId,
      );

    if (!existing) {
      return {
        status:
          "session_expired" as const,
      };
    }

    return {
      status: "ready" as const,
      session: existing,
    };
  }

  const reader =
    createKnowledgeEngine(
      createKnowledgeExportStore(),
    );

  const release =
    await reader.readActiveRelease();

  const now =
    new Date().toISOString();

  const state =
    createDoctorSession({
      releaseVersion:
        release.releaseVersion,
      manifestChecksum:
        release.manifestChecksum,
      contentChecksum:
        release.contentChecksum,
      now,
    });

  const created =
    await sessions.create(state);

  return {
    status: "ready" as const,
    session: created,
  };
}

export async function POST(
  request: Request,
) {
  try {
    if (!flags.vision()) {
      return NextResponse.json(
        {
          status:
            "vision_disabled",
          error:
            "تحليل الصور غير متاح حاليًا.",
        },
        {
          status: 503,
        },
      );
    }

    enforceRateLimit(
      "doctor-image",
      requestIpHash(request),
      10,
      60 * 1000,
    );

    const form =
      await request.formData();

    const sessionValue =
      form.get("sessionId");

    const image =
      form.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          status:
            "image_invalid",
          error:
            "اختر صورة واحدة للنبات.",
        },
        {
          status: 400,
        },
      );
    }

    const requestedSessionId =
      isValidSessionId(
        sessionValue,
      )
        ? sessionValue.trim()
        : undefined;

    const sessionResult =
      await getOrCreateSession(
        requestedSessionId,
      );

    if (
      sessionResult.status ===
      "session_expired"
    ) {
      return NextResponse.json(
        {
          status:
            "session_expired",
          error:
            "انتهت الجلسة. ابدأ محادثة جديدة ثم ارفع الصورة مرة أخرى.",
        },
        {
          status: 409,
        },
      );
    }

    const processed =
      await processDoctorImage(
        Buffer.from(
          await image.arrayBuffer(),
        ),
      );

    const imageRef =
      getTemporaryVisionImageStore().put(
        sessionResult.session.id,
        processed.image,
      );

    const acceptable =
      processed.quality.includes(
        "ACCEPTABLE",
      );

    return NextResponse.json({
      sessionId:
        sessionResult.session.id,
      status: acceptable
        ? "image_ready"
        : "image_quality_insufficient",
      imageRef,
      qualityFindings:
        processed.quality,
      recaptureGuidance:
        processed.guidance,
    });
  } catch (error) {
    reportError(error, {
      requestId:
        requestId(
          request.headers,
        ),
      route:
        "doctor-image",
    });

    const code =
      error instanceof Error
        ? error.message
        : "IMAGE_PROCESSING_FAILED";

    const status =
      code === "IMAGE_INVALID" ||
      code ===
        "IMAGE_UPLOAD_LIMIT"
        ? "image_invalid"
        : "vision_processing_failed";

    return NextResponse.json(
      {
        status,
        error:
          "تعذر تجهيز الصورة بأمان. جرّب صورة أوضح وأصغر حجمًا.",
      },
      {
        status: 400,
      },
    );
  }
}
