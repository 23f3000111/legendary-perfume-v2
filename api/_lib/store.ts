import { db } from './db.js'
import { optionalEnv } from './http.js'
import { sameParcel, type Order, type OrderStatus, type Shipment } from './order.js'
import { stripe } from './stripe.js'
import { fromMinorUnits, getProduct } from './catalogue.js'

/**
 * Where orders live.
 *
 * Two backings, chosen by whether DATABASE_URL is set:
 *
 *  - Postgres, the one to run in production. Gives the house an order history
 *    it owns, queryable independently of the payment processor.
 *  - Stripe itself, the fallback. Every order is already mirrored onto its
 *    PaymentIntent's metadata, so the shop is fully functional with nothing but
 *    the Stripe keys, which is what a fresh deployment has. The catch is that
 *    Stripe's search index takes a moment to catch up after a write, so a
 *    lookup within a minute of paying can miss; the confirmation page shows the
 *    order from its own response rather than looking it up, so a customer never
 *    meets that gap.
 *
 * Both satisfy the same interface, so nothing above this file knows which is in
 * use, and moving to Postgres later is one environment variable.
 */

export interface OrderStore {
  readonly kind: 'postgres' | 'stripe'
  save(order: Order): Promise<void>
  /** Returns true only if this call is what moved the order to paid. */
  markPaid(reference: string, paidAt: string): Promise<boolean>
  markStatus(reference: string, status: OrderStatus): Promise<void>
  find(reference: string): Promise<Order | null>
  /** Most recent first, for the dashboard. */
  recent(limit: number): Promise<Order[]>
  /**
   * Record the parcel an order went out in, or clear it with null. Returns true
   * only if this call changed what the customer would be told, so that of two
   * saves arriving together only one goes on to email them.
   */
  setShipment(order: Order, shipment: Shipment | null): Promise<boolean>
  /** Stamp the time the customer was emailed about their parcel. */
  markNotified(order: Order, at: string): Promise<void>
}

// ------------------------------------------------------------------ postgres

function rowToOrder(r: Record<string, any>): Order {
  return {
    reference: r.reference,
    status: r.status,
    currency: r.currency,
    lines: r.lines,
    subtotal: r.subtotal,
    shippingCost: r.shipping_cost,
    total: r.total,
    customer: r.customer,
    shipping: r.shipping,
    note: r.note ?? undefined,
    paymentIntentId: r.payment_intent_id,
    createdAt: new Date(r.created_at).toISOString(),
    paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : undefined,
    shipment: r.shipment ?? undefined,
  }
}

function postgresStore(): OrderStore {
  return {
    kind: 'postgres',
    async save(order) {
            await (await db()).query(
        `INSERT INTO orders (reference, status, currency, lines, subtotal, shipping_cost,
                             total, customer, shipping, note, payment_intent_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (reference) DO NOTHING`,
        [
          order.reference, order.status, order.currency, JSON.stringify(order.lines),
          order.subtotal, order.shippingCost, order.total,
          JSON.stringify(order.customer), JSON.stringify(order.shipping),
          order.note ?? null, order.paymentIntentId, order.createdAt,
        ],
      )
    },
    async markPaid(reference, paidAt) {
      // Only ever forward: a late webhook must not reopen a settled order.
      // The row count is the idempotency guard. The webhook and the
      // reconciler can both arrive at the same order, and whichever gets
      // there first is the one that sends the emails.
      const { rowCount } = await (await db()).query(
        `UPDATE orders SET status = 'paid', paid_at = COALESCE(paid_at, $2)
         WHERE reference = $1 AND status <> 'paid'`,
        [reference, paidAt],
      )
      return rowCount === 1
    },
    async markStatus(reference, status) {
      await (await db()).query(
        `UPDATE orders SET status = $2 WHERE reference = $1 AND status = 'pending'`,
        [reference, status],
      )
    },
    async find(reference) {
            const { rows } = await (await db()).query('SELECT * FROM orders WHERE reference = $1', [reference])
      return rows.length ? rowToOrder(rows[0]) : null
    },
    async recent(limit) {
            const { rows } = await (await db()).query(
        'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1',
        [Math.min(Math.max(limit, 1), 200)],
      )
      return rows.map(rowToOrder)
    },
    async setShipment(order, shipment) {
      if (shipment === null) {
        const { rowCount } = await (await db()).query(
          'UPDATE orders SET shipment = NULL WHERE reference = $1 AND shipment IS NOT NULL',
          [order.reference],
        )
        return rowCount === 1
      }
      // Conditional on the parcel details differing, so the row count says
      // whether this call is the one that changed them.
      const { rowCount } = await (await db()).query(
        `UPDATE orders SET shipment = $2::jsonb
         WHERE reference = $1
           AND (shipment IS NULL
                OR shipment ->> 'trackingNumber' IS DISTINCT FROM $3
                OR shipment ->> 'courierName' IS DISTINCT FROM $4
                OR COALESCE(shipment ->> 'trackingUrl', '') IS DISTINCT FROM $5)`,
        [
          order.reference, JSON.stringify(shipment),
          shipment.trackingNumber, shipment.courierName, shipment.trackingUrl ?? '',
        ],
      )
      return rowCount === 1
    },
    async markNotified(order, at) {
      await (await db()).query(
        `UPDATE orders SET shipment = shipment || jsonb_build_object('notifiedAt', $2::text)
         WHERE reference = $1 AND shipment IS NOT NULL`,
        [order.reference, at],
      )
    },
  }
}

