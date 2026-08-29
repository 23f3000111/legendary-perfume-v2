# Setup and launch

Everything needed to take the shop from a local test payment to a live one, in
the order it should be done.

## 0. Running it locally

```bash
npm install
npm run dev
```

One command, two servers: **Vite on 5173** for the site, and the **API on 3000**
for the functions. Vite proxies `/api` to 3000, so if you ever start only Vite
you get a wall of `ECONNREFUSED /api/...` in the log. That is the whole meaning
of that error: nothing is listening on 3000.

`npm run dev:site` and `npm run dev:api` start them separately if you want two
terminals.

---

## 1. Stripe

### The keys

1. Sign up at [stripe.com](https://stripe.com) and open the dashboard.
2. Leave the **Test mode** toggle **on** (top right). Everything below is done in
   test mode first.
3. **Developers → API keys**. Copy both into `.env`:

   ```
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

   The secret key is server only and must never reach the browser. The
   publishable key is meant to be public, which is why it carries the `VITE_`
   prefix that puts it in the bundle.

### The webhook secret

**Yes, you need it in test mode too.** It is not optional for testing, because
the webhook is what actually completes an order. Without it, a test card will be
charged in Stripe and then the order sits at *pending* forever, with no
confirmation email to anyone. So it is exactly the piece you want working before
you trust a real payment.

Why it works that way: the browser saying "I paid" is not evidence. Stripe's own
signed callback is. See `api/webhook.ts`.

**Locally, do not use the dashboard at all.** Stripe cannot reach a laptop, so
it rejects `localhost:3000/api/webhook` with *"The URL must be publicly
accessible"*. That is correct and there is no way around it: an endpoint created
in the dashboard can only ever point at a deployed URL.

The CLI covers local work instead, by holding an outbound connection open and
relaying events back down it. **`npm run dev` already starts it**, alongside the
site and the API, so there is nothing to run in a third terminal. Look for the
yellow `hook │` lines.

The signing secret is already in `.env`. It is **stable per account**, so unlike
what you may read elsewhere it does not change between runs. To print it again:

```bash
stripe listen --api-key sk_test_... --print-secret
```

If `npm run dev` says the listener was skipped, install the CLI with
`scoop install stripe`.

**Once deployed** (still in test mode), create a real endpoint instead:

1. **Developers → Webhooks → Add endpoint** (newer dashboards call this
   *Create an event destination*).
2. On **Select events**, ignore the long list of categories and expand
   **Payment Intent**. Tick exactly these three, and nothing else:

   - `payment_intent.succeeded` — the one that settles the order and sends both
     emails
   - `payment_intent.payment_failed` — marks the order failed
   - `payment_intent.canceled` — marks it cancelled

   Do not use **Select all**. Every extra event is a request the function has to
   wake up for, verify and discard, and the handler ignores all of them.
   `api/webhook.ts` handles those three and no others.
3. **Choose destination type** → *Webhook endpoint*.
4. URL: `https://your-domain/api/webhook`
5. Copy the **Signing secret** into the Vercel environment as
   `STRIPE_WEBHOOK_SECRET`.

You will end up with **two different** signing secrets over the project's life,
and eventually a third: one from the CLI for local work, one for the deployed
test endpoint, one for the deployed live endpoint. They are not interchangeable.

### Malaysian payment methods

In **Settings → Payment methods**, turn on Cards and **FPX** (Malaysian online
banking, which is how a large share of Malaysian customers will want to pay).
Grab Pay and Alipay are worth considering too. The checkout uses Stripe's
automatic payment methods, so anything enabled on the account appears at the
checkout without a code change.

---

## 2. Supabase (the database)

You already have the connection string. One thing matters about **which** one you
copied.

In Supabase: **Project Settings → Database → Connection string**. You want the
**Transaction pooler** (port `6543`), not the direct connection:

```
DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

Why the pooler: serverless functions come and go constantly, and each one wants
its own connection. The direct connection (`db.PROJECT.supabase.co:5432`) runs
out of connections quickly under that pattern, and on newer projects it is also
IPv6 only, which many serverless platforms cannot reach at all.

Replace `PASSWORD` with your database password, URL-encoding any special
characters in it (`@` becomes `%40`, and so on).

You do **not** need to create any tables. `orders` and `product_overrides` are
created on first use.

**On the certificate.** Supabase does not use a public certificate authority for
Postgres: it signs with its own *Supabase Root 2021 CA*, which is not in Node's
trust store. A connection verified against the public roots therefore fails with
`SELF_SIGNED_CERT_IN_CHAIN`. The advice you will find for that is
`rejectUnauthorized: false`, which does not solve the trust problem, it throws
it away, and leaves the database connection open to interception.

Supabase's roots are pinned instead, in `api/_lib/supabase-ca.ts`. That is
stricter than the public set would have been: this connection trusts Supabase
and nothing else. Nothing to configure, and there is deliberately no switch to
turn verification off.

Check it works:

```bash
npm run db:check
```

Without `DATABASE_URL` the shop still runs: orders fall back to living on their
Stripe PaymentIntent, and the dashboard writes to a local file and says plainly
that changes will not survive a deploy.

---

## 3. Resend (email)

1. Sign up at [resend.com](https://resend.com).
2. **API Keys → Create API Key**, with **Sending access**. Copy it once, it is
   shown only that time:

   ```
   RESEND_API_KEY=re_...
   ```

3. **Domains → Add Domain**, enter `legendary.com.my`, and add the DNS records
   it gives you (a DKIM `TXT`, an SPF `TXT`, usually an MX for replies) at
   whoever hosts the domain's DNS. Verification takes minutes to a few hours.

4. Until the domain verifies, you can send from Resend's shared sender:

   ```
   ORDER_FROM_EMAIL=Legendary <onboarding@resend.dev>
   ```

   In that state Resend will only deliver to **the email address you signed up
   with**, which is fine for testing and useless for customers. Once
   `legendary.com.my` is verified, switch to:

   ```
   ORDER_FROM_EMAIL=Legendary <noreply@legendary.com.my>
   ```

Order notifications and contact form messages both go to `ORDER_NOTIFY_EMAIL`,
carrying the invoice. `ORDER_NOTIFY_CC` adds anyone else who should get a copy.

`ORDER_NOTIFY_CC` may be left empty to mean nobody; removing the line entirely
brings the default back. Copies are sent as their own messages, so one that
cannot be delivered is logged and never costs the house the notification itself.

**Until the domain verifies, customers get no email at all.** Resend's shared
sender only delivers to the account's own address, so the house's notification
arrives and the customer's confirmation is refused. Everything else works: the
order is taken, recorded and shown, which is what makes this so easy to miss.
The functions log a warning whenever they are sending as `resend.dev` for
exactly that reason.

**Once the domain shows Verified**, two environment variables have to change or
nothing improves. Verifying the domain does not by itself change who the mail is
sent as:

```
ORDER_FROM_EMAIL=Legendary <noreply@legendary.com.my>
ORDER_NOTIFY_CC=legendaryteammy@gmail.com
```

Then **redeploy**. Vercel injects environment variables at deploy time, so an
existing deployment keeps the values it was built with no matter what the
dashboard says.

The two kinds of email fail differently, on purpose:

- An **order** email that fails is logged and swallowed. The order is already
  safe in Postgres and on its Stripe payment, and failing the webhook would make
  Stripe retry the event and send the confirmation twice.
- A **contact form** message that fails returns an error to the visitor, telling
  them to use WhatsApp. There is no other copy of that message, so claiming it
  was sent when it was not loses it completely.

---

## 4. The dashboard

The dashboard is at **`/admin`** and nowhere else. There is no link to it from
the site: not in the navigation, not in the footer. It is excluded from the
sitemap, disallowed in `robots.txt` and carries a `noindex`, so it will not turn
up in a search result.

Set a long password:

```
ADMIN_PASSWORD=a-long-passphrase-you-choose
```

Until you set one, `/admin` refuses every sign in. An unset password never means
open doors.

The password is exchanged for a signed, HttpOnly session cookie lasting eight
hours. Failed sign ins are rate limited to ten a minute per address, so the
password cannot be ground down by guessing. Every dashboard endpoint checks the
session on every request, so knowing the URL gets you a password prompt and
nothing else.

**If you want a second layer**, Vercel offers password protection on the whole
deployment (Project → Settings → Deployment Protection). That is a good idea for
the staging deployment and the wrong tool for production, since it would sit in
front of the shop as well.

---

## 5. Test the whole path

With `npm run dev` and `stripe listen` both running:

```bash
npm run smoke     # 25 checks against the real API and database
```

That covers the whole server path, including a **signed webhook**: it forges one
signature and confirms it is rejected, then sends a correctly signed one and
confirms the order flips to paid. So the webhook logic is proven before you ever
run the Stripe CLI. It removes its own test order afterwards.

Then by hand, which is the one that matters:

1. Add something to the bag, go to the checkout, fill the form in. **State is a
   dropdown**, so choose it rather than typing.
2. Pay with test card **`4242 4242 4242 4242`**, any future expiry, any CVC, any
   postcode.
3. Confirm, in order:
   - the confirmation page shows a reference like `LG-XXXX-XXXX`
   - `stripe listen` logs `payment_intent.succeeded`
   - the notification email arrives with the invoice
   - the customer confirmation arrives, **once the domain is verified**. Before
     that Resend refuses it and only the house copy goes out
   - `/track` finds the order with that reference and email
   - `/admin` → Orders shows it as **paid**

Other test cards worth trying, from
[Stripe's list](https://stripe.com/docs/testing):

| Card | What it does |
| --- | --- |
| `4242 4242 4242 4242` | succeeds |
| `4000 0000 0000 9995` | declined, insufficient funds |
| `4000 0025 0000 3155` | requires 3D Secure authentication |

Also test the dashboard: toggle something out of stock, confirm the product page
says **Sold out**, and confirm the checkout refuses it if you try anyway.

---

## 5a. When a webhook is missed

It will happen: a deploy restarting a function mid-delivery, a network blip, or
simply nothing forwarding events during local work. The order is paid at Stripe
and the row still says pending.

The shop repairs itself. Every read of a pending order, by a customer on
`/order` or by the dashboard, asks Stripe what really happened and settles the
order there and then, sending the emails that never went. Whichever of the
webhook or the reconciler gets there first does the work; the other finds it
done, so nothing is ever emailed twice. See `api/_lib/reconcile.ts`.

The same pass retires dead checkouts. Pressing back at the payment step leaves a
Stripe intent that stays `requires_payment_method` forever, so after 30 minutes
those become **abandoned** rather than sitting in the dashboard as orders that
might still arrive. `ABANDON_AFTER_MINUTES` changes the window.

---

## 6. Going live

The order matters: everything above proved in **test mode**, then the switch to
live, then deployment. Section 7 has the deployment steps in full.

1. **Stripe → activate your account**: business details and a Malaysian bank
   account for payouts. Stripe takes time to review this, so start it early.
2. Switch the dashboard to **live mode** and take the live key pair.
3. Put the live keys in Vercel, **not** in your local `.env`. Section 7 explains
   why, and the tooling refuses live keys locally to enforce it.
4. Create the webhook endpoint again in live mode and copy that signing secret.
5. Point the domain at Vercel.
6. Place one real order with a real card and refund it.

---

## 7. Deploying to Vercel

### Before you push

**Live keys must never sit in your local `.env`.** Nothing about localhost makes
a payment pretend: a live key there creates real PaymentIntents and a real card
on the local checkout is really charged. `npm run dev` and `npm run smoke` both
refuse to start against `sk_live_` for exactly that reason.

So put the **test** pair back in `.env` (Stripe dashboard, Test mode toggle,
Developers → API keys) and give the live pair to Vercel only. That way local
work stays free and the deployed site takes real money.

`.env` is git-ignored and stays that way. Nothing secret is ever committed.

### Create the project

1. Push the repository to GitHub.
2. Vercel → **Add New → Project**, import the repo.
3. Framework preset **Vite**, which it should detect. Build command
   `npm run build`, output `dist`. `vercel.json` already sets these, so leave
   them alone if it fills them in.
4. **Do not deploy yet.** Add the environment variables first, or the first
   build produces a site with no keys.

### Environment variables

Vercel → Project → **Settings → Environment Variables**. Set every one of these
for **Production**:

| Variable | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_live_…` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | filled in below, after the endpoint exists |
| `DATABASE_URL` | the Supabase **transaction pooler** string, port 6543 |
| `RESEND_API_KEY` | `re_…` |
| `ORDER_FROM_EMAIL` | `Legendary <onboarding@resend.dev>` until the domain verifies |
| `ORDER_NOTIFY_EMAIL` | `noreply@legendary.com.my` |
| `ORDER_NOTIFY_CC` | leave **empty** until the domain verifies |
| `ADMIN_PASSWORD` | a long passphrase |
| `ADMIN_SESSION_SECRET` | 40+ random characters |
| `SITE_URL` | `https://legendary.com.my` |
| `VITE_SITE_URL` | `https://legendary.com.my` |

`VITE_`-prefixed variables are read **at build time** and baked into the bundle,
so changing one needs a redeploy, not just a restart. The rest are read per
request.

Set `SITE_URL` to the final domain from the start, even before DNS points at it.
Canonical tags, the sitemap and the links inside emails all come from it, and
having them move later is worse than having them point somewhere not yet live.

### The live webhook

Only after the first deploy, because the endpoint has to exist to receive.

1. Stripe dashboard, **Live mode** this time.
2. **Developers → Webhooks → Add endpoint** (or *Create an event destination*).
3. Expand **Payment Intent** and tick exactly `payment_intent.succeeded`,
   `payment_intent.payment_failed`, `payment_intent.canceled`.
4. URL: `https://legendary.com.my/api/webhook` (or the `.vercel.app` URL until
   DNS is live; change it afterwards).
5. Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET` and **redeploy**.

The live signing secret is a different value from the CLI one you use locally.
They are not interchangeable.

### The domain

1. Vercel → Project → **Settings → Domains → Add** `legendary.com.my`.
2. Vercel prints the DNS records. At your registrar, add an `A` record for the
   apex pointing at Vercel's address and a `CNAME` for `www`.
3. Certificates are issued automatically once the records resolve.
4. Update the Stripe webhook URL to the real domain.

Until DNS resolves, the site is reachable at its `.vercel.app` URL. That
hostname is served with `X-Robots-Tag: noindex` (see `vercel.json`), so Google
cannot index it alongside the real domain and treat the two as duplicates.

### What the platform config already does

`vercel.json` is committed and covers:

- **`regions: ["sin1"]`** — functions run in Singapore, beside the Supabase
  project in `ap-southeast-1`. A function in Washington would cross an ocean for
  every query.
- **`maxDuration: 30`** — a reconciling dashboard read can make a Stripe call
  per pending order.
- **Security headers** — HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
  a `Referrer-Policy` and a `Permissions-Policy`, on every response.
- **Caching** — hashed assets immutable for a year, `sitemap.xml`, `robots.txt`
  and `llms.txt` for an hour.
- **The SPA rewrite** — every path that is not a file or `/api/` serves
  `index.html`, so deep links work on a real router rather than a hash.

### After the first deploy

```
https://legendary.com.my/api/catalogue    → {"products":{},"hidden":[]}
https://legendary.com.my/admin            → a password prompt
https://legendary.com.my/sitemap.xml      → 41 URLs
https://legendary.com.my/robots.txt       → disallows /admin and /api/
```

Then place **one real order with a real card** and refund it from the Stripe
dashboard. Confirm along the way that the order reaches the dashboard as paid,
that `/track` finds it, and that the notification email arrives. Nothing short
of that proves the live path.

## Environment variables, in full

| Variable | Needed | What it is |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | yes | Server side Stripe key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | yes | Browser side Stripe key |
| `STRIPE_WEBHOOK_SECRET` | yes | Verifies Stripe's callbacks. Without it no order is ever marked paid |
| `DATABASE_URL` | strongly | Supabase transaction pooler. Without it the dashboard cannot save |
| `RESEND_API_KEY` | strongly | Without it emails are logged, not sent |
| `ADMIN_PASSWORD` | yes | The dashboard password. Unset means the dashboard is closed |
| `ADMIN_SESSION_SECRET` | optional | Signs the session cookie. Derived from the Stripe key if unset |
| `SITE_URL` | yes | Absolute origin, for emails and the sitemap |
| `VITE_SITE_URL` | yes | The same origin, for canonical tags |
| `ORDER_FROM_EMAIL` | optional | Sender. Defaults to `noreply@legendary.com.my` |
| `ORDER_NOTIFY_EMAIL` | optional | Where order notifications go |
| `ORDER_NOTIFY_CC` | optional | A second recipient for them |
| `ORDER_REPLY_TO` | optional | Where customer replies go |
