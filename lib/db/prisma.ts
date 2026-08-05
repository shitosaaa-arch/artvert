import {
  Prisma,
  PrismaClient,
} from "@prisma/client";

import { UserDirectoryConfigurationError } from "@/lib/auth/user-directory-errors";

type GlobalPrismaState = {
  prisma?: PrismaClient;
};

const globalForPrisma =
  globalThis as unknown as GlobalPrismaState;

function getDatabaseUrl() {
  const databaseUrl =
    process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new UserDirectoryConfigurationError(
      "DATABASE_URL is required when AUTH_USER_DIRECTORY=prisma.",
    );
  }

  return databaseUrl;
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        /*
         * الموقع وكل سكريبتات الاستيراد تستخدم DATABASE_URL.
         * DATABASE_URL يجب أن يكون رابط Neon Pooler.
         *
         * DIRECT_URL يظل مخصصًا لأوامر Prisma CLI
         * مثل migrations وdb push وdb pull.
         */
        url: getDatabaseUrl(),
      },
    },

    transactionOptions: {
      maxWait: 15000,
      timeout: 60000,
      isolationLevel:
        Prisma.TransactionIsolationLevel.ReadCommitted,
    },

    log:
      process.env.NODE_ENV ===
      "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma =
      createPrismaClient();
  }

  return globalForPrisma.prisma;
}