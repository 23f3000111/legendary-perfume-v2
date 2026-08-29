import { sendMerchantNotification, sendOrderConfirmation } from './email.js'
import type { Order } from './order.js'
import { orderStore } from './store.js'
import { stripe } from './stripe.js'

/**
 * Bring a pending order back in line with what Stripe actually knows.
 *
 * The webhook is the fast path and it is not a guarantee. It can be missed for
 * ordinary reasons: nothing forwarding it during local development, a deploy
 * restarting a function mid-delivery, a network blip, Stripe exhausting its
 * retries while the site is down. When that happens the payment has been taken
 * and the order sits at "pending" forever, the customer is never emailed, and
 * the house has no idea it has a parcel to pack. That is the worst failure this
 * shop has, so it does not rely on the webhook alone.
 *
 * So every read of a pending order asks Stripe for the truth. Payment is
 * settled by whichever arrives first, and the other finds the work already
 * done: `markPaid` only reports success to the caller that actually moved the
 * row, so the confirmation emails are sent exactly once either way.
 *
 * It also gives up on checkouts nobody completed. A customer who presses back
 * at the payment step leaves an intent at `requires_payment_method`, which
 * Stripe keeps in that state indefinitely; after a grace period those become
 * `abandoned` rather than staying in the dashboard as orders that might yet
 * arrive.
 */

/**
 * How long an unpaid checkout is given before it is treated as abandoned.
 *
 * Half an hour by default: long enough that someone hunting for their card is
 * never written off, short enough that the dashboard is not carrying yesterday's
 * dead checkouts as live ones. `ABANDON_AFTER_MINUTES` overrides it.
 */
const ABANDON_AFTER_MS =
  Number(process.env.ABANDON_AFTER_MINUTES || 30) * 60 * 1000

/** Reconciling is a network call per order, so a read cannot do many. */
const MAX_PER_REQUEST = 15

export async function reconcile(order: Order, siteUrl: string): Promise<Order> {
  if (order.status !== 'pending' || !order.paymentIntentId) return order

  let intent
  try {
    intent = await stripe().paymentIntents.retrieve(order.paymentIntentId)
  } catch (err) {
    // A reconcile that cannot reach Stripe must not fail the page the customer
    // is looking at. The order simply reads as it stands.
    console.error(`[reconcile] could not read ${order.paymentIntentId}:`, err)
    return order
  }

  const store = orderStore()

  if (intent.status === 'succeeded') {
    const paidAt = new Date((intent.created ?? Date.now() / 1000) * 1000).toISOString()
    const settled = { ...order, status: 'paid' as const, paidAt }

    // True only if this call is what moved it, so the emails cannot double up
    // with a webhook arriving at the same moment.
    const wasUs = await store.markPaid(order.reference, paidAt)
    if (wasUs) {
      console.log(`[reconcile] ${order.reference} was paid but never settled, fixing`)
      await Promise.allSettled([
        sendOrderConfirmation(settled, siteUrl),
        sendMerchantNotification(settled, siteUrl),
      ])
    }
    return settled
  }

  if (intent.status === 'canceled') {
    await store.markStatus(order.reference, 'cancelled')
    return { ...order, status: 'cancelled' }
  }

  // Still waiting on the customer. Only call it abandoned once enough time has
  // passed that they are plainly not coming back: someone can legitimately sit
  // on the payment step for a few minutes hunting for their card.
  const age = Date.now() - new Date(order.createdAt).getTime()
  if (
    age > ABANDON_AFTER_MS &&
    (intent.status === 'requires_payment_method' || intent.status === 'requires_confirmation')
  ) {
    await store.markStatus(order.reference, 'abandoned')
    return { ...order, status: 'abandoned' }
  }

  return order
}

/** Reconcile a list, leaving anything already settled untouched. */
export async function reconcileAll(orders: Order[], siteUrl: string): Promise<Order[]> {
  let budget = MAX_PER_REQUEST
  const out: Order[] = []
  for (const order of orders) {
    if (order.status === 'pending' && budget > 0) {
      budget -= 1
      out.push(await reconcile(order, siteUrl))
    } else {
      out.push(order)
    }
  }
  return out
}
