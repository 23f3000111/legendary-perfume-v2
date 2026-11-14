# Content dashboard, stage 4a (site details and lists) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Legendary team can change these from the dashboard:
- the site's contact details and links
- the collections and the customer reviews
- the Our Story journey
- the partner and trusted seller logos
- the Scented Memory map's words and photos
- the four policy pages

**Architecture:**
- **Eight new documents.** Each list moves out of code into its own file under `src/content/`, and nothing visible changes. The files are `site.json`, `collections.json`, `reviews.json`, `journey.json`, `partners.json`, `sellers.json`, `places.json` and `policies.json`.
- **A logo is two prints.** The logo walls rest in black and white and show a logo's own colours on hover. So the dashboard makes both prints from one upload, as `brand_mark` in `scripts/prepare-assets.py` does. The document holds both paths, so a publish carries both like any other photo.
- **A collection's name is read where it shows.** Products keep a copy of their collection's name. The pages now show the collection's current name, so a renamed collection is renamed everywhere at once.
- **The site details reach every link.** These are made from `site.json` when they render:
  - every WhatsApp button and the header's chat link
  - the footer's social links
  - the Contact page's channels and head office
  - the facts search engines are given
- **Two new tabs.** **Site** has one screen per list plus the site details. **Policies** edits the four policy pages with the journal's blocks.

**Tech Stack:** As stages 1 to 3. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-12-content-dashboard-design.md`.

This plan covers these parts of stage 4 of "Order of work":
- site details, collections, reviews, the journey, logos and policies
- the Scented Memory map's place names, words and card photos (the "In" list under "What counts as page text and photos")
- the "Collections, Reviews, Our Story journey, Partners, Stockists, Policies, Site details" entry under "Screens"
- the logo row of the photo slot table

**Stage 4b**, planned separately, covers:
- each page's own copy and photos
- the page banners with their focus point, including each collection's shop banner
- the header and footer words
- each page's search-engine title, description and sharing image

This plan builds on the stage 1 to 3 plans in `docs/superpowers/plans/`.

## Global Constraints

- **The earlier stages' constraints still apply.** Every Global Constraint of the stage 1, 2 and 3 plans applies here. In particular:
  - Every object schema goes through the `object()` helper (passthrough), and declares its keys in file order. The JSON files are written from each schema's `parse` output, so the round-trip test holds.
  - Content image paths are root paths, resolved with `asset()` where they are drawn.
  - Optional fields the team empties are left out of the data, not saved as `''` (`setOptional`).
  - Nothing is computed from content when a module loads, and `applyDrafts` keeps every top-level array's identity.
  - No em or en dash in any visible copy, including every new label, hint and message in this plan.
  - The local `.env` is production, so tests and runs stay off it.
  - No new function files: 10 stay.
- **What stays in code:**
  - the map's pins: each pin's position, its product, its collection and its stores
  - the policy addresses (`/shipping`, `/returns`, `/terms`, `/privacy`)
  - menu and filter labels
  - each section's own heading and words around a list (stage 4b)
- **Fixed ids.**
  - A collection's id is its address (`/shop?collection=<id>`). While the collection is new, the id is made from its name with `newId`, and never takes a published id. Once published, it is fixed.
  - Policy slugs and place ids never change.
- **Written out in full.** The policies write out the WhatsApp number and the house's email; today they do so through constants. The JSON holds those words as they read. The Site details form says where the number is also written.
- **Cross-document checks use working copies.** A dashboard check that reads another document reads the working copy, so it sees the team's unpublished changes. Two checks do this: the products in a collection, and the collections a product can join.
- **Release.** Stage 4a is merged into local `main` after its review. Do not push: the user tests all stages live at once (memory `cms-live-testing-at-the-end`).

## Review Focus

1. **A new logo goes on a wall.** It must:
   - rest in black and white
   - show its colours on hover
   - sit on transparency, including one sent on white
   - go live with both prints

   Tests:
   - Task 2: `a logo gets a colour print and a black and white print`, and `a logo sent on white loses its white`
   - Task 3: `publishing a new logo carries both its prints`
2. **The WhatsApp number changes.** All of these follow it, in preview and once live:
   - every WhatsApp button and the header's chat link
   - the number on the Contact and FAQ pages
   - what search engines are told

   Test: Task 4 `every WhatsApp link follows the site details`.
3. **A collection is removed or renamed.** Removing one that products or a map pin use is refused, with the reason. A new name shows on every product card and product page at once. Tests:
   - Task 5: `a collection in use cannot be removed`
   - Task 3: `drafts applied to the lists are what the pages read`, which renames a collection
4. **Previewing a list.** A draft of any of the eight documents shows on its page. Tests:
   - Task 3: `drafts applied to the lists are what the pages read`
   - Task 4: `every WhatsApp link follows the site details`
5. **A partner row is emptied, or a logo moves between rows.** An empty row is refused with a message, and a moved logo keeps both prints. Tests:
   - Task 1: `a logo row needs a logo`
   - Task 6: `moveLogo moves a logo to the end of another row`

---

### Task 1: The schemas for the eight documents

**Files:**
- Modify: `api/_lib/content/schema.ts`
- Test: `tests/api/content-schema.test.ts`

**Interfaces:**
- Produces, in `schema.ts` after the products section. Each schema comes with its doc type, `z.infer` of it:
  - `SiteDocSchema`, type `SiteDoc`
  - `CollectionsDocSchema`, type `CollectionsDoc`; entry type `CollectionEntry`
  - `ReviewsDocSchema`, type `ReviewsDoc`; entry type `ReviewEntry`
  - `JourneyDocSchema`, type `JourneyDoc`; entry type `MilestoneEntry`
  - `LogoSchema`, plus:
    - `PartnersDocSchema`, type `PartnersDoc`
    - `SellersDocSchema`, type `SellersDoc`
    - entry type `LogoEntry`
  - `PlacesDocSchema`, type `PlacesDoc`; entry type `PlaceEntry`
  - `PoliciesDocSchema`, type `PoliciesDoc`; entry type `PolicyEntry`
  - `POLICY_SLUGS = ['shipping', 'returns', 'terms', 'privacy'] as const`
  - `tablesComplete(body, ctx, at)`: the table row check that `ArticleSchema` runs today, moved out so `PolicySchema` runs it too. Each row needs a cell for each column.

**The fields of each document,** declared in this order, which is the file order. "optional, `text(n)`" means `text(n).optional()`, as in stage 3. `photo` is the existing photo rule, and `id` is `/^[a-z0-9-]{1,40}$/` with the message `Use lowercase letters and numbers only.`.

**Site details**, `site.json`, one object:

| Field | Rule |
| --- | --- |
| `whatsapp` | `/^\+\d[\d ]{6,18}\d$/`: `Write the number with its country code, spaced like +60 19 383 6633.` |
| `email` | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`: `Use an email address, like hello@legendary.com.my.` |
| `instagram` | `{ handle: text(60), url }`, with `url` on `instagram.com` |
| `facebook` | `{ handle: text(60), url }`, with `url` on `facebook.com` |
| `tiktok` | a url on `tiktok.com` |
| `shopee` | a url on `shopee.com.my` |
| `office` | `{ name: text(80), address: text(300), mapQuery: text(300), mapEmbed }` |

