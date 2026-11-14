# Content dashboard, stage 3 (Products) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Legendary team can add a new product end to end, from its copy, notes and every photo to a price that checkout charges after publishing. They can also edit, duplicate, reorder and remove products from the dashboard's Products tab.

**Architecture:**
- **Where the products live.** The 21 products move from `src/data/products.ts` into one document, `src/content/products.json` (key `products`, label `Products`). It is in shelf order, with every product written out in full: the generated Spirit and Wish singles and the shared "What's included" lines are expanded. Nothing visible changes.
- **Server prices travel with the products.** `api/_catalogue.ts`, the server's price list, is generated from that document by one function. `npm run catalogue` and the content function's publish and restore both use it. Every commit that changes `products.json` also carries the regenerated catalogue, so checkout knows a new product at its price, whatever order Vercel builds things in.
- **Prices of published products** keep changing through the existing price table (product overrides), which takes effect at once. The form sets a price only for a product that is not yet published.
- **Preview** keeps working for products: drafts are applied without replacing the products array, and nothing derived from products is computed when a module loads.

**Tech Stack:** As stages 1 and 2. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-12-content-dashboard-design.md`. This plan covers stage 3 of "Order of work" and the parts of the spec that apply to products:
- the Products entry under "Screens"
- the product rows of the photo slot table
- the Goals line on new products being buyable at the entered price
- the Testing line on buying a dashboard product without live keys

It builds on the stage 1 and 2 plans (`docs/superpowers/plans/2026-11-12-content-dashboard-stage-1.md`, `docs/superpowers/plans/2026-11-13-content-dashboard-stage-2.md`).

## Global Constraints

- **The earlier stages' constraints still apply.** Every Global Constraint of the stage 1 and stage 2 plans applies here. In particular:
  - Every object schema is `.passthrough()` (the `object()` helper in `schema.ts`), and schemas declare keys in file order.
  - Content image paths are root paths, resolved with `asset()` where they are drawn.
  - Optional fields the team empties are left out of the data, not saved as `''`.
  - No em or en dash in visible copy.
  - The local `.env` is production, so tests and runs stay off it.
  - There are no new function files (10 stay).
- **Server prices.** Checkout prices only from `api/_catalogue.ts`. That file is the output of `catalogueSource()` in `api/_lib/content/catalogue-source.ts` over `src/content/products.json`. The committed file must always equal that output, byte for byte once CRLF is normalised.
- **Overrides key on product ids**, and so do product addresses (`/product/<id>`). A published product's id never changes. A new product's id is made from its name, letters and digits only (`newId`), until it is published.
- **Pinned products.** The site's own code points at Orchid (Home, Signature section) and at the products the Scented Memory map pins (mahsuri, man, orchid, kebaya-blooms, spirit). The form refuses to remove those, saying where they appear. The pages also cope if one goes missing.
- **Preview.** `asset()` is idempotent. `applyDrafts` keeps the identity of every top-level array in a document. No module computes anything from products when it loads.
- **Release.** Stage 3 is merged into local `main` after its review. Do not push it: the user tests all stages live at once (memory `cms-live-testing-at-the-end`).

## Review Focus

1. **A new product is published.** Checkout must charge exactly the price entered, the moment the site is live, never fail its id. Test: Task 3 `publishing a new product puts it in the server catalogue at its price`.
2. **Removing a product the site's code points at.** Removing Orchid, or a product the map pins, is refused with the reason, and Home and the map do not crash if one goes missing anyway. Tests: Task 4 `pinned products cannot be removed` and Task 2 `the map and Home cope with a missing product`.
3. **A pack shot sent on white.** "Make the white see-through" has to leave a transparent background and an intact pack. A photo that already has transparency is left alone. Test: Task 1 `white is knocked out of a pack shot sent on white`.
4. **Previewing a new product.** `/product/<id>?preview` shows it, the shop lists it, and search finds it. Tests: Task 2 `a draft applied to the registry is what the shop reads`; search builds its index when it opens (Task 2, step 5).
5. **A published product is renamed or resized.** The server catalogue's name and size follow, so the order confirmation shows the new wording, while the price stays the table's. Test: Task 3 `the catalogue follows a renamed product`.

---

### Task 1: The product schema, its photo slots, and making white see-through

**Files:**
- Modify: `api/_lib/content/schema.ts`, `api/_lib/content/slots.ts`, `api/_lib/content/images.ts`, `api/admin/media.ts`
- Test: `tests/api/content-schema.test.ts`, `tests/api/media.test.ts`

**Interfaces:**
- Produces:
  - **`schema.ts`:**
    - `ProductSchema` and `ProductsDocSchema = { products: Product[] }`.
    - Types `ProductsDoc`, `ProductEntry` (`ProductsDoc['products'][number]`), `ProductVariant` and `ScentNotesEntry`.
  - **`slots.ts`:** entries typed as `{ label; maxSide; alpha; square? }`:

    | Kind | Label | maxSide | alpha | square |
    | --- | --- | --- | --- | --- |
    | `productLife` | Lifestyle photo | 1400 | false | true |
    | `productBox` | Box shot | 1400 | false | true |
    | `productPack` | Pack cut-out | 1400 | true | |
    | `productIncluded` | What's included flat-lay | 1600 | true | |
    | `productChart` | Occasion chart | 1100 | true | |
    | `productBloom` | Botanical | 1000 | true | |

  - **`images.ts`:** `makeSlot(master, kind, opts?: { white?: boolean })`.
    - A `square` kind is cropped to `maxSide` by `maxSide` with `fit: 'cover'` and sharp's attention strategy.
    - `white` applies only to an `alpha` kind, and only to a master with no real transparency. Pixels above 238 in red, green and blue become transparent, then transparent edges are trimmed. This mirrors `opaque_to_alpha` in `scripts/prepare-assets.py`.
  - **`media.ts`:** `POST ?derive=<file>&kind=<kind>&white=1` passes `white`. For a kind without `alpha` it answers 400 `That kind of photo keeps its background.`.

**Product fields,** declared in this order, which is the file's order:

| Field | Rule |
| --- | --- |
| `id` | `/^[a-z0-9-]{1,40}$/` (`Use lowercase letters and numbers only.`), unique (`Another product already uses this address.`) |
| `name` | `text(60)` |
| `subtitle` | `text(80)` |
| `collection` | `text(40)` |
| `collectionId` | `/^[a-z0-9-]{1,40}$/` |
| `family` | `text(40)` |
| `audience` | `For Her`, `For Him` or `Unisex` (`Choose who it is for.`) |
| `moods` | 1 to 4 of `Serene`, `Bold`, `Romantic`, `Playful`, no repeats (`Choose at least one mood.`) |
| `price` | whole ringgit 1 to 10000 (`Use a whole number of ringgit, from 1 to 10000.`) |
| `compareAt` | optional, same rule, and more than `price` (`The was price must be more than the price.`) |
| `size` | `text(60)` |
| `image`, `hoverImage`, `box`, `included`, `radar` | `SITE_PHOTO` (`Choose a photo.`) |
| `includedItems` | 1 to 8 of `{ label: text(60), detail: text(160) }` |
| `bloom` | optional, `SITE_PHOTO` |
| `variants` | optional, 1 to 6 of `{ name: text(40), family?: text(40), notes, radar: photo, bloom?: photo }` |
| `accent` | one of `gold`, `rose`, `jade`, `amber`, `plum`, `teal`, `graphite` (`Choose a colour.`) |
| `compositionTint` | optional, `/^#[0-9a-fA-F]{6}$/` (`Use a colour written like #D1E5ED.`) |
| `badges` | 0 to 4 of `text(30)` |
| `bestseller`, `gift` | optional booleans |
| `story` | `text(600)` |
| `description` | `text(1500)` |
| `goodToKnow` | optional, `text(400)` |
| `care` | optional, `text(600)` |
| `notes` | `{ top, heart, base }`, each 1 to 8 of `text(30)` (`Add at least one note.`) |
| `place` | optional, `text(60)` |

