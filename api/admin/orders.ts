import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth.js'
import { handler, HttpError, json, siteUrl } from '../_lib/http.js'
import { orderStore } from '../_lib/store.js'
import { reconcileAll } from '../_lib/reconcile.js'
import { COURIERS } from '../_lib/couriers.js'
import { sendShippingNotice } from '../_lib/email.js'
import { normaliseReference, parseShipment, type Order } from '../_lib/order.js'

/**
 * Recent orders, and the figures drawn from them.
 *
 *   GET    the list and the summary
 *   PATCH  { reference, shipment }       record the parcel's courier and
 *                                        tracking number, and email it to the
 *                                        customer
 *          { reference, shipment: null } take it off again, without an email
 *          { reference, resend: true }   email the customer the same number again
 *
 * The dashboard needs the list and the summary together and they come from the
 * same read, so they are returned in one response rather than making the page
 * open two connections to say the same thing twice.
 *
 * Unlike the customer facing lookup this shows the real email address: whoever
 * is signed in here is the person who has to pack the parcel.
 */
function view(o: Order) {
  return {
    reference: o.reference,
    status: o.status,
    total: o.total,
    currency: o.currency,
    placedAt: o.createdAt,
    paidAt: o.paidAt ?? null,
    customer: o.customer,
    shipping: o.shipping,
    note: o.note ?? null,
    lines: o.lines,
    shipment: o.shipment ?? null,
  }
}

const couriers = COURIERS.map(({ id, name, url }) => ({ id, name, linked: Boolean(url) }))

/**
 * Save the parcel, then email it.
 *
 * In that order, so a mail provider that is down costs the house a resend
 * rather than the tracking number itself. The email only goes when this save
 * actually changed the parcel details: saving the same number twice, or a
 * second click landing while the first is still going, sends nothing more.
 * `notifiedAt` is stamped only once the email has really gone, so the
 * dashboard can say plainly when a customer has not been told.
 */
async function ship(order: Order, raw: unknown, site: string) {
  const store = orderStore()
  const details = parseShipment(raw, order.shipment)
  const changed = await store.setShipment(order, details)
  if (!changed) return { order, email: null }

  const shipped: Order = { ...order, shipment: details }
  // A customer already told one number gets told this one replaces it.
  const email = await sendShippingNotice(shipped, site, Boolean(order.shipment?.notifiedAt))
  if (!email.ok) return { order: shipped, email: { sent: false, reason: email.reason } }

  const at = new Date().toISOString()
  await store.markNotified(shipped, at)
  return { order: { ...shipped, shipment: { ...details, notifiedAt: at } }, email: { sent: true } }
}

async function resend(order: Order, site: string) {
  if (!order.shipment) throw new HttpError(400, 'This order has no tracking number to send.')
  const email = await sendShippingNotice(order, site)
  if (!email.ok) return { order, email: { sent: false, reason: email.reason } }
  const at = new Date().toISOString()
  await orderStore().markNotified(order, at)
  return { order: { ...order, shipment: { ...order.shipment, notifiedAt: at } }, email: { sent: true } }
}

async function patch(req: VercelRequest, res: VercelResponse) {
  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
  const reference = normaliseReference(body.reference)
  const store = orderStore()
  const order = await store.find(reference)
  if (!order) throw new HttpError(404, 'No order with that reference.')
  // Only something that has been paid for goes out, so only that can be shipped.
  if (order.status !== 'paid') throw new HttpError(400, 'Only a paid order can be marked as shipped.')

  const site = siteUrl(req)
  let result: { order: Order; email: { sent: boolean; reason?: string } | null }
  if (body.resend === true) {
    result = await resend(order, site)
  } else if (body.shipment === null) {
    await store.setShipment(order, null)
    result = { order: { ...order, shipment: undefined }, email: null }
  } else {
    result = await ship(order, body.shipment, site)
  }
  json(res, 200, { order: view(result.order), email: result.email })
}

export default handler(async (req: VercelRequest, res: VercelResponse) => {
  requireAdmin(req)
  if (req.method === 'PATCH') return patch(req, res)
  if (req.method !== 'GET') throw new HttpError(405, 'Use GET or PATCH for this endpoint.')

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200)
  const store = orderStore()
  // Anything still pending is checked against Stripe before it is counted, so a
  // webhook that never arrived cannot leave a paid order looking unpaid, and an
  // abandoned checkout stops being presented as one that might still complete.
  const orders = await reconcileAll(await store.recent(limit), siteUrl(req))

  const paid = orders.filter((o) => o.status === 'paid')
  const revenue = paid.reduce((sum, o) => sum + o.total, 0)

  // Units sold per product, so the dashboard can show what is actually moving
  // rather than what the merchandising order says should be.
  const units = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const order of paid) {
    for (const line of order.lines) {
      const row = units.get(line.id) ?? { name: line.name, qty: 0, revenue: 0 }
      row.qty += line.qty
      row.revenue += line.lineTotal
      units.set(line.id, row)
    }
  }

  json(res, 200, {
    storage: store.kind,
    couriers,
    orders: orders.map(view),
    summary: {
      window: orders.length,
      paid: paid.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      abandoned: orders.filter((o) => o.status === 'abandoned').length,
      failed: orders.filter((o) => o.status === 'failed' || o.status === 'cancelled').length,
      revenue,
      averageOrder: paid.length ? Math.round((revenue / paid.length) * 100) / 100 : 0,
      top: [...units.entries()]
        .map(([id, row]) => ({ id, ...row }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 6),
    },
  })
})
