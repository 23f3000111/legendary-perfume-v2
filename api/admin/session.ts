import type { VercelRequest, VercelResponse } from '@vercel/node'
import { checkPassword, clearSession, isSignedIn, issueSession } from '../_lib/auth'
import { handler, json, optionalEnv } from '../_lib/http'
import { overrideStore } from '../_lib/overrides'
import { callerKey, clearRateLimit, rateLimit } from '../_lib/ratelimit'

/**
 * The dashboard's session: who am I, sign in, sign out.
 *
 * One endpoint rather than three, because the browser only ever needs one of
 * them at a time and three files would be three cold starts.
 *
 *   GET             is there a valid session
 *   POST {password} sign in
 *   DELETE          sign out
 */
export default handler(async (req: VercelRequest, res: VercelResponse) => {
  const store = overrideStore()
  const health = {
    // Surfaced in the dashboard so nobody has to guess why a change did not
    // stick, or why the password is being refused.
    storage: store.kind,
    durable: store.durable,
    passwordSet: Boolean(optionalEnv('ADMIN_PASSWORD')),
  }

  if (req.method === 'POST') {
    // One shared password, so unlimited guesses is the whole attack. Ten a
    // minute leaves a person who has mistyped theirs entirely unbothered.
    const caller = callerKey(req)
    rateLimit(caller, {
      limit: 10,
      windowMs: 60_000,
      message: 'Too many attempts. Wait a minute and try again.',
    })

    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {}
    checkPassword(body.password)
    clearRateLimit(caller)
    const { cookie, expiresAt } = issueSession()
    res.setHeader('Set-Cookie', cookie)
    json(res, 200, { signedIn: true, expiresAt, ...health })
    return
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSession())
    json(res, 200, { signedIn: false, ...health })
    return
  }

  json(res, 200, { signedIn: isSignedIn(req), ...health })
})
