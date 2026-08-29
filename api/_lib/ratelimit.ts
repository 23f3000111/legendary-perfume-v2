import type { VercelRequest } from '@vercel/node'
import { HttpError } from './http.js'

/**
 * A rate limit for the endpoints where guessing is the attack.
 *
 * The admin password is a single shared secret, so an unlimited number of
 * attempts is the difference between a strong password and a matter of time.
 * The order lookup is the same shape of problem: reference plus email is a
 * large keyspace, but not one worth letting anybody search at machine speed.
 *
 * Deliberately in memory. A serverless instance is not shared, so this is a
 * limit per warm instance rather than a global one, and a determined attacker
 * spread across enough cold starts would get more attempts than the number
 * below suggests. It still turns an unbounded online guessing attack into a
 * slow one, which is the property that matters, and it costs no round trip on
 * the happy path. If the house ever needs a hard global limit, this is the one
 * function to move onto Postgres or a KV store.
 */

interface Window {
  count: number
  resetAt: number
}

const buckets = new Map<string, Window>()

/**
 * Whoever is asking, as best the platform can tell us.
 *
 * Defensive about the shape of the request: this runs under Vercel's Node
 * runtime, under the local dev server and under the smoke test, and not all
 * three build the same object. A limiter that throws on a missing header bag
 * would take the endpoint down with it, which is worse than not limiting.
 */
export function callerKey(req: Partial<VercelRequest>): string {
  const forwarded = req?.headers?.['x-forwarded-for']
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded?.[0]) ??
    req?.socket?.remoteAddress ??
    'unknown'
  return String(ip).trim() || 'unknown'
}

/**
 * Count one attempt against `key`, and refuse once the allowance is spent.
 *
 * Throws an HttpError the caller is meant to let propagate, so an endpoint opts
 * in with a single line at the top.
 */
export function rateLimit(
  key: string,
  { limit, windowMs, message }: { limit: number; windowMs: number; message: string },
): void {
  const now = Date.now()

  // Opportunistic sweep. Without it a long lived instance would hold a bucket
  // for every address that ever called it.
  if (buckets.size > 5000) {
    for (const [k, w] of buckets) if (w.resetAt <= now) buckets.delete(k)
  }

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  existing.count += 1
  if (existing.count > limit) {
    throw new HttpError(429, message)
  }
}

/** Forget a caller's attempts, e.g. once they have signed in successfully. */
export function clearRateLimit(key: string): void {
  buckets.delete(key)
}