- `products` needs at least one product: `Keep at least one product.`.
- The whole field list, `includedItems` and the variant fields follow the order above.
- A variant is `{ name, family?, notes, radar, bloom? }`, in that order.

- [ ] **Step 1: Write the failing tests**
  - `content-schema.test.ts`, with a fixture `product(over)`:
    - `accepts a minimal product`.
    - `a price is whole ringgit`: `188.5` and `0` fail at `['products', 0, 'price']`.
    - `the was price is above the price`: `compareAt: 150` with `price: 188` fails at `['products', 0, 'compareAt']`.
    - `product addresses are their own`: two `orchid` products fail at `['products', 1, 'id']`.
    - `a product needs a mood and its notes`: `moods: []` fails at `moods`, and `notes.top: []` fails at `['products', 0, 'notes', 'top']`.
    - `each fragrance in a set needs its own chart`: a variant without `radar` fails at `['products', 0, 'variants', 0, 'radar']`.
    - `a composition colour is a colour`: `compositionTint: 'blue'` fails.
  - `media.test.ts`:
    - `a lifestyle photo is framed square at 1400 px`: a 3000×2000 JPEG master derived as `productLife` gives 1400×1400.
    - `white is knocked out of a pack shot sent on white`: a 1200×800 white JPEG with a 400×400 red square in the middle, derived as `productPack` with `white=1`. The output has alpha; its corner pixel's alpha is 0; its centre is opaque red; it is trimmed to about the square.
    - `a cut-out that already has transparency is left as it is`: a transparent PNG derived with `white=1` keeps its pixels.
    - `only a see-through kind takes white=1`: `store` with `white=1` answers 400.
