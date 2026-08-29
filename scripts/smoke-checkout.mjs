/**
 * A smoke test for the checkout, run against Stripe test mode.
 *
 * Bundles the real serverless handlers with esbuild and calls them with a mock
 * request and response, so this exercises exactly the code Vercel deploys: the
 * validation, the server side pricing, the PaymentIntent, and the order lookup.
 * It then confirms the payment with Stripe's own test card and reads the order
 * back, which is the only way to know the whole path works rather than each
 * piece in isolation.
 *
 * Run: npm run smoke
 *
 * Requires STRIPE_SECRET_KEY in .env, and refuses to run against a live key:
 * it would take a real payment.
 */
import { build } from 'esbuild'
import { readFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** Bundles written next to the project, removed on the way out. */
const tempFiles = []

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Load .env into process.env the way the platform would.
for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('smoke: STRIPE_SECRET_KEY is not set')
  process.exit(1)
}
if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  console.error('smoke: refusing to run against a live Stripe key, this takes a real payment')
  console.error('       put the sk_test_ key back in .env; live keys belong in Vercel only')
  process.exit(1)
}

async function loadModule(entry) {
  // Written to a real file rather than a data: URL, because a data: module
  // cannot resolve the bare 'stripe' specifier.
  const outfile = resolve(ROOT, `.tmp-${entry.replace(/[^a-z0-9]/gi, '_')}.mjs`)
  await build({
    entryPoints: [resolve(ROOT, entry)],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    external: ['pg', 'stripe', 'resend'],
    absWorkingDir: ROOT,
    loader: { '.json': 'json' },
  })
  tempFiles.push(outfile)
  return import(pathToFileURL(outfile).href)
}

async function loadHandler(entry) {
  return (await loadModule(entry)).default
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(c) { res.statusCode = c; return res },
    setHeader(k, v) { res.headers[k] = v },
    send(b) { res.body = b },
  }
  return res
}

async function call(handler, req) {
  const res = mockRes()
  await handler(req, res)
  return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null }
}