- **A social url** matches `^https://(www\.)?<host>/\S*$`. Otherwise: `Use the full <Name> address, starting https://<shown host>/.`
  - The shown host has `www.` for Instagram, Facebook and TikTok.
  - It is `shopee.com.my` for Shopee.
- **`mapEmbed`** matches `/^https:\/\/www\.google\.com\/maps\/embed\?\S+$/`. Otherwise: `Paste the map address from Google Maps: Share, then Embed a map. It starts https://www.google.com/maps/embed?`

**Collections**, `{ collections }`:

| Field | Rule |
| --- | --- |
| `id` | `id`, unique: `Another collection already uses this address.` |
| `name` | `text(40)` |
| `tagline` | `text(80)` |
| `description` | `text(600)`: its card on the Home page's rail |
| `intro` | `text(400)`: under the title when the shop shows this collection |
| `accent` | one of `ACCENTS`: `Choose a colour.` |
| `image` | `photo`: the square cover |
| `banner` | optional `photo`: the shop banner, edited in stage 4b |

At least one collection: `Keep at least one collection.`

**Reviews**, `{ reviews }`:

| Field | Rule |
| --- | --- |
| `quote` | `text(1000)` |
| `author` | `text(60)` |
| `product` | optional, `text(80)` |
| `rating` | optional, a whole number from 1 to 5: `Choose from one to five stars.` |
| `href` | optional, `/^https:\/\/\S+$/` and up to 1000 characters: `Use the full web address, starting https://.` |

At least one review: `Keep at least one review.`

**Journey**, `{ milestones }`:

| Field | Rule |
| --- | --- |
| `year` | `/^\d{4}$/`: `Write the year, like 2026.` It is unique: `This year is already on the journey.` |
| `title` | `text(60)` |
| `body` | `text(400)` |
| `photo` | optional `photo`. Without one, the card shows the house motif. |

At least one year: `Keep at least one year.`

**Logos**, with `LogoSchema = { name: text(60), logo: photo, mono: photo, tall?: boolean }`:
- **Partners**, `{ rows }`:
  - 1 to 6 rows: `Keep at least one row.` and `Up to six rows.`
  - Each row is `{ logos }`, with 1 to 10 logos: `Add a logo to this row, or remove the row.` and `Up to ten logos in a row.`
- **Sellers**, `{ logos }`: 1 to 40 logos, `Keep at least one logo.`

**Places**, `{ places }`:

| Field | Rule |
| --- | --- |
| `id` | `id` |
| `place` | `text(40)` |
| `region` | `text(60)` |
| `note` | `text(300)` |
| `productId` | `id` |
| `collectionId` | optional `id` |
| `scentLabel` | optional, `text(60)` |
| `familyLabel` | optional, `text(80)` |
| `cardImage` | optional `photo` |
| `storeIds` | an array of `id` |
| `x`, `y` | numbers from 0 to 100 |

**Policies**, `{ policies }`:

| Field | Rule |
| --- | --- |
| `slug` | one of `POLICY_SLUGS` |
| `title` | `text(80)` |
| `eyebrow` | `text(40)` |
| `intro` | `text(400)` |
| `updated` | `text(40)` |
| `body` | at least one `BlockSchema` block: `Write at least one paragraph.` Tables must be complete. |

Each of the four slugs appears exactly once: `The four policy pages each appear once.`

- [ ] **Step 1: Write the failing tests** in `content-schema.test.ts`, with minimal fixtures for each document:
  - `site details need a number written with its country code`: `019-383 6633` fails at `['whatsapp']`, and `+60 19 383 6633` passes.
  - `a social link goes to its own site`: an `instagram.url` of `https://example.com/x` fails at `['instagram', 'url']`.
  - `collection addresses are their own`: two `signature` collections fail at `['collections', 1, 'id']`.
  - `a review link is a full web address`:
    - An `href` of `shopee.com.my/x` fails at `['reviews', 0, 'href']`.
    - A `rating` of `6` fails at `['reviews', 0, 'rating']`.
  - `a year appears once on the journey`: two `2015` milestones fail at `['milestones', 1, 'year']`.
  - `a logo row needs a logo`:
    - `rows: [{ logos: [] }]` fails at `['rows', 0, 'logos']`.
    - A logo without `mono` fails at `['rows', 0, 'logos', 0, 'mono']`.
  - `the four policy pages stay`:
    - A document without `privacy` fails.
    - A table row short of a cell fails at `['policies', 0, 'body', <j>, 'rows', <r>]`.
