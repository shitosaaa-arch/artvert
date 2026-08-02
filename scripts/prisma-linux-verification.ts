import dotenv from "dotenv";

import { hash } from "bcryptjs";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { User } from "@prisma/client";

import { authOptions } from "../lib/auth/options";
import { getPrismaClient } from "../lib/db/prisma";
import { UserRole } from "../lib/auth/roles";

dotenv.config({ path: ".env.local" });

function getVerificationPassword(): string {
  const password = process.env.SPRINT3_VERIFICATION_PASSWORD;
  if (!password) {
    throw new Error("SPRINT3_VERIFICATION_PASSWORD is required for Linux verification.");
  }
  return password;
}

const verificationPassword = getVerificationPassword();
export const verificationEmails = {
  superAdmin: "sprint3-verification-super-admin@example.test",
  admin: "sprint3-verification-admin@example.test",
  agronomist: "sprint3-verification-agronomist@example.test",
  inactive: "sprint3-verification-inactive@example.test",
} as const;

const usersFile = path.join(process.cwd(), "data", "auth", "users.json");
const temporaryUsersFile = `${usersFile}.sprint3-verification`;
const importLogs = [
  path.join(process.cwd(), "first-import.log"),
  path.join(process.cwd(), "second-import.log"),
];
const allEmails = Object.values(verificationEmails);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function credentialsAuthorize() {
  const provider = authOptions.providers.find((candidate) => candidate.id === "credentials") as {
    options?: {
      authorize?: (credentials: Record<string, string>) => Promise<User | null>;
    };
  };
  assert(provider?.options?.authorize, "Credentials authorization is not configured.");
  return provider.options.authorize;
}

export async function prepareVerificationUsers() {
  const prisma = getPrismaClient();
  const passwordHash = await hash(verificationPassword, 12);
  const now = new Date().toISOString();
  const users = [
    { id: "sprint3_verify_super", name: "Sprint 3 Super Admin", email: verificationEmails.superAdmin, passwordHash, role: UserRole.SUPER_ADMIN, active: true, createdAt: now, updatedAt: now },
    { id: "sprint3_verify_admin", name: "Sprint 3 Admin", email: verificationEmails.admin, passwordHash, role: UserRole.ADMIN, active: true, createdAt: now, updatedAt: now },
    { id: "sprint3_verify_agronomist", name: "Sprint 3 Agronomist", email: verificationEmails.agronomist, passwordHash, role: UserRole.AGRONOMIST, active: true, createdAt: now, updatedAt: now },
    { id: "sprint3_verify_inactive", name: "Sprint 3 Inactive", email: verificationEmails.inactive, passwordHash, role: UserRole.ADMIN, active: false, createdAt: now, updatedAt: now },
  ];

  try {
    await prisma.user.deleteMany({ where: { email: { in: allEmails } } });
    await fs.mkdir(path.dirname(usersFile), { recursive: true });
    await fs.writeFile(temporaryUsersFile, `${JSON.stringify(users, null, 2)}\n`, "utf8");
    await fs.rename(temporaryUsersFile, usersFile);
    console.log("prisma-linux-fixture:prepared");
  } finally {
    await prisma.$disconnect();
  }
}

export async function verifyPrismaUsers() {
  const prisma = getPrismaClient();
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    const migrationRows = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
      "SELECT migration_name FROM _prisma_migrations WHERE migration_name = '20260802000000_init_users' AND finished_at IS NOT NULL",
    );
    assert(migrationRows.length === 1, "The initial migration is not applied.");

    const { getUserDirectory } = await import("../lib/auth/user-directory-factory");
    const directory = getUserDirectory();
    const [superAdmin, admin, agronomist, inactive, unknown] = await Promise.all([
      directory.findByEmail(verificationEmails.superAdmin),
      directory.findByEmail(verificationEmails.admin),
      directory.findByEmail(verificationEmails.agronomist),
      directory.findByEmail(verificationEmails.inactive),
      directory.findByEmail("sprint3-verification-unknown@example.test"),
    ]);
    assert(superAdmin?.role === UserRole.SUPER_ADMIN, "SUPER_ADMIN lookup or role mapping failed.");
    assert(admin?.role === UserRole.ADMIN, "ADMIN lookup or role mapping failed.");
    assert(agronomist?.role === UserRole.AGRONOMIST, "AGRONOMIST lookup or role mapping failed.");
    assert(inactive === null, "Inactive users must not be returned by the directory.");
    assert(unknown === null, "Unknown users must not be returned by the directory.");

    const authorize = credentialsAuthorize();
    const [authorizedSuperAdmin, authorizedAdmin, authorizedAgronomist, invalidPassword, inactiveUser, unknownUser] = await Promise.all([
      authorize({ email: verificationEmails.superAdmin, password: verificationPassword, remember: "false" }),
      authorize({ email: verificationEmails.admin, password: verificationPassword, remember: "false" }),
      authorize({ email: verificationEmails.agronomist, password: verificationPassword, remember: "false" }),
      authorize({ email: verificationEmails.superAdmin, password: `${verificationPassword}-invalid`, remember: "false" }),
      authorize({ email: verificationEmails.inactive, password: verificationPassword, remember: "false" }),
      authorize({ email: "sprint3-verification-unknown@example.test", password: verificationPassword, remember: "false" }),
    ]);
    assert(authorizedSuperAdmin?.role === UserRole.SUPER_ADMIN, "SUPER_ADMIN credentials authorization failed.");
    assert(authorizedAdmin?.role === UserRole.ADMIN, "ADMIN credentials authorization failed.");
    assert(authorizedAgronomist?.role === UserRole.AGRONOMIST, "AGRONOMIST credentials authorization failed.");
    assert(invalidPassword === null, "Invalid credentials must be rejected.");
    assert(inactiveUser === null, "Inactive credentials must be rejected.");
    assert(unknownUser === null, "Unknown credentials must be rejected.");
    console.log("prisma-linux-verification:ok");
  } finally {
    await prisma.$disconnect();
  }
}

export async function cleanupVerificationUsers() {
  const prisma = getPrismaClient();
  try {
    await prisma.user.deleteMany({ where: { email: { in: allEmails } } });
    await Promise.all([
      fs.rm(usersFile, { force: true }),
      fs.rm(temporaryUsersFile, { force: true }),
      ...importLogs.map((importLog) => fs.rm(importLog, { force: true })),
    ]);
    console.log("prisma-linux-fixture:cleaned");
  } finally {
    await prisma.$disconnect();
  }
}

const command = process.argv[2];
const actions: Record<string, () => Promise<void>> = {
  prepare: prepareVerificationUsers,
  verify: verifyPrismaUsers,
  cleanup: cleanupVerificationUsers,
};

if (command) {
  const action = actions[command];
  if (!action) throw new Error("Unknown Prisma Linux verification command.");
  action().catch(() => {
    console.error("Prisma Linux verification failed.");
    process.exitCode = 1;
  });
}
