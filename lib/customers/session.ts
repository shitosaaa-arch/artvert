import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/db/prisma";
import { CUSTOMER_SESSION_COOKIE, hashCustomerSecret } from "@/lib/customers/security";

export async function currentCustomer() {
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  const now = new Date();
  const session = await getPrismaClient().customerSession.findUnique({ where: { tokenHash: hashCustomerSecret(token) }, include: { customer: true } });
  if (!session || session.revokedAt || session.expiresAt <= now || !session.customer.active) return null;
  void getPrismaClient().customerSession.update({ where: { id: session.id }, data: { lastSeenAt: now } });
  return { id: session.customer.id, email: session.customer.email, displayName: session.customer.displayName, locale: session.customer.locale, emailVerifiedAt: session.customer.emailVerifiedAt, historyOptIn: session.customer.historyOptIn, imageSavingOptIn: session.customer.imageSavingOptIn, analyticsOptIn: session.customer.analyticsOptIn, marketingOptIn: session.customer.marketingOptIn, sessionId: session.id };
}

export async function requireCustomer() {
  const customer = await currentCustomer();
  if (!customer) throw new Error("CUSTOMER_UNAUTHORIZED");
  return customer;
}
