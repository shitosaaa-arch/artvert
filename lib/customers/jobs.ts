import { CustomerJobStatus, CustomerJobType, type Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { auditCustomer } from "@/lib/customers/audit";

const exportData = async (customerId: string) => {
  const customer = await getPrismaClient().customer.findUniqueOrThrow({ where: { id: customerId }, include: { diagnoses: { orderBy: { createdAt: "desc" } }, savedPlants: true, productFavorites: true } });
  return { version: 1, exportedAt: new Date().toISOString(), profile: { email: customer.email, displayName: customer.displayName, locale: customer.locale, consent: { historyOptIn: customer.historyOptIn, imageSavingOptIn: customer.imageSavingOptIn, analyticsOptIn: customer.analyticsOptIn, marketingOptIn: customer.marketingOptIn } }, diagnoses: customer.diagnoses.map((item) => ({ createdAt: item.createdAt.toISOString(), summary: item.summary })), savedPlantIds: customer.savedPlants.map((item) => item.plantId), favoriteProductIds: customer.productFavorites.map((item) => item.productId) };
};

export async function enqueueCustomerJob(customerId: string, type: CustomerJobType) {
  const job = await getPrismaClient().customerJob.create({ data: { customerId, type } });
  await auditCustomer(`CUSTOMER_${type}_REQUESTED`, "CustomerJob", { customerId, targetId: job.id, actorType: "CUSTOMER" }); return job;
}

/** Intended for a queue worker/cron. Route handlers only enqueue jobs. */
export async function processCustomerJobs(limit = 20, customerIds?: string[]) {
  const prisma = getPrismaClient(); const jobs = await prisma.customerJob.findMany({ where: { status: CustomerJobStatus.PENDING, ...(customerIds ? { customerId: { in: customerIds } } : {}) }, orderBy: { createdAt: "asc" }, take: Math.min(Math.max(limit, 1), 100) });
  for (const job of jobs) {
    const claimed = await prisma.customerJob.updateMany({ where: { id: job.id, status: CustomerJobStatus.PENDING }, data: { status: CustomerJobStatus.PROCESSING, startedAt: new Date() } }); if (!claimed.count) continue;
    try {
      if (!job.customerId) throw new Error("CUSTOMER_JOB_ORPHANED");
      if (job.type === CustomerJobType.DATA_EXPORT) {
        const payload = await exportData(job.customerId);
        await prisma.customerJob.update({ where: { id: job.id }, data: { status: CustomerJobStatus.COMPLETED, result: payload as Prisma.InputJsonValue, completedAt: new Date() } });
      } else {
        // Delete only after a durable asynchronous request; this cascades all customer-private data and sessions.
        await prisma.customer.delete({ where: { id: job.customerId } });
        await prisma.customerJob.update({ where: { id: job.id }, data: { status: CustomerJobStatus.COMPLETED, completedAt: new Date() } });
      }
    } catch {
      await prisma.customerJob.update({ where: { id: job.id }, data: { status: CustomerJobStatus.FAILED, errorCode: "PROCESSING_FAILED", completedAt: new Date() } });
    }
  }
  return jobs.length;
}

export async function cleanupCustomerRetention(now = new Date(), customerIds?: string[]) {
  const prisma = getPrismaClient();
  const customerScope = customerIds ? { customerId: { in: customerIds } } : {};
  const [tokens, sessions, images] = await Promise.all([
    prisma.customerToken.deleteMany({ where: { ...customerScope, OR: [{ expiresAt: { lte: now } }, { usedAt: { not: null } }] } }),
    prisma.customerSession.deleteMany({ where: { ...customerScope, OR: [{ expiresAt: { lte: now } }, { revokedAt: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }] } }),
    prisma.customerSavedImage.deleteMany({ where: { ...customerScope, expiresAt: { lte: now } } }),
  ]);
  return { tokens: tokens.count, sessions: sessions.count, images: images.count };
}
