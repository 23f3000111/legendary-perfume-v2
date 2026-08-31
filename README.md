# Legendary — *A Scented Memory of Malaysia*

A production build of the Legendary Perfume storefront. Heritage luxe aesthetic
(ivory, antique gold, Peranakan motifs), scroll driven storytelling, and a real
shop: Stripe payments, order references, order lookup and transactional email.

This repository carries the client's amendments up to and including
**revision 5** (`Website.xlsx`, plus the notes and the sample order email sent
on 28 August 2026).

### Deployments

| | |
| --- | --- |
| **Live shop** | Vercel. Serves the site and the `/api` functions on one origin, holds the Stripe and Resend keys. |
| **Static preview** | https://23f3000111.github.io/legendary-perfume-v2/ — published from `main` by GitHub Actions. Carries no keys, so its checkout says so rather than taking money. |

## Run it

```bash
npm install
cp .env.example .env      # then fill in the Stripe keys
npm run dev               # the site,  http://localhost:5173
npm run dev:api           # the /api functions, in a second terminal
```

Vite proxies `/api` to port 3000, so the shop works end to end locally with
those two commands and nothing else installed. `vercel dev` also works and is
closer to production, but it needs the CLI and a linked project.

```bash
npm run build     # catalogue + type check + Vite build + sitemap/robots/llms
npm run preview   # serve the production build
npm run smoke     # drive a real test mode payment through the API end to end
```

Requires Node 18+.

## The shop

Stripe takes the payment, and there are no accounts anywhere in the flow.

1. **Checkout** (`src/pages/Checkout.tsx`) collects a name, email, phone and a
   Malaysian address, then posts the basket to `POST /api/checkout`.
2. **`/api/checkout`** prices that basket from `api/_catalogue.json`, which is
   generated from `src/data/products.ts` at build time. No price, and no total,
   is ever read from the browser. It mints an order reference, opens a Stripe
   PaymentIntent in MYR and records the order as pending.
3. **Stripe's Payment Element** takes the card inside its own iframe, so card
   details never touch this origin. Card payments settle in place; FPX and
   GrabPay redirect and come back to `/order`.
4. **`POST /api/webhook`** is what actually settles the order. Stripe's
   signature is verified against the raw body, so the browser cannot claim a
   payment that did not happen. On success it marks the order paid and sends
   both emails.
5. **`GET /api/order`** looks an order up by reference plus the email it was
   placed with. A wrong email reads exactly like a reference that does not
   exist, so the endpoint cannot be used to probe for real orders.

**Order references** look like `LG-7K3M-9QX4`: eight characters of Crockford's
alphabet, so there is no I, L, O or U to be misheard down a phone, drawn from
the crypto source rather than `Math.random`.

**Where orders live** is decided by whether `DATABASE_URL` is set:

- **Postgres** when it is. The recommended production setup: the house owns its
  order history, and lookups are immediate.
- **Stripe itself** when it is not. Every order is mirrored onto its
  PaymentIntent's metadata, so a deployment with nothing but Stripe keys is
  fully functional. The one catch is that Stripe's search index takes a few
  seconds to catch up after a sale, so the confirmation page shows the order
  from the checkout's own response and retries the lookup behind the scenes.

**Email** goes out through Resend, from and to `noreply@legendary.com.my`:
the customer's confirmation, modelled on the client's sample, and the house's
own notification carrying the same invoice. `legendaryteammy@gmail.com` gets a
copy. The contact form lands in the same inbox. With no `RESEND_API_KEY` set,
all of it is logged rather than sent and checkout still completes.

**Configuration** is documented field by field in `.env.example`. The same
names go into Vercel's environment variables. `.env` is git ignored.

### Setting it up for real

1. Put the live Stripe keys in Vercel's environment variables.
2. Add a webhook endpoint in Stripe pointing at `https://<domain>/api/webhook`,
   subscribed to `payment_intent.succeeded`, `payment_intent.payment_failed`
   and `payment_intent.canceled`. Put its signing secret in
   `STRIPE_WEBHOOK_SECRET`. **Until this is set, payments are taken but orders
   never settle and no email is sent.**
3. Verify `legendary.com.my` in Resend and set `RESEND_API_KEY`.
4. Provision Postgres and set `DATABASE_URL`. Both tables are created on first
   use. Without it the shop still works, but the dashboard cannot save.
5. Set `ADMIN_PASSWORD` to something long. Until you do, `/admin` refuses every
   sign in, which is the right default.
