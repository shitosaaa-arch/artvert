import { promises as fs } from "node:fs";
import path from "node:path";
import { isUserRole } from "@/lib/auth/roles";
import { UserDirectoryConflictError } from "@/lib/auth/user-directory-errors";
import type { CreateDirectoryUser, DirectoryUser, UserDirectory } from "@/lib/auth/user-directory";
const file = path.join(process.cwd(), "data", "auth", "users.json");

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function readUsers() {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as DirectoryUser[];
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeUsersAtomically(users: DirectoryUser[]) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporaryFile = `${file}.${process.pid}.${Date.now()}.tmp`;

  try {
    await fs.writeFile(temporaryFile, `${JSON.stringify(users, null, 2)}\n`, "utf8");
    await fs.rename(temporaryFile, file);
  } catch (error) {
    await fs.rm(temporaryFile, { force: true });
    throw error;
  }
}

export const jsonUserDirectory: UserDirectory = {
  async findByEmail(email) {
    try {
      const users = await readUsers();
      return users.find(
        (user) =>
          user.email.toLowerCase() === normalizeEmail(email) &&
          user.active &&
          isUserRole(user.role),
      ) ?? null;
    } catch {
      return null;
    }
  },
  async createUser(user: CreateDirectoryUser) {
    if (!isUserRole(user.role)) throw new Error("The user role is invalid.");

    const users = await readUsers();
    const email = normalizeEmail(user.email);
    if (users.some((existingUser) => normalizeEmail(existingUser.email) === email)) {
      throw new UserDirectoryConflictError(email);
    }

    const now = new Date().toISOString();
    const createdUser: DirectoryUser = {
      ...user,
      email,
      createdAt: user.createdAt ?? now,
      updatedAt: user.updatedAt ?? now,
    };
    await writeUsersAtomically([...users, createdUser]);
    return createdUser;
  },
};
