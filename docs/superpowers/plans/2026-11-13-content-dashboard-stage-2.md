# Content dashboard, stage 2 (Journal) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Legendary team can write a new journal article, edit or remove the existing
ones, give them photos, preview them on the real pages and publish them from `/admin`. Two
fixes from the stage 1 review come first.

**Architecture:**
- **Fixes first.** Every object schema keeps keys it does not know, so a field a developer
  adds by hand survives the next dashboard publish. A GitHub 403 or rate limit gets its own
  message instead of "renew the token", and GitHub's reason is logged.
- **Where the articles live.** The five articles move from `src/data/articles.ts` into one
  document, `src/content/journal.json` (key `journal`, label `Journal`). A new
  `JournalDocSchema` covers the 13 block types the articles use. Dates are stored as
  `published` (ISO) and reading time as `minutes`. The page text ("22 October 2026",
  "3 min") is made from them at render, so nothing visible changes.
- **Reuse.** Stage 1's drafts, preview, publish, history, restore and photo library carry
  the journal as they are; adding the key to the registry is all they need. Photos use a
  new slot kind, `journal` (1600 px).
- **The dashboard.** A Journal tab lists the articles and opens one into an editor whose
  body is built from blocks.

**Tech Stack:** As stage 1 (Vite 5.4, React 18, TypeScript, Tailwind, zustand, zod 3,
sharp, vitest, playwright-core). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-12-content-dashboard-design.md`. This plan covers
stage 2 of its "Order of work", the **Journal** entry under "Screens", and the "Journal
photo" row of the slot table. It builds on
`docs/superpowers/plans/2026-11-12-content-dashboard-stage-1.md`, which shipped on 13 Nov
2026. Of the stage 1 review's deferred minors, this plan fixes three:
- 401 and 403 showing the same message
- unknown keys being dropped on publish
- the Overview banner's line about Photos

## Global Constraints

- **Every Global Constraint of the stage 1 plan still applies.** The key ones:
  - **Functions.** Relative imports in `api/` carry `.js` extensions, and
    `npm run check:functions` must pass. There is no test file under `api/`: API tests
    live in `tests/api/`, and site tests sit beside their source.
  - **No new function files.** 10 functions, as now.
  - **Read content at render time.** Components and helpers read content when they render,
    never into a value computed when a module loads.
  - **File format.** Content JSON is written as `JSON.stringify(data, null, 2) + '\n'`, with
    LF line endings.
  - **Production is off limits.** The local `.env` is production. Tests and local runs use
    an isolated Postgres, the fake GitHub and `RESEND_API_KEY=" "`.
  - **Where to deploy.** The target is `23f3000111/legendary-perfume-v2`, branch `main`. Push
    only with the user's go-ahead, and never to the `origin` remote.
  - **Copy.** No em or en dash in visible copy, dashboard copy included. Article addresses
    (slugs) use lowercase letters and digits only.
  - **Style and bundle.** The dashboard keeps its existing style (`src/admin/styles.ts`).
    Editors and zod stay in the lazy dashboard chunk.
- **Unknown keys are kept.** Every `z.object` in `api/_lib/content/schema.ts` is
  `.passthrough()`. Where a schema also has `.superRefine`, `.passthrough()` comes before
  it.
- **Schemas list keys in file order.** zod writes an object's keys in the order its schema
  declares them, and publish writes zod's output. So each schema declares its keys in the
  order the JSON file has them, or the first dashboard publish rewrites the whole file.
- **Image paths in content are root paths** (`/assets/client/x.webp`,
  `/Journal_Images/x.webp`, `/assets/cms/<h>.webp`). The component that draws an image
  calls `asset()` on it once, at render: `Prose` does this for image blocks. `Seo` takes the
  root path as it is.
- **Optional fields stay optional.** An optional field the team empties is left out of the
  saved data rather than saved as `''`. This covers `cardTitle`, `cardImage`, `caption`,
  `cite` and `narrow`. A required photo (`hero`, an image block's `src`) that is removed
  becomes `''`, which the schema reports as `Choose a photo.`.
- **Test seed.** `tests/api/content.test.ts` seeds one file per document in `DOC_KEYS`.

## Review Focus

1. **A published article's address changes.** Old links and search results would 404. The
   slug follows the title only while the article has never been published. Test: Task 5
   `retitle keeps a published address`.
2. **Every article deleted, or one left without a header photo or its description.** The
   Journal page crashes on an empty list (`const [feature] = ...`). Publish must be blocked
   with the reason. Tests: Task 2 `the journal keeps at least one article` and
   `an article needs a header photo with a description`.
3. **A link typed without its leading slash** (`[Orchid](product/orchid)`). It renders as a
   relative link that breaks on every article page, so it must be blocked at the field.
   Test: Task 2 `a link needs an address the site can follow`.
4. **A developer adds a field to a content file by hand.** The next dashboard publish must
   keep it. Test: Task 1 `publish keeps fields the dashboard does not know`.
5. **Previewing a new article that was never published.** `/journal/<slug>?preview` must
   show it, and the Journal page must list it first. Test: Task 3
   `a draft applied to the registry is what the journal reads`.

---

### Task 1: Keep unknown fields, and tell a read-only token from an expired one

**Files:**
- Modify:
  - `api/_lib/content/schema.ts`: `.passthrough()` on every object
  - `api/admin/content.ts`: the GitHub error messages, and logging
  - `scripts/fake-github.mjs`: `onRequest` may answer a request itself
- Test: `tests/api/content-schema.test.ts`, `tests/api/content.test.ts`

**Interfaces:**
- Produces:
  - **The schemas keep unknown keys.** `safeParse(x).data` keeps keys the schema does not
    know, at every depth. Publish and restore write that output.
  - **GitHub errors become 502s.** In `content.ts`, every `GitHubError` is logged first with
    `console.error('[content] GitHub answered', err.status, err.message)`. It then answers
    502:

    | GitHub answered | Message |
    | --- | --- |
    | 401 | `GitHub refused the publishing token. Ask the developer to renew it.` (unchanged) |
    | 429, or 403 whose message matches `/rate limit/i` | `GitHub is busy right now. Please try again in a few minutes.` |
    | any other 403 | `The publishing token can read the site but not change it. Ask the developer to give it Contents: Read and write.` |
    | anything else | unchanged |

  - **The fake can answer.** `fake.onRequest(fn)`: when `fn(method, route)` returns
    `[status, body]`, the fake sends that response and does not route the request.

- [ ] **Step 1: Write the failing tests**
  - `content-schema.test.ts`, `keeps keys it does not know`:
    - `FaqDocSchema.parse({ ...faq(), note: 'x' }).note` is `'x'`.
    - An item `{ q, a, source: 'sheet' }` keeps `source` at `sections[0].items[0].source`.
    - A store with `extra: 1` keeps it.
  - `content.test.ts`, `publish keeps fields the dashboard does not know`:
    - Commit to the fake a `faq.json` with `"note": "kept"` at the top level and on the
      first item. `publish refuses a stale base` changes the fake the same way.
    - Save a draft built from the state's `published` copy with one answer changed, and
      publish it.
    - The committed `faq.json` still has both keys.
  - `content.test.ts`, `a GitHub 403 says the token cannot change the site`:
    - Set `fake.onRequest((m, r) => m === 'POST' && r === 'git/blobs' ? [403, { message: 'Resource not accessible by personal access token' }] : undefined)`.
    - Spy on `console.error`, then publish.
    - The publish answers 502 with the 403 message from the table, and the draft still
      exists.
    - The spy was called with `'[content] GitHub answered', 403, 'Resource not accessible by personal access token'`.
  - `content.test.ts`, `a GitHub rate limit asks to try again later`: the same setup, with
    the message `API rate limit exceeded for user ID 1.`. The publish answers 502 with the
    busy message.
- [ ] **Step 2:** `npm test`. Expected: the four new tests FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4:** Run `npm test`, `npx tsc --noEmit` and `npm run check:functions`.
  Expected: all PASS, and 10 functions load. `.passthrough()` widens the inferred types
  with an index signature, so fix any fallout that tsc reports.
- [ ] **Step 5:** Commit: `fix(content): keep unknown fields, and tell a read-only token from an expired one`.

### Task 2: The journal's schema and photo slot

**Files:**
- Modify: `api/_lib/content/schema.ts`, `api/_lib/content/slots.ts`
- Test: `tests/api/content-schema.test.ts`

**Interfaces:**
- Consumes: the `text`, `optionalText` and `SITE_PHOTO` helpers already in `schema.ts`.
- Produces:
  - **`schema.ts`:**
    - `SITE_PHOTO` widens to `/^\/(assets|Journal_Images)\/[\w./-]+\.(webp|jpg|png)$/`.
      The older article photos live in `public/Journal_Images/`.
    - `BlockSchema`: a `z.discriminatedUnion('t', ...)` of the 13 block types below.
    - `ArticleSchema` and `JournalDocSchema = { articles: Article[] }`.
    - Types `JournalDoc`, `JournalArticle` (`JournalDoc['articles'][number]`) and
      `JournalBlock` (`z.infer<typeof BlockSchema>`). Each block type stays assignable to
      `Block` in `src/components/ui/Prose.tsx`.
  - **`slots.ts`:** `journal: { label: 'Journal photo', maxSide: 1600, alpha: false }`.

`rich(max)` is `text(max)` plus one rule on links. Every `[label](target)` in the text needs
a target matching `/^(\/|#|https?:\/\/|mailto:|tel:)\S*$/`. Otherwise the message is
`A link needs an address starting with / or https://.`. `optionalRich(max)` is the same
check on `optionalText(max)`.

**Article fields:**

| Field | Rule |
| --- | --- |
| `slug` | `/^[a-z0-9]{1,40}$/`, message `Use lowercase letters and numbers only.` Unique: `Another article already uses this address.`, at the later article |
| `title` | `text(140)` |
| `cardTitle` | `text(80)`, optional |
| `category` | `text(40)` |
| `published` | `YYYY-MM-DD` and a real calendar day, otherwise `Choose a date.` |
| `minutes` | whole number 1 to 60, otherwise `Between 1 and 60 minutes.` |
| `excerpt` | `text(400)` |
| `hero` | `SITE_PHOTO`, otherwise `Choose a photo.` |
| `heroAlt` | `text(300)` |
| `cardImage` | `SITE_PHOTO`, optional |
| `body` | at least one block: `Write at least one paragraph.` |

`articles` needs at least one article: `Keep at least one article.`.

**Blocks:**

| `t` | Fields |
| --- | --- |
| `p`, `lead`, `tip` | `text: rich(3000)` |
| `h2`, `h3` | `text: text(160)` |
| `ul`, `ol`, `refs` | `items`: at least one (`Add at least one line.`), each `rich(1000)` |
| `quote` | `text: rich(1000)`, `cite?: optionalText(200)` |
| `image` | `src: SITE_PHOTO` (`Choose a photo.`), `alt: text(300)`, `caption?: optionalText(300)`, `narrow?: boolean` |
| `table` | `head`: 1 to 6 cells (`Add at least one column.` / `Up to six columns.`), each `text(80)`. `rows`: 1 to 50 (`Add at least one row.` / `Up to fifty rows.`). Each row has exactly `head.length` cells (`Every row needs a cell for each column.`, at the row). Each cell is `optionalRich(600)` |
| `cta` | `label: text(60)`; `to` matches `/^\/\S*$/`, otherwise `Use an address on this site, starting with /.` |
| `faq` | `items`: 1 to 30 (`Add at least one question.`), each `{ q: text(200), a: rich(2000) }` |

`duo` is left out on purpose: no article uses it, and the dashboard publishes only what it
can edit.

- [ ] **Step 1: Write the failing tests**, with fixtures `article(over)` and `journal(...articles)`:
  - `accepts a minimal article`.
  - `the journal keeps at least one article`: `{ articles: [] }` fails at `['articles']`.
  - `an article needs a header photo with a description`: `hero: ''` fails at
    `['articles', 0, 'hero']`, and `heroAlt: '  '` fails at `['articles', 0, 'heroAlt']`.
  - `an article address has letters and numbers only, and is its own`: `slug: 'eleven-years'`
    fails at `['articles', 0, 'slug']`. Two articles with slug `nyonya` fail at
    `['articles', 1, 'slug']`.
  - `an article date must be a real day`: `2026-02-30` fails at `['articles', 0, 'published']`.
  - `a link needs an address the site can follow`: a `p` of `See [Orchid](product/orchid).`
    fails at `['articles', 0, 'body', 0, 'text']`. `/product/orchid` and
    `https://example.com` pass.
  - `every table row has a cell for each column`: `head` of two cells with rows
    `[['a', 'b'], ['c']]` fails at `['articles', 0, 'body', 0, 'rows', 1]`.
  - `a button goes to a page on this site`: `to: 'https://example.com'` fails at
    `['articles', 0, 'body', 0, 'to']`.
  - `a photo block needs a description`: `alt: ''` fails at `['articles', 0, 'body', 0, 'alt']`.
  - `an older journal photo path is accepted`: `hero: '/Journal_Images/gift-guide-orchid.webp'` passes.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4:** Run `npm test` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(content): the journal's schema and photo slot`.

### Task 3: Move the articles into JSON, nothing visible changed

**Files:**
- Create: `src/content/journal.json`
- Modify:
  - `api/_lib/content/keys.ts`, `api/_lib/content/docs.ts`, `src/content/registry.ts`
  - `src/data/articles.ts`
  - `src/pages/Journal.tsx`, `src/pages/Article.tsx`, `src/components/ui/Prose.tsx`
  - `scripts/build-seo.mjs`
  - `tests/api/content.test.ts`: add a minimal valid `journal.json` to the seed
- Test: `src/content/content.test.ts`, `src/content/preview.test.ts`

**Interfaces:**
- Consumes: `JournalDocSchema` and the `JournalDoc` and `JournalArticle` types (Task 2).
- Produces:
  - **The registry.** `DOC_KEYS = ['faq', 'stores', 'journal']`, and `DOCS.journal` is
    `{ path: 'src/content/journal.json', label: 'Journal', schema: JournalDocSchema }`.
    `CONTENT.journal` is the imported JSON object.
  - **`src/data/articles.ts`:**
    - `journal: JournalDoc` is the imported JSON object itself.
    - `type Article = JournalArticle & { date: string; readTime: string }`.
    - `formatDate(iso: string): string` gives `22 October 2026` for `2026-10-22`, with no
      leading zero on the day. It works from the digits alone, with no `Date` and no locale.
    - `articleList(): Article[]` is newest first by `published`; equal dates keep file
      order. `readTime` is `` `${minutes} min` ``.
    - `getArticle(slug)` and `articleNeighbours(slug)` are as today, read from
      `articleList()`.
    - Everything reads `journal.articles` when called. The module's header comment carries
      over, and says the notes on each article's origin are in this file's git history.
  - **Consumers.**
    - Journal and Article use `articleList()` and `getArticle()`, and wrap `hero` and
      `cardImage` in `asset()` for `<img>` and `PageHeader`.
    - `Seo` gets the root path.
    - Prose's image block renders `asset(b.src)`; the policy pages have no image blocks.
    - `build-seo.mjs` reads `articleList()`.
  - **`journal.json` format.** `{ "articles": [...] }`, in today's order (newest first).
    - Each article's keys come in this order: `slug`, `title`, `cardTitle?`, `category`,
      `published`, `minutes`, `excerpt`, `hero`, `cardImage?`, `heroAlt`, `body`.
    - `date` is dropped, because `formatDate(published)` reproduces it.
    - `readTime: 'N min'` becomes `minutes: N`.

- [ ] **Step 1: Record the before state.**
  - Build in PowerShell (Git Bash turns `/` into a Windows path):
    `$env:VITE_BASE = "/"; npm run build`.
  - Run `npx vite preview --port 4230`.
  - Run `node scripts/parity.mjs http://localhost:4230 .parity-before.json`.
- [ ] **Step 2: Generate `journal.json` from today's module.** Use a throwaway esbuild
  bundle of `src/data/articles.ts` with `lib/asset` stubbed to identity, as
  `scripts/build-seo.mjs` does. Before dropping `date`, the script asserts that every
  `date` equals `formatDate(published)`. It is not committed.
- [ ] **Step 3: Write the failing tests**
  - `content.test.ts`:
    - `the published journal passes its schema`.
    - `each content file is exactly what a publish would write`: for every `DOCS` entry,
      `JSON.stringify(schema.parse(file), null, 2) + '\n'` equals the file's text byte for
      byte. This pins the key order rule in Global Constraints.
    - The identity test also expects `journal` to be the JSON object (`toBe`).
    - `formatDate writes the date the way the pages show it`: `2026-10-22` gives
      `22 October 2026`, and `2025-01-05` gives `5 January 2025`.
    - `articles run newest first, with the date and reading time the pages show`: the slugs
      are `['elevenyears', 'nyonya', 'alcoholfree', 'gifting', 'longevity']`, and the first
      article's `date` is `22 October 2026` and its `readTime` is `3 min`.
  - `preview.test.ts`, `a draft applied to the registry is what the journal reads`:
    - Apply a journal draft that adds `{ slug: 'newpiece', published: '2027-01-01', ... }`.
    - `getArticle('newpiece')` is defined, and `articleList()[0].slug` is `newpiece`.
    - Restore the registry afterwards, as the FAQ test there does.
- [ ] **Step 4:** `npm test`. Expected: FAIL.
- [ ] **Step 5:** Implement as above.
  - Run `npx tsc --noEmit` and `npm test`.
  - Run `npm run check:content`. Expected: all pass, and the last prints
    `content: 3 documents valid`.
- [ ] **Step 6: Prove nothing changed.**
  - Stop the preview server: the node process whose command line matches
    `*preview --port*`.
  - Rebuild as in Step 1, start the preview, and run
    `node scripts/parity.mjs http://localhost:4230 .parity-after.json`.
  - Run `node scripts/parity.mjs --compare .parity-before.json .parity-after.json`.
    Expected: every route identical, with `/journal` and all five articles among them.
- [ ] **Step 7:** Commit: `refactor(content): the journal lives in src/content JSON`.

### Task 4: The article body editor

**Files:**
- Create: `src/admin/blocks.ts`, `src/admin/blocks.test.ts`, `src/admin/BlocksEditor.tsx`, `src/admin/TableField.tsx`

**Interfaces:**
- Consumes:
  - `JournalBlock` (Task 2), `SLOT_KINDS.journal` (Task 2)
  - `TextField`, `TextArea`, `LinesField`, `ListEditor` (`fields.tsx`), `PhotoField`
  - `replaceLongDashes` and `hasLongDash` (`text.ts`)
- Produces:
  - **`blocks.ts`:**
    - `BLOCK_LABELS: Record<JournalBlock['t'], string>`, in this menu order:
      - `p` Paragraph, `lead` Opening paragraph, `h2` Heading, `h3` Subheading
      - `ul` Bulleted list, `ol` Numbered list, `quote` Quote, `tip` Tip
      - `image` Photo, `table` Table, `cta` Button, `faq` Questions and answers, `refs` References
    - `blankBlock(t): JournalBlock`:
      - text blocks get `text: ''`, and lists get `items: []`
      - `image` is `{ t: 'image', src: '', alt: '' }`
      - `table` is `{ t: 'table', head: ['', ''], rows: [['', '']] }`
      - `cta` is `{ t: 'cta', label: '', to: '' }`
      - `faq` is `{ t: 'faq', items: [{ q: '', a: '' }] }`
    - `insertAt<T>(list: T[], index: number, item: T): T[]` and
      `moveItem<T>(list: T[], from: number, to: number): T[]`, both returning new arrays.
    - `addColumn(table)` and `removeColumn(table)` act on the last column of the head and of
      every row. The result keeps 1 to 6 columns.
    - `estimateMinutes(blocks): number` is `max(1, ceil(words / 200))`.
      - Words are counted in what a reader reads: `text`, `items`, `head`, `rows`, `q`, `a`,
        `cite` and `caption`.
      - A link counts its label only.
  - **`BlocksEditor({ blocks, onChange, err, disabled })`**, where `err(path)` takes a path
    relative to the list, such as `'3.text'` or `'5.rows.1'`.
    - **Above the list:** the hint
      `Links: [words](/shop) or [words](https://example.com). Bold: **words**.`, and the
      error for the list itself (`err('')`).
    - **Each block** has a header with its label and **Move up**, **Move down**,
      **Add below** and **Remove** (with confirmation).
      - **Add below** shows the type menu inline and inserts at `index + 1`, so a long
        article never needs dozens of moves.
    - **Fields by type:**
      - `p`, `lead`, `tip`: TextArea "Text".
      - `h2`, `h3`: TextField "Heading".
      - Lists: LinesField "Lines".
      - `quote`: TextArea "Quote", and TextField "Who said it (optional)".
      - `image`:
        - PhotoField of kind `journal`, labelled "Photo".
        - TextField "Photo description".
        - TextField "Caption (optional)".
        - A checkbox, "Upright photo, shown narrower".
      - `table`: TableField.
      - `cta`: TextField "Button text", and TextField "Goes to" with the hint
        `An address on this site, such as /stores or /shop?collection=nyonya`.
      - `faq`: a `ListEditor` of a question and answer.
    - **At the foot:** a type `<select>` and **Add**, which appends a `blankBlock`.
  - **`TableField({ table, onChange, err, disabled })`:**
    - inputs for the column headings
    - rows through `ListEditor<string[]>` (`Add a row`)
    - **Add a column** (off at six) and **Remove last column** (off at one)
    - one dash note under the table when any cell has a long dash, with **Use commas**,
      which applies `replaceLongDashes` to every cell

- [ ] **Step 1: Write the failing tests** in `blocks.test.ts`:
  - `blankBlock gives each type the fields its form needs`:
    - Every `BLOCK_LABELS` key gives a block with that `t`.
    - `blankBlock('table')` and `blankBlock('image')` equal the values above.
  - `insertAt puts a block right after the one chosen`:
    `insertAt(['a', 'b', 'c'], 2, 'x')` is `['a', 'b', 'x', 'c']`.
  - `moveItem moves one place`.
  - `adding and removing a column keeps every row the same width`:
    - Start from head `['A', 'B']` and rows `[['1', '2'], ['3', '4']]`.
    - `addColumn` gives `['A', 'B', '']` and `[['1', '2', ''], ['3', '4', '']]`.
    - `removeColumn` goes back.
  - `estimateMinutes counts what a reader reads, at 200 words a minute`:
    - A 450-word `p` gives 3.
    - `[two words](/x)` counts 2.
    - An empty body gives 1.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `blocks.ts`, `BlocksEditor` and `TableField`.
- [ ] **Step 4:** Run `npm test` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(dashboard): the article body editor`.

### Task 5: The Journal tab

**Files:**
- Create: `src/admin/journal.ts`, `src/admin/journal.test.ts`, `src/admin/JournalEditor.tsx`
- Modify:
  - `src/admin/fields.tsx`: add `NumberField` and `DateField`
  - `src/pages/Admin.tsx`: the tab, `DOC_TABS`, and the Overview banner

**Interfaces:**
- Consumes:
  - `useContent` and `sameContent` (`contentStore.ts`)
  - `BlocksEditor` and `estimateMinutes` (Task 4)
  - `formatDate` and `JournalArticle` (Tasks 2 and 3)
  - `newId` (`text.ts`), `PhotoField`, `ContentGate`, `PublishBar`, `errorAt`
- Produces:
  - **`journal.ts`:**
    - `todayInKL(now = new Date()): string`: `YYYY-MM-DD` in `Asia/Kuala_Lumpur`.
    - `blankArticle(taken: Set<string>, today: string): JournalArticle`. Its slug is
      `newId('new article', taken)`, `published` is `today` and `minutes` is 1, the body is
      one empty `p`, and every text field and `hero` is `''`.
    - `retitle(article, title, publishedSlugs: Set<string>, taken: Set<string>): JournalArticle`.
      It sets the title. While `article.slug` is not in `publishedSlugs`, the slug becomes
      `newId(title || 'new article', taken)`; a published article keeps its slug.
    - `byDate(articles): { article: JournalArticle; index: number }[]`: newest first.
      `index` is the article's place in the document, which error paths and updates use.
    - `issueCount(errors: ContentIssue[], index: number): number`: the issues whose path
      is `articles.<index>` or starts with `articles.<index>.`.
  - **`fields.tsx`:**
    - `NumberField({ label, value, onChange, min, max, error, hint, disabled })`: an empty
      box gives `0`.
    - `DateField({ label, value, onChange, error, disabled })`: `<input type="date">`.
  - **`JournalEditor`:**
    - **The list:**
      - **New article** inserts a `blankArticle` at index 0 and opens it.
      - The rows come from `byDate`. Each shows its card title or title,
        `formatDate(published)` and the category.
      - A row can be tagged:
        - **New**: its slug is not in the published document.
        - **Changed**: it differs from its published version (`sameContent`).
        - **Needs attention**, in red: `issueCount > 0`.
      - Each row has **Edit** and **Remove**. Remove asks first:
        `Remove "<title>"? Its page stops working once you publish.`
      - The document's own error (`err('articles')`) shows above the list.
    - **One article,** below an **All articles** link back, in this order:
      - **Title**, through `retitle`. Under it, `Address: /journal/<slug>` and
        `Made from the title. It stays the same once the article is published.`
      - **Card title (optional)**. Past 50 characters it hints
        `Long card titles crowd the Journal page. Under 50 characters reads best.`
      - **Category** and **Date**.
      - **Reading time (minutes)**, with the hint `About N min at this length.` and a
        **Use N** button when N differs.
      - **Summary**, with the hint `Shown on the Journal page and under the title.`
      - **Header photo** (`PhotoField`, kind `journal`) and **Header photo description**.
      - **Journal page photo (optional)**, with the hint
        `Only when the header photo crops badly on the Journal page.`
      - **Article**, a `BlocksEditor` with
        `err = (p) => errorAt(doc.errors, p ? `articles.${index}.body.${p}` : `articles.${index}.body`)`.
    - `PublishBar docs={['journal']}`, with `previewPath` set to `/journal/<slug>` while an
      article is open and `/journal` otherwise.
  - **`Admin.tsx`:**
    - Tab `journal` labelled `Journal`, after Stores, and `DOC_TABS.journal = 'journal'`.
    - The Overview banner reads `Publishing is not set up yet, so the FAQ, Stores and
      Journal tabs cannot save.`, followed by the existing instruction. Uploads work without
      GitHub, so Photos is not named.

- [ ] **Step 1: Write the failing tests** in `journal.test.ts`:
  - `retitle makes the address from the title while the article is new`: an article with
    slug `newarticle`, retitled `Eleven Years: A Journey` with `nyonya` published and
    taken, gets `elevenyearsajourney`.
  - `retitle keeps a published address`: `nyonya` is published, so retitling it
    `A new name` keeps `nyonya`.
  - `retitle never takes another article's address`: with `gifting` taken, a new article
    retitled `Gifting` gets `gifting2`.
  - `byDate lists newest first and remembers where each article sits`: articles dated
    `2025-01-01` and `2026-01-01` give indexes `[1, 0]`.
  - `issueCount finds the problems inside one article`: paths `articles.1.title`,
    `articles.1.body.0.text` and `articles.10.title` give 2 for index 1.
  - `todayInKL is the date in Kuala Lumpur`: `new Date('2026-11-13T17:30:00Z')` gives
    `2026-11-14`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4: Check it in the browser.**
  - `npm test` and `npx tsc --noEmit` pass.
  - Start the isolated stack from stage 1's Task 9 Step 1, then sign in and open the
    Journal tab:
    - Open "Benefits of Alcohol-Free Perfumes", change a paragraph and wait for "Saved as a
      draft". **Preview** shows the change on `/journal/alcoholfree`, with the ribbon.
    - Make a **New article** with a title, an uploaded JPEG header photo and its
      description, a summary, a category and a paragraph. Use **Add below** to put a
      heading after the paragraph. **Preview** shows it at `/journal/<slug>`, and first on
      `/journal`.
    - Discard.
  - `npm run build`, then `rg -l "ZodError" dist/assets`. Expected: only the lazy dashboard
    chunk.
- [ ] **Step 5:** Commit: `feat(dashboard): the Journal tab`.

### Task 6: End to end, docs and release

**Files:**
- Modify: `scripts/dashboard-e2e.mjs`, `README.md` (the "Content dashboard" section)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1:** Bring up the isolated stack as in stage 1's Task 9 Step 1. None of its
  processes reads production values.
- [ ] **Step 2: Extend `scripts/dashboard-e2e.mjs`.** Stage 1's checks 1 to 10 stay. Add:
  11. On the Journal tab, change the first paragraph of "Benefits of Alcohol-Free
      Perfumes" and wait for "Saved".
  12. Preview `/journal/alcoholfree` shows the new paragraph with the ribbon.
  13. Create and publish a new article:
      - title `Testing the journal`
      - a 3000 px JPEG header photo made by sharp, with its description
      - a summary, a category and one paragraph
      - a heading added with **Add below**

      Publish, and it goes to Live. The fake's `journal.json` then has:
      - the article under slug `testingthejournal`
      - `body[1].t === 'h2'`
      - a `hero` under `/assets/cms/`

      The commit carries that photo (longest side 1600) and its master.
  14. History lists the Journal publish. **Restore Journal** to the seeded version makes a
      new commit whose `journal.json` equals the seed byte for byte.

  Expected: every check passes.
- [ ] **Step 3: Build like production.** `npm run build` passes in full: catalogue,
  `content: 3 documents valid`, tsc, 10 functions, the Vite build and the SEO files. The
  sitemap lists every article. `npm test` passes.
- [ ] **Step 4: Document it.** In the README's "Content dashboard" section:
  - The dashboard now covers the FAQ, the store list and the Journal.
  - Articles live in one document, `src/content/journal.json`.
  - An article's address is made from its title, and fixed once published.
  - Journal photos are 1600 px.
- [ ] **Step 5: Release.**
  - Commit `feat(dashboard): stage 2 end to end checks and docs`.
  - **Ask the user before pushing.** `git push v2 main` deploys the live shop.
  - After the push, wait for the "Vercel" status on the commit to be `success`.
- [ ] **Step 6: Verify on the live dashboard,** with the user signing in.
  - The Journal tab lists the five articles.
  - Change one paragraph of an article, publish it, see "Live", then restore the Journal
    from History. The site ends as it began.

  Report the two commit links.