6. Run `npm run smoke` against test keys to confirm the whole path.

## The dashboard

`/admin`, behind one password in `ADMIN_PASSWORD`. There is one administrator,
so a user table would be ceremony without benefit: the password is exchanged for
a signed, HttpOnly session cookie, and no session state is kept server side to
go stale between function instances.

Three views:

- **Overview** — revenue, average order, what is awaiting payment, and what is
  actually selling by units.
- **Products** — every SKU with switches for **in stock**, **bestseller** and
  **on the shop**, plus an editable price and was price. Reset returns a
  fragrance to the values it was built with.
- **Orders** — recent orders, searchable by reference, name or email, each one
  expanding to the items, the delivery address and the contact details needed to
  pack it.

### What it can and cannot change

Copy, photography and compositions stay in `src/data/` and in git, where they
are reviewed before they go live. What a shopkeeper needs between deploys is a
much smaller set, and that is what the dashboard writes: an override layer that
the catalogue falls through to. See `api/_lib/overrides.ts`.

A change reaches customers within the minute. The storefront reads
`/api/catalogue` once per page load for the handful of products that currently
differ, and that response is edge cached for sixty seconds. Failing to load it
is not an error anyone sees: the site falls back to the catalogue it was built
with.

**Stock is enforced on the server, not in the browser.** `/api/checkout` prices
and stock checks the basket again on every attempt, so a sold out fragrance
cannot be bought by a page that has been left open, or by anyone bypassing the
buttons entirely.

### Storage

The dashboard needs somewhere durable to write.

- **`DATABASE_URL` set** — Postgres. The table is created on first use.
- **Not set** — a JSON file under `.data/`, for local development only. A
  serverless instance has no durable disk, so the dashboard says so plainly in a
  banner rather than pretending the change stuck.


## Search, and answer engines

- Real paths, not hash fragments. `BrowserRouter`, with Vercel rewriting unknown
  paths to `index.html` and `dist/404.html` doing the same job on GitHub Pages.
- Per route `<title>`, description, canonical, Open Graph and Twitter tags via
  `src/components/Seo.tsx`.
- JSON-LD on every page: `Organization` and `WebSite` throughout, plus `Product`
  with an `Offer` carrying price, currency and stock; `FAQPage` over all fifty
  questions; `Store` per boutique; `Article` per journal piece; and a
  `BreadcrumbList`.
- `sitemap.xml`, `robots.txt` and `llms.txt` are generated from the real data by
  `scripts/build-seo.mjs`, so a new fragrance or article appears in all three
  without anyone remembering. `llms.txt` is a plain text brief for the answer
  engines that will not run JavaScript to learn what the house sells.
- Checkout and order lookup carry `noindex` and are disallowed in `robots.txt`.

## Tech

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** — custom design tokens (`tailwind.config.js`, `src/index.css`)
- **Framer Motion** — intro ritual, scroll reveals, parallax, the pinned collections rail
- **Zustand** (+ `localStorage`) — cart persistence (`src/store/`)
- **React Router** — multi page routing on real paths
- **Stripe** — Payment Element in the browser, PaymentIntents and webhooks on the server
- **Resend** — the order confirmation and the house's notification
- **Vercel functions** (`api/`) — checkout, webhook, order lookup, contact form, dashboard
- **react-helmet-async** — per route head tags and JSON-LD

## What's inside

- **Cinematic hero** with the brand video, a page load intro ritual, ambient gold
  particles and a trailing cursor.
- **The Signature** — the Orchid feature, with the house's own figures.
- **Pinned horizontal collections rail** (desktop) / snap scroller (mobile).
- **"A Scented Memory of Malaysia"** — an interactive stylised map linking places to
  scents (`src/components/MalaysiaMap.tsx`).
- **The Olfactory Finder** — pick a mood, get matched fragrances.
- **Shop** with filtering and sorting, **product pages** whose composition band repeats
  once per fragrance for the sets, a slide over **cart**, a real Stripe
  **checkout** and an **order lookup** at `/track`.
- **Store locator** with embedded Google Maps and live directions (`src/pages/Stores.tsx`).
- **Customer care pages** — FAQ, Shipping Policy, Return, Refund & Exchange, Terms of
  Service and Privacy Policy (`src/data/policies.ts`, `src/pages/Policy.tsx`).
- **Concierge** — an in page assistant that answers scent, gift and store questions and
  hands off to the real WhatsApp number (`src/lib/concierge.ts`).

