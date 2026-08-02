import { jsonUserDirectory } from "@/lib/auth/json-user-directory";
import { prismaUserDirectory } from "@/lib/auth/prisma-user-directory";
import { UserDirectoryConfigurationError } from "@/lib/auth/user-directory-errors";
import type { UserDirectory } from "@/lib/auth/user-directory";

type UserDirectoryMode = "json" | "prisma";

function resolveUserDirectoryMode(): UserDirectoryMode {
  const configuredMode = process.env.AUTH_USER_DIRECTORY;

  if (!configuredMode) {
    if (process.env.NODE_ENV === "production") {
      throw new UserDirectoryConfigurationError("AUTH_USER_DIRECTORY must be set to prisma in production.");
    }
    return "json";
  }

  if (configuredMode !== "json" && configuredMode !== "prisma") {
    throw new UserDirectoryConfigurationError("AUTH_USER_DIRECTORY must be either json or prisma.");
  }
  if (configuredMode === "json" && process.env.NODE_ENV === "production") {
    throw new UserDirectoryConfigurationError("The JSON user directory is available only in local development.");
  }
  if (configuredMode === "prisma" && !process.env.DATABASE_URL) {
    throw new UserDirectoryConfigurationError("DATABASE_URL is required when AUTH_USER_DIRECTORY=prisma.");
  }

  return configuredMode;
}

export function getUserDirectory(): UserDirectory {
  return resolveUserDirectoryMode() === "json" ? jsonUserDirectory : prismaUserDirectory;
}
