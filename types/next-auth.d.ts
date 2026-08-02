import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/lib/auth/roles";

declare module "next-auth" {
  interface User {
    role: UserRole;
    sessionExpiresAt: number;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      sessionExpiresAt: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    sessionExpiresAt?: number;
    userId?: string;
  }
}
