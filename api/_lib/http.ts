import type { VercelRequest, VercelResponse } from '@vercel/node'

/** A failure the caller is allowed to see the message of. */
export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

export function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  // Order data is per customer and must never sit in a shared cache.
  res.setHeader('Cache-Control', 'no-store')
  res.send(JSON.stringify(body))
}

/**
 * Wrap a handler so an unexpected throw never leaks a stack trace or a key.
 *
 * Anything that is not an HttpError is logged in full for the platform's own
 * log drain and reported to the caller as a bare 500.
 */
export function handler(
  fn: (req: VercelRequest, res: VercelResponse) => Promise<void>,
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await fn(req, res)
    } catch (err) {
      if (err instanceof HttpError) {
        json(res, err.status, { error: err.message })
        return
      }
      console.error('[api] unhandled', err)
      json(res, 500, { error: 'Something went wrong on our side. Please try again.' })
    }
  }
}

/**
 * The request body exactly as it was sent, for Stripe's signature check and
 * for photo uploads.
 *
 * A platform that has already parsed the body leaves the stream empty, so the
 * parsed copy is re-serialised as a fallback. It is not byte identical, and a
 * signature check on it can fail; the reconciler is what covers that case.
 */
export function nodeBody(req: VercelRequest): Promise<Buffer> {
  if (req.readableEnded || req.readable === false) {
    const parsed = (req as { body?: unknown }).body
    if (Buffer.isBuffer(parsed)) return Promise.resolve(parsed)
    if (typeof parsed === 'string') return Promise.resolve(Buffer.from(parsed, 'utf8'))
    if (parsed) return Promise.resolve(Buffer.from(JSON.stringify(parsed), 'utf8'))
    return Promise.resolve(Buffer.alloc(0))
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export function requireMethod(req: VercelRequest, method: 'GET' | 'POST') {
  if (req.method !== method) {
    throw new HttpError(405, `Use ${method} for this endpoint.`)
  }
}

/** A required environment variable, or a clear failure naming it. */
export function env(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new HttpError(500, `The shop is not fully configured yet (${name} is unset).`)
  }
  return value
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]
  return value && value.trim() ? value.trim() : undefined
}

/** The site's own origin, used for links inside confirmation emails. */
export function siteUrl(req?: VercelRequest): string {
  const configured = optionalEnv('SITE_URL')
  if (configured) return configured.replace(/\/$/, '')
  const host = req?.headers['x-forwarded-host'] ?? req?.headers.host
  if (typeof host === 'string' && host) {
    const proto = process.env.VERCEL ? 'https' : 'http'
    return `${proto}://${host}`
  }
  return 'http://localhost:5173'
}
