import type { User } from "@prisma/client";

import { isUserRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import type {
  CreateDirectoryUser,
  DirectoryUser,
  UserDirectory,
} from "@/lib/auth/user-directory";
import {
  UserDirectoryConfigurationError,
  UserDirectoryConflictError,
} from "@/lib/auth/user-directory-errors";

const normalizeEmail = (email: string) =>
  email.trim().toLowerCase();

function toDirectoryUser(
  user: User,
): DirectoryUser {
  if (!isUserRole(user.role)) {
    throw new Error(
      "The database contains an unsupported user role.",
    );
  }

  if (!user.passwordHash) {
    throw new Error(
      "The database user does not have a password hash.",
    );
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    active: user.active,
    createdAt:
      user.createdAt.toISOString(),
    updatedAt:
      user.updatedAt.toISOString(),
  };
}

export const prismaUserDirectory: UserDirectory =
  {
    async findByEmail(email) {
      try {
        const user =
          await getPrismaClient().user.findFirst(
            {
              where: {
                email:
                  normalizeEmail(email),
                active: true,
                passwordHash: {
                  not: null,
                },
              },
            },
          );

        return user
          ? toDirectoryUser(user)
          : null;
      } catch (error) {
        if (
          error instanceof
          UserDirectoryConfigurationError
        ) {
          throw error;
        }

        throw new UserDirectoryConfigurationError(
          "The Prisma user directory is unavailable.",
        );
      }
    },

    async createUser(
      user: CreateDirectoryUser,
    ) {
      try {
        const prisma =
          getPrismaClient();

        const email =
          normalizeEmail(user.email);

        const existingUser =
          await prisma.user.findUnique({
            where: {
              email,
            },
          });

        if (existingUser) {
          throw new UserDirectoryConflictError(
            email,
          );
        }

        const createdUser =
          await prisma.user.create({
            data: {
              id: user.id,
              name: user.name,
              email,
              passwordHash:
                user.passwordHash,
              role: user.role,
              active: user.active,

              ...(user.createdAt
                ? {
                    createdAt: new Date(
                      user.createdAt,
                    ),
                  }
                : {}),

              ...(user.updatedAt
                ? {
                    updatedAt: new Date(
                      user.updatedAt,
                    ),
                  }
                : {}),
            },
          });

        return toDirectoryUser(
          createdUser,
        );
      } catch (error) {
        if (
          error instanceof
            UserDirectoryConflictError ||
          error instanceof
            UserDirectoryConfigurationError
        ) {
          throw error;
        }

        throw new UserDirectoryConfigurationError(
          "The Prisma user directory is unavailable.",
        );
      }
    },
  };