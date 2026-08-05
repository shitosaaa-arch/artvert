import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { getPrismaClient } from "@/lib/db/prisma";
import { createKnowledgeExportStore } from "@/lib/knowledge/export/knowledge-export-store-factory";
import { KnowledgeGenerator } from "@/lib/knowledge/knowledge-generator";
import { createPrismaKnowledgeEntityRepository } from "@/lib/knowledge/prisma/prisma-knowledge-repository";
import { PrismaKnowledgeReleaseRepository } from "@/lib/knowledge/prisma/prisma-knowledge-release-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type GenerateKnowledgeResponse = {
  success: true;
  message: string;
  release: {
    version: string;
    contentChecksum: string;
    generatedAt: string;
  };
};

type KnowledgeErrorResponse = {
  success: false;
  error: string;
  message: string;
};

async function authorizeKnowledgeGeneration() {
  const session = await getServerSession(
    authOptions,
  );

  if (
    !session?.user?.id ||
    !session.user.role
  ) {
    return {
      authorized: false as const,
      response: NextResponse.json<KnowledgeErrorResponse>(
        {
          success: false,
          error: "UNAUTHORIZED",
          message: "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const role = String(
    session.user.role,
  ).toUpperCase();

  if (
    role !== "ADMIN" &&
    role !== "SUPER_ADMIN"
  ) {
    return {
      authorized: false as const,
      response: NextResponse.json<KnowledgeErrorResponse>(
        {
          success: false,
          error: "FORBIDDEN",
          message:
            "ليس لديك صلاحية لتوليد قاعدة المعرفة.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    authorized: true as const,
    actor: {
      id: session.user.id,
      role,
    },
  };
}

function buildGenerator() {
  const prisma = getPrismaClient();

  return new KnowledgeGenerator(
    createPrismaKnowledgeEntityRepository(
      prisma,
    ),
    new PrismaKnowledgeReleaseRepository(
      prisma,
    ),
    createKnowledgeExportStore(),
  );
}

export async function POST() {
  try {
    const authorization =
      await authorizeKnowledgeGeneration();

    if (!authorization.authorized) {
      return authorization.response;
    }

    const startedAt = Date.now();

    console.info(
      "Knowledge generation started",
      {
        actorId:
          authorization.actor.id,
        exportStore:
          process.env
            .KNOWLEDGE_EXPORT_STORE ??
          (process.env.NODE_ENV ===
          "production"
            ? "blob"
            : "filesystem"),
      },
    );

    const result =
      await buildGenerator().generate();

    const generatedAt =
      new Date().toISOString();

    console.info(
      "Knowledge generation completed",
      {
        actorId:
          authorization.actor.id,
        version: result.version,
        contentChecksum:
          result.contentChecksum,
        durationMs:
          Date.now() - startedAt,
      },
    );

    return NextResponse.json<GenerateKnowledgeResponse>(
      {
        success: true,
        message:
          "تم توليد وتفعيل قاعدة المعرفة بنجاح.",
        release: {
          version: result.version,
          contentChecksum:
            result.contentChecksum,
          generatedAt,
        },
      },
      {
        status: 201,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "POST /api/admin/knowledge/generate failed:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "تعذر توليد قاعدة المعرفة.";

    const normalizedMessage =
      message.toLowerCase();

    const isBusy =
      normalizedMessage.includes(
        "lease",
      ) ||
      normalizedMessage.includes(
        "lock",
      ) ||
      normalizedMessage.includes(
        "already in progress",
      );

    return NextResponse.json<KnowledgeErrorResponse>(
      {
        success: false,
        error: isBusy
          ? "KNOWLEDGE_GENERATION_BUSY"
          : "KNOWLEDGE_GENERATION_FAILED",
        message: isBusy
          ? "يوجد توليد معرفة جارٍ بالفعل. انتظر قليلًا ثم حاول مرة أخرى."
          : message,
      },
      {
        status: isBusy ? 409 : 500,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  }
}