- [ ] **Step 2:** `npx vitest run tests/api/content-schema.test.ts`. Expected: FAIL, since the schemas do not exist yet.
- [ ] **Step 3:** Implement as above. `ArticleSchema` keeps its behaviour through `tablesComplete`.
- [ ] **Step 4:** `npm test` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(content): the schemas for the site details and the lists`.

### Task 2: Photo kinds for the lists, and a logo's two prints

**Files:**
- Modify: `api/_lib/content/slots.ts`, `api/_lib/content/images.ts`, `api/admin/media.ts`, `src/lib/api.ts`
- Test: `tests/api/media.test.ts`

**Interfaces:**
- Produces:
  - **`slots.ts`.** `SlotSpec` gains `mono?: boolean`, which means the kind also makes a black and white print. The new kinds:

    | Kind | Label | maxSide | alpha | square | mono |
    | --- | --- | --- | --- | --- | --- |
    | `collection` | Collection cover | 1600 | false | `cover` | |
    | `journey` | Journey photo | 1000 | false | | |
    | `place` | Map card photo | 1200 | false | | |
    | `logo` | Logo | 340 | true | | true |

  - **`images.ts`.** `export type Print = { data: Buffer; width: number; height: number }`. `makeSlot` returns a `Print`.
    - `makeLogo(master: Buffer): Promise<{ colour: Print; mono: Print }>` makes the two prints.
    - When nothing is left of the logo after step 1 below, it throws `HttpError(400, 'Nothing is left of that logo once its white is taken away. Use a file with the logo on a coloured or see-through background.')`.
  - **`media.ts`.** A derive of a `mono` kind stores both prints, each as kind `logo` with the master as its source. It answers `{ path, mono, width, height }`. Other kinds are unchanged.
  - **`api.ts`.** `adminDerivePhoto` resolves to `{ path: string; mono?: string; width: number; height: number }`.

**`makeLogo`**, ported from `brand_mark`, `opaque_to_alpha`, `monochrome` and `_padded`:
1. **The white goes.** A master with no real transparency has every pixel brighter than 238 in red, green and blue made transparent.
2. **Trim and fit.** It is trimmed to the box around its non-transparent pixels, and fitted within 340 px, never enlarged. This is the colour print.
3. **The mono print** is made from the colour print.
   - **The ink's median.** Luminance is `0.299 R + 0.587 G + 0.114 B`. Take the median luminance over pixels whose alpha is above 110, or above 40 when there are none. When there are none at all, the mono print is the colour print.
   - **Light ink is inverted.** When the median is above 200, every luminance value is inverted, and the median with it.
   - **A light median is darkened.** When the median is above 46, every value becomes `255 · (v / 255)^γ`, with `γ = ln(46/255) / ln(median/255)`.
   - **Grey.** The result is that grey in red, green and blue, with the colour print's alpha.
4. **The margin.** Both prints get a transparent margin of `round(0.06 × their longer side)` on every side.
5. **The format.** Both are saved as lossless WebP.

- [ ] **Step 1: Write the failing tests** in `media.test.ts`. Each uploads a sharp-made file, then derives it as `logo`.
  - `a logo gets a colour print and a black and white print`:
    - **The file:** a 1000×400 transparent PNG with an opaque 800×200 bar of `(200, 30, 30)` in the middle.
    - **The answer:** it has a `path` and a different `mono`, and the store holds both.
    - **The colour print:** 380 px wide, with alpha 0 at the corner and a red centre.
    - **The mono print:** the same size, with a grey centre (red, green and blue equal) within 4 of 46.
  - `a logo sent on white loses its white`:
    - **The file:** an opaque 1200×800 white PNG with no alpha channel, and a 600×200 black bar in the middle.
    - **The colour print:** 380 px wide and between 145 and 165 px tall. With the white kept, it would be about 267.
  - `a white logo drawn for a dark ground comes out dark`:
    - **The file:** a transparent PNG with an opaque white bar.
    - **The mono print:** its centre is below 60.
  - `a logo with nothing left is refused`: an all-white opaque PNG answers 400, and the message names the white.
- [ ] **Step 2:** `npx vitest run tests/api/media.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4:** Run `npm test`, `npx tsc --noEmit` and `npm run check:functions`. Expected: PASS, with 10 functions.
- [ ] **Step 5:** Commit: `feat(content): photo kinds for the lists, and a logo's two prints`.

### Task 3: Move the lists into JSON, nothing visible changed

**Files:**
- Create:
  - `src/content/collections.json`, `reviews.json`, `journey.json`, `partners.json`, `sellers.json`, `places.json`
  - `src/data/journey.ts`, `src/data/logos.ts`
- Modify:
  - the registry: `api/_lib/content/keys.ts`, `docs.ts`, `src/content/registry.ts`
  - data: `src/data/collections.ts`, `src/data/reviews.ts`, `src/data/places.ts`
  - components:
    - `src/components/JourneyCarousel.tsx`, `src/components/ui/BrandLogo.tsx`
    - `src/components/ProductCard.tsx`, `src/components/SearchOverlay.tsx`, `src/components/layout/Header.tsx`
  - sections: `src/sections/CollectionsRail.tsx`, `src/sections/PartneredWith.tsx`
  - pages: `src/pages/About.tsx`, `Stores.tsx`, `Shop.tsx`, `Product.tsx`
  - scripts: `scripts/parity.mjs`
  - `tests/api/content.test.ts`: add a minimal `partners.json` to the seed
