import { PrismaClient } from "@prisma/client";
import { UserDirectoryConfigurationError } from "@/lib/auth/user-directory-errors";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new UserDirectoryConfigurationError("DATABASE_URL is required when AUTH_USER_DIRECTORY=prisma.");
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
  }

  return globalForPrisma.prisma;
}