let failures = 0
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`)
  if (!ok) failures++
}

const checkout = await loadHandler('api/checkout.ts')
const orderLookup = await loadHandler('api/order.ts')

// -------------------------------------------------------------- validation --

let r = await call(checkout, { method: 'GET', body: {} })
check('GET is rejected', r.status === 405, r.body?.error)

r = await call(checkout, { method: 'POST', body: { items: [] } })
check('empty basket is rejected', r.status === 400, r.body?.error)

r = await call(checkout, {
  method: 'POST',
  body: {
    items: [{ id: 'orchid', qty: 1, price: 1 }],
    customer: { email: 'not-an-email', name: 'A', phone: '+60123456789' },
    shipping: { line1: 'x', city: 'y', postcode: '1', state: 'z' },
  },
})
check('bad email is rejected', r.status === 400, r.body?.error)

r = await call(checkout, {
  method: 'POST',
  body: {
    items: [{ id: 'not-a-product', qty: 1 }],
    customer: { email: 'a@b.com', name: 'A', phone: '+60123456789' },
    shipping: { line1: 'x', city: 'y', postcode: '1', state: 'z' },
  },
})
check('unknown product is rejected', r.status === 400, r.body?.error)

// ------------------------------------------------------- pricing authority --

const basket = {
  method: 'POST',
  body: {
    // A price sent by the browser must be ignored entirely.
    items: [{ id: 'orchid', qty: 2, price: 1, unitPrice: 1 }, { id: 'wish-i', qty: 1 }],
    customer: { email: 'buyer@example.com', name: 'Azlan Hashim', phone: '+60 12 345 6789' },
    shipping: {
      line1: 'No. 37-03, ViiA Residences, Jalan Bangsar',
      city: 'Kuala Lumpur',
      postcode: '59200',
      state: 'WP Kuala Lumpur',
    },
    note: 'Please gift wrap.',
    total: 1,
  },
}

r = await call(checkout, basket)
check('checkout opens', r.status === 200, r.body?.error ?? '')
if (r.status !== 200) { console.error(r.body); process.exit(1) }

const session = r.body
// orchid 188 x2 + wish-i 88 = 464
check('server prices the basket, not the browser', session.total === 464, `total=${session.total}`)
check('shipping is free', session.shippingCost === 0)
check('reference is well formed', /^LG-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(session.reference), session.reference)
check('client secret returned', typeof session.clientSecret === 'string' && session.clientSecret.startsWith('pi_'))

// ------------------------------------------------- confirm against Stripe --

const Stripe = (await import(pathToFileURL(resolve(ROOT, 'node_modules/stripe/esm/stripe.esm.node.js')).href)).default
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const intentId = session.clientSecret.split('_secret_')[0]
const intent = await stripe.paymentIntents.retrieve(intentId)
check('amount is in sen', intent.amount === 46400, `amount=${intent.amount}`)
check('currency is myr', intent.currency === 'myr')
check('reference is on the intent', intent.metadata.reference === session.reference)
check('basket is on the intent', intent.metadata.lines === 'orchid:2:188|wish-i:1:88', intent.metadata.lines)

const confirmed = await stripe.paymentIntents.confirm(intentId, {
  payment_method: 'pm_card_visa',
  return_url: 'https://legendary.com.my/order',
})
check('test card is accepted', confirmed.status === 'succeeded', confirmed.status)

// -------------------------------------------------------------- webhook ----

/*
 * Stripe's callback is what actually settles an order, so it is tested here
 * rather than left to a manual run of the Stripe CLI.
 *
 * The event is signed with `generateTestHeaderString`, which is the same HMAC
 * the real callback carries, so the handler's verification is genuinely
 * exercised: a wrong secret is rejected below before the right one is accepted.
 *
 * Against the Stripe backed store this changes nothing, because that store
 * reads the payment's own status. Against Postgres it is the only thing that
 * moves an order from pending to paid, which is exactly the failure this test
 * exists to catch.
 */
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_smoketest_' + 'x'.repeat(24)
const webhook = await loadHandler('api/webhook.ts')

const event = {
  id: 'evt_smoke',
  object: 'event',
  api_version: null,
  created: Math.floor(Date.now() / 1000),
  type: 'payment_intent.succeeded',
  data: { object: confirmed },
}
const payload = JSON.stringify(event)

const signed = (secret) =>
  stripe.webhooks.generateTestHeaderString({ payload, secret })

const postWebhook = (signature) =>
  webhook(new Request('http://localhost/api/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': signature, 'content-type': 'application/json' },
    body: payload,
  }))

const forged = await postWebhook(signed('whsec_wrong_secret_entirely'))
check('a forged signature is rejected', forged.status === 400, String(forged.status))

const accepted = await postWebhook(signed(process.env.STRIPE_WEBHOOK_SECRET))
check('a signed webhook is accepted', accepted.status === 200, String(accepted.status))

/*
 * The same handler, called the other way.
 *
 * A platform may hand a function the Web Request or Node's (req, res), and
 * which one arrives is a property of the runtime rather than of this code. A
 * webhook that only understood one shape would deploy cleanly and then fail on
 * the first real payment, so both are exercised here.
 */
const { Readable } = await import('node:stream')
const nodeReq = Object.assign(Readable.from([Buffer.from(payload)]), {
  method: 'POST',
  headers: {
    'stripe-signature': signed(process.env.STRIPE_WEBHOOK_SECRET),
    'content-type': 'application/json',
    host: 'localhost',
  },
})
const nodeRes = mockRes()
await webhook(nodeReq, nodeRes)
check('the node handler shape also works', nodeRes.statusCode === 200, String(nodeRes.statusCode))

// --------------------------------------------------- reconciliation ----

/*
 * A webhook that never arrives must not leave a paid order looking unpaid.
 *
 * This is the failure that actually happened in testing: two real payments sat
 * at "pending" with no confirmation email, because nothing was forwarding
 * Stripe's callback. So the reconciler is covered here rather than trusted.
 *
 * A second order is opened and paid without ever telling the API, which is
 * exactly the state a missed webhook leaves behind. Reading it back must repair
 * it.
 */
const missed = await call(checkout, {
  method: 'POST',
  body: {
    items: [{ id: 'orchid', qty: 1 }],
    customer: { email: 'buyer@example.com', name: 'Azlan Hashim', phone: '+60 12 345 6789' },
    shipping: {
      line1: 'No. 37-03, ViiA Residences, Jalan Bangsar',
      city: 'Kuala Lumpur',
      postcode: '59200',
      state: 'WP Kuala Lumpur',
    },
  },
})
check('second order opens', missed.status === 200, missed.body?.error)
const missedRef = missed.body?.reference
const missedIntent = missed.body?.clientSecret?.split('_secret_')[0]

await stripe.paymentIntents.confirm(missedIntent, {
  payment_method: 'pm_card_visa',
  return_url: 'https://legendary.com.my/order',
})

// No webhook is sent. The order is stale in exactly the way a missed callback
// leaves it, and the next read has to notice.
const stale = await call(orderLookup, {
  method: 'GET',
  query: { reference: missedRef, email: 'buyer@example.com' },
})
check('a missed webhook is repaired on read', stale.body?.order?.status === 'paid', stale.body?.order?.status)

// --------------------------------------------------------------- lookup ----

// The Stripe backed store reads through the search index, which lags a little
// after a write, so give it a few tries before calling it a failure. Postgres
// answers immediately.
let found = null
for (let i = 0; i < 10 && !found; i++) {
  const res = await call(orderLookup, {
    method: 'GET',
    query: { reference: session.reference, email: 'buyer@example.com' },
  })
  if (res.status === 200) found = res.body.order
  else if (i === 9) console.log('   last lookup response:', res.status, res.body?.error)
  else await new Promise((r) => setTimeout(r, 3000))
}
check('order is found by reference', Boolean(found))
if (found) {
  check('lookup reports paid', found.status === 'paid', found.status)
  check('lookup total matches', found.total === 464, String(found.total))
  check('lookup masks the email', found.customer.email.includes('*'), found.customer.email)
  check('lookup carries the address', found.shipping.postcode === '59200')
  check('lines are rebuilt from the catalogue', found.lines[0].name === 'Orchid', JSON.stringify(found.lines[0]))
}

// Wrong email must read exactly like a missing order.
const wrong = await call(orderLookup, {
  method: 'GET',
  query: { reference: session.reference, email: 'someone@else.com' },
})
check('wrong email is refused', wrong.status === 404, wrong.body?.error)

const bogus = await call(orderLookup, {
  method: 'GET',
  query: { reference: 'LG-ZZZZ-ZZZZ', email: 'buyer@example.com' },
})
check('unknown reference reads the same', bogus.status === 404 && bogus.body?.error === wrong.body?.error)

/*
 * Take the test order back out of the database.
 *
 * Every run places a genuine order row, and left alone they fill the dashboard
 * with orders nobody placed and skew the revenue on the overview. The Stripe
 * payment stays: a test mode payment costs nothing and Stripe keeps its own
 * record regardless.
 */
if (process.env.DATABASE_URL) {
  try {
    const { default: pg } = await import('pg')
    const { sslFor } = await loadModule('api/_lib/db.ts')
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslFor(process.env.DATABASE_URL),
      max: 1,
    })
    const { rowCount } = await pool.query(
      'DELETE FROM orders WHERE reference = ANY($1)',
      [[session.reference, missedRef].filter(Boolean)],
    )
    await pool.end()
    check('test orders are cleaned up', rowCount === 2, `${rowCount} removed`)
  } catch (err) {
    console.log('   could not clean up the test order:', err.message)
  }
}

for (const f of tempFiles) { try { rmSync(f) } catch {} }
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
