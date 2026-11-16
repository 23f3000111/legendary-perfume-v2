# Content dashboard, stage 4c (banners and sharing images) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Legendary team can replace these from the dashboard:
- every page banner, each with a focus point so the bottle stays in view on a phone
- each Shop view's banner and each collection's banner
- each page's sharing image

The Home page's search words then also reach link previews.

**Architecture:**
- **A banner is two prints and a focus.**
  - A banner field holds `{ image, phone, focus? }`. The wide print is up to 2400 px and the phone print up to 1200 px, both with the same framing, made from one upload.
  - The optional focus point `{ x, y }` (fractions from 0 to 1) becomes the CSS `object-position` of both prints. A title bar on a phone, or a wide bar on a laptop, then crops around the bottle rather than the middle.
  - The delivery's banners keep their own phone crops (`banner-<page>-sm.webp`) and have no focus.
- **Banners live with their words.**
  - Each page's banner goes in `pages.json`, beside its title bar's words, and the Shop views' banners go in `shop.banners`.
  - Each collection's banner in `collections.json` becomes the same `{ image, phone }` shape.
  - Nothing visible changes.
- **Sharing images.** A sharing image is optional, `seo.image` on each page. Without one, a page shares its banner, as today, and Home shares the house's default.
- **The static head.** The Home title, description and sharing image are also written into `index.html` at build time. That is the only head a link preview reads, since it does not run the site's JavaScript.

**Tech Stack:** As stages 1 to 4b. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-12-content-dashboard-design.md`. This plan covers:
- the "Page banner" row of the photo slot table: "2400 px wide, plus a focus point so the phone crop keeps the bottle"
- "the Shop banners" under "In"
- "its sharing image" under "In"

It builds on the stage 4b plan.

## Global Constraints

- **The earlier stages' constraints still apply.** Every Global Constraint of stages 1 to 4b applies. In particular:
  - schemas use `object()`, with keys in file order
  - nothing is computed from content when a module loads
  - no em or en dash in new copy
  - no new function files (10 stay)
  - the local `.env` is production
- **The focus point** is stored as fractions rounded to two places. Without one, a banner is centred, as every banner is today.
- **Out of this stage:**
  - **Per-route prerendered heads**, which would let inner pages' link previews differ. The Home head is the static one every route serves.
  - **The hero poster**, which is stage 5.
- **Release.** Merged into local `main` after its review. Do not push.

## Review Focus

1. **A banner uploaded with a focus point** keeps the chosen spot in view on a phone and on a laptop. Its two prints both go live. Tests:
   - Task 1 `a banner gets a wide print and a phone print`
   - Task 2 `a title bar crops around the banner's focus`
2. **A delivery banner chosen from the library** keeps its own phone crop, rather than showing the wide print squeezed onto a phone. Test: Task 1 `sitePhone finds the phone crop beside a delivery banner`.
3. **A page with no sharing image** shares its banner, as today, and Home shares the house default. Test: Task 2 `a page without a sharing image shares its banner`.
4. **The static head after a Home edit.** It carries the new title and description, escaped, with no stray markup. Test: Task 3 `the static head carries the Home page's search words`.
5. **Every banner and sharing image has a field.** The page table test still holds, with an optional sharing image allowed to be absent. Test: Task 4 `every word on the pages has a field, and every field a word`.

---

### Task 1: Banner and sharing photo kinds, and a banner's two prints

**Files:**
- Modify:
  - `api/_lib/content/slots.ts`, `api/_lib/content/images.ts`, `api/admin/media.ts`, `src/lib/api.ts`
  - `src/admin/PhotoField.tsx`, `src/admin/PhotoLibrary.tsx`, `src/admin/site.ts`
- Test: `tests/api/media.test.ts`, `src/admin/site.test.ts`