- Test: `src/content/content.test.ts`, `src/content/preview.test.ts`, `tests/api/content.test.ts`

**Interfaces:**
- Consumes: the Task 1 schemas.
- Produces:
  - **The registry.** `DOC_KEYS` adds `'collections', 'reviews', 'journey', 'partners', 'sellers', 'places'`. Each `DOCS` entry is `{ path: 'src/content/<key>.json', label }`, with these labels:
    - `Collections`
    - `Reviews`
    - `Our Story journey`
    - `Partner logos`
    - `Trusted sellers`
    - `Scented Memory map`
  - **`src/data/collections.ts`:**
    - `collectionsDoc`, the imported JSON
    - `collections = collectionsDoc.collections`
    - `type Collection = CollectionEntry`, and `getCollection(id)`
    - `collectionName(p: { collection: string; collectionId: string }): string`: the current name of the product's collection, or the product's own `collection` when that collection is gone. The header comment says the products' copy of the name is only a fallback.
  - **`src/data/reviews.ts`:** `reviewsDoc`, `reviews = reviewsDoc.reviews` and `type Review = ReviewEntry`. `reviewsUrl` stays as it is.
  - **`src/data/journey.ts`:** `journeyDoc` and `type Milestone = MilestoneEntry`.
  - **`src/data/logos.ts`:** `partnersDoc`, `sellersDoc` and `type Logo = LogoEntry`.
  - **`src/data/places.ts`:**
    - `placesDoc`, `scentPlaces = placesDoc.places` and `type ScentPlace = PlaceEntry`
    - `placeTarget`'s image is `asset(place.cardImage ?? product.image)`
  - **Components:**
    - **`BrandLogo({ logo, mono, name, className?, cellClassName? })`** takes root paths, each through `asset()`.
    - **`JourneyCarousel({ milestones: Milestone[] })`** draws `asset(m.photo)`, or the house motif when there is no photo.
    - **Collection covers** are drawn through `asset()`.
    - **The collection's name.** The product card, the product page (its eyebrow and the JSON-LD category) and search all show `collectionName(p)`.
    - **The Shop page.** Its intro for a collection is that collection's `intro`; its other intros stay in `INTROS`. The banner's root path is chosen first and resolved once through `asset()`.
  - **At render, not at load.** Each of these reads its document when it renders:
    - the header's mobile menu (`MOBILE_NAV` becomes a function)
    - the partner rows
    - the trusted sellers
    - the Our Story timeline
  - **`scripts/parity.mjs`** also records each page's link addresses in order (`a[href]`). The compare prints `link gone:` and `link added:` lines.
  - **The JSON files** are written from each schema's `parse`. A throwaway esbuild bundle of today's modules does it, with `lib/asset` stubbed to identity. Arrays that only a component holds are copied into the script as they stand: the partners, the sellers, the timeline and the Shop's collection intros. None of the script is committed. Per file:
    - **collections:** root paths for `image` and `banner`, and `intro` from `INTROS[id]`.
    - **journey:** `photo` is `art` when it is a path, and `/assets/client/journey-<year>.webp` when it is unset.
    - **partners:**
      - The rows are as `PYRAMID` slices them: 6, 5, 3.
      - Each logo has `logo: /assets/client/<file>`, `mono` its `-mono.png` sibling, and `tall: true` where it is set today.
    - **sellers:** likewise, in one list.
    - **places:** root paths for `cardImage`.

- [ ] **Step 1: Record the before state.**
  - Make parity record links.
  - In PowerShell, run `$env:VITE_BASE = "/"; npm run build`, then `npx vite preview --port 4230 --strictPort`.
  - Then `node scripts/parity.mjs http://localhost:4230 .parity-before.json`.
- [ ] **Step 2: Generate the six JSON files.**
- [ ] **Step 3: Write the failing tests**
  - `content.test.ts`:
    - `the published lists pass their schemas`: each of the six documents passes, with issues `[]`.
    - The identity test adds:
      - `collectionsDoc` and `collections` (`collectionsJson.collections`)
      - `reviewsDoc` and `reviews`
      - `journeyDoc`, `partnersDoc` and `sellersDoc`
      - `placesDoc` and `scentPlaces`
    - `every product's collection is a collection, under its current name`: for every product, `getCollection(p.collectionId)?.name` equals `p.collection`.
  - `preview.test.ts`, `drafts applied to the lists are what the pages read`:
    - Apply drafts that rename `signature` to `Signature Line` and give the partners two rows.
    - `collectionName(getProduct('orchid')!)` is `Signature Line`.
    - `collections` is the same array object as before.
    - `partnersDoc.rows` has 2 rows.
    - Restore afterwards.
  - `tests/api/content.test.ts`, `publishing a new logo carries both its prints`:
    - Put a master and two slot rows in the store, `logo1.webp` and `logo1mono.webp`, both of kind `logo` with the master as their source.
    - Draft the partners with a logo that uses both, and publish.
    - The commit holds both files and the master.
