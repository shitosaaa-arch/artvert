import { promises as fs } from "node:fs";
import path from "node:path";
import { isUserRole } from "@/lib/auth/roles";
import type { DirectoryUser, UserDirectory } from "@/lib/auth/user-directory";
const file = path.join(process.cwd(), "data", "auth", "users.json");

export const jsonUserDirectory: UserDirectory = {
  async findByEmail(email) {
    try {
      const users = JSON.parse(await fs.readFile(file, "utf8")) as DirectoryUser[];
      return users.find(
        (user) =>
          user.email.toLowerCase() === email.toLowerCase() &&
          user.active &&
          isUserRole(user.role),
      ) ?? null;
    } catch {
      return null;
    }
  },
};