## Revision 2 amendments

Applied from the client's annotated deck, in deck order:

| Page | Change |
| --- | --- |
| Intro | Supplied Legendary logo in place of typeset text, grey box removed from behind the script mark, lockup holds about three seconds |
| Home | Est. 2015 counter strip removed; Art of Gifting section removed |
| Home | "Since 2015" in Minion Bold, "30,000,000+" in Noto Serif Medium, "bottles loved worldwide" |
| Home | New Four worlds, bottled photography; new Melaka and Kota Kinabalu map cards; Spirit I & II card renamed "Spirit" |
| Home | Every product tile carries its SKU gradient behind a transparent pack cut out |
| Home | Mood icons in gold, tile titles aligned |
| Home | "As Featured In" becomes "Partnered With", with the fourteen supplied partner logos |
| Shop | Spirit II and the Spirit I Travel Kit added to the Spirit collection |
| Shop | "For Her" and "For Him" now filter correctly from the footer and mega menu |
| Product | "What's included" flat lay on transparency and larger |
| Product | Composition plate given breathing space at the right edge |
| Product | Sets show three composition bands, one per fragrance, in the client's order |
| Product | Spirit I band tinted `#d1e5ed`, Spirit II `#d9dfd2` |
| Our Story | Journey figures in Minion Regular; 2024 and 2025 added |
| Services | Complimentary Samples icon redrawn to match its neighbours |
| Contact | "Collaborate With Us", WhatsApp only, head office address, single centred form |
| Site wide | No hyphen or dash characters anywhere in the copy |

## Amendment 4

Applied from `amendament_4.pdf`, in deck order. Source artwork for this round
lives in `client-assets/amendment-4/`.

| Page | Change |
| --- | --- |
| Intro | "the legend of scent" set in the same gold as "Est. 2015 · Malaysia" |
| Home | The 30,000,000+ figure rolls up on an odometer as the Signature section arrives (`src/components/ui/RollingNumber.tsx`) |
| Home | New Signature family photograph on the "Four worlds, bottled" rail |
| Home | "Partnered With" laid out six, five, three, in the order the client drew |
| Home / Stores | Partner and stockist logos come up in their own colour when hovered. They were already meant to, but `img { pointer-events: none }` meant the hover could never fire; the whole cell is the target now. Pointers with no hover to give show them coloured outright |
| Shop | Seven SKUs added: Wish I, Wish II and Wish III in 15ml, the 3 Wishes Travel Kit, and Passion, Life and Dream in 50ml |
| Shop | For Her and For Him carry the banners the client supplied, and the title bar follows the chip you pressed |
| Product | The three Wishes quote their own notes rather than one list shared across the box; Kebaya Blooms, Ondeh Delights and Nyonya Aromatic corrected to the client's sheet |
| Bag | Free delivery on every order, so the spend to unlock meter is gone |
| Checkout | Standard and express delivery removed. With nothing left to choose, the delivery step goes with them and the summary reads Free |
| Shipping Policy | Cost table reduced to one line, free on every order |
| Our Story | Its own "It started with a single flower" photograph, rather than the home page's orchid shot |
| Our Story | The Journey panel brings its title forward first, then unfolds the body under it |
| Contact | The WhatsApp card carries the client's ringed handset |

Two notes for the client on this round:

- The Orchid photograph supplied for "Orchid, the scent that began it all" is
  byte for byte the one already on the site, so there was nothing to swap.
- Prices for the seven new SKUs follow the house's existing ladder and need
  confirming: RM 79 (was RM 99) for a 15ml Wish, RM 68 (was RM 98) for the
  3 Wishes Travel Kit, RM 189 (was RM 229) for a 50ml Spirit II.

## Revision 6

| Page | Change |
| --- | --- |
| Site wide | `color-scheme: light` declared, so a phone in dark mode stops inventing its own dark version of a design that is light by intent. This is what turned the porcelain bands muddy on iOS Safari |
| Site wide | No horizontal overflow on any page, checked across iPhone 13, iPhone SE, Pixel 7 and iPad Mini |
| Mobile nav | Rebuilt to the client's reference: a compact list where Fragrances, Collections and Customer Care expand in place, one at a time, with the concierge pinned at the foot. The old drawer was a dozen display-size links that scrolled past the fold |
| Home | The review wall was set in CSS columns, which fill downward before they wrap, so the reading order ran down and back up and the columns ended ragged. It is a grid of equal cards now, with the star rating each review carried, and a snap scroller below `sm` |
| Our Story | The Journey no longer squeezes eleven panels into one row. Each card keeps its size and the rail drifts endlessly, pausing on hover with an arrow at each end |
| Shop | For Her and For Him re-cut a third time. The re-centring had never actually run: where the scale worked out to 1.0 there was no room to shift the frame and the offset was clamped back to zero, leaving the For Her bottle at 0.26 to 0.90 of the canvas. Verified by reading the built files off a grid rather than by re-detecting |
| Footer | "Designed and developed by Imsuya Global", linked, on its own line |

