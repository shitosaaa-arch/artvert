import crypto from "node:crypto";

import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function isStrongPassword(password: string) {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token =
      typeof body?.token === "string"
        ? body.token.trim()
        : "";

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "رابط إعادة تعيين كلمة المرور غير صالح.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "كلمة المرور يجب أن تكون 12 حرفًا على الأقل وتحتوي على حرف كبير وصغير ورقم ورمز.",
        },
        {
          status: 400,
        },
      );
    }

    const tokenHash =
      hashToken(token);

    const resetToken =
      await prisma.userPasswordResetToken.findUnique({
        where: {
          tokenHash,
        },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          usedAt: true,
          user: {
            select: {
              active: true,
            },
          },
        },
      });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() <=
        Date.now() ||
      !resetToken.user.active
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "رابط إعادة تعيين كلمة المرور غير صالح أو انتهت صلاحيته.",
        },
        {
          status: 400,
        },
      );
    }

    const passwordHash =
      await hash(password, 12);

    const now =
      new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordHash,
        },
      }),

      prisma.userPasswordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          usedAt: now,
        },
      }),

      prisma.userPasswordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: {
            not: resetToken.id,
          },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "[reset-password]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "تعذر تغيير كلمة المرور. حاول مرة أخرى.",
      },
      {
        status: 500,
      },
    );
  }
}