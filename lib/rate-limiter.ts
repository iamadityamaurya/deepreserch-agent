interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const REQUESTS_PER_WINDOW = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

const store = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory sliding-window rate limiter keyed by IP address.
 * Suitable for single-instance deployments. For multi-instance or
 * production-scale deployments, replace this with Redis.
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + WINDOW_MS;
    store.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: REQUESTS_PER_WINDOW - 1, resetAt };
  }

  if (entry.count >= REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: REQUESTS_PER_WINDOW - entry.count, resetAt: entry.resetAt };
}
