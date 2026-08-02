import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import dotenv from "dotenv";
import { CustomerAnalyticsEventType, CustomerJobStatus, CustomerJobType, CustomerTokenPurpose } from "@prisma/client";
import { getPrismaClient } from "../lib/db/prisma";
import { CustomerService } from "../lib/customers/service";
import { cleanupCustomerRetention, enqueueCustomerJob, processCustomerJobs } from "../lib/customers/jobs";
import { auditCustomer } from "../lib/customers/audit";
import { enforceRateLimit, resetRateLimitsForTests } from "../lib/customers/rate-limit";
import { hashCustomerSecret } from "../lib/customers/security";
import { rollupAnalytics } from "../lib/analytics/service";
import { UserRole } from "../lib/auth/roles";

dotenv.config({ path: ".env.local" });
const prefix = `sprint13-${randomUUID().slice(0, 12)}`;
const customerId = `${prefix}-customer`, deletionCustomerId = `${prefix}-delete`, staffId = `${prefix}-staff`, plantId = `${prefix}-plant`, productId = `${prefix}-product`;
const analyticsDate = new Date("2099-01-15T00:00:00.000Z"), analyticsHash = hashCustomerSecret(`${prefix}-analytics`);
const expect = (value: unknown, message: string): asserts value => assert.ok(value, message);
const jobIds: string[] = [];

