# Content dashboard for the Legendary site: design

Date: 12 November 2026. Status: agreed in conversation, written for the builder.

## Why

The client (the Legendary team) changes the site through PDF "revision" rounds every week or
two: new products with their photos, a swapped photo, a new hero poster when a campaign starts
and its removal when it ends, a new journal article, a missing store, a reworded FAQ answer.
Every round goes through the developer. The goal is that the Legendary team makes these
changes themselves, in the dashboard they already use for prices, stock and orders
(`/admin`), and sees them live about a minute after pressing Publish.

The dashboard built earlier for Summer Academy (`Summer_Academy/siss`, Express + EJS +
SQLite on its own server) is the reference for *how it feels*, not for code: plain-language
forms, a photo library you drag photos into, Preview before Publish, and a history that lets
a mistake be undone. Its code is not reused; Legendary is a Vite + React site on Vercel.

## Decided by the user

1. **Scope: all four areas.** Products; the text and photos on every page (hero poster,
   banners, Home, Our Story and the rest); journal articles; the FAQ and the store list.
2. **Publishing within about a minute, not instantly.** Publish saves the change into the
   website's own files in the GitHub repository, and Vercel rebuilds and redeploys the site.
3. **Words and photos only.** Every page keeps its current design. The client changes text,
   swaps photos, and adds, removes or reorders items in lists (FAQ entries, stores, products,
   articles, reviews and the like). They cannot add, move or remove page sections.
4. **One shared login.** The existing dashboard password (`ADMIN_PASSWORD`, signed session
   cookie in `api/_lib/auth.ts`). History records what changed and when, not who.
5. **Cheapest hosting.** The dashboard lives inside the existing site and deployment. No new
   paid service.

## Goals

- The copy and photos that make up the public pages can be changed from the dashboard (the
  boundary is under **What counts as page text and photos** below).
- A new product can be added end to end (copy, notes, every photo slot) and is **buyable**
  after it publishes, at the price entered.
- Journal articles can be written and edited with the block types articles already use.
- FAQ, stores, collections, reviews, the Our Story journey, partner and stockist logos,
  the four policy pages and the site's contact details are editable lists and fields.
- Draft → Preview → Publish, with a history and a one-click restore of an earlier version.
- The client can drop in the originals they send today (up to 8000 px, 15 MB PNGs) and the
  site gets web-sized files.
- No change in running cost.

## Non-goals

- A page builder: adding, moving or deleting page sections, or changing layouts and styling.
- Instant publishing.
- Separate accounts, roles, or an approval step before publishing. The client publishes
  directly.
- Editing the hero **film** (video), the chat concierge's scripted replies, order and
  shipping emails, the checkout and payment wording, or the dashboard itself.
- Uploading photos from a phone or iPad. The user confirmed the team uploads from a
  computer.
- Prices, stock, the Bestsellers edit and hiding products: these already work instantly
  through `product_overrides` and stay exactly as they are.
- Other languages.

## Anti-goals: it fails if

- An edit can break a page's layout, or leave the live site broken. A bad edit must be
  stopped in the dashboard, or at worst fail the build so the previous version stays live,
  and the dashboard must say so.
- The site gets slower, or Google sees less. Content stays baked into the build exactly as
  today; nothing on a public page waits for a content request.
- A publish silently overwrites a newer change (a developer's commit, or a second browser
  tab).
- A new product appears on the site but cannot be paid for, or is charged a wrong price.
- A photo goes live at its original size, sideways, or with dull colours.
- The developer's own work turns into daily merge conflicts.

## Constraints

- **Stack.** Vite + React 18 + TypeScript + Tailwind SPA. Serverless functions in `api/`,
  transpiled per file by Vercel: relative imports need `.js` extensions, and
  `npm run check:functions` must pass. Postgres is Supabase through `DATABASE_URL`
  (`api/_lib/db.ts`, schema created with `CREATE … IF NOT EXISTS`; keep schema changes
  additive).
- **Function count.** 8 functions today (`api/*.ts`, `api/admin/*.ts`; `_lib` and
  `_catalogue.ts` do not count). Vercel's Hobby plan has long capped a deployment at 12, so
  add at most two new function files and route several actions through each.
