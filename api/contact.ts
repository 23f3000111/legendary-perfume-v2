import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handler, HttpError, json, requireMethod } from './_lib/http'
import { sendContactMessage } from './_lib/email'

/**
 * The contact form.
 *
 * Messages land in the house's primary inbox with the sender set as the reply
 * to address, so a reply goes straight back to the customer.
 *
 * There is no captcha. The form is low traffic and a captcha is a poor trade
 * against a luxury checkout's feel, so the defences are a honeypot field that
 * a person never sees and never fills, and a minimum time on the form. Both
 * stop the drive by bots that make up nearly all of this traffic, and neither
 * asks anything of a real customer.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function field(value: unknown, name: string, max: number): string {
  const v = typeof value === 'string' ? value.trim() : ''
  if (!v) throw new HttpError(400, `Please fill in your ${name}.`)
  if (v.length > max) throw new HttpError(400, `That ${name} is too long.`)
  return v
}

export default handler(async (req: VercelRequest, res: VercelResponse) => {
  requireMethod(req, 'POST')

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {}

  // Honeypot: hidden in the form, so anything in it came from a bot. Answer
  // with the same success the form always gives, and send nothing.
  if (typeof body.company === 'string' && body.company.trim()) {
    json(res, 200, { sent: true })
    return
  }

  // A person cannot read the page and fill three fields in under three seconds.
  const elapsed = Number(body.elapsedMs)
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 3000) {
    json(res, 200, { sent: true })
    return
  }

  const name = field(body.name, 'name', 120)
  const email = field(body.email, 'email address', 254).toLowerCase()
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'That email address does not look right.')
  const message = field(body.message, 'message', 4000)

  try {
    await sendContactMessage({ name, email, message })
  } catch (err) {
    // Never claim a message was sent when it was not: there is no other copy
    // of it, so the visitor needs to know to reach us another way.
    console.error('[contact] could not deliver the message:', err)
    throw new HttpError(
      502,
      'We could not send your message just now. Please reach us on WhatsApp and we will pick it up straight away.',
    )
  }
  json(res, 200, { sent: true })
})