- [ ] **Step 2:** `npm test`. Expected: the new tests FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4:** Run `npm test`, `npx tsc --noEmit` and `npm run check:functions`. Expected: PASS, with 10 functions loading.
- [ ] **Step 5:** Commit: `feat(content): the product schema, its photo slots, and making white see-through`.

### Task 2: Move the products into JSON, nothing visible changed

**Files:**
- Create: `src/content/products.json`
- Modify:
  - `api/_lib/content/keys.ts`, `docs.ts`, `src/content/registry.ts`
  - `src/data/products.ts`
  - `src/lib/asset.ts`, `src/content/preview.ts`
  - `src/components/ProductCard.tsx`, `CartDrawer.tsx`, `SearchOverlay.tsx`
  - `src/pages/Checkout.tsx`, `src/pages/Product.tsx`
  - `src/data/places.ts`, `src/components/MalaysiaMap.tsx`, `src/sections/Signature.tsx`
  - `tests/api/content.test.ts`: add a minimal `products.json` to the seed
- Test: `src/content/content.test.ts`, `src/content/preview.test.ts`, `src/lib/asset.test.ts` (new), `src/data/places.test.ts` (new)

**Interfaces:**
- Consumes: `ProductsDocSchema` and its types (Task 1).
- Produces:
  - **The registry.** `DOC_KEYS` adds `'products'`, and `DOCS.products` is `{ path: 'src/content/products.json', label: 'Products', schema: ProductsDocSchema }`.
  - **`src/data/products.ts`:**
    - `productsDoc` is the imported JSON object.
    - `products` is `productsDoc.products`, the very array.
    - `galleryOf(p) = [p.image, p.hoverImage, p.box]`.
    - The types, `moodList`, `moodCopy`, `moodIcon`, `getProduct`, `relatedProducts`, `productsByMood` and `productsByCollection` keep their names. Each reads `products` when called.
    - The `Product` type is `ProductEntry`.
    - The header comment says where each product's notes now live: the file's git history from before this commit.
  - **`asset(path)` is idempotent.** A path already starting with the base plus `/` comes back unchanged.
  - **`applyDrafts` keeps array identity.** When a document's key and its draft's key are both arrays, the array's contents are replaced in place. So `products` stays the array the site holds, and shows a preview's drafts.
  - **Consumers.** Every product photo is drawn through `asset()`: card, cart, checkout, search, the product page (gallery via `galleryOf`, included, charts, botanicals) and the map card. `Seo` and JSON-LD get root paths.
  - **`SearchOverlay`** builds its index when it opens (`useMemo` in the component), not when its module loads.
  - **Missing products.** `placeTarget(place)` returns `null` when its product is missing, and the map leaves that pin out. `Signature` renders nothing without Orchid.
  - **`products.json` format.** `{ "products": [...] }` in today's shelf order, keys in the Task 1 order.
    - `gallery` becomes `box`, its third entry.
    - Every path is a root path.
    - Singles and shared lines are expanded, exactly as the module builds them.