**Interfaces:**
- Produces:
  - **`slots.ts`.** `SlotSpec.phone?: boolean`, which means the kind also makes a 1200 px print for phones. New kinds:
    - `banner: { label: 'Banner', maxSide: 2400, alpha: false, phone: true }`
    - `share: { label: 'Sharing image', maxSide: 1200, alpha: false }`
  - **`images.ts`.** `makeBanner(master: Buffer): Promise<{ wide: Print; phone: Print }>`. Each print is fitted inside its size (2400 and 1200), never enlarged, flattened on white, and saved as WebP at quality 82.
  - **`media.ts`.** A derive of a `phone` kind stores both prints and answers `{ path, phone, width, height }`.
  - **`api.ts`.** `adminDerivePhoto` resolves to `{ path; mono?; phone?; width; height }`.
  - **`site.ts`.** `sitePhone(path: string): string | null`. `/assets/client/banner-<name>.webp` gives its `-sm.webp` sibling; anything else, an `-sm` print included, gives null.
  - **`PhotoField`.**
    - **The second print.** `onChange(path, second?)`. The second print is the derive's `mono ?? phone`. For a site photo it is `siteMono` or `sitePhone`, by kind.
    - **What the library offers.** For a `mono` or `phone` kind, it offers only the site photos that have that second print beside them.
- [ ] **Step 1: Write the failing tests**
  - `media.test.ts`, `a banner gets a wide print and a phone print`:
    - **The file:** a 3000×1500 JPEG.
    - **The answer:** a `path` that is 2400×1200, and a different `phone` that is 1200×600.
  - `site.test.ts`, `sitePhone finds the phone crop beside a delivery banner`:
    - `/assets/client/banner-nyonya.webp` gives `/assets/client/banner-nyonya-sm.webp`.
    - Each of these gives null: `/assets/client/banner-nyonya-sm.webp`, `/assets/client/store-bsas.webp` and `/assets/cms/abc.webp`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4:** Run `npm test`, `npx tsc --noEmit` and `npm run check:functions`. Expected: PASS, with 10 functions.
- [ ] **Step 5:** Commit: `feat(content): banner and sharing photo kinds, and a banner's two prints`.

### Task 2: Banners and sharing images move into the documents, nothing visible changed

**Files:**
- Modify:
  - `api/_lib/content/schema.ts`, `src/content/pages.json`, `src/content/collections.json`
  - `src/components/ui/PageHeader.tsx`
  - pages: `src/pages/About.tsx`, `Stores.tsx`, `Contact.tsx`, `Faq.tsx`, `Journal.tsx`, `Policy.tsx`, `Shop.tsx`, `Home.tsx`, `Order.tsx`
