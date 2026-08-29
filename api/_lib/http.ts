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
