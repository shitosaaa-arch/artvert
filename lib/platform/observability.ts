import { randomUUID } from "node:crypto";
const redact = (value: unknown): unknown => typeof value === "string" ? "[redacted]" : value;
export function requestId(headers: Headers) { return headers.get("x-request-id")?.slice(0, 80) ?? randomUUID(); }
export function log(level: "info" | "warn" | "error", event: string, context: Record<string, unknown> = {}) { const safe = Object.fromEntries(Object.entries(context).map(([key, value]) => /email|password|token|cookie|authorization|message|image/i.test(key) ? [key, redact(value)] : [key, value])); console[level](JSON.stringify({ level, event, ...safe, timestamp: new Date().toISOString() })); }
export function reportError(error: unknown, context: Record<string, unknown> = {}) { log("error", "application_error", { ...context, error: error instanceof Error ? error.name : "unknown" }); }
