import { Resend } from 'resend'
import { optionalEnv } from './http.js'
import type { Order } from './order.js'

/**
 * Transactional email.
 *
 * Two go out on every paid order, both modelled on the "Thank you for your
 * order!" sample the client supplied:
 *
 *  - the customer's confirmation, with the order summary and both addresses;
 *  - the house's own notification, carrying the same invoice plus the contact
 *    details needed to pack and ship it.
 *
 * With no RESEND_API_KEY set, both are logged rather than sent, so a local run
 * or a fresh deploy still completes a checkout end to end.
 */

/**
 * Where the house reads its own mail. `noreply@legendary.com.my` is the primary
 * address: everything the site sends is sent from it, and order notifications
 * and contact form messages both arrive at it.
 *
 * `ORDER_NOTIFY_CC` adds anyone else who should get a copy. Set to an empty
 * value it means nobody, rather than falling back to the default: until a
 * domain is verified, Resend will only deliver to the account's own address,
 * and a second recipient makes it refuse the whole message. So being able to
 * say "no copies for now" is what lets email work at all before the DNS lands.
 */
export const PRIMARY_INBOX = optionalEnv('ORDER_NOTIFY_EMAIL') ?? 'noreply@legendary.com.my'

const ccRaw = process.env.ORDER_NOTIFY_CC
const HOUSE_CC = (ccRaw === undefined ? 'legendaryteammy@gmail.com' : ccRaw)
  .split(',')
  .map((a) => a.trim())
  .filter((a) => a && a !== PRIMARY_INBOX)
  .filter((a, i, all) => all.indexOf(a) === i)

/** The address the site sends as, and whether it can reach a customer. */
export function senderHealth(): { from: string; canReachCustomers: boolean; configured: boolean } {
  const from = optionalEnv('ORDER_FROM_EMAIL') ?? 'Legendary <noreply@legendary.com.my>'
  return {
    from,
    // Resend's shared sender only delivers to the account's own address, so a
    // deployment on it takes orders and tells no customer about them.
    canReachCustomers: !from.includes('resend.dev'),
    configured: Boolean(optionalEnv('RESEND_API_KEY')),
  }
}

let client: Resend | undefined

function resend(): Resend | null {
  const key = optionalEnv('RESEND_API_KEY')
  if (!key) return null
  if (!client) client = new Resend(key)
  return client
}

const money = (currency: string, value: number) =>
  `${currency === 'MYR' ? 'RM' : currency + ' '}${value.toFixed(2)} ${currency}`

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  )
}

function addressBlock(order: Order): string {
  const a = order.shipping
  return [order.customer.name, a.line1, a.line2, `${a.postcode} ${a.city} ${a.state}`, a.country]
    .filter(Boolean)
    .map((l) => escape(String(l)))
    .join('<br />')
}

/**
 * The invoice table both emails share.
 *
 * Inline styles and a table layout throughout: email clients strip stylesheets
 * and most still do not lay out with flex or grid.
 */
