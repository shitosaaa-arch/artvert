import dotenv from "dotenv";

import { promises as fs } from "node:fs";
import path from "node:path";

import { getPrismaClient } from "../lib/db/prisma";
import { isUserRole } from "../lib/auth/roles";

dotenv.config({ path: ".env.local" });

type JsonUser = {
  id?: unknown;
  name?: unknown;
  email?: unknown;
  passwordHash?: unknown;
  role?: unknown;
  active?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type ImportSummary = { imported: number; skipped: number; failed: number };

const usersFile = path.join(process.cwd(), "data", "auth", "users.json");
const isValidId = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_-]{1,191}$/.test(value);
const isValidDate = (value: unknown): value is string => typeof value === "string" && !Number.isNaN(Date.parse(value));
const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function importUsers() {
  const users = JSON.parse(await fs.readFile(usersFile, "utf8")) as JsonUser[];
  const prisma = getPrismaClient();
  const summary: ImportSummary = { imported: 0, skipped: 0, failed: 0 };

  for (const user of users) {
    if (
      typeof user.name !== "string" ||
      typeof user.email !== "string" ||
      typeof user.passwordHash !== "string" ||
      typeof user.active !== "boolean" ||
      !isUserRole(user.role) ||
      !isValidDate(user.createdAt) ||
      !isValidDate(user.updatedAt)
    ) {
      summary.failed += 1;
      continue;
    }

    const email = normalizeEmail(user.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || user.passwordHash.length === 0) {
      summary.failed += 1;
      continue;
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      summary.skipped += 1;
      continue;
    }
    if (isValidId(user.id) && await prisma.user.findUnique({ where: { id: user.id } })) {
      summary.failed += 1;
      continue;
    }

    try {
      await prisma.user.create({
        data: {
          ...(isValidId(user.id) ? { id: user.id } : {}),
          name: user.name.trim(),
          email,
          passwordHash: user.passwordHash,
          role: user.role,
          active: user.active,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
      summary.imported += 1;
    } catch {
      summary.failed += 1;
    }
  }

  console.log(`Import summary: imported=${summary.imported}, skipped=${summary.skipped}, failed=${summary.failed}`);
  if (summary.failed > 0) process.exitCode = 1;
}

async function main() {
  const prisma = getPrismaClient();
  try {
    await importUsers();
  } catch {
    console.error("User import failed before completion.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
