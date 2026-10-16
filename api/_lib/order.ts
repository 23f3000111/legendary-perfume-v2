import { randomBytes } from 'node:crypto'
import { HttpError } from './http.js'
import type { OrderLine } from './catalogue.js'
import { courierById, trackingLink } from './couriers.js'

/**
 * `abandoned` is a checkout that was opened and never paid: the customer
 * pressed back at the payment step, or closed the tab. Stripe keeps the intent
 * at `requires_payment_method` forever in that case, so without a name for it
 * those rows would sit in the dashboard as "pending" indefinitely and be
 * counted as orders that might still arrive.
 */
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'abandoned'

export interface Customer {
  email: string
  name: string
  phone: string
}

export interface Address {
  line1: string
  line2?: string
  city: string
  postcode: string
  state: string
  country: string
}

/**
 * A parcel handed to a courier, recorded from the dashboard.
 *
 * Kept apart from `status` on purpose. Status is the payment's own state, and
 * the code that settles a payment moves any order that is not already `paid`
 * to `paid`; a `shipped` status would let a late webhook knock a shipped order
 * back to paid. So an order is shipped when it is paid and has one of these.
 */
export interface Shipment {
  /** One of COURIERS, or 'other'. */
  courier: string
  /** As the customer sees it: the courier's name, or the house's own wording for 'other'. */
  courierName: string
  trackingNumber: string
  /** Where the customer can follow it. Absent for an 'other' courier given no link. */
  trackingUrl?: string
  shippedAt: string
  /** When the customer was last emailed about it. Absent until an email has actually gone. */
  notifiedAt?: string
}

export interface Order {
  reference: string
  status: OrderStatus
  currency: string
  lines: OrderLine[]
  subtotal: number
  shippingCost: number
  total: number
  customer: Customer
  shipping: Address
  note?: string
  paymentIntentId: string
  createdAt: string
  paidAt?: string
  shipment?: Shipment
}

/**
 * Reference numbers customers read out over the phone.
 *
 * Crockford's alphabet, so there is no I/L/O/U to be misheard as 1/0, and the
 * bytes come from the crypto source rather than Math.random: a reference is
 * half of what it takes to look an order up, so it must not be guessable.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function newReference(): string {
  const bytes = randomBytes(8)
  let out = ''
  for (let i = 0; i < 8; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return `LG-${out.slice(0, 4)}-${out.slice(4)}`
}

const REFERENCE_RE = /^LG-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{4}-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{4}$/

/** Accept what the customer types: spaces, lower case and missing dashes. */
export function normaliseReference(input: unknown): string {
  if (typeof input !== 'string') throw new HttpError(400, 'Enter your order reference.')
  const bare = input.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/^LG/, '')
  if (bare.length !== 8) throw new HttpError(400, 'That does not look like an order reference.')
  const ref = `LG-${bare.slice(0, 4)}-${bare.slice(4)}`
  if (!REFERENCE_RE.test(ref)) {
    throw new HttpError(400, 'That does not look like an order reference.')
  }
  return ref
}

// ---------------------------------------------------------------- validation

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function text(value: unknown, field: string, max: number, min = 1): string {
  const v = typeof value === 'string' ? value.trim() : ''
  if (v.length < min) throw new HttpError(400, `Please give us your ${field}.`)
  if (v.length > max) throw new HttpError(400, `That ${field} is too long.`)
  return v
}

export function parseCustomer(raw: unknown): Customer {
  const c = (raw ?? {}) as Record<string, unknown>
  const email = text(c.email, 'email address', 254).toLowerCase()
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'That email address does not look right.')
  const phone = text(c.phone, 'phone number', 32)
  if (!/^[+0-9][0-9\s()]{6,}$/.test(phone)) {
    throw new HttpError(400, 'That phone number does not look right.')
  }
  return { email, name: text(c.name, 'name', 120), phone }
}