- [ ] **Step 4:** `npm test`. Expected: FAIL.
- [ ] **Step 5:** Implement as above. Run `npx tsc --noEmit`, `npm test` and `npm run check:content`. Expected: all pass, and the last prints `content: 10 documents valid`.
- [ ] **Step 6: Prove nothing changed.**
  - Stop the preview server, rebuild as in Step 1, and capture `.parity-after.json`.
  - `node scripts/parity.mjs --compare .parity-before.json .parity-after.json`. Expected: all 45 routes identical in text, images and links.
  - When `api/_catalogue.ts` shows a change of line endings only, run `git checkout -- api/_catalogue.ts`.
- [ ] **Step 7:** Commit: `refactor(content): the collections, reviews, journey, logos and map live in src/content JSON`.

### Task 4: Move the site details and the policies into JSON, nothing visible changed

**Files:**
- Create: `src/content/site.json`, `src/content/policies.json`, `src/data/site.ts`, `src/data/site.test.ts`
- Modify:
  - the registry: `keys.ts`, `docs.ts`, `registry.ts`
  - data and lib: `src/data/policies.ts`, `src/data/stores.ts` (`HEAD_OFFICE` leaves), `src/lib/concierge.ts`, `src/lib/seo.ts`
  - components: `src/components/layout/Footer.tsx`, `Header.tsx`, `src/components/Concierge.tsx`
  - pages: `src/pages/Contact.tsx`, `Faq.tsx`, `Stores.tsx`
- Test: `src/content/content.test.ts`, `src/data/site.test.ts`

**Interfaces:**
- Consumes: the Task 1 schemas, and `applyDrafts`.
- Produces:
  - **The registry.** `DOC_KEYS` adds `'site'` (label `Site details`) and `'policies'` (label `Policies`).
  - **`src/data/site.ts`:**
    - `site: SiteDoc`, the imported JSON
    - `whatsappDigits(): string`: the number without its plus or spaces
    - `waLink(text: string): string`: today's link, made from the site's number
    - `waChat(): string`: `https://api.whatsapp.com/send/?phone=%2B<digits>`, the header's link
    - `sameAs(): string[]`: `[instagram.url, facebook.url, tiktok, shopee]`
  - **`src/lib/concierge.ts`** no longer defines `WHATSAPP_NUMBER`, `WHATSAPP_DISPLAY`, `SUPPORT_EMAIL` or `waLink`. Their users import `waLink` from `src/data/site.ts`.
  - **`SITE` in `seo.ts`** keeps `name`, `legalName`, `tagline`, `description`, `url`, `locale`, `currency`, `country` and `founded`. `organisationLd()` reads `site.email`, `site.whatsapp` and `sameAs()` when it is called.
  - **`src/data/policies.ts`:** `policiesDoc`, `policies = policiesDoc.policies`, `type Policy = PolicyEntry`, and `getPolicy(slug)`.
  - **Pages:**
    - **Contact:** its channels come from `site`. WhatsApp shows `site.whatsapp`, Instagram `instagram.handle` and Facebook `facebook.handle`. The head office comes from `site.office`.
    - **Footer:** its social links come from `site`.
    - **FAQ page:** its number is `site.whatsapp`.
    - **Header:** its chat link is `waChat()`.
  - **`site.json`** is written from today's constants:
    - **whatsapp:** `+60 19 383 6633`
    - **email:** `noreply@legendary.com.my`
    - **instagram:** `@legendaryofficial.my`, `https://www.instagram.com/legendaryofficial.my/`
    - **facebook:** `LegendaryPerfumeMY`, `https://www.facebook.com/LegendaryPerfumeMY`
    - **tiktok:** `https://www.tiktok.com/@legendary.my`
    - **shopee:** `https://shopee.com.my/legendaryperfume`
    - **office:** `HEAD_OFFICE` as it stands
  - **`policies.json`** is generated from the module through its schema, with the number and the address written out as the pages show them.
  - **What search engines are told.** The Instagram handle in `SITE.sameAs` (`legendaryperfume.my`) differs from the one the footer and Contact page show (`legendaryofficial.my`). So `sameAs` becomes the links the site shows, with TikTok added. Record this as a ruling in the ledger. Pages show nothing different, and the structured data now agrees with them.

- [ ] **Step 1: Write the failing tests**
  - `site.test.ts`:
    - `WhatsApp links are made from the number as written`:
      - `waLink('Hi Legendary!')` is `https://api.whatsapp.com/send/?phone=%2B60193836633&text=Hi%20Legendary!&type=phone_number&app_absent=0`.
      - `waChat()` is `https://api.whatsapp.com/send/?phone=%2B60193836633`.
    - `every WhatsApp link follows the site details`:
      - Apply a site draft with the number `+60 12 345 6789`.
      - `waLink('Hi')` contains `phone=%2B60123456789&`.
      - `waChat()` ends with `%2B60123456789`.
      - `organisationLd().telephone` is `+60 12 345 6789`.
      - Restore afterwards.
    - `search engines are given the links the site shows`: `organisationLd().sameAs` equals `[site.instagram.url, site.facebook.url, site.tiktok, site.shopee]`.
  - `content.test.ts`:
    - `the published site details and policies pass their schemas`.
    - The identity test adds `site`, `policiesDoc` and `policies`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Generate the two JSON files and implement as above. Run `npx tsc --noEmit`, `npm test` and `npm run check:content`. Expected: all pass, and the last prints `content: 12 documents valid`.
- [ ] **Step 4: Prove nothing changed.**
  - Task 3's `.parity-after.json` is this task's before state.
  - Rebuild, capture, and compare as in Task 3. Expected: all 45 routes identical in text, images and links.
- [ ] **Step 5:** Commit: `refactor(content): the site details and the policies live in src/content JSON`.

### Task 5: The Site tab: the site details, the collections and the map

