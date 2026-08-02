import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import type { UserRole } from "@/lib/auth/roles";

export async function requireRole(...allowed: UserRole[]) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user?.role ||
    !allowed.includes(session.user.role) ||
    !session.user.sessionExpiresAt ||
    session.user.sessionExpiresAt <= Date.now()
  ) {
    redirect("/login?error=AccessDenied");
  }

  return session;
}
