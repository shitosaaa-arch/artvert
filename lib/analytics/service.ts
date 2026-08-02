import { CustomerAnalyticsEventType } from "@prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { hashCustomerSecret } from "@/lib/customers/security";

const allowed = new Set(Object.values(CustomerAnalyticsEventType));
const safeRoute = (route: unknown) => typeof route === "string" && /^\/(?:[a-z0-9_/-]{0,120})$/i.test(route) ? route : undefined;
export async function recordAnalyticsEvent(input: { eventType: unknown; anonymousId: unknown; locale?: unknown; route?: unknown }) {
  if (typeof input.eventType !== "string" || !allowed.has(input.eventType as CustomerAnalyticsEventType) || typeof input.anonymousId !== "string" || input.anonymousId.length < 8 || input.anonymousId.length > 200) throw new Error("INVALID_ANALYTICS_EVENT");
  await getPrismaClient().analyticsEvent.create({ data: { eventType: input.eventType as CustomerAnalyticsEventType, anonymousIdHash: hashCustomerSecret(input.anonymousId), locale: input.locale === "en" ? "en" : "ar", route: safeRoute(input.route) } });
}
export async function rollupAnalytics(start: Date, end: Date) {
  const prisma = getPrismaClient(); const rows = await prisma.analyticsEvent.groupBy({ by: ["eventType", "locale", "occurredAt"], where: { occurredAt: { gte: start, lt: end } }, _count: { _all: true } });
  // PostgreSQL date bucketing is kept in the worker boundary; upsert one daily aggregate at a time.
  const grouped = new Map<string, { date: Date; eventType: CustomerAnalyticsEventType; locale: string; count: number }>();
  for (const row of rows) { const date = new Date(Date.UTC(row.occurredAt.getUTCFullYear(), row.occurredAt.getUTCMonth(), row.occurredAt.getUTCDate())); const locale = row.locale ?? "all"; const key = `${date.toISOString()}:${row.eventType}:${locale}`; const old = grouped.get(key); grouped.set(key, { date, eventType: row.eventType, locale, count: (old?.count ?? 0) + row._count._all }); }
  for (const item of grouped.values()) await prisma.analyticsDailyRollup.upsert({ where: { date_eventType_locale: { date: item.date, eventType: item.eventType, locale: item.locale } }, create: item, update: { count: item.count } });
  return grouped.size;
}