**Files:**
- Create:
  - `src/admin/site.ts`, `src/admin/site.test.ts`
  - `src/admin/SiteTab.tsx`, `src/admin/SiteDetailsEditor.tsx`, `src/admin/CollectionsEditor.tsx`, `src/admin/PlacesEditor.tsx`
- Modify:
  - `src/admin/fields.tsx`: `Select` moves here from `ProductForm.tsx`, unchanged, and is exported
  - `src/admin/ProductForm.tsx`: its Collection select lists the working Collections
  - `src/admin/ProductsEditor.tsx`: rows show `collectionName(product)`
  - `src/admin/changes.ts`, `src/admin/History.tsx`, `src/pages/Admin.tsx`
- Test: `src/admin/site.test.ts`, `src/admin/changes.test.ts`

**Interfaces:**
- Consumes:
  - Tasks 1 to 4
  - `newId`, `setOptional`, `ListEditor`, `TextField`, `TextArea`, `PhotoField`, `PublishBar`, `useContent`, `accents`, `titleList`
- Produces:
  - **`src/admin/site.ts`:**
    - **`blankCollection(taken: Set<string>): CollectionEntry`:** the id is `newId('new collection', taken)`, the accent `gold`, and every text and the cover are `''`.
    - **`renameCollection(c, name, publishedIds, taken): CollectionEntry`:** works as `renameProduct` does. The id follows the name while the collection is unpublished, and never takes a published id.
    - **`collectionInUse(c, products, places): string | null`.** Parameters:
      - `c: { id; name }`
      - `products: { name; collectionId }[]`
      - `places: { place; collectionId? }[]`

      What it returns:
      - When products are in the collection: `<titleList of names> are in <name>. Move them to another collection first.` With one product: `<product> is in <name>. Move it to another collection first.`
      - When a pin opens it: `The Scented Memory map's <place> pin opens <name>.`
      - Otherwise null.
  - **`SiteTab({ screen, onScreen })`:**
    - A row of screen buttons, each named by its document's label. A button shows a gold dot while its document has unpublished changes.
    - Then the screen itself, inside `ContentGate`.
    - `SITE_SCREENS` lists the screens' document keys. This task adds `site`, `collections` and `places`; `type SiteScreen = (typeof SITE_SCREENS)[number]`.
  - **`SiteDetailsEditor`.** Three panels:
    - **Contact:**
      - **WhatsApp number**, with the hint `Shown on the Contact and FAQ pages, and used by every WhatsApp button. The FAQ answers and the policies write the number out in their own words: change it there too.`
      - **Email**, with the hint `Given to search engines as the house's address. The FAQ and the privacy policy write it out in their own words.`
    - **Social links:**
      - **Instagram name** (hint `As the Contact page shows it.`) and **Instagram address**
      - **Facebook name** and **Facebook address**
      - **TikTok address**, with the hint `The footer's TikTok button.`
      - **Shopee shop address**, with the hint `Given to search engines with the other links.`
    - **Head office:**
      - **Name** and **Address**
      - **Map search**, with the hint `What Get directions asks Google Maps to find.`
      - **Map embed address**, with the hint `From Google Maps: Share, then Embed a map. Copy the address inside src="…".`

    Publish bar: `docs={['site']}`, `previewPath="/contact"`.
  - **`CollectionsEditor`.** A `ListEditor` in menu order. Each collection has:
    - **Name**, with the address line below it, as on products.
    - **Tagline**, with the hint `Under its name in the menu, and on its card on the Home page.`
    - **On the Home page** (`description`), with the hint `The words on its card in the Home page's collection rail.`
    - **In the shop** (`intro`), with the hint `Under the title when the shop shows this collection.`
    - **Colour:** `Select` with a swatch, as in the product form.
    - **Cover photo:** `PhotoField`, kind `collection`.

    The list's behaviour:
    - `canRemove` is `collectionInUse`, given the working products and places.
    - **Add a collection** adds `blankCollection(taken ∪ published)`.
    - Publish bar: `docs={['collections']}`, `previewPath="/shop"`.
  - **`PlacesEditor`.** One panel per pin, without add, remove or reorder.
    - Each panel is headed with the place, and a line saying what the pin opens: `Opens <product name>.`, or `Opens the <collection name> collection.`
    - Fields:
      - **Place name**
      - **Line above the name** (`region`)
      - **Words on its card** (`note`)
      - **Card heading** (optional), with the hint `Left empty, the card shows <product name>.`
      - **Line under the heading** (optional), with the hint `Left empty: <family> · RM <price>.`
      - **Card photo** (optional, `PhotoField` kind `place`), with the hint `Left empty, the card shows <product name>'s lifestyle photo.`
    - Publish bar: `docs={['places']}`, `previewPath="/"`.
  - **`ProductForm`'s Collection select** lists the collections of the working Collections document, its draft when there is one. So a new collection can take products before it is published.
  - **`changes.ts`:**
    - `ListShape.key` becomes `string`.
    - `LISTS` adds `collections`, by `id` and titled by `name` (or `An unnamed collection`), and `places`, by `id` and titled by `place`.
    - `namesItems(doc: DocKey): boolean` says whether a document names its items.
  - **`History.tsx`:**
    - It names the items for every document where `namesItems` is true.
    - It reads "they were" for Stores, Products, Collections, Reviews, Partner logos, Trusted sellers, Policies and Site details, and "it was" otherwise.
  - **`Admin.tsx`:**
    - A `site` tab, labelled `Site`, comes after Journal.
    - A `siteScreen` state is passed to `SiteTab`.
    - `DOC_TABS` maps the Site documents to `site`, and the Overview's button also opens that document's screen.
    - The unconfigured note reads `Publishing is not set up yet, so nothing on the editing tabs can be saved. Add GITHUB_TOKEN and GITHUB_REPO in Vercel and redeploy.`

