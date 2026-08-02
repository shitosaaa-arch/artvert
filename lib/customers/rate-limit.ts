type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Process-local fallback. Production must supply a shared limiter before horizontal scaling. */
export function enforceRateLimit(scope: string, key: string, limit: number, windowMs: number) {
  const now = Date.now(); const id = `${scope}:${key}`; const current = buckets.get(id);
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  bucket.count += 1; buckets.set(id, bucket);
  if (bucket.count > limit) { const error = new Error("RATE_LIMITED") as Error & { retryAfter: number }; error.retryAfter = Math.ceil((bucket.resetAt - now) / 1000); throw error; }
}

export function resetRateLimitsForTests() { buckets.clear(); }