- Test: `src/content/content.test.ts`, `src/content/preview.test.ts`, `src/components/ui/PageHeader.test.tsx` (new), `tests/api/pages-schema.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - **`schema.ts`:**
    - `BannerSchema = object({ image: photo, phone: photo, focus: object({ x: fraction, y: fraction }).optional() })`, where `fraction` is a number from 0 to 1. Plus `type BannerEntry`.
    - The `seo` rule gains `image: photo.optional()`.
    - `PagesDocSchema` gains, each placed after its page's `header`:
      - `about.banner`, `stores.banner`, `contact.banner`, `faq.banner` and `journal.banner`
      - `policies.banner`, before `more`
      - `shop.banners: { all, bestsellers, gifts, her, him }`, after `shop.eyebrow`
    - In `CollectionSchema`, `banner` becomes `BannerSchema.optional()`.
  - **The data.** Each banner is today's file, with its phone print being today's `-sm` sibling:
    - **FAQ:** `banner-contact`. **Policies:** `banner-journal`.
    - **Shop views:** `all` is `banner-fragrances`, and the others are `bestsellers`, `gifts`, `for-her` and `for-him`.
    - **Collections:** their four banners.
    - **No `focus` anywhere,** and no `seo.image` anywhere.
  - **`PageHeader`:**
    - It gains `banner?: BannerEntry`, drawn as a `<picture>`: a `<source media="(max-width: 640px)">` of `asset(banner.phone)`, and an `<img>` of `asset(banner.image)`.
    - With a focus, both get `object-position: <x×100>% <y×100>%`.
    - `image` stays for articles. Its file-name phone crop is kept for any caller that still passes a banner path.
  - **The pages** pass `banner={pages.<page>.banner}`.
    - The Shop passes the view's banner, or the active collection's (`collection.banner ?? pages.shop.banners.all`).
    - Order keeps passing its own `image`, since the checkout flow is out of scope.
  - **`shareImage(page: { seo: { image?: string }; banner?: { image: string } }): string | undefined`** in `src/data/pages.ts`. It returns `seo.image ?? banner?.image`.
  - **`Seo` images.** Each page passes `shareImage(pages.<page>)`. Home's gives `undefined` until a sharing image is set, and `Seo` then falls back to the house default.
- [ ] **Step 1: Record the before state** with parity (build in PowerShell with `$env:VITE_BASE = "/"`, preview on 4230, capture `.parity-before.json`).
- [ ] **Step 2: Write the failing tests**
  - `PageHeader.test.tsx` (render with `renderToStaticMarkup` inside a `MemoryRouter`), `a title bar crops around the banner's focus`:
    - The banner `{ image: '/assets/cms/a.webp', phone: '/assets/cms/b.webp', focus: { x: 0.3, y: 0.7 } }` gives `object-position:30% 70%`.
    - It gives a `<source>` with `srcSet` for `/assets/cms/b.webp`.
    - Without a focus there is no `object-position`.
  - `content.test.ts`, `a page without a sharing image shares its banner`. The helper `shareImage(page)` in `src/data/pages.ts` returns `seo.image ?? banner.image`:
    - For `pages.about` it is `/assets/client/banner-our-story.webp`.
    - With `seo.image` set, it is that image.
  - `preview.test.ts`, `a banner draft is what the page reads`: a draft with a new `about.banner.image` is what `pages.about.banner.image` reads.
  - `pages-schema.test.ts`, `a banner's focus stays on the photo`: a focus with `x: 1.2` fails at `['about', 'banner', 'focus', 'x']`.
- [ ] **Step 3:** `npm test`. Expected: FAIL.
- [ ] **Step 4:** Implement, writing the data through the schemas' `parse`. Run `npx tsc --noEmit`, `npm test` and `npm run check:content`. Expected: PASS, `content: 13 documents valid`.
- [ ] **Step 5: Prove nothing changed.** Rebuild, capture, and compare. Expected: all 45 routes identical in text, images and links.
- [ ] **Step 6:** Commit: `refactor(content): banners and sharing images live with each page's words`.

### Task 3: The static head follows the Home page's search words

**Files:**
- Create: `scripts/home-head.mjs`, `tests/scripts/home-head.test.ts`
- Modify: `vite.config.ts`, `index.html` (only the comment beside the tags)

**Interfaces:**
- Produces:
  - **`homeHead(html: string, home: { title: string; description: string; image?: string }, siteUrl: string): string`** in `scripts/home-head.mjs`.
    - It replaces the `<title>` text and the `description` meta's `content`.
    - It adds `og:title`, `og:description`, `og:image` and `twitter:card` (`summary_large_image`) meta tags before `</head>`.
    - The image is `home.image ?? '/assets/client/banner-fragrances.webp'`, made absolute with `siteUrl`.
    - Every value is HTML-escaped (`&`, `<`, `>` and `"`).
  - **`vite.config.ts`** adds a plugin whose `transformIndexHtml` calls `homeHead` with `pages.json`'s `home.seo`. The site URL comes from `process.env.SITE_URL`, defaulting to `https://legendary.com.my`.
- [ ] **Step 1: Write the failing test**, `the static head carries the Home page's search words`:
  - Given today's `index.html` and `{ title: 'Legendary & Co', description: 'A "new" line', image: undefined }`:
    - The output has `<title>Legendary &amp; Co</title>`.
    - The description content is `A &quot;new&quot; line`.
    - `og:image` is `https://legendary.com.my/assets/client/banner-fragrances.webp`.
    - The old description (`A Scented Memory of Malaysia. A heritage`) is gone.
- [ ] **Step 2:** `npx vitest run tests/scripts/home-head.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4:** Run `npm test`, then `npm run build`. Expected: PASS. `dist/index.html`'s title is `Legendary · A Scented Memory of Malaysia`, and its description is the Home page's.
- [ ] **Step 5:** Commit: `feat(seo): the static head follows the Home page's search words`.