- [ ] **Step 1: Write the failing tests**
  - `site.test.ts`:
    - `a new collection gets an address of its own`:
      - `blankCollection(new Set(['newcollection']))` has the id `newcollection2`.
      - Renaming it `Merdeka` gives the id `merdeka`.
      - A published collection keeps its id when renamed.
    - `a collection in use cannot be removed`:
      - With Orchid and Violet in `signature`, the reason is `Orchid and Violet are in Signature. Move them to another collection first.`
      - With no products but a Melaka pin on `nyonya`, it is `The Scented Memory map's Melaka pin opens Nyonya.`
      - With neither, null.
  - `changes.test.ts`:
    - `changeSummary names the collections a publish adds, changes and removes`.
    - `changeSummary names the map pins a publish changes`: `Changed: Melaka.`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4: Check it in the browser** against the isolated stack: fake GitHub, dev-api with every setting given and the file store, and Vite. Use a throwaway script in Chrome, as stage 3 did, that checks:
  - **Opening.** The Site tab opens on Site details.
  - **The number.** Change the WhatsApp number. Preview `/contact` shows the new number, and the footer's WhatsApp link carries its digits.
  - **The collections list.** It shows four collections, in order. Remove on Signature is refused, naming its products.
  - **A new collection.** `Merdeka`, with every field and a cover photo, saves with no problems left. The Products tab's form lists it under Collection.
  - **The map.** Melaka's words change, and the draft saves.
  - **Discarding.** Discard returns each screen to the published version.

  Review the screenshots.
- [ ] **Step 5:** Commit: `feat(dashboard): the Site tab, with the site details, collections and the map`.

### Task 6: The Site tab: the reviews, the journey and the logo walls

**Files:**
- Create: `src/admin/ReviewsEditor.tsx`, `src/admin/JourneyEditor.tsx`, `src/admin/LogosEditor.tsx`
- Modify:
  - `src/admin/site.ts`, `src/admin/SiteTab.tsx`
  - `src/admin/PhotoField.tsx`, `src/admin/PhotoLibrary.tsx`
  - `src/pages/Admin.tsx`: `DOC_TABS`
- Test: `src/admin/site.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 2 and 5, and `SLOT_KINDS[kind].mono`.
- Produces:
  - **`site.ts`:**
    - **`setStars(review: ReviewEntry, stars: number): ReviewEntry`:** five stars, the default, is left out of the data.
    - **`moveLogo(rows, from: { row: number; index: number }, to: number)`:** takes and returns `PartnersDoc['rows']`. The logo goes to the end of row `to`, and nothing else changes.
    - **`siteMono(path: string): string | null`:** the black and white print beside a logo the site already has.
      - `/assets/client/(partner|seller)-<name>.png` gives the same path with `-mono.png`.
      - Anything else gives null, including a `-mono` print itself.
  - **`PhotoField`:**
    - Its `onChange` becomes `(path: string | undefined, mono?: string) => void`.
    - For a `mono` kind:
      - A derive passes its `mono`.
      - A site photo passes `siteMono(path)`.
      - **Remove photo** passes `undefined`.
  - **`LibraryPicker({ onPick, onClose, kind? })`:** for a `mono` kind it offers the uploads, and of the site's photos only the logos `siteMono` knows.
  - **`ReviewsEditor`.** A `ListEditor` in page order. Each review has:
    - **Quote**
    - **Name** (`author`), with the hint `Their name on the platform, or Verified buyer.`
    - **What they bought** (optional), with the hint `Shown under the name, as a link when the review has one.`
    - **Stars:** `Select`, from five down to one, through `setStars`.
    - **Link to the review** (optional), with the hint `Where it was left, such as its Shopee listing. It starts https://`

    Publish bar: `docs={['reviews']}`, `previewPath="/"`.
  - **`JourneyEditor`.** A `ListEditor` in page order. Each year has:
    - **Year** and **Title**
    - **Words**, with the hint `A card shows about 200 characters.` Past 200, the hint is `Longer than a card shows: the end will be cut off.`
    - **Photo** (optional, `PhotoField` kind `journey`), with the hint `Left empty, the card shows the house pattern in gold.`

    The list's behaviour:
    - A new year starts at the last year plus one.
    - Publish bar: `docs={['journey']}`, `previewPath="/about"`.
  - **`LogosEditor({ wall: 'partners' | 'sellers' })`:**
    - **Partners** is a `ListEditor` of rows.
      - Each row is labelled `Row <n>`.
      - Removing a row that still has logos is refused: `Row <n> still has logos. Move or remove them first.`
      - A row with more than six logos says `Six fit across a wide screen; more wrap onto a second line.`
      - Each row holds a `ListEditor` of its logos.
      - **Add a row** adds `{ logos: [] }`.
    - **Sellers** is one `ListEditor` of logos.
    - **Each logo** has:
      - **Name**, with the hint `For anyone who cannot see the logo.`
      - **Logo**, a `PhotoField` of kind `logo`. It sets `logo` and `mono` together, and removing the photo empties both.
      - The checkbox `An upright or square mark: give it more height` (`tall`).
      - On the partner wall, a **Row** select, which moves the logo with `moveLogo`.
    - A new logo is `{ name: '', logo: '', mono: '' }`.
    - Publish bars: `docs={['partners']}` with `previewPath="/"`, and `docs={['sellers']}` with `previewPath="/stores"`.
  - **`SITE_SCREENS`**, complete and in this order: `site`, `collections`, `reviews`, `journey`, `partners`, `sellers`, `places`.