async function main() {
  const prisma = getPrismaClient();
  try {
    // Isolated staff fixture exists only to satisfy knowledge ownership foreign keys; it is never an auth subject under test.
    await prisma.user.create({ data: { id: staffId, email: `${prefix}-staff@example.test`, name: "Sprint 13 Fixture", passwordHash: await hash("temporary-only-password", 12), role: UserRole.SUPER_ADMIN, active: false } });
    await prisma.knowledgeEntity.createMany({ data: [
      { id: plantId, type: "PLANT", slug: plantId, name: "Sprint 13 plant", payload: {}, schemaVersion: 1, publicationState: "DRAFT" },
      { id: productId, type: "PRODUCT", slug: productId, name: "Sprint 13 product", payload: {}, schemaVersion: 1, publicationState: "DRAFT" },
    ] });
    await prisma.plant.create({ data: { id: plantId, category: "CROP", createdByUserId: staffId } });
    await prisma.product.create({ data: { id: productId, category: "fixture", nameAr: "منتج اختبار", nameEn: "Fixture product", shortDescription: "fixture", description: "fixture", composition: "fixture", dosage: "fixture", packageSize: "fixture", benefits: [], crops: [], createdByUserId: staffId } });
    await prisma.customer.create({ data: { id: customerId, email: `${prefix}@example.test`, displayName: "عميل اختبار", passwordHash: await hash("temporary-only-password", 12) } });
    await prisma.customer.create({ data: { id: deletionCustomerId, email: `${prefix}-delete@example.test`, displayName: "حذف اختبار", passwordHash: await hash("temporary-only-password", 12) } });

    // Customer identity is separate from staff roles; customer-specific sessions/tokens are bounded and one-time.
    assert.ok(!Object.values(UserRole).includes("CUSTOMER" as UserRole));
    const customers = new CustomerService();
    await assert.rejects(() => customers.updateProfile(customerId, { imageSavingOptIn: true }), /IMAGE_SAVING_REQUIRES_HISTORY_CONSENT/);
    const updated = await customers.updateProfile(customerId, { historyOptIn: true, imageSavingOptIn: true, analyticsOptIn: true });
    assert.equal(updated.imageSavingOptIn, true);
    const verification = await customers.issueToken(customerId, CustomerTokenPurpose.EMAIL_VERIFICATION);
    assert.equal(await customers.useToken(verification, CustomerTokenPurpose.EMAIL_VERIFICATION), customerId);
    await assert.rejects(() => customers.useToken(verification, CustomerTokenPurpose.EMAIL_VERIFICATION), /TOKEN_INVALID/);
    for (let index = 0; index < 6; index += 1) await customers.createSession(customerId, { userAgent: "fixture", ipHash: "fixture" });
    assert.ok(await prisma.customerSession.count({ where: { customerId, revokedAt: null } }) <= 5, "customer session concurrency must be bounded");
    const current = await prisma.customerSession.findFirstOrThrow({ where: { customerId, revokedAt: null } }); await customers.revokeOtherSessions(customerId, current.id);
    assert.equal(await prisma.customerSession.count({ where: { customerId, revokedAt: null } }), 1);

    // Explicit consent gates private retention. No message, temporary image reference, or raw image is written.
    await prisma.customerDiagnosis.create({ data: { customerId, summary: { status: "completed", candidateIds: ["fixture"] } } });
    await prisma.customerSavedPlant.create({ data: { customerId, plantId } }); await prisma.customerProductFavorite.create({ data: { customerId, productId } });
    await prisma.customerSavedImage.create({ data: { customerId, storageKey: `customer-private/${prefix}`, contentType: "image/jpeg", expiresAt: new Date(Date.now() - 1_000) } });
    const expiredToken = await customers.issueToken(customerId, CustomerTokenPurpose.PASSWORD_RESET); await prisma.customerToken.updateMany({ where: { tokenHash: hashCustomerSecret(expiredToken) }, data: { expiresAt: new Date(Date.now() - 1_000) } });
    const retention = await cleanupCustomerRetention(new Date(), [customerId]); assert.ok(retention.tokens >= 1 && retention.images >= 1, "scoped retention must remove expired private data");

    // Jobs are scoped to fixture customers so no existing pending job can be read or processed.
    const exportJob = await enqueueCustomerJob(customerId, CustomerJobType.DATA_EXPORT); jobIds.push(exportJob.id); await processCustomerJobs(10, [customerId]);
    const completedExport = await prisma.customerJob.findUniqueOrThrow({ where: { id: exportJob.id } }); assert.equal(completedExport.status, CustomerJobStatus.COMPLETED); assert.ok(completedExport.result && !JSON.stringify(completedExport.result).includes("temporary-only-password"));
    const deletionJob = await enqueueCustomerJob(deletionCustomerId, CustomerJobType.ACCOUNT_DELETION); jobIds.push(deletionJob.id); await processCustomerJobs(10, [deletionCustomerId]);
    assert.equal(await prisma.customer.findUnique({ where: { id: deletionCustomerId } }), null); const completedDeletion = await prisma.customerJob.findUniqueOrThrow({ where: { id: deletionJob.id } }); assert.equal(completedDeletion.status, CustomerJobStatus.COMPLETED); assert.equal(completedDeletion.customerId, null);

    // Analytics fixture is future-dated and uses a unique locale/hash, avoiding production aggregates entirely.
    await prisma.analyticsEvent.create({ data: { eventType: CustomerAnalyticsEventType.ACCOUNT_CREATED, anonymousIdHash: analyticsHash, locale: prefix, route: "/fixture", occurredAt: analyticsDate } });
    await rollupAnalytics(analyticsDate, new Date(analyticsDate.getTime() + 24 * 60 * 60 * 1000));
    const event = await prisma.analyticsEvent.findFirstOrThrow({ where: { anonymousIdHash: analyticsHash } }); assert.notEqual(event.anonymousIdHash, `${prefix}-analytics`); assert.equal(event.dimensions, null);
    assert.equal((await prisma.analyticsDailyRollup.findUniqueOrThrow({ where: { date_eventType_locale: { date: analyticsDate, eventType: CustomerAnalyticsEventType.ACCOUNT_CREATED, locale: prefix } } })).count, 1);
    resetRateLimitsForTests(); enforceRateLimit("fixture", prefix, 1, 60_000); assert.throws(() => enforceRateLimit("fixture", prefix, 1, 60_000), /RATE_LIMITED/);
    await auditCustomer("SPRINT13_FIXTURE_AUDIT", "Customer", { customerId, actorType: "SYSTEM", metadata: { fixture: true } }); assert.equal(await prisma.customerAuditLog.count({ where: { customerId, action: "SPRINT13_FIXTURE_AUDIT" } }), 1);
    console.log("customer-integration-tests:ok");
  } finally {
    // Every mutation is limited to this random fixture prefix; never touch normal users/customers/analytics.
    await prisma.customerAuditLog.deleteMany({ where: { OR: [{ customerId: { in: [customerId, deletionCustomerId] } }, { targetId: { in: jobIds } }, { action: "SPRINT13_FIXTURE_AUDIT" }] } });
    await prisma.analyticsDailyRollup.deleteMany({ where: { date: analyticsDate, eventType: CustomerAnalyticsEventType.ACCOUNT_CREATED, locale: prefix } });
    await prisma.analyticsEvent.deleteMany({ where: { anonymousIdHash: analyticsHash } });
    await prisma.customerJob.deleteMany({ where: { id: { in: jobIds } } });
    await prisma.customer.deleteMany({ where: { id: { in: [customerId, deletionCustomerId] } } });
    await prisma.product.deleteMany({ where: { id: productId } }); await prisma.plant.deleteMany({ where: { id: plantId } }); await prisma.knowledgeEntity.deleteMany({ where: { id: { in: [plantId, productId] } } }); await prisma.user.deleteMany({ where: { id: staffId } }); await prisma.$disconnect();
  }
}
main().catch(() => { console.error("customer integration verification failed"); process.exitCode = 1; });