- [ ] **Step 1: Record the before state.** In PowerShell, run `$env:VITE_BASE = "/"; npm run build`, then `npx vite preview --port 4230`, then `node scripts/parity.mjs http://localhost:4230 .parity-before.json`. Also keep a copy of `api/_catalogue.ts`.
- [ ] **Step 2: Generate `products.json`** with a throwaway esbuild bundle of the current module, with `lib/asset` stubbed to identity. It asserts that every gallery is `[image, hoverImage, box]` before writing `box`. It is not committed.
- [ ] **Step 3: Write the failing tests**
  - `content.test.ts`:
    - `the published products pass their schema`.
    - The identity test adds `productsDoc` to the JSON object, and `products` to `productsDoc.products`.
    - The round-trip test already covers every `DOCS` file.
  - `preview.test.ts`, `a draft applied to the registry is what the shop reads`:
    - Apply a products draft that appends `{ id: 'newscent', ... }`.
    - `getProduct('newscent')` is defined, and the `products` array the module exported is the same object as before and has 22 entries.
    - Restore afterwards.
  - `asset.test.ts`, `asset is idempotent`: `asset(asset('/assets/a.webp'))` equals `asset('/assets/a.webp')`.
  - `places.test.ts`, `the map and Home cope with a missing product`: `placeTarget` of a place whose `productId` is not a product returns `null`.
- [ ] **Step 4:** `npm test`. Expected: FAIL.
- [ ] **Step 5:** Implement as above.
  - `SearchOverlay` builds its index in the component.
  - Run `npx tsc --noEmit`, `npm test` and `npm run check:content`. Expected: all pass, and the last prints `content: 4 documents valid`.
- [ ] **Step 6: Prove nothing changed.**
  - Stop the preview server, rebuild as in Step 1, and capture `.parity-after.json`.
  - `node scripts/parity.mjs --compare .parity-before.json .parity-after.json`. Expected: all 45 routes identical, the 21 product pages among them.
  - `git diff --ignore-cr-at-eol --stat -- api/_catalogue.ts`. Expected: empty.
- [ ] **Step 7:** Commit: `refactor(content): the products live in src/content JSON`.

### Task 3: The server catalogue travels with every product change

**Files:**
- Create: `api/_lib/content/catalogue-source.ts`
- Modify: `api/_lib/content/docs.ts`, `api/admin/content.ts`, `scripts/build-catalogue.mjs`, `api/_catalogue.ts` (regenerated once, header only)
- Test: `tests/api/catalogue-source.test.ts` (new), `tests/api/content.test.ts`

**Interfaces:**
- Consumes: `ProductsDoc` (Task 1), `products.json` (Task 2).
- Produces:
  - **`catalogueSource(products: { id; name; size; price; collection }[]): string`.**
    - It returns the full text of `api/_catalogue.ts`: today's interface, `CURRENCY = 'MYR'`, and `PRODUCTS` as `JSON.stringify(record, null, 2)`, keyed by id in shelf order, each entry `{ id, name, size, price, collection }`, ending with a newline.
    - The header comment says it is generated from `src/content/products.json` by this function.
    - It throws on a duplicate id or on a price that is not a positive whole number, the existing guards.
  - **`DocSpec.companions?: (data: unknown) => { path: string; content: string }[]`.** `DOCS.products.companions` gives `api/_catalogue.ts` from `catalogueSource`.
  - **Publish and restore** add each published document's companions to the same commit.
  - **`scripts/build-catalogue.mjs`** bundles `catalogue-source.ts` with esbuild, reads `products.json`, and writes `api/_catalogue.ts`. It keeps its console line.

- [ ] **Step 1: Write the failing tests**
  - `catalogue-source.test.ts`:
    - `the committed catalogue is what the products file generates`: `catalogueSource(products.json's products)` equals `api/_catalogue.ts`, with CRLF normalised.
    - `a price the server cannot charge is refused`: a price of `0` throws.
  - `content.test.ts`:
    - `publishing a new product puts it in the server catalogue at its price`:
      - Draft the seed products plus `{ id: 'newscent', price: 95, ... }` and publish.
      - The commit's `api/_catalogue.ts`, parsed from its `PRODUCTS = ` JSON, has `newscent` at price 95.
      - `src/content/products.json` holds the product.
    - `the catalogue follows a renamed product`: renaming a seeded product's `size` puts the new size in the committed catalogue, and leaves its price unchanged.
    - `restoring the products restores the catalogue with them`: after a publish, restoring the seed makes a commit whose catalogue equals `catalogueSource` of the seed.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement. Run `npm run catalogue` once, and the header change is the only diff in `api/_catalogue.ts`.