- **4.5 MB** is the largest request or response body a Vercel function accepts, on every
  plan. Photos must be shrunk in the browser before upload, and no single request may carry
  more than about 4 MB.
- **`/assets/` is cached for a year as immutable** (`vercel.json`). A new or replaced photo
  always gets a new file name, never an old one reused. Content-hash names do this.
- **Checkout prices come from the build.** `scripts/build-catalogue.mjs` writes
  `api/_catalogue.ts` from `src/data/products.ts` during `npm run build`, and checkout
  refuses ids it does not know. Product data must keep flowing through that script.
- **Deploy target.** The GitHub repo `23f3000111/legendary-perfume-v2`, branch `main`. A push
  there deploys Vercel (the live shop at legendary.com.my) and the GitHub Pages preview.
  The `origin` remote is a separate old copy and must never be written to.
- **The local `.env` is production**: live Stripe keys, the production database and the real
  mail sender. Development and tests of the content API use an isolated Postgres (the
  `embedded-postgres` approach used for the tracking feature) and a throwaway GitHub repo or
  branch. Never the production repo or database.
- **House copy rules.** No em or en dashes in visible copy (hyphenated words are fine), and
  no dashes in new route slugs. Product ids and article slugs the dashboard creates follow
  that.
- Orders store their own copy of each line's name, size and price (`OrderLine` in
  `api/_lib/catalogue.ts`), so renaming or removing a product does not change past orders.

## How it works