function invoice(order: Order): string {
  const rows = order.lines
    .map(
      (l) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #E6DFD2;font-size:14px;color:#1C1815;">
          ${escape(l.name)}${l.size ? `<br /><span style="font-size:12px;color:#8A8078;">${escape(l.size)}</span>` : ''}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #E6DFD2;font-size:14px;color:#8A8078;text-align:center;">&times; ${l.qty}</td>
        <td style="padding:10px 0;border-bottom:1px solid #E6DFD2;font-size:14px;color:#1C1815;text-align:right;white-space:nowrap;">${money(order.currency, l.lineTotal)}</td>
      </tr>`,
    )
    .join('')

  const total = (label: string, value: string, strong = false) => `
      <tr>
        <td colspan="2" style="padding:6px 0;font-size:${strong ? '15' : '14'}px;color:${strong ? '#1C1815' : '#8A8078'};${strong ? 'font-weight:600;' : ''}">${label}</td>
        <td style="padding:6px 0;font-size:${strong ? '15' : '14'}px;color:#1C1815;text-align:right;white-space:nowrap;${strong ? 'font-weight:600;' : ''}">${value}</td>
      </tr>`

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows}
      ${total('Subtotal', money(order.currency, order.subtotal))}
      ${total('Shipping', order.shippingCost === 0 ? 'Free' : money(order.currency, order.shippingCost))}
      ${total('Taxes', money(order.currency, 0))}
      ${total('Total', money(order.currency, order.total), true)}
    </table>`
}

function shell(title: string, intro: string, order: Order, siteUrl: string, extra = ''): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F4EEE2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE2;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FBF8F2;border:1px solid #E6DFD2;">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:0.16em;color:#1C1815;">LEGENDARY</div>
          <div style="font-size:11px;letter-spacing:0.24em;color:#B08D3E;margin-top:6px;">ORDER ${escape(order.reference)}</div>
        </td></tr>
        <tr><td style="padding:16px 32px 0;">
          <h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;color:#1C1815;">${escape(title)}</h1>
          <p style="margin:0 0 22px;font-size:14px;line-height:1.7;color:#5A524B;">${intro}</p>
        </td></tr>
        <tr><td style="padding:0 32px;">
          <div style="font-size:11px;letter-spacing:0.18em;color:#B08D3E;margin-bottom:8px;">ORDER SUMMARY</div>
          ${invoice(order)}
        </td></tr>
        <tr><td style="padding:26px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" valign="top" style="font-size:13px;line-height:1.7;color:#5A524B;">
                <div style="font-size:11px;letter-spacing:0.18em;color:#B08D3E;margin-bottom:8px;">DELIVERING TO</div>
                ${addressBlock(order)}
              </td>
              <td width="50%" valign="top" style="font-size:13px;line-height:1.7;color:#5A524B;">
                <div style="font-size:11px;letter-spacing:0.18em;color:#B08D3E;margin-bottom:8px;">CONTACT</div>
                ${escape(order.customer.email)}<br />${escape(order.customer.phone)}
              </td>
            </tr>
          </table>
        </td></tr>
        ${order.note ? `<tr><td style="padding:22px 32px 0;">
          <div style="font-size:11px;letter-spacing:0.18em;color:#B08D3E;margin-bottom:8px;">NOTE</div>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#5A524B;">${escape(order.note)}</p>
        </td></tr>` : ''}
        ${extra}
        <tr><td style="padding:28px 32px 34px;">
          <a href="${siteUrl}/order?reference=${encodeURIComponent(order.reference)}"
             style="display:inline-block;background:#1C1815;color:#F4EEE2;text-decoration:none;padding:13px 26px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">
            View your order
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 30px;border-top:1px solid #E6DFD2;">
          <p style="margin:18px 0 0;font-size:12px;line-height:1.7;color:#8A8078;">
            Quote your reference <strong style="color:#1C1815;">${escape(order.reference)}</strong> in any message about this order.
            Write to us at ${escape(PRIMARY_INBOX)} and we will pick it up.
          </p>
        </td></tr>
      </table>
      <p style="max-width:560px;margin:16px auto 0;font-size:11px;color:#8A8078;text-align:center;">
        Legendary Perfume &middot; Crafted in Malaysia
      </p>
    </td></tr>
  </table>
</body></html>`
}

/**
 * Send one email, and report honestly whether it went.
 *
 * The result is returned rather than thrown, because the two callers want
 * opposite things from a failure and only one of them is entitled to be
 * relaxed about it. See the note on sendContactMessage.
 */
/**
 * Send to the house: the primary inbox first, copies after.
 *
 * Deliberately not one message with several recipients. A provider refuses the
 * whole send when any single address is not allowed, so one unreachable copy
 * would cost the house the notification itself, which is the part that matters.
 * Sending the copies separately means the worst a bad address can do is fail to
 * be a copy.
 */
async function sendToHouse(
  subject: string,
  html: string,
  replyTo?: string,
): Promise<{ ok: boolean; reason?: string }> {
  const primary = await send(PRIMARY_INBOX, subject, html, replyTo)
  for (const cc of HOUSE_CC) {
    const copy = await send(cc, subject, html, replyTo)
    if (!copy.ok) console.error(`[email] copy to ${cc} not delivered: ${copy.reason}`)
  }
  return primary
}

async function send(
  to: string | string[],
  subject: string,
  html: string,
  replyTo?: string,
): Promise<{ ok: boolean; reason?: string }> {
  const api = resend()
  if (!api) {
    const reason = 'RESEND_API_KEY is not set'
    console.log(`[email] ${reason}, not sending "${subject}" to ${String(to)}`)
    return { ok: false, reason }
  }
  const from = optionalEnv('ORDER_FROM_EMAIL') ?? 'Legendary <noreply@legendary.com.my>'
  /*
   * Resend's shared sender only delivers to the account's own address, so a
   * deployment left on it takes orders and silently tells no customer about
   * them. That is invisible from the outside: the shop looks fine and the
   * house still gets its notification. Worth saying out loud in the log.
   */
  if (from.includes('resend.dev')) {
    console.warn(
      `[email] sending as ${from}. Customers will NOT receive anything: the shared ` +
      'sender only reaches the Resend account address. Set ORDER_FROM_EMAIL to an ' +
      'address on a verified domain.',
    )
  }
  const { error } = await api.emails.send({ from, to, subject, html, replyTo })
  if (error) {
    console.error(`[email] send failed for ${subject}:`, error)
    return { ok: false, reason: error.message ?? 'the mail provider refused it' }
  }
  return { ok: true }
}

/** The customer's own confirmation. */
export async function sendOrderConfirmation(order: Order, siteUrl: string) {
  await send(
    order.customer.email,
    `Order ${order.reference} confirmed`,
    shell(
      'Thank you for your order!',
      'We are getting your order ready to be shipped. We will let you know as soon as it is on its way.',
      order,
      siteUrl,
    ),
    optionalEnv('ORDER_REPLY_TO'),
  )
}

/** The house's own copy, with everything needed to pack and post it. */
export async function sendMerchantNotification(order: Order, siteUrl: string) {
  const placed = new Date(order.createdAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })
  const extra = `<tr><td style="padding:22px 32px 0;">
      <div style="font-size:11px;letter-spacing:0.18em;color:#B08D3E;margin-bottom:8px;">PAYMENT</div>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#5A524B;">
        Paid in full &middot; ${escape(order.paymentIntentId)}<br />Placed ${escape(placed)} (MYT)
      </p>
    </td></tr>`
  await sendToHouse(
    `New order ${order.reference} · ${money(order.currency, order.total)}`,
    shell(
      'A new order has come in',
      `${escape(order.customer.name)} has paid for the order below. The invoice is the same one the customer received.`,
      order,
      siteUrl,
      extra,
    ),
    order.customer.email,
  )
}

/**
 * A contact form message, delivered to the house's primary inbox.
 *
 * The customer's own address becomes the reply to, so hitting reply in the
 * inbox answers them directly. Their text is escaped rather than trusted: it
 * arrives from a public form and is rendered as HTML.
 */
export async function sendContactMessage(msg: { name: string; email: string; message: string }) {
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F4EEE2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EEE2;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FBF8F2;border:1px solid #E6DFD2;">
        <tr><td style="padding:30px 32px 6px;">
          <div style="font-size:11px;letter-spacing:0.24em;color:#B08D3E;">SEND A MESSAGE</div>
          <h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:22px;color:#1C1815;">
            ${escape(msg.name)} has written in
          </h1>
        </td></tr>
        <tr><td style="padding:6px 32px 0;font-size:13px;line-height:1.7;color:#5A524B;">
          <a href="mailto:${escape(msg.email)}" style="color:#B08D3E;">${escape(msg.email)}</a>
        </td></tr>
        <tr><td style="padding:20px 32px 32px;">
          <div style="border-top:1px solid #E6DFD2;padding-top:18px;font-size:14px;line-height:1.8;color:#1C1815;white-space:pre-wrap;">${escape(msg.message)}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
  /*
   * This one throws when it fails, unlike the order emails.
   *
   * An order is safely recorded in Postgres and on its Stripe payment before
   * any email is attempted, so a bounced confirmation is an inconvenience and
   * the webhook must not be failed for it: Stripe would retry the event and
   * send the survivor twice.
   *
   * A contact form message has no such record. The email IS the message, so
   * telling the visitor it was sent when it was not loses it completely, and
   * they walk away believing the house has heard from them. Better to say so
   * and point them at WhatsApp.
   */
  const { ok, reason } = await sendToHouse(`Contact form: ${msg.name}`, html, msg.email)
  if (!ok) throw new Error(reason ?? 'the message could not be sent')
}