- [ ] **Step 1: Write the failing tests** in `site.test.ts`:
  - `five stars is the default and is left out`.
  - `moveLogo moves a logo to the end of another row`.
  - `siteMono finds the black and white print beside a site logo`:
    - `/assets/client/partner-sogo.png` gives `/assets/client/partner-sogo-mono.png`.
    - `/assets/client/seller-zapin.png` gives `/assets/client/seller-zapin-mono.png`.
    - Each of these gives null: `/assets/client/partner-sogo-mono.png`, `/assets/client/store-bsas.webp` and `/assets/cms/abc.webp`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4: Check it in the browser,** as in Task 5:
  - **A review.** One with four stars saves, and Preview `/` shows its quote.
  - **The journey.** It shows ten years in order. A new title for 2015 shows in Preview `/about`.
  - **The partner rows.** They hold 6, 5 and 3 logos.
  - **A new logo.** One uploaded into row 3, from a sharp-made PNG on white, shows its thumbnail.
  - **Moving.** Moving SOGO to row 3 gives rows of 6, 4 and 5.
  - **Removing a row.** Removing row 1 is refused.
  - **The sellers.** Trusted sellers shows 12 logos.
  - **Discarding.** Discard returns each screen to the published version.

  Review the screenshots.
- [ ] **Step 5:** Commit: `feat(dashboard): the reviews, the journey and the logo walls`.

### Task 7: The Policies tab

**Files:**
- Create: `src/admin/PoliciesEditor.tsx`
- Modify: `src/admin/changes.ts`, `src/pages/Admin.tsx`
- Test: `src/admin/changes.test.ts`

**Interfaces:**
- Consumes:
  - `PolicyEntry` (Task 1), `BlocksEditor`, `PublishBar`
  - `issueCount(errors, index, 'policies')`
- Produces:
  - **`PoliciesEditor`:**
    - **The list.** The four policies in file order, without add, remove or reorder. Each row shows:
      - its title
      - `Last updated · <updated>`
      - the **Changed** and **Needs attention** tags
      - an **Edit** button
    - **One policy.** The form sits below an **All policies** link, with these fields:
      - **Title**
      - **Line above the title** (`eyebrow`)
      - **Introduction**
      - **Last updated**, with the hint `As the page shows it, for example August 2026.`
      - **The page:** `BlocksEditor`, with errors read at `policies.<i>.body.<path>`
    - **The publish bar:** `docs={['policies']}`. Its `previewPath` is `/<slug>` while a policy is open, and `/shipping` otherwise.
  - **`changes.ts`.** `LISTS.policies` keys by `slug` and titles by `title`.
  - **`Admin.tsx`.** A `policies` tab, labelled `Policies`, comes after Site, and `DOC_TABS.policies = 'policies'`.

- [ ] **Step 1: Write the failing test** in `changes.test.ts`: `changeSummary names the policy pages a publish changes`. It expects `Changed: Shipping Policy.`
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4: Check it in the browser:**
  - **The list.** Four policies are listed.
  - **One policy.** Edit on Shipping Policy shows its blocks, its table among them.
  - **Preview.** A changed first paragraph shows in Preview `/shipping`.
  - **Discarding.** Discard returns it to the published version.
- [ ] **Step 5:** Commit: `feat(dashboard): the Policies tab`.

### Task 8: End to end and docs

**Files:**
- Modify: `scripts/dashboard-e2e.mjs`, `README.md`

- [ ] **Step 1:** Bring up the isolated stack, as in stage 3.
- [ ] **Step 2: Extend `scripts/dashboard-e2e.mjs`.** Keep checks 1 to 19, and add:
  20. **The WhatsApp number.**
      - Site details: change it to `+60 12 345 6789`.
      - Preview `/contact` shows it, and the footer's WhatsApp link carries `60123456789`.
      - Publish, and it goes Live. The fake's `site.json` holds the new number.
  21. **A collection in use.** Remove on Signature is refused, naming its products.
  22. **A new partner logo.**
      - Add `E2E Partner` to row 3. Its file is a sharp-made 900×600 PNG on white, with a 600×150 bar.
      - Publish, and it goes Live.
      - The fake's `partners.json` has the logo last in row 3, with two `/assets/cms/` paths, and the fake holds both files.
      - The colour print is under 160 px tall, which shows the white is gone.
      - Every opaque pixel of the mono print is grey.
  23. **A review.** One with four stars shows its quote in Preview `/`. Then discard it.
  24. **A policy.**
      - Change the Shipping Policy's first paragraph. Preview `/shipping` shows it.
      - Publish, and it goes Live. The fake's `policies.json` holds it.
  25. **Restoring the site details.**
      - Restore Site details to the seeded version. The question reads `Put the Site details back as they were on`.
      - Afterwards, `site.json` is back byte for byte.

  Expected: every check passes.
- [ ] **Step 3: Build like production.** Expected:
  - `npm run build` passes in full, with `content: 12 documents valid` and 10 functions.
  - The sitemap still lists 45 routes.
  - `npm test` passes.
- [ ] **Step 4: Document it.** The README's Content dashboard section covers:
  - the eight new documents and the screens that edit them
  - a logo's two prints
  - collection addresses, the rule on removing a collection, and names shown from the collection
  - the site details feeding every WhatsApp and social link and the structured data
  - where the WhatsApp number is also written out: the FAQ answers and the policies
- [ ] **Step 5:** Commit: `feat(dashboard): stage 4a end to end checks and docs`. Do not push: the user tests all stages live together.