Items marked *(builder's call)* are left open on purpose. Everything else was decided by
the user or is the designer's call, recorded here so it can be checked.

### What counts as page text and photos (designer's call)

**In.**
- The copy and photos of every public page: the Home sections, Our Story, Stores, Contact,
  the FAQ and Journal pages' own text, the Shop banners and collection intros, and the four
  policy pages.
- The header and footer text, and the contact details.
- The Scented Memory map's place names, words and card photos. The pins stay where they
  are; moving or adding pins is out.
- Each page's search-engine title and description, and its sharing image. A product's or
  article's are taken from its own name, summary and photo, as today.

**Out, staying in code.**
- Interface wording: "Add to bag", "Sold out", sort and filter labels, the cart drawer, the
  search overlay, form labels and error messages, the 404 page and the intro curtain.
- The order confirmation and Track my order page, which belong to the checkout flow.
- Brand artwork the asset script treats specially: the logo, the wordmark, the gold mood
  icons, the map outline and the tab icon.

### Where content lives

- Content moves out of TypeScript and JSX into JSON files under `src/content/`, one file per
  editable document. A likely split: `products.json`, `collections.json`, `articles.json`,
  `faq.json`, `stores.json`, `reviews.json`, `journey.json`, `partners.json`, `sellers.json`,
  `policies.json`, `site.json` (contact details, WhatsApp, emails, social links, header and
  footer labels), `hero.json`, and `pages/<page>.json` for each page's own copy. *(Exact
  split: builder's call.)*
- `src/data/*.ts` keep the types and helpers and read from the JSON, so components and the
  build scripts (`build-catalogue.mjs`, `build-seo.mjs`) keep working.
- Today some copy is computed (`products.ts` builds the Spirit singles from a template; Wish
  singles likewise). In JSON every product is written out in full.
- Copy hard-coded in sections and pages (Signature, Collections rail, Finder, Our Story,
  Contact, Stores, Footer and the rest) is lifted into the page JSON. Headings that break
  over two lines today keep that as a newline in the text.
- **The migration changes nothing visible.** Generate the JSON from today's modules, then
  prove every route renders the same text and the same images before and after.

### Draft, preview, publish

- **Drafts** are saved as the client types, in a new Postgres table (for example
  `content_drafts`: document key, JSON, the GitHub file version it started from, updated
  time). Closing the tab loses nothing.
- **Draft photos** live in Postgres until published (for example `content_media`: content
  hash, bytes, type, size). After processing each is well under 1 MB.
- **Preview** opens the real site page in a new tab, marked as a preview. When the admin
  cookie is present the site loads the drafts and renders them in place of the published
  content. Suggested approach: in `main.tsx`, load drafts and apply them to the content
  modules *before* dynamically importing the app, so modules that build indexes at load time
  (search, for example) see the draft too. *(Mechanism: builder's call.)* The public never
  sees drafts, and drafts never reach a build.
- **Publish** makes one commit to `main` through the GitHub API holding every changed
  document and every new photo (`public/assets/cms/<hash>.webp`), with a readable message
  such as "Dashboard: Hope product, FAQ". Vercel then deploys it.
- **Conflict rule.** If a document changed on GitHub after its draft began, publishing that
  document stops and asks: keep my version, or take the newer one. Never a silent overwrite.
- **Knowing it's live.** After publishing, the dashboard shows "Publishing… about a minute",
  then "Live" once the deployment is up. It finds out from the commit's deployment status on
  GitHub (Vercel's integration reports one), or from a small marker file the build writes
  with the commit it was built from. A failed build shows as "Not published, the site is
  unchanged", with the developer's contact. *(Which signal: builder's call.)*
- **Validation.** Every document is checked against its schema in the dashboard before
  Publish is allowed (required fields, sensible lengths, valid links, prices that are whole
  ringgit) and again at build time.
- **History, restored one document at a time** (designer's call). History lists recent
  publishes and developer commits that touched content, each with its date, message and the
  documents it changed. Restore works on a single document: "put the FAQ back as it was on
  3 November" publishes that one document's earlier version as a new commit. Nothing
  published to other documents since is touched, and the conflict rule above still applies.
  History is never rewritten.

### Photos

- **Uploads come from a computer** (decided by the user): Windows or Mac, in current Chrome,
  Edge, Safari or Firefox. On a phone the dashboard still edits text. Photo upload there
  says to use a computer.
- Accept JPG, PNG and WebP originals up to about 60 MB and 10,000 px (designer's call).
- The browser decodes the photo, turns it upright, converts it to sRGB (the client's Melaka
  shopfront was Display P3) and shrinks it before upload. Each upload stays under 4 MB.
  Safari cannot reliably save WebP from a canvas, so the browser sends JPEG, or PNG where
  there is transparency. *(WebP encoding in the browser where supported, or with `sharp` in
  a function: builder's call. Output is WebP either way, transparency kept.)*
- **A photo library** (from the Summer Academy dashboard, agreed with the user). A
  **Photos** tab takes one or many photos dragged in at once, to be assigned later. Each
  slot can upload a photo directly or pick one from the library.
  - **Keeping a large copy** (designer's call). The library keeps each upload at up to
    3200 px, the largest size any slot needs, and makes the slot-sized version from that
    copy when the photo is assigned.
  - **Where photos live.** Unpublished uploads stay in Postgres, and are cleared after 30
    days if never used. A large copy is committed with the publish that first uses it, so
    it can be reused later.
  - **Existing photos.** The site's current photos (`public/assets/client/`) appear in the
    library too, pickable at the sizes they already have. One photo serving two places,
    like `store-bsas.webp` (a store photo and the 2026 journey card), keeps working.
- Every photo slot knows its kind and its output size. These match today's pipeline
  (`scripts/prepare-assets.py`):

  | Slot | Output |
  | --- | --- |
  | Product lifestyle, box shot | 1400 px, square framing |
  | Product pack cut-out | 1400 px, transparent; option to remove a white background, for files sent on white like the first MAN photo |
  | "What's included" flat-lay | 1600 px, transparent |
  | Occasion chart, botanical | 1100 px and 1000 px, transparent |
  | Page banner | 2400 px wide, plus a focus point so the phone crop keeps the bottle |
  | Hero poster | 1280, 2400 and 3200 px wide plus a small blurred fill, as `save_hero_poster` makes |
  | Journal photo | up to 1600 px; "narrow" for upright shots |
  | Store photo | 900 px |
  | Partner or stockist logo | 340 px, transparent |

- File names come from the content hash, so a replaced photo always gets a new name.
- Every photo has alt text. It is required on products and articles.
- `prepare-assets.py` stays for the developer's own batch work. Its files (in
  `public/assets/client/`) and the dashboard's (in `public/assets/cms/`) never share a name.

### Screens

New tabs in the existing dashboard, in its current dense, quiet style:

- **Overview** (exists): adds an "Unpublished changes" card.
- **Products** (exists): the price and stock table stays. Each row gains **Edit**, which
  opens the product editor. It covers everything the product page shows:
  - name, subtitle, collection, scent family, audience, moods, colour
  - size, price and was price (for new products), badges
  - description, story, good to know, care, the "What's included" list
  - top, heart and base notes; for sets, each fragrance in the box with its own notes,
    chart and botanical
  - the six photo slots

  **New product** and **Duplicate** (start from an existing one, as the Spirit I singles
  were made from Spirit II's). Products can be reordered on the shelf, and removed.
- **Pages:** every page listed. Each opens a form with the page's sections in page order,
  every text field and photo slot labelled in plain words, for example "Home · Signature ·
  Heading". Each page also has its search-engine title, description and sharing image.
- **Photos:** the library described above.
- **Hero poster:**
  - poster on or off, and the poster image
  - two boxes the client drags over it: the words, and the picture that must stay visible.
    These replace the hand-set `words` and `picture` fractions in `src/sections/Hero.tsx`
  - light or dark header over it
- **Journal:** articles listed. The editor holds title, card title, category, date, summary,
  header photo, and a body built from today's blocks (paragraph, lead, heading, photo, table,
  button, questions and answers, references), each added, moved or removed. The address is
  made from the title, without dashes, and fixed once published.
- **FAQ:** groups and questions, added, edited, reordered or removed.
- **Stores:** name, region, address, phone, opening hours lines, map search text and photo.
- **Collections, Reviews, Our Story journey, Partners, Stockists, Policies, Site details:**
  the same pattern of lists and fields.
- **History:** as above.
- A **publish bar** on every editing tab lists what has changed and offers Preview, Publish
  and Discard.

### Editing rules

- Long text uses the light markup articles already use: `[text](/link)` for links and
  `**bold**`. Nothing else, so nothing a client types can break a layout.
- Where a design has a practical limit (the hero headline, card titles) the form warns
  past it but does not block.
- House style: typing an em or en dash shows a warning and offers to change it to a comma
  (designer's call). It does not change it silently.
- Required fields per kind: name and price on products, alt text on photos, and so on.

## Hosting and running cost

- **The dashboard costs nothing extra.** It is part of the existing Vercel project. Publishing
  goes through GitHub (free), and drafts use the existing Supabase database on its free tier
  (a few MB).
- Each Publish is one Vercel deployment, about a minute. Hobby allows 100 a day.
- **Separate from the dashboard:** Vercel's free Hobby plan is for non-commercial use only. A
  shop taking payments belongs on Pro, about $20 a month per member. If the project is
  already on Pro, nothing changes.
- New environment variables: `GITHUB_TOKEN` (a fine-grained token with read and write access
  to this one repository's contents, and nothing else), `GITHUB_REPO`, `GITHUB_BRANCH`.

## The developer's workflow afterwards

- The dashboard's publishes arrive on `main` as ordinary commits. Pull before pushing (`git
  pull --rebase`). The JSON content files belong to the dashboard. Code changes that need
  to touch them happen right after a pull and go out promptly.

## Order of work (designer's call)

Each phase ships on its own:

1. **Foundation.** Content moved to JSON with nothing visible changed; draft, preview,
   publish, history and restore; photo upload and the photo library. FAQ and Stores editors
   prove the whole path.
2. **Journal** articles.
3. **Products**, including new products and sets.
4. **Pages:** site details, collections, reviews, journey, logos, policies, and each page's
   copy and photos.
5. **Hero poster.**

## Testing

- Migration: every public route renders the same text and images before and after,
  compared automatically.
- The content API is exercised against an isolated Postgres and a throwaway GitHub
  repository or branch, never production.
- One full publish (dashboard, commit, build, live) on a test branch or preview deployment.
- Photos: rotated JPEG, transparent PNG, Display P3, an 8000 px original, an over-limit
  file, each in Chrome and in Safari on a Mac.
- Preview needs the admin session. Drafts never appear in a built bundle.
- A product published from the dashboard can be bought (server catalogue rebuilt, checkout
  accepts its id at the entered price), tested without live payment keys.

## Left to the builder

- The JSON schemas, the exact file split, and the validation library.
- The preview mechanism.
- Final photo encoding in the browser or in a function, and how the banner's phone crop is
  produced from its focus point.
- How a completed deployment is detected.
- Component details within the dashboard's existing style.
