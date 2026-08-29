import type { VercelRequest, VercelResponse } from '@vercel/node'
import type Stripe from 'stripe'
import { optionalEnv } from './_lib/http'
import { sendMerchantNotification, sendOrderConfirmation } from './_lib/email'
import { orderStore } from './_lib/store'
import { stripe } from './_lib/stripe'

/**
 * Stripe's own account of what happened to a payment.
 *
 * This, not the browser, is what settles an order: a customer who closes the
 * tab the moment their card is accepted still gets a paid order and a
 * confirmation email, and a browser that lies about having paid changes
 * nothing, because the signature is verified against Stripe's secret.
 *
 * Signature verification is over the bytes exactly as Stripe sent them, so the
 * body has to be read raw. A JSON body parser would already have thrown them
 * away, which is why this reads the stream itself.
 *
 * It answers to **both** handler shapes. A platform may hand a function the Web
 * `Request` or Node's `(req, res)` pair, and which one arrives is a detail of
 * the runtime rather than something this file should depend on. Getting that
 * wrong would not fail loudly at deploy time, it would fail on the first real
 * payment, so both are handled rather than assumed.
 *
 * Local setup is automatic: `npm run dev` starts the Stripe CLI listener.
 */

interface Incoming {
  method: string
  signature: string | null
  rawBody: Buffer
  origin: string
}

interface Outgoing {
  status: number
  body: Record<string, unknown>
}

function isWebRequest(value: unknown): value is Request {
  return typeof (value as Request | undefined)?.headers?.get === 'function'
}

function nodeBody(req: VercelRequest): Promise<Buffer> {
  // A platform that has already parsed the body leaves the stream empty, so the
  // parsed copy is re-serialised as a fallback. It is not byte identical, and a
  // signature check on it can fail; the reconciler is what covers that case.
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

async function handle({ method, signature, rawBody, origin }: Incoming): Promise<Outgoing> {
  if (method !== 'POST') return { status: 405, body: { error: 'Use POST for this endpoint.' } }

  const secret = optionalEnv('STRIPE_WEBHOOK_SECRET')
  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is unset, refusing to trust the request')
    return { status: 500, body: { error: 'Webhook is not configured.' } }
  }
  if (!signature) return { status: 400, body: { error: 'Missing signature.' } }

  let event: Stripe.Event
  try {
    // constructEventAsync, not constructEvent: the async form uses the Web
    // Crypto API, which is available in every runtime this may land in.
    event = await stripe().webhooks.constructEventAsync(rawBody, signature, secret)
  } catch (err) {
    console.error('[webhook] signature rejected:', err)
    return { status: 400, body: { error: 'Signature verification failed.' } }
  }

  const store = orderStore()
  const intent = event.data.object as Stripe.PaymentIntent
  const reference = intent?.metadata?.reference
  const site = (optionalEnv('SITE_URL') ?? origin).replace(/\/$/, '')

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        if (!reference) break
        const paidAt = new Date(event.created * 1000).toISOString()

        // True only if this call is what moved the row. The reconciler can
        // reach the same order first, and whichever wins sends the emails.
        const wasUs = await store.markPaid(reference, paidAt)
        if (!wasUs) break

        const order = await store.find(reference)
        if (!order) {
          console.error(`[webhook] paid ${reference} but no order was found to email`)
          break
        }
        const paid = { ...order, status: 'paid' as const, paidAt }
        // Neither email failing is allowed to fail the webhook: Stripe would
        // retry the event and send the survivor twice.
        await Promise.allSettled([
          sendOrderConfirmation(paid, site),
          sendMerchantNotification(paid, site),
        ])
        break
      }
      case 'payment_intent.payment_failed':
        if (reference) await store.markStatus(reference, 'failed')
        break
      case 'payment_intent.canceled':
        if (reference) await store.markStatus(reference, 'cancelled')
        break
      default:
        break
    }
  } catch (err) {
    // Report the failure so Stripe retries, without putting the detail in the
    // response body.
    console.error(`[webhook] handling ${event.type} failed:`, err)
    return { status: 500, body: { error: 'Handler failed.' } }
  }

  return { status: 200, body: { received: true } }
}

export default async function handler(
  a: Request | VercelRequest,
  b?: VercelResponse,
): Promise<Response | void> {
  if (isWebRequest(a)) {
    const out = await handle({
      method: a.method,
      signature: a.headers.get('stripe-signature'),
      rawBody: Buffer.from(await a.arrayBuffer()),
      origin: new URL(a.url).origin,
    })
    return new Response(JSON.stringify(out.body), {
      status: out.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  }

  const req = a
  const signature = req.headers['stripe-signature']
  const proto = (req.headers['x-forwarded-proto'] as string) ?? (process.env.VERCEL ? 'https' : 'http')
  const host = (req.headers['x-forwarded-host'] as string) ?? req.headers.host ?? 'localhost'

  const out = await handle({
    method: req.method ?? 'GET',
    signature: typeof signature === 'string' ? signature : null,
    rawBody: await nodeBody(req),
    origin: `${proto}://${host}`,
  })

  b?.status(out.status)
  b?.setHeader('Content-Type', 'application/json')
  b?.setHeader('Cache-Control', 'no-store')
  b?.send(JSON.stringify(out.body))
}

/**
 * Keep the raw bytes intact for signature verification.
 *
 * Honoured by the platforms that read it; the reader above copes regardless.
 */
export const config = { api: { bodyParser: false } }
