import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth.js'
import { handler, json, requireMethod, siteUrl } from '../_lib/http.js'
import { orderStore } from '../_lib/store.js'
import { reconcileAll } from '../_lib/reconcile.js'

/**
 * Recent orders, and the figures drawn from them.
 *
 * The dashboard needs both together and they come from the same read, so this
 * returns the list and the summary in one response rather than making the page
 * open two connections to say the same thing twice.
 *
 * Unlike the customer facing lookup this shows the real email address: whoever
 * is signed in here is the person who has to pack the parcel.
 */
export default handler(async (req: VercelRequest, res: VercelResponse) => {
  requireAdmin(req)
  requireMethod(req, 'GET')

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
    orders: orders.map((o) => ({
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
    })),
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
