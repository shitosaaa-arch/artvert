import { hash } from "bcryptjs";
import { CustomerTokenPurpose, type Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { auditCustomer } from "@/lib/customers/audit";
import { hashCustomerSecret, newCustomerSecret, normalizeCustomerEmail } from "@/lib/customers/security";

const SESSION_LIMIT = 5;
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validPassword = (password: string) => password.length >= 12 && password.length <= 128;

export class CustomerService {
  async register(input: { email: string; password: string; displayName: string; locale?: string }, context: { userAgent?: string; ipHash?: string }) {
    const email = normalizeCustomerEmail(input.email); const displayName = input.displayName.trim();
    if (!validEmail(email) || !validPassword(input.password) || !displayName || displayName.length > 100) throw new Error("INVALID_REGISTRATION");
    const prisma = getPrismaClient();
    if (await prisma.customer.findUnique({ where: { email } })) throw new Error("EMAIL_IN_USE");
    const customer = await prisma.customer.create({ data: { email, displayName, locale: input.locale === "en" ? "en" : "ar-EG", passwordHash: await hash(input.password, 12) } });
    const verificationToken = await this.issueToken(customer.id, CustomerTokenPurpose.EMAIL_VERIFICATION);
    const sessionToken = await this.createSession(customer.id, context);
    await auditCustomer("CUSTOMER_REGISTERED", "Customer", { customerId: customer.id, actorType: "CUSTOMER" });
    return { customer, sessionToken, verificationToken };
  }

  async login(emailInput: string, password: string, context: { userAgent?: string; ipHash?: string }) {
    const { compare } = await import("bcryptjs"); const customer = await getPrismaClient().customer.findUnique({ where: { email: normalizeCustomerEmail(emailInput) } });
    if (!customer || !customer.active || !(await compare(password, customer.passwordHash))) throw new Error("INVALID_CREDENTIALS");
    const sessionToken = await this.createSession(customer.id, context); await auditCustomer("CUSTOMER_LOGGED_IN", "CustomerSession", { customerId: customer.id, actorType: "CUSTOMER" });
    return { customer, sessionToken };
  }

  async createSession(customerId: string, context: { userAgent?: string; ipHash?: string }) {
    const prisma = getPrismaClient(); const token = newCustomerSecret(); const now = new Date();
    await prisma.$transaction(async (tx) => {
      const active = await tx.customerSession.findMany({ where: { customerId, revokedAt: null, expiresAt: { gt: now } }, orderBy: { lastSeenAt: "asc" } });
      const excess = active.slice(0, Math.max(0, active.length - SESSION_LIMIT + 1));
      if (excess.length) await tx.customerSession.updateMany({ where: { id: { in: excess.map((item) => item.id) } }, data: { revokedAt: now } });
      await tx.customerSession.create({ data: { customerId, tokenHash: hashCustomerSecret(token), userAgent: context.userAgent?.slice(0, 300), ipHash: context.ipHash, expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } });
    });
    return token;
  }

  async logout(token: string) { await getPrismaClient().customerSession.updateMany({ where: { tokenHash: hashCustomerSecret(token), revokedAt: null }, data: { revokedAt: new Date() } }); }
  async revokeOtherSessions(customerId: string, currentSessionId: string) { await getPrismaClient().customerSession.updateMany({ where: { customerId, id: { not: currentSessionId }, revokedAt: null }, data: { revokedAt: new Date() } }); await auditCustomer("CUSTOMER_SESSIONS_REVOKED", "CustomerSession", { customerId, actorType: "CUSTOMER" }); }

  async issueToken(customerId: string, purpose: CustomerTokenPurpose) {
    const prisma = getPrismaClient(); const raw = newCustomerSecret(); const now = new Date();
    await prisma.customerToken.updateMany({ where: { customerId, purpose, usedAt: null }, data: { usedAt: now } });
    await prisma.customerToken.create({ data: { customerId, purpose, tokenHash: hashCustomerSecret(raw), expiresAt: new Date(now.getTime() + 60 * 60 * 1000) } });
    return raw;
  }
  async useToken(raw: string, purpose: CustomerTokenPurpose) {
    const prisma = getPrismaClient(); const token = await prisma.customerToken.findFirst({ where: { tokenHash: hashCustomerSecret(raw), purpose, usedAt: null, expiresAt: { gt: new Date() } } });
    if (!token) throw new Error("TOKEN_INVALID"); await prisma.customerToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }); return token.customerId;
  }
  async requestPasswordReset(email: string) { const customer = await getPrismaClient().customer.findUnique({ where: { email: normalizeCustomerEmail(email) } }); return customer?.active ? this.issueToken(customer.id, CustomerTokenPurpose.PASSWORD_RESET) : null; }
  async resetPassword(token: string, password: string) { if (!validPassword(password)) throw new Error("INVALID_PASSWORD"); const customerId = await this.useToken(token, CustomerTokenPurpose.PASSWORD_RESET); await getPrismaClient().customer.update({ where: { id: customerId }, data: { passwordHash: await hash(password, 12) } }); await getPrismaClient().customerSession.updateMany({ where: { customerId, revokedAt: null }, data: { revokedAt: new Date() } }); await auditCustomer("CUSTOMER_PASSWORD_RESET", "Customer", { customerId, actorType: "CUSTOMER" }); }
  async verifyEmail(token: string) { const customerId = await this.useToken(token, CustomerTokenPurpose.EMAIL_VERIFICATION); await getPrismaClient().customer.update({ where: { id: customerId }, data: { emailVerifiedAt: new Date() } }); await auditCustomer("CUSTOMER_EMAIL_VERIFIED", "Customer", { customerId, actorType: "CUSTOMER" }); }
  async updateProfile(customerId: string, input: { displayName?: string; locale?: string; historyOptIn?: boolean; imageSavingOptIn?: boolean; analyticsOptIn?: boolean; marketingOptIn?: boolean }) {
    const data: Prisma.CustomerUpdateInput = {};
    if (input.displayName !== undefined) { const name = input.displayName.trim(); if (!name || name.length > 100) throw new Error("INVALID_PROFILE"); data.displayName = name; }
    if (input.locale !== undefined) data.locale = input.locale === "en" ? "en" : "ar-EG";
    for (const key of ["historyOptIn", "imageSavingOptIn", "analyticsOptIn", "marketingOptIn"] as const) if (typeof input[key] === "boolean") data[key] = input[key];
    if (data.imageSavingOptIn === true && data.historyOptIn !== true) { const current = await getPrismaClient().customer.findUniqueOrThrow({ where: { id: customerId } }); if (!current.historyOptIn) throw new Error("IMAGE_SAVING_REQUIRES_HISTORY_CONSENT"); }
    const customer = await getPrismaClient().customer.update({ where: { id: customerId }, data }); await auditCustomer("CUSTOMER_PRIVACY_UPDATED", "Customer", { customerId, actorType: "CUSTOMER" }); return customer;
  }
}