export function parseAddress(raw: unknown): Address {
  const a = (raw ?? {}) as Record<string, unknown>
  const line2 = typeof a.line2 === 'string' && a.line2.trim() ? text(a.line2, 'address', 160) : undefined
  return {
    line1: text(a.line1, 'street address', 160),
    line2,
    city: text(a.city, 'city', 80),
    postcode: text(a.postcode, 'postcode', 16),
    state: text(a.state, 'state', 80),
    // The client ships within Malaysia only, so there is nothing to choose.
    country: 'Malaysia',
  }
}

export function parseNote(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined
  return text(raw, 'note', 500)
}

/**
 * The courier and number the dashboard sends, checked and made whole.
 *
 * A number pasted from a courier's app often carries spaces, so they go; what
 * is left must look like a tracking number rather than a sentence. The link is
 * built from the courier's own pattern, so only an 'other' courier may bring
 * one, and it must be https: it goes into an email and onto a public page as a
 * link, and a `javascript:` address in either would be an attack.
 */
export function parseShipment(raw: unknown, previous?: Shipment): Omit<Shipment, 'notifiedAt'> {
  const s = (raw ?? {}) as Record<string, unknown>
  const courier = courierById(typeof s.courier === 'string' ? s.courier : '')
  if (!courier) throw new HttpError(400, 'Choose the courier the parcel went with.')

  const trackingNumber = (typeof s.trackingNumber === 'string' ? s.trackingNumber : '').replace(/\s+/g, '')
  if (!trackingNumber) throw new HttpError(400, 'Enter the tracking number.')
  if (!/^[A-Za-z0-9-]{4,40}$/.test(trackingNumber)) {
    throw new HttpError(400, 'That tracking number does not look right. Use only the letters and numbers on the label.')
  }

  let courierName = courier.name
  let trackingUrl = trackingLink(courier.id, trackingNumber)
  if (courier.id === 'other') {
    courierName = typeof s.courierName === 'string' ? s.courierName.trim() : ''
    if (!courierName) throw new HttpError(400, "Enter the courier's name.")
    if (courierName.length > 60) throw new HttpError(400, 'That courier name is too long.')
    const url = typeof s.trackingUrl === 'string' ? s.trackingUrl.trim() : ''
    if (url) {
      let parsed: URL
      try {
        parsed = new URL(url)
      } catch {
        throw new HttpError(400, 'That tracking link does not look right.')
      }
      if (parsed.protocol !== 'https:') throw new HttpError(400, 'The tracking link must start with https://')
      if (url.length > 400) throw new HttpError(400, 'That tracking link is too long.')
      trackingUrl = parsed.toString()
    } else {
      trackingUrl = undefined
    }
  }

  return {
    courier: courier.id,
    courierName,
    trackingNumber,
    trackingUrl,
    // A corrected number keeps the day it actually went out.
    shippedAt: previous?.shippedAt ?? new Date().toISOString(),
  }
}

type ParcelDetails = Pick<Shipment, 'courierName' | 'trackingNumber' | 'trackingUrl'>

/** Whether two shipments would tell the customer the same thing. */
export function sameParcel(a: ParcelDetails | undefined, b: ParcelDetails): boolean {
  if (!a) return false
  return (
    a.courierName === b.courierName &&
    a.trackingNumber === b.trackingNumber &&
    (a.trackingUrl ?? '') === (b.trackingUrl ?? '')
  )
}

/** What a customer is allowed to see back when they look an order up. */
export function publicOrder(order: Order) {
  return {
    reference: order.reference,
    status: order.status,
    currency: order.currency,
    lines: order.lines,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    total: order.total,
    placedAt: order.createdAt,
    paidAt: order.paidAt,
    customer: { name: order.customer.name, email: maskEmail(order.customer.email) },
    shipping: order.shipping,
    // Only once it has been paid for: a tracking number on an order that is
    // not paid would be a mistake in the dashboard, not something to show.
    shipment:
      order.status === 'paid' && order.shipment
        ? {
            courierName: order.shipment.courierName,
            trackingNumber: order.shipment.trackingNumber,
            trackingUrl: order.shipment.trackingUrl,
            shippedAt: order.shipment.shippedAt,
          }
        : undefined,
  }
}

/** Enough for the customer to recognise their own address, not enough to leak it. */
function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email
  const head = user.slice(0, 2)
  return `${head}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`
}