### Task 4: Banner and sharing image fields in the dashboard

**Files:**
- Create: `src/admin/BannerField.tsx`
- Modify: `src/admin/pages.ts`, `src/admin/PagesEditor.tsx`, `src/admin/CollectionsEditor.tsx`
- Test: `src/admin/pages.test.ts`

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces:
  - **`BannerField({ label, value, onChange, disabled, optional? })`.** It takes and gives `BannerEntry | undefined`.
    - **The photo.** It is a `PhotoField` of kind `banner`. A new photo sets `image` and `phone`, and clears `focus`.
    - **The focus point.**
      - The wide print is shown with a gold dot at the focus (the centre when unset). Clicking sets `focus` to the click, rounded to two places.
      - **Centre** clears it.
      - Two framing previews show what a laptop title bar (3.5:1) and a phone one (1:1) would show, through `object-position`.
    - **Remove photo** is offered only when `optional` is set; it gives `undefined`.
    - **Hints:**
      - On the field: `Click the photo where the bottle is: phones and wide screens keep that spot in view.`
      - Under the previews: `A wide screen` and `A phone`.
  - **`pages.ts`:**
    - `FieldKind` gains `banner` and `share`.
    - `PageField` gains `optional?: boolean`.
    - **Banner fields.** A `Banner` field goes at the end of each Title bar section: about, stores, contact, faq and journal. Policies gets a `Banner` section, and the Shop's title bar gets five banner fields named after the views.
    - **Sharing image fields.** Every Search engines section gains a `Sharing image` field (`share`, optional) with the hint `Shown when the page is shared. Left empty, the page shares its banner.` Home's says `...the house's default picture.`
  - **`PagesEditor`** draws `banner` with `BannerField`, and `share` with `PhotoField` kind `share` (removing it gives `undefined`).
  - **`CollectionsEditor`.** Each collection gains `Shop banner` (`BannerField`, optional), with the hint `Behind its title in the shop. Left empty, the shop's own banner shows.`
- [ ] **Step 1: Write the failing test.** In `pages.test.ts`, update `every word on the pages has a field, and every field a word`:
  - A banner object counts as one leaf.
  - An `optional` field may have no leaf.
  - Every leaf must have a field, and every field that is not optional must have a leaf.

  Then run it. Expected: FAIL, since the banners have no fields yet.
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** Run `npm test` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 4: Check it in the browser** on the isolated stack:
  - **A new banner.** Our Story's title bar shows its banner. Uploading a 3000×1500 photo shows both prints.
  - **The focus.** Clicking the right third sets the focus near `x: 0.8`. Preview `/about`, in a 390 px wide window, uses `object-position` near `80%`.
  - **A collection.** Its banner field shows today's banner.
  - **Discarding.** Discard returns everything.

  Review the screenshots.
- [ ] **Step 5:** Commit: `feat(dashboard): banners with a focus point, and sharing images`.

### Task 5: End to end and docs

**Files:**
- Modify: `scripts/dashboard-e2e.mjs`, `README.md`

- [ ] **Step 1:** Bring up a fresh isolated stack.
- [ ] **Step 2: Extend the e2e.** Keep checks 1 to 28, and add:
  29. **A new banner.**
      - Upload a new banner for Our Story and set its focus near the right edge, then publish to Live.
      - The fake's `pages.json` has `about.banner` with two `/assets/cms/` prints and a focus `x` above 0.7, and the fake holds both files.
      - The wide print is 2400 px wide.
  30. **A sharing image.** Give the Stores page one. Preview `/stores`'s `og:image` meta ends with its file.

  Expected: every check passes.
- [ ] **Step 3: Build like production.** Expected: `npm run build` passes with `content: 13 documents valid` and 10 functions, and `npm test` passes.
- [ ] **Step 4: Document it.** The README covers:
  - banners as two prints and a focus
  - sharing images and their fallback
  - the static head following Home's search words
  - per-route heads not being prerendered
- [ ] **Step 5:** Commit: `feat(dashboard): stage 4c end to end checks and docs`. Do not push.
