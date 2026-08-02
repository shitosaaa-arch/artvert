import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";

export async function auditCustomer(action: string, targetType: string, options: { customerId?: string; targetId?: string; actorType?: "CUSTOMER" | "STAFF" | "SYSTEM"; metadata?: Prisma.InputJsonValue } = {}) {
  await getPrismaClient().customerAuditLog.create({ data: { action, targetType, customerId: options.customerId, targetId: options.targetId, actorType: options.actorType ?? "SYSTEM", metadata: options.metadata } });
}
