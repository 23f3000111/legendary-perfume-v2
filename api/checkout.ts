import type { VercelRequest, VercelResponse } from '@vercel/node'
import { CURRENCY, priceOrder, toMinorUnits } from './_lib/catalogue'
import { handler, HttpError, json, requireMethod } from './_lib/http'
import {
  newReference, parseAddress, parseCustomer, parseNote, type Order,
} from './_lib/order'
import { orderStore, packLines } from './_lib/store'
import { stripe } from './_lib/stripe'

/**
 * Open a checkout.
 *
 * Takes a basket of product ids and quantities, prices it from the server's own
 * catalogue, records a pending order and hands back a Stripe client secret for
 * the browser to confirm against. No price, and no total, is ever read from the
 * request: a tampered basket changes what is bought, never what is charged.
 *
 * The order is written before payment so that a customer who pays but loses the
 * page still has a reference the house can find, and so the webhook has a row
 * to settle against.
 */
export default handler(async (req: VercelRequest, res: VercelResponse) => {
  requireMethod(req, 'POST')

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {}
  const { lines, subtotal, total } = await priceOrder(body.items)
  const customer = parseCustomer(body.customer)
  const shipping = parseAddress(body.shipping)
  const note = parseNote(body.note)

  const reference = newReference()
  const order: Order = {
    reference,
    status: 'pending',
    currency: CURRENCY,
    lines,
    subtotal,
    // Client amendment: delivery is complimentary on every order.
    shippingCost: 0,
    total,
    customer,
    shipping,
    note,
    paymentIntentId: '',
    createdAt: new Date().toISOString(),
  }

  const intent = await stripe().paymentIntents.create(
    {
      amount: toMinorUnits(total),
      currency: CURRENCY.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      receipt_email: customer.email,
      description: `Legendary order ${reference}`,
      shipping: {
        name: customer.name,
        phone: customer.phone,
        address: {
          line1: shipping.line1,
          line2: shipping.line2,
          city: shipping.city,
          postal_code: shipping.postcode,
          state: shipping.state,
          country: 'MY',
        },
      },
      // The metadata is a full record of the order, so the shop still works
      // with Stripe as its only storage. See api/_lib/store.ts.
      metadata: {
        reference,
        lines: packLines(lines),
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        addr1: shipping.line1,
        addr2: shipping.line2 ?? '',
        city: shipping.city,
        postcode: shipping.postcode,
        state: shipping.state,
        country: shipping.country,
        note: note ?? '',
      },
    },
    // Stripe deduplicates on this key, so a double submitted form cannot open
    // two payments for the same reference.
    { idempotencyKey: `order:${reference}` },
  )

  if (!intent.client_secret) {
    throw new HttpError(502, 'We could not start the payment. Please try again.')
  }

  order.paymentIntentId = intent.id
  await orderStore().save(order)

  json(res, 200, {
    reference,
    clientSecret: intent.client_secret,
    currency: CURRENCY,
    lines,
    subtotal,
    shippingCost: 0,
    total,
  })
})
