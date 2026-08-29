import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { HttpError, optionalEnv } from './http'

/**
 * Admin authentication.
 *
 * One shared password, held in `ADMIN_PASSWORD`, exchanged for a signed session
 * cookie. There is one administrator here, so a user table would be ceremony
 * without benefit, and a signed cookie means the server keeps no session state
 * to go stale across function instances.
 *
 * The cookie is HttpOnly, so no script on the page can read it, and it carries
 * an expiry inside the signature rather than trusting the browser's own.
 */

const COOKIE = 'legendary_admin'
const TTL_SECONDS = 60 * 60 * 8

/**
 * The key the session is signed with.
 *
 * `ADMIN_SESSION_SECRET` if it is set. Otherwise it is derived from the Stripe
 * secret key, which is already high entropy, already server only, and already
 * required for anything else here to work. That keeps the dashboard usable on a
 * fresh deployment without a second secret to configure, at the cost of every
 * session being invalidated if the Stripe key is ever rotated, which is the
 * correct thing to happen anyway.
 */
function signingKey(): Buffer {
  const explicit = optionalEnv('ADMIN_SESSION_SECRET')
  if (explicit) return Buffer.from(explicit, 'utf8')
  const stripeKey = optionalEnv('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    throw new HttpError(500, 'The dashboard is not configured yet.')
  }
  return scryptSync(stripeKey, 'legendary-admin-session', 32)
}

function sign(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('base64url')
}

export function issueSession(): { cookie: string; expiresAt: number } {
  const expiresAt = Date.now() + TTL_SECONDS * 1000
  const payload = `${expiresAt}.${randomBytes(12).toString('base64url')}`
  const token = `${payload}.${sign(payload)}`
  const attrs = [
    `${COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${TTL_SECONDS}`,
  ]
  // Secure would make the cookie unusable over plain http during local
  // development, and everything deployed is https.
  if (process.env.VERCEL) attrs.push('Secure')
  return { cookie: attrs.join('; '), expiresAt }
}

export function clearSession(): string {
  const attrs = [`${COOKIE}=`, 'HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=0']
  if (process.env.VERCEL) attrs.push('Secure')
  return attrs.join('; ')
}

function readCookie(req: VercelRequest): string | null {
  const header = req.headers.cookie
  if (!header) return null
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE) return rest.join('=')
  }
  return null
}

/** Constant time comparison that does not leak length through an early return. */
function sameSecret(a: string, b: string): boolean {
  const ha = createHmac('sha256', 'compare').update(a).digest()
  const hb = createHmac('sha256', 'compare').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export function checkPassword(candidate: unknown): void {
  const expected = optionalEnv('ADMIN_PASSWORD')
  if (!expected) {
    throw new HttpError(
      503,
      'No dashboard password is set. Add ADMIN_PASSWORD to the environment to enable it.',
    )
  }
  if (typeof candidate !== 'string' || !sameSecret(candidate, expected)) {
    throw new HttpError(401, 'That password is not right.')
  }
}

export function isSignedIn(req: VercelRequest): boolean {
  const token = readCookie(req)
  if (!token) return false
  const cut = token.lastIndexOf('.')
  if (cut < 0) return false
  const payload = token.slice(0, cut)
  const signature = token.slice(cut + 1)

  let expected: string
  try {
    expected = sign(payload)
  } catch {
    return false
  }
  if (signature.length !== expected.length) return false
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false

  const expiresAt = Number(payload.split('.')[0])
  return Number.isFinite(expiresAt) && expiresAt > Date.now()
}

export function requireAdmin(req: VercelRequest): void {
  if (!isSignedIn(req)) {
    throw new HttpError(401, 'Please sign in again.')
  }
}

export function setCookie(res: VercelResponse, cookie: string): void {
  res.setHeader('Set-Cookie', cookie)
}
