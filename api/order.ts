import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handler, HttpError, json, requireMethod, siteUrl } from './_lib/http.js'
import { normaliseReference, publicOrder } from './_lib/order.js'
import { orderStore } from './_lib/store.js'
import { reconcile } from './_lib/reconcile.js'
import { callerKey, rateLimit } from './_lib/ratelimit.js'

/**
 * Look an order up by its reference.
 *
 * There are no accounts on this shop, so the reference is the credential. It is
 * eight characters from a 32 character alphabet, drawn from the crypto source,
 * which is a keyspace of about 2^40; enough that guessing one is not a practical
 * attack, but not enough on its own to hand over a customer's address. So the
 * email address on the order has to match as well, and the response gives the
 * email back masked. Getting it wrong reads the same as a reference that does
 * not exist, so this cannot be used to test whether an order is real.
 */
export default handler(async (req: VercelRequest, res: VercelResponse) => {
  requireMethod(req, 'GET')

  // Reference plus email is a large keyspace, but not one worth letting
  // anybody search at machine speed.
  rateLimit(callerKey(req), {
    limit: 20,
    windowMs: 60_000,
    message: 'Too many lookups. Wait a minute and try again.',
  })

  const reference = normaliseReference(req.query.reference)
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : ''
  if (!email) throw new HttpError(400, 'Enter the email address you ordered with.')

  const notFound = new HttpError(
    404,
    'We could not find an order with that reference and email address.',
  )

  const order = await orderStore().find(reference)
  if (!order) throw notFound
  if (order.customer.email.toLowerCase() !== email) throw notFound

  // A customer arriving straight off the payment often gets here before the
  // webhook does, so the order is checked against Stripe rather than shown as
  // pending on the strength of a row that is a few seconds stale.
  json(res, 200, { order: publicOrder(await reconcile(order, siteUrl(req))) })
})
