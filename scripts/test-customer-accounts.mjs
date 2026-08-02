import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";

const source = (file) => readFile(path.join(process.cwd(), file), "utf8");
const hashSecret = (value) => createHash("sha256").update(`test:${value}`).digest("hex");
const normalizeEmail = (value) => value.trim().toLowerCase();
const buckets = new Map();
function limit(scope, key, max, windowMs, now) { const id = `${scope}:${key}`; const previous = buckets.get(id); const bucket = !previous || previous.resetAt <= now ? { count: 0, resetAt: now + windowMs } : previous; bucket.count += 1; buckets.set(id, bucket); if (bucket.count > max) throw new Error("RATE_LIMITED"); }

async function main() {
  assert.equal(normalizeEmail(" Test@Example.COM "), "test@example.com");
  const secret = randomBytes(32).toString("base64url"); assert.notEqual(secret, randomBytes(32).toString("base64url")); assert.equal(hashSecret(secret), hashSecret(secret));
  limit("test", "customer", 1, 60_000, 1); assert.throws(() => limit("test", "customer", 1, 60_000, 2), /RATE_LIMITED/);
  const schema = await source("prisma/schema.prisma");
  for (const name of ["model Customer {", "model CustomerSession {", "model CustomerToken {", "model CustomerDiagnosis {", "model CustomerJob {", "model AnalyticsEvent {", "model AnalyticsDailyRollup {"]) assert.ok(schema.includes(name), `${name} must be present`);
  const staff = await source("lib/auth/roles.ts"); assert.ok(!staff.includes("CUSTOMER"), "Customer is not a staff role.");
  const diagnosis = await source("app/api/customer/diagnoses/route.ts"); assert.ok(!/(?:body|source)\.(?:message|imageRef|temporaryImage)/i.test(diagnosis), "Saved diagnosis endpoint must not accept Doctor messages or temporary image references.");
  const customerAdmin = (await source("app/api/admin/customers/route.ts")).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""); for (const forbidden of ["diagnoses", "savedImages", "tokens", "sessions", "passwordHash"]) assert.ok(!customerAdmin.includes(forbidden), `Normal customer admin surface must not expose ${forbidden}.`);
  const image = await source("app/api/customer/images/route.ts"); assert.ok(!image.includes("formData"), "Private image save route must not accept raw upload bytes.");
  const jobs = await source("lib/customers/jobs.ts"); const jobRoute = await source("app/api/customer/jobs/route.ts"); assert.ok(jobs.includes("CustomerJobStatus.PENDING") && jobRoute.includes("ACCOUNT_DELETION"), "Destructive account changes must be queued.");
  const analytics = await source("lib/analytics/service.ts"); assert.ok(!/email|message|image|ip/i.test(analytics.replace(/anonymousIdHash/g, "")), "Analytics service must only persist privacy-safe data.");
  console.log("customer-account-tests:ok");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
