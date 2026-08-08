import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail/mailer";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body?.email === "string"
        ? normalizeEmail(body.email)
        : "";

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid email address.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      return NextResponse.json({
        ok: true,
      });
    }

    const rawToken =
      crypto.randomBytes(32).toString("hex");

    const tokenHash =
      hashToken(rawToken);

    const expiresAt =
      new Date(
        Date.now() +
          RESET_TOKEN_TTL_MS,
      );

    await prisma.$transaction([
      prisma.userPasswordResetToken.deleteMany({
        where: {
          userId: user.id,
        },
      }),

      prisma.userPasswordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const resetUrl =
      `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (mailError) {
      console.error(
        "[forgot-password-mail]",
        mailError,
      );

      await prisma.userPasswordResetToken.deleteMany({
        where: {
          userId: user.id,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to send password reset email.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "[forgot-password]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to process password reset request.",
      },
      {
        status: 500,
      },
    );
  }
}