## Notes

- Prices are in **RM (MYR)**.
- The checkout takes **real payments** through Stripe. Which money moves depends
  entirely on which keys are set: `sk_test_` charges test cards, `sk_live_`
  charges real ones. See [SETUP.md](SETUP.md).
- The concierge is rule based, and deep links to WhatsApp for human follow up.
- All product, store, collection and policy copy lives in `src/data/`.
- Web assets in `public/assets/client/` are generated from the client's delivery by
  `python scripts/prepare-assets.py`. The originals live in `client-assets/`, which is
  deliberately outside `public/` and not committed: `Legendary digital/` is the main
  delivery, `amendment-4/` the later drop. The script empties
  `public/assets/client/` before it writes, so anything the site references has to be
  produced by it rather than dropped in by hand.
- "Minion Variable Concept" is an Adobe licence the site cannot host. The CSS names it
  first and falls back to Source Serif 4, so the real family takes over automatically on
  any machine where it is installed.

## Revision 5

Applied from `Website.xlsx` and the client's notes of 28 August 2026.

| Page | Change |
| --- | --- |
| Home / Stores | Every partner and stockist logo now sits in a true black and white rendition and comes up in its real colour on hover. `grayscale(1)` could not do this: half the supplied marks are gold or white cut outs drawn for a dark ground, so desaturating them left pale ghosts and lost Parkson entirely. `scripts/prepare-assets.py` renders a mono companion for each, anchored to one house tone |
| Home / Stores | SOGO now takes the client's colour artwork, red over dark grey, rather than the flat black file. Parkson on Stores takes the gold lockup rather than the white one |
| Stores | The Malaysia logo is bigger, on its own height rather than the shared one |
| Shop | Page banners re-cut to 3:1 so the bottle is never cropped. For Her and For Him were the two the client flagged; every banner is treated the same way |
| Our Story | The Journey animation reworked. The year cross dissolves in place instead of hard swapping, and nothing animates layout any more, so the copy no longer rewraps while the panel widens |
| Our Story | Journey rewritten to the client's wording. 2019 removed, 2026 added |
| Our Story | Trust row wording, and "Gift Wrapping" becomes "Art of Gifting" |
| Home | Hero, Orchid, Four worlds and map standfirsts rewritten; the figure is now 300,000+ Bottles Loved Worldwide |
| Shop | Each view carries its own standfirst rather than one shared line |
| Product | Every description, What's Included, Good to know and Care line from the client's sheet. Good to know and Care are now per fragrance |
| Product | Prices updated across all 18 SKUs to the client's price sheet |
| Home | The four placeholder reviews replaced with the client's ten real Shopee reviews |
| FAQ | Roughly fifty questions from the client's sheet, in their own seven groups |
| Contact | Wording updated, and the form now actually sends |
| Site wide | Stripe checkout, order references, order lookup, transactional email, sitemap, structured data and `llms.txt` |
| Shop | Banners re-cut a second time. The bottle is now found in each frame automatically and placed inside a safe band, and the title bar is bounded against the viewport's height as well as its width, so nothing is cropped and nothing falls below the fold on a laptop |
| Admin | A dashboard at `/admin`: stock, price and visibility switches per fragrance, an order list, and the figures behind them |

### Still needed from the client

- **A photograph for 2026** on the Journey. There is none in the delivery, so
  that panel falls back to the house pattern. Drop
  `journey-2026.webp` in and remove `art: false` in `src/pages/About.tsx`.
- **The 30,000,000+ figure became 300,000+** on the client's sheet, a hundredfold
  drop. Applied as written, but worth confirming it was not a typo.
- **Lasting time is quoted twice**: four to seven hours on the product pages,
  five to seven in the FAQ. Both are the client's own words, so both are used
  where they were given. One of them should win.