// -------------------------------------------------------------------- stripe

/**
 * Stripe metadata values are capped at 500 characters each, and an order can
 * carry thirty lines, so the basket is packed into a compact string rather than
 * JSON: `id:qty:unitPrice` per line, pipe separated.
 */
export function packLines(lines: Order['lines']): string {
  return lines.map((l) => `${l.id}:${l.qty}:${l.unitPrice}`).join('|')
}

function unpackLines(packed: string | undefined): Order['lines'] {
  if (!packed) return []
  const out: Order['lines'] = []
  for (const chunk of packed.split('|')) {
    const [id, qty, unit] = chunk.split(':')
    if (!id) continue
    // Names come from the catalogue rather than the metadata, so a renamed
    // product reads correctly on an old order without a migration.
    const product = getProduct(id)
    const quantity = Number(qty) || 0
    const unitPrice = Number(unit) || 0
    out.push({
      id,
      name: product?.name ?? id,
      size: product?.size ?? '',
      qty: quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    })
  }
  return out
}

const statusOfIntent = (intentStatus: string): OrderStatus =>
  intentStatus === 'succeeded' ? 'paid'
  : intentStatus === 'canceled' ? 'cancelled'
  : 'pending'

/** Rebuild an order from the metadata checkout.ts wrote onto its payment. */
function intentToOrder(intent: {
  id: string
  status: string
  amount: number
  currency: string
  created: number
  metadata?: Record<string, string> | null
}): Order | null {
  const m = intent.metadata ?? {}
  if (!m.reference) return null
  const lines = unpackLines(m.lines)
  const at = new Date(intent.created * 1000).toISOString()
  return {
    reference: m.reference,
    status: statusOfIntent(intent.status),
    currency: intent.currency.toUpperCase(),
    lines,
    subtotal: lines.reduce((s, l) => s + l.lineTotal, 0),
    shippingCost: 0,
    total: fromMinorUnits(intent.amount),
    customer: { email: m.email ?? '', name: m.name ?? '', phone: m.phone ?? '' },
    shipping: {
      line1: m.addr1 ?? '',
      line2: m.addr2 || undefined,
      city: m.city ?? '',
      postcode: m.postcode ?? '',
      state: m.state ?? '',
      country: m.country ?? 'Malaysia',
    },
    note: m.note || undefined,
    paymentIntentId: intent.id,
    createdAt: at,
    paidAt: intent.status === 'succeeded' ? at : undefined,
    shipment: m.ship_tracking
      ? {
          courier: m.ship_courier || 'other',
          courierName: m.ship_name || m.ship_courier || '',
          trackingNumber: m.ship_tracking,
          trackingUrl: m.ship_url || undefined,
          shippedAt: m.shipped_at || at,
          notifiedAt: m.ship_notified || undefined,
        }
      : undefined,
  }
}

/**
 * The shipment as PaymentIntent metadata. Stripe removes a key set to an empty
 * string, which is how a cleared shipment leaves no trace.
 */
function shipmentMetadata(shipment: Shipment | null): Record<string, string> {
  return {
    ship_courier: shipment?.courier ?? '',
    ship_name: shipment?.courierName ?? '',
    ship_tracking: shipment?.trackingNumber ?? '',
    ship_url: shipment?.trackingUrl ?? '',
    shipped_at: shipment?.shippedAt ?? '',
    ship_notified: shipment?.notifiedAt ?? '',
  }
}

function stripeStore(): OrderStore {
  return {
    kind: 'stripe',
    // The PaymentIntent is written by checkout.ts, so there is nothing more to
    // persist: it is already the record.
    async save() {},
    // Stripe is already the record, so there is nothing to write back. It never
    // needs the emails re-sent from here either: the webhook is the only path
    // that reaches this store, and it sends them itself.
    async markPaid() { return false },
    async markStatus() {},
    async find(reference) {
      const found = await stripe().paymentIntents.search({
        query: `metadata['reference']:'${reference}'`,
        limit: 1,
      })
      const intent = found.data[0]
      return intent ? intentToOrder(intent) : null
    },
    async recent(limit) {
      // Listing, not searching: it is immediate rather than indexed, so a sale
      // from ten seconds ago is already in the dashboard.
      const page = await stripe().paymentIntents.list({ limit: Math.min(Math.max(limit, 1), 100) })
      return page.data
        .map(intentToOrder)
        .filter((o): o is Order => o !== null)
    },
    async setShipment(order, shipment) {
      // No atomic compare here as Postgres has, so the check is against the
      // order as read. One house, one dashboard: close enough for a fallback.
      const changed = shipment === null ? Boolean(order.shipment) : !sameParcel(order.shipment, shipment)
      if (!changed) return false
      await stripe().paymentIntents.update(order.paymentIntentId, { metadata: shipmentMetadata(shipment) })
      return true
    },
    async markNotified(order, at) {
      await stripe().paymentIntents.update(order.paymentIntentId, { metadata: { ship_notified: at } })
    },
  }
}

let cached: OrderStore | undefined

export function orderStore(): OrderStore {
  if (!cached) {
    const url = optionalEnv('DATABASE_URL')
    cached = url ? postgresStore() : stripeStore()
    console.log(`[api] order store: ${cached.kind}`)
  }
  return cached
}