- [ ] **Step 4:** Run `npm test`, `npx tsc --noEmit`, `npm run check:functions` and `npm run catalogue`, then `git diff --ignore-cr-at-eol --stat -- api/_catalogue.ts` after the commit. Expected: PASS, and the last is empty.
- [ ] **Step 5:** Commit: `feat(content): the server catalogue travels with every product change`.

### Task 4: The product form

**Files:**
- Create: `src/admin/products.ts`, `src/admin/products.test.ts`, `src/admin/ProductForm.tsx`
- Modify:
  - `src/admin/PhotoField.tsx`: a `white` option
  - `src/lib/api.ts`: `adminDerivePhoto(file, kind, opts?)`

**Interfaces:**
- Consumes:
  - `ProductEntry` (Task 1), `products`, `moodList` and `galleryOf` (Task 2)
  - `collections` (`src/data/collections.ts`), `scentPlaces` (`src/data/places.ts`), `accents` (`src/lib/accents.ts`)
  - `newId`, `setOptional`, `ListEditor`, `LinesField`, `TextField`, `TextArea`, `NumberField`, `PhotoField`
- Produces:
  - **`products.ts` (admin):**
    - `blankProduct(taken: Set<string>, collection: { id; name }): ProductEntry`: id `newId('new product', taken)`, name `''`, moods `['Serene']`, audience `Unisex`, accent `gold`, price 0, notes with one empty entry per tier, `includedItems` the house's four lines plus an empty first line, photos `''`.
    - `duplicateProduct(p, taken): ProductEntry`: a deep copy named `${p.name} copy`, with the id made from that, and without `bestseller` or `place`.
    - `renameProduct(p, name, publishedIds, taken)`: the id follows the name while the product is not published, as `retitle` does for articles.
    - `pinReason(id): string | null`:
      - `orchid` gives `Orchid leads the Home page's Signature section.`
      - each map product gives `<Name> is pinned on the Scented Memory map.`
      - anything else gives null.
      - It is read from `scentPlaces` when called.
  - **`PhotoField` `white?: boolean`.** It shows a checkbox, `The photo is on a white background: make the white see-through`, and derives with `white` when ticked.
  - **`ProductForm({ product, index, publishedIds, taken, onChange, err, busy })`.** It shows these sections in order:
    - **Basics:**
      - Name, with the address line below it, as on articles
      - Subtitle
      - Collection (a select of `collections`, setting `collection` and `collectionId`)
      - Scent family, and Who it is for (a select)
      - Moods (checkboxes)
      - Colour (a select of `accents`, with a swatch)
      - Composition band colour (optional, `<input type="color">` with a Clear button)
      - Size
      - Badges (lines)
      - Show under Gifts & Sets (a checkbox)
    - **Price:**
      - While the product is not published: Price and Was price (`NumberField`, was price optional).
      - Once published, a line instead: `RM <price>. Change prices in the price table below; they change on the site at once.`
    - **Words:** Story; Description; Good to know and Care, each optional with the hint `Left empty, the page shows the house wording.`
    - **What's included:** a `ListEditor` of label and detail.
    - **Notes:** Top, Heart and Base (`LinesField`, one note per line).
    - **Photos:**
      - Lifestyle (`productLife`), Pack cut-out (`productPack`, `white`), Box shot (`productBox`)
      - What's included flat-lay (`productIncluded`)
      - Occasion chart (`productChart`), Botanical (`productBloom`, optional)
    - **Fragrances in the box (for a set):** a `ListEditor` of name, family, the three note lines, chart and botanical. When it is emptied, `variants` is left out.

- [ ] **Step 1: Write the failing tests** in `products.test.ts`:
  - `a new product starts with the house's included lines and a mood`.
  - `renameProduct makes the address from the name while the product is new`: `New product` becomes `Saffron Dusk`, so the id becomes `saffrondusk`.
  - `renameProduct keeps a published address`.
  - `a duplicate is a copy with its own address, not on the map or the bestseller list`.
  - `pinned products cannot be removed`: `pinReason('orchid')` names the Signature section; `pinReason('mahsuri')` names the map; `pinReason('violet')` is null.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement the helpers, the `white` option and `ProductForm`.
