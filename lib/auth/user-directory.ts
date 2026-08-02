import type { UserRole } from "@/lib/auth/roles";

export type DirectoryUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export interface UserDirectory {
  findByEmail(email: string): Promise<DirectoryUser | null>;
}