- [ ] **Step 4:** Run `npm test` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(dashboard): the product form`.

### Task 5: The Products tab

**Files:**
- Create: `src/admin/ProductsEditor.tsx`
- Modify:
  - `src/pages/Admin.tsx`: the Products tab shows `ProductsEditor` above the price table; each price row gains `Edit page`; `DOC_TABS.products = 'products'`
  - `src/admin/changes.ts`: products in `changeSummary` and `restoreChanges`
  - `src/admin/History.tsx`: the restore question names products too
- Test: `src/admin/changes.test.ts`

**Interfaces:**
- Consumes: Task 4, `useContent`, `PublishBar`, `issueCount` (from `journal.ts`, which is generic over `articles.<i>` and so gains an optional prefix argument).
- Produces:
  - **`ProductsEditor`:**
    - **The list:**
      - A **Products on the shop** panel, in shelf order. Each row shows the name, the collection and `RM <price>`.
      - The tags are as on Journal articles: **New**, **Changed** and **Needs attention**.
      - Each row has **Edit**, **Duplicate** (the copy goes straight after it), **Move up**, **Move down** and **Remove**.
      - Remove is refused, with an alert of `pinReason`, for a pinned product. Otherwise it asks: `Remove "<name>"? It leaves the shop and its page stops working once you publish.`
      - **New product** adds a `blankProduct` at the end and opens it.
    - **One product:** `ProductForm` below an **All products** link.
    - **Publish bar:** `docs={['products']}`, with `previewPath` set to `/product/<id>` while a product is open and `/shop` otherwise.
    - **From the price table:** its `Edit page` button opens the same form, by id.
  - **`changes.ts`.** `changeSummary('products', ...)` and `restoreChanges` work for products by `id`, titled by `name`. The journal ones are unchanged.

- [ ] **Step 1: Write the failing tests** in `changes.test.ts`:
  - `changeSummary names the products a publish adds, changes and removes`.
  - `restoreChanges names the products a restore takes off and brings back`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4: Check it in the browser** against the isolated stack (fake GitHub, dev-api with every setting given and the file store, Vite). Write a throwaway script, like stage 2's `journal-tab-check.mjs`, that runs in Chrome and checks:
  - The list shows 21 products in shelf order.
  - **Edit** on Violet opens its form with its notes and photos.
  - **New product** made with a name, collection, moods, price 95, the three notes, a lifestyle photo, a pack shot on white with the box ticked, a box shot, a flat-lay, a chart, story and description: it saves with no problems left, and **Preview** shows `/product/<id>` with the ribbon.
  - **Duplicate** and **Move up** work.
  - **Remove** on Orchid is refused, with the Signature reason.
  - **Discard** returns the list to 21 products.

  Review the screenshots.
- [ ] **Step 5:** Commit: `feat(dashboard): the Products tab`.

### Task 6: End to end and docs

**Files:**
- Modify: `scripts/dashboard-e2e.mjs`, `README.md`

- [ ] **Step 1:** Bring up the isolated stack (as in stage 2).
- [ ] **Step 2: Extend `scripts/dashboard-e2e.mjs`.** Keep checks 1 to 15. Add:
  16. A new product, `E2E Test Scent`, priced 95, with every required photo made by sharp:
      - its lifestyle photo is 3000×2000
      - its pack shot is on white, with the box ticked

      Publish it, and it goes Live. The fake then has:
      - the product in `products.json` under the id `e2etestscent`
      - `api/_catalogue.ts` with it at 95
      - its lifestyle copy at 1400×1400
      - its pack cut-out with transparency
  17. Remove is refused on Orchid with the Signature reason.
  18. Preview `/product/e2etestscent` shows the new product with the ribbon.
  19. Restore Products to the seeded version. `products.json` is back byte for byte, and `api/_catalogue.ts` equals `catalogueSource` of the seed.

  Expected: every check passes.
- [ ] **Step 3: Build like production.** `npm run build` passes in full, with `content: 4 documents valid` and 10 functions. The sitemap lists the 21 product pages. `npm test` passes.
- [ ] **Step 4: Document it.** The README's Content dashboard section covers:
  - products in `src/content/products.json`
  - the catalogue travelling with every product commit
  - prices of published products staying in the price table
  - pinned products
  - the product photo sizes
- [ ] **Step 5:** Commit: `feat(dashboard): stage 3 end to end checks and docs`. Do not push: the user tests all stages live together.
