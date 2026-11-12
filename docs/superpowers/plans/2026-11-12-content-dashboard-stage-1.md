# Content dashboard, stage 1 (foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Legendary team can edit the FAQ and the store list in `/admin`, preview the
real pages with their drafts, publish (one GitHub commit that Vercel deploys in about a
minute), see the history, restore one document to an earlier version, and manage photos in a
library. All later stages build on these pieces.

**Architecture:**
- **Where content lives.** The FAQ and store data move from TypeScript into
  `src/content/*.json`, which the site imports at build time. Nothing visible changes.
- **Drafts and photos.** Drafts and unpublished photos live in Postgres (a file store
  locally). Two new admin functions, `api/admin/content.ts` and `api/admin/media.ts`, save
  drafts, process photos with sharp, and publish by writing one commit through the GitHub
  Git Data API.
- **Preview.** The site loads drafts before its first render when `?preview` is present,
  so preview is the real page.
- **The dashboard.** The new screens are lazy-loaded tabs of the existing dashboard.

**Tech Stack:**
- Vite 5.4 + React 18 + TypeScript + Tailwind, zustand.
- Vercel Node functions, Postgres (`pg`), the GitHub REST API.
- New: `zod` (schemas, shared by the site's dashboard and the functions), `sharp` (photos),
  `vitest` (tests), and `playwright-core` (driving installed Chrome for page comparisons).

**Spec:** `docs/superpowers/specs/2026-11-12-content-dashboard-design.md`. This plan covers
the spec's stage 1. Stages 2 to 5 (Journal, Products, Pages, Hero) get their own plans once
this ships. Each stage also moves its own content to JSON, so this stage moves only the FAQ
and the stores.

## Global Constraints

- Functions in `api/` are transpiled per file by Vercel: relative imports carry `.js`
  extensions, and `npm run check:functions` must pass. `check:functions` only transpiles
  `api/`, so anything a function imports must live under `api/` (shared code goes in
  `api/_lib/content/`, and the site imports it from there).
- Exactly two new function files: `api/admin/content.ts` and `api/admin/media.ts` (8 today,
  10 after; Hobby caps a deployment at 12).
- No test file anywhere under `api/`. Vercel deploys every file in `api/` outside `_` folders
  as a function, and `check:functions` would try to load it. API tests live in `tests/api/`.
  Site tests sit beside their source in `src/`.
- No request or response body over 4.5 MB. Uploads are kept under 3,800,000 bytes.
- `/assets/` is served `immutable` for a year: every dashboard photo is named by the SHA-256
  of its bytes (first 20 hex characters), so a new photo never reuses a name.
- Deploy target is GitHub `23f3000111/legendary-perfume-v2`, branch `main`. Never write to the
  `origin` remote.
- The local `.env` is production. Tests and local runs use an isolated Postgres
  (`embedded-postgres`, as in the memory note `local-env-is-production`), the fake GitHub
  from Task 4, and `RESEND_API_KEY=" "`. Never the production database or repository.
- Schema changes are additive (`CREATE TABLE IF NOT EXISTS`), in both `api/_lib/db.ts` and
  `scripts/db-check.mjs`.
- No em or en dash in visible copy. Ids the dashboard creates contain no dash.
- Content JSON is written as `JSON.stringify(data, null, 2) + '\n'`, LF line endings.
- **Read content at render time.** Components and helpers read content when they render,
  never into a value computed when a module loads. Preview replaces the content objects
  before the first render and relies on this.
- **Dashboard style.** The dashboard keeps its existing dense, quiet style (`src/pages/Admin.tsx`).
  The public bundle must not grow by the editors or by zod: they load with the lazy
  dashboard route.

## Review Focus

1. **Two tabs or a developer edit, then Publish.** The publish must stop with a conflict
   naming the document, never overwrite. Test: Task 5 `publish refuses a stale base`.
2. **An 8000 px transparent PNG, or a HEIC photo, dropped in.** The PNG uploads under the
   limit with its transparency. The HEIC is refused with "save it as JPEG or PNG". Tests:
   Task 6 `refuses a file that is not JPEG, PNG or WebP`; Task 8b `shrink loop always ends
   under the byte limit`.
3. **The session expires mid-edit** (8 hour cookie). The edits stay on screen and say "sign
   in again", nothing lost. Test: Task 8a `a 401 on autosave keeps the edits`.
4. **Publishing before GitHub is set up, or with a revoked token.** A plain message, and the
   drafts are kept. Tests: Task 5 `publishing is refused when GitHub is not configured` and
   `a GitHub 401 keeps the drafts`.
5. **Deleting every store, or leaving a name empty.** Publish is blocked with the reason.
   The Stores page would crash on an empty list. Test: Task 1 `stores need at least one
   store and every field filled`.

---

### Task 1: Content schemas and the document registry

**Files:**
- Modify: `package.json` (add `zod`; devDependency `vitest`; script `"test": "vitest run"`)
- Create: `api/_lib/content/keys.ts`, `api/_lib/content/schema.ts`, `api/_lib/content/docs.ts`, `api/_lib/content/slots.ts`
- Test: `tests/api/content-schema.test.ts`

**Interfaces:**
- Produces:
  - `keys.ts` (no imports, so the public site can use it without pulling in zod):
    `DOC_KEYS = ['faq', 'stores'] as const`, `type DocKey`, `isDocKey(v: unknown): v is DocKey`.
  - `schema.ts`:
    - `FaqDocSchema`, `StoresDocSchema` (zod), with the inferred types `FaqDoc` and
      `StoresDoc`.
    - `findDashes(value: unknown): string[]`: dotted paths of strings that contain U+2014
      or U+2013.
    - `mediaRefs(value: unknown): string[]`: every string starting `/assets/cms/`, without
      duplicates.
  - `docs.ts`: `DOCS: Record<DocKey, { path: string; label: string; schema: ZodType }>`. FAQ
    is at `src/content/faq.json`, labelled `FAQ`. Stores is at `src/content/stores.json`,
    labelled `Stores`.
  - `slots.ts` (no imports): `SLOT_KINDS = { store: { label: 'Store photo', maxSide: 900,
    alpha: false } } as const` and `type SlotKind`.

Schema rules:

- **FaqDoc** is `{ intro, sections, product }`.
  - `intro`: 1 to 600 characters.
  - `sections`: at least one, each `{ title, items }`.
    - `title`: 1 to 80 characters.
    - `items`: at least one FaqItem.
  - `product`: at least one FaqItem.
- **FaqItem** is `{ q, a, list? }`.
  - `q`: 1 to 200 characters. `a`: 1 to 2000.
  - `list`: optional, each entry 1 to 300 characters.
- **StoresDoc** is `{ regions, stores }`.
  - `regions`: 1 to 12 unique names, 1 to 40 characters each. `All` is not stored here; the
    page adds it.
  - `stores`: at least one Store.
  - Every store's `region` must be one of `regions`.
- **Store fields**:

  | Field | Rule |
  | --- | --- |
  | `id` | `/^[a-z0-9-]{1,40}$/`, unique |
  | `name` | 1 to 80 characters |
  | `region` | one of `regions` |
  | `address` | 1 to 300 characters |
  | `phone` | 0 to 40 characters |
  | `hours` | 0 to 5 lines, each 1 to 80 characters |
  | `mapQuery` | 1 to 200 characters |
  | `image` | optional, a path matching `/^\/assets\/[\w./-]+\.(webp|jpg|png)$/` |

- Every string is trimmed before it is checked.

- [ ] **Step 1: Write the failing tests** in `tests/api/content-schema.test.ts`, each with a small inline fixture:
  - `accepts a minimal valid FAQ`.
  - `rejects an FAQ answer left empty`: `FaqDocSchema.safeParse(...)` fails, and the issue
    path is `['sections', 0, 'items', 0, 'a']`.
  - `stores need at least one store and every field filled`: an empty `stores` fails, and a
    store with `name: '  '` fails at `['stores', 0, 'name']`.
  - `a store's region must be listed`: an unlisted region fails at `['stores', 0, 'region']`.
  - `findDashes reports where a long dash is`: `findDashes({ a: ['ok', 'x — y'], b: 'p–q' })`
    equals `['a.1', 'b']`.
  - `mediaRefs lists dashboard photos once`: a value containing `/assets/cms/abc.webp`
    twice and `/assets/client/x.webp` returns `['/assets/cms/abc.webp']`.
- [ ] **Step 2:** `npm i zod && npm i -D vitest`, add the `test` script, run `npm test`. Expected: the tests FAIL, because the modules do not exist yet.
- [ ] **Step 3:** Implement the four files above.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(content): schemas and the document registry for the dashboard`.

### Task 2: Move the FAQ and the stores into JSON, nothing visible changed

**Files:**
- Create: `src/content/faq.json`, `src/content/stores.json`, `scripts/parity.mjs`,
  `scripts/check-content.mjs`, `src/content/content.test.ts`
- Modify:
  - `src/data/faq.ts`, `src/data/stores.ts`
  - `src/pages/Faq.tsx`, `src/pages/Contact.tsx`, `src/pages/Product.tsx`,
    `src/pages/Stores.tsx`, `src/data/places.ts`
  - `package.json`:
    - devDependency `playwright-core`
    - scripts `"parity": "node scripts/parity.mjs"` and
      `"check:content": "node scripts/check-content.mjs"`
    - `build` runs `npm run check:content` straight after `npm run catalogue`

**Interfaces:**
- Consumes: `FaqDocSchema`, `StoresDocSchema` (Task 1).
- Produces:
  - `src/data/faq.ts` exports `faq: FaqDoc`, the imported JSON object itself, and keeps the
    `FaqItem` and `FaqSection` types. `faqSections`, `faqIntro`, `productFaq` and the unused
    `houseFaq` go; consumers read `faq.sections`, `faq.intro` and `faq.product` at render.
  - `src/data/stores.ts` exports `storesDoc: StoresDoc`, the JSON object itself. It keeps
    `HEAD_OFFICE`, `mapEmbedUrl`, `directionsUrl` and the `Store` type; `stores` and
    `regions` go.
    - The Stores page renders `['All', ...storesDoc.regions]`.
    - `places.ts` looks stores up in `storesDoc.stores` inside `placeTarget`.
    - Store `image` values in the JSON are root paths such as `/assets/store-kiosk.webp`.
      Components call `asset(store.image)` when they render.
  - `scripts/check-content.mjs [rootDir]` validates every `DOCS` file against its schema at
    build time, the spec's second line of defence. `rootDir` defaults to the repo root and
    exists so a broken copy can be checked. It bundles `api/_lib/content/docs.ts` with
    esbuild, as `build-catalogue.mjs` does with products.
    - On failure it prints each document, path and message, and exits 1, so Vercel keeps
      the previous deployment live.
    - On success it prints `content: 2 documents valid`.
  - `scripts/parity.mjs <baseUrl> <out.json>` visits every public route with the intro
    skipped (sessionStorage `legendary-intro` = `1`). It writes `{ route: { text, images } }`:
    `document.body.innerText` with whitespace collapsed, and the sorted `currentSrc` of every
    `img`. Routes: `/`, `/shop`, every `/product/<id>`, `/stores`, `/about`, `/journal`,
    every `/journal/<slug>`, `/contact`, `/faq`, `/shipping`, `/returns`, `/terms`,
    `/privacy`. It uses installed Chrome:
    `chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })`.

FAQ answers that build text from code today (`WHATSAPP_DISPLAY`, `SUPPORT_EMAIL`) are stored
with the resulting text written out, exactly as visitors see it now.

- [ ] **Step 1: Record the before state.**
  - Build at the current commit with PowerShell: `$env:VITE_BASE = "/"; npm run build`.
  - Run `npx vite preview --port 4230`.
  - Run `node scripts/parity.mjs http://localhost:4230 .parity-before.json`. The file is
    git-ignored; add `.parity-*.json` to `.gitignore`.
- [ ] **Step 2: Generate the two JSON files from today's modules** with a throwaway esbuild bundle (the technique in `scripts/build-catalogue.mjs`, with `lib/asset` stubbed to identity). Write them in the format from Global Constraints. Stores go into `{ regions, stores }` with `All` dropped.
- [ ] **Step 3: Write the failing test** `content.test.ts`: `the published FAQ and stores pass their schemas`. It parses both JSON files and expects `success === true`.
- [ ] **Step 4:** Change the data modules and their consumers as described above, and add `check-content.mjs`.
  - Run `npx tsc --noEmit`, `npm test` and `npm run check:content`. Expected: all pass, and
    the last prints `content: 2 documents valid`.
  - Blank one FAQ answer in a scratch copy and point the script at it: it exits 1 and names
    `faq sections.0.items.0.a`.
- [ ] **Step 5: Prove nothing changed.**
  - Stop the preview server: the node process whose command line matches `*preview --port*`.
  - Rebuild, start the preview, and run
    `node scripts/parity.mjs http://localhost:4230 .parity-after.json`.
  - Compare the two files. Expected: identical.
- [ ] **Step 6:** Commit: `refactor(content): the FAQ and stores live in src/content JSON`.

### Task 3: Draft and photo storage

**Files:**
- Create: `api/_lib/content/store.ts`, `tests/api/content-store.test.ts`
- Modify: `api/_lib/db.ts`, `scripts/db-check.mjs`

**Interfaces:**
- Consumes: `DocKey` and `SlotKind` (Task 1), `db()` (`api/_lib/db.ts`).
- Produces (`store.ts`):
  - **Types.**
    - `Draft { doc: DocKey; data: unknown; baseSha: string | null; updatedAt: string }`
    - `MediaRow { file: string; bytes: Buffer; width: number; height: number; kind: 'master' | SlotKind; source: string | null; published: boolean; createdAt: string }`
    - `file` is `m/<hash>.webp` for a master and `<hash>.webp` for a slot-sized copy.
  - **The `ContentStore` interface.**
    - `kind: 'postgres' | 'file'` and `durable: boolean`.
    - `drafts(): Promise<Draft[]>`
    - `saveDraft(doc, data, baseSha): Promise<Draft>`. The first save sets `baseSha`; later
      saves keep it.
    - `deleteDraft(doc): Promise<void>`
    - `putMedia(row: Omit<MediaRow, 'published' | 'createdAt'>): Promise<void>`. Saving the
      same file twice is harmless.
    - `getMedia(file): Promise<MediaRow | null>`
    - `listMedia(): Promise<Omit<MediaRow, 'bytes'>[]>`
    - `markPublished(files: string[]): Promise<void>`
    - `purgeStale(days: number): Promise<number>`. Deletes unpublished media older than
      `days`.
  - **`contentStore(): ContentStore`.** Postgres when `DATABASE_URL` is set. Otherwise a
    file store under `.data/content/`, which is git-ignored already. Same pattern as
    `overrideStore()`.
- Tables, added to the schema in `db.ts` and to `db-check.mjs`:
  - `content_drafts (doc text PRIMARY KEY, data jsonb NOT NULL, base_sha text, updated_at timestamptz NOT NULL DEFAULT now())`
  - `content_media (file text PRIMARY KEY, bytes bytea NOT NULL, width integer NOT NULL, height integer NOT NULL, kind text NOT NULL, source text, published boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now())`

- [ ] **Step 1: Write failing tests** against the file store, rooted in a temp dir with `process.chdir`:
  - `a second save keeps the first base`: save with base `a`, then with base `b`; the draft's
    `baseSha` is `a`.
  - `deleteDraft removes it`.
  - `putMedia twice keeps one row`.
  - `purgeStale removes only old unpublished media`: one old unpublished row, one old
    published row and one new unpublished row. It returns 1, and the other two remain.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement both stores. The Postgres one uses `INSERT … ON CONFLICT (doc) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`, leaving `base_sha` alone.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(content): draft and photo storage`.

### Task 4: GitHub client and a fake GitHub for local work

**Files:**
- Create: `api/_lib/github.ts`, `scripts/fake-github.mjs`, `tests/api/github.test.ts`

**Interfaces:**
- Produces (`github.ts`):
  - **Config.** `GitHubConfig { token; repo; branch; apiUrl }`.
    `githubConfig(): GitHubConfig | null` reads:
    - `GITHUB_TOKEN` and `GITHUB_REPO` (both required; `null` when either is missing)
    - `GITHUB_BRANCH` (default `main`)
    - `GITHUB_API_URL` (default `https://api.github.com`)
  - **Errors.**
    - `class GitHubError extends Error { status: number }`
    - `class StaleBranchError extends Error`: the branch moved while committing.
  - **Calls.**
    - `branchHead(cfg): Promise<{ commit: string; tree: string }>`
    - `readFile(cfg, path, ref?): Promise<{ sha: string; text: string } | null>`: the
      contents API; `sha` is the blob sha; `null` on 404.
    - `readBinary(cfg, path): Promise<Buffer | null>`: finds the tree entry at the branch
      head, then fetches it through the git blobs API (for files over 1 MB).
    - `listFiles(cfg, prefix): Promise<Set<string>>`: the recursive tree at the head,
      filtered by prefix.
    - `commitFiles(cfg, { message, files: { path: string; content: string | Buffer }[] }): Promise<string>`:
      1. blobs (utf-8 for strings, base64 for Buffers)
      2. a tree with `base_tree` set to the head tree
      3. a commit with the head as parent
      4. `PATCH` the ref with `force: false`

      A 422 from the ref update means `StaleBranchError`. Returns the new commit sha.
    - `fileHistory(cfg, path, limit = 30): Promise<{ sha; date; message }[]>`
    - `deployState(cfg, sha): Promise<'pending' | 'success' | 'failure' | 'none'>`: the
      commit status whose `context` is `Vercel`. Vercel posts this today; `error` reads as
      `failure`.
- Produces (`scripts/fake-github.mjs`):
  - `startFakeGitHub({ port, seedDir }): Promise<{ url; close(); files(): Map<string, Buffer>; setStatus(sha, state) }>`
    implements the endpoints `github.ts` calls, plus the `GET` lookups those calls need.
  - Seeded with `src/content/*.json` and the paths under `public/assets/`.
  - A new commit's status is `pending`, then `success` 1.5 s later.
  - Run directly (`node scripts/fake-github.mjs 4010`), it serves the working tree for local
    dashboard work.

- [ ] **Step 1: Write failing contract tests**, `github.ts` against `startFakeGitHub` on a free port:
  - `commitFiles then readFile returns the new text and a new sha`.
  - `a Buffer is committed byte for byte`: `files()` holds the same bytes.
  - `a moved branch raises StaleBranchError`. Commit through a second client between this
    client's head read and its ref update. The test injects the commit with a hook
    `startFakeGitHub` exposes as `onBeforeRefUpdate`.
  - `fileHistory lists newest first`.
  - `deployState reads Vercel's status`: `pending`, then `success`.
  - `a 401 becomes GitHubError with status 401`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `github.ts` (global `fetch`, `Authorization: Bearer`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`) and the fake.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(content): GitHub client and a fake GitHub for local work`.

### Task 5: The content API

**Files:**
- Create: `api/admin/content.ts`, `tests/api/content.test.ts`, `tests/api/http-doubles.ts`
  (request and response doubles for handler tests)

**Interfaces:**
- Consumes:
  - `requireAdmin`, `issueSession` (`api/_lib/auth.ts`)
  - `handler`, `json`, `HttpError` (`api/_lib/http.ts`)
  - Tasks 1, 3 and 4
- Produces these routes, all admin only (401 otherwise):

  | Request | Response |
  | --- | --- |
  | `GET ?action=state` | `{ configured: boolean; branch: string; durable: boolean; docs: Record<DocKey, { label; published; sha; draft; draftBase; errors; warnings }> }` |
  | `PUT ?action=draft` `{ doc, data }` | `{ draft, errors, warnings }` |
  | `DELETE ?action=draft&doc=` | `{ ok: true }` |
  | `GET ?action=preview` | `{ drafts: Partial<Record<DocKey, unknown>>; media: string[] }` |
  | `POST ?action=publish` `{ docs: DocKey[]; overwrite?: DocKey[] }` | 200 `{ commit }`; 400 `{ error, errors: Record<DocKey, issues> }`; 409 `{ error, conflicts: DocKey[] }` |
  | `GET ?action=history&doc=` | `{ commits: { sha, date, message, docs: DocKey[] }[] }`, newest first. Without `doc`, every document's `fileHistory` is merged by sha, so each commit lists the documents it changed |
  | `GET ?action=version&doc=&sha=` | `{ data }` |
  | `POST ?action=restore` `{ doc, sha }` | `{ commit }`, or 409 while that document has a draft |
  | `GET ?action=status&sha=` | `{ state }` |

  Field notes:
  - In `state`, `errors` are the zod issues as `{ path: string; message: string }` and
    `warnings` is the output of `findDashes`.
  - A draft is saved even when it does not pass the schema. The errors come back with the
    response, and they block Publish.
  - `preview`'s `media` lists the unpublished photos as `/assets/cms/...` paths.
  - `restore` uses the message `Dashboard: restore <Label> to <d MMMM yyyy>`.
  - Without GitHub configured, every action except `state` answers 503 with
    `Publishing is not set up yet. Add GITHUB_TOKEN and GITHUB_REPO in Vercel.`, and
    `state` answers `{ configured: false }`.

Publish does this:
1. Every listed document must have a draft and pass its schema.
2. Read each document's current blob sha. If it differs from the draft's `baseSha` and the
   document is not in `overwrite`, add it to `conflicts`, then answer 409.
3. Collect `mediaRefs` from the documents being published. Any file not already under
   `public/assets/cms/` in the repo is taken from the store, together with its `source`
   master (`public/assets/cms/m/...`) when the master is not in the repo either. A file the
   store does not have answers 400 with `A photo in <Label> is missing. Upload it again.`
4. Make one `commitFiles` call with the message `Dashboard: <labels joined with ", ">`.
   - The documents are written in the Global Constraints format.
   - On `StaleBranchError`, re-read the head and repeat the conflict check once.
5. Delete the drafts, mark the photos published, and return `{ commit }`.

A `GitHubError` 401 or 403 answers 502 with
`GitHub refused the publishing token. Ask the developer to renew it.`. Drafts are untouched.

- [ ] **Step 1: Write failing handler tests** against the file store (temp dir), with `startFakeGitHub` and `ADMIN_SESSION_SECRET` set:
  - `rejects a request without a session`: 401.
  - `state shows the published FAQ and no draft`.
  - `a draft with an empty answer saves and reports the error`.
  - `publish commits the FAQ and clears the draft`: the fake holds the new
    `src/content/faq.json` text, and the history has one commit `Dashboard: FAQ`.
  - `publish refuses a stale base`. Change `faq.json` in the fake after the draft. The
    publish answers 409 with `conflicts: ['faq']`. With `overwrite: ['faq']` it answers 200.
  - `publish carries a new photo and its master`. A stores draft refers to
    `/assets/cms/<h>.webp`. The commit contains that file and `public/assets/cms/m/<m>.webp`.
  - `publishing is refused when GitHub is not configured`: 503 with the message above.
  - `a GitHub 401 keeps the drafts`: 502, and the draft still exists.
  - `restore puts back one document`. After two publishes, restoring the first commit's
    FAQ makes a third commit whose `faq.json` equals the first version. `stores.json` is
    unchanged.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `content.ts`, using `requireMethod`-style checks per action.
- [ ] **Step 4:** `npm test` and `npm run check:functions`. Expected: PASS, with 9 functions loading.
- [ ] **Step 5:** Commit: `feat(content): drafts, preview, publish, history and restore API`.

### Task 6: Photo upload, processing and the library API

**Files:**
- Create: `api/admin/media.ts`, `tests/api/media.test.ts`, `api/_lib/content/images.ts`
- Modify:
  - `package.json` (add `sharp`)
  - `scripts/dev-api.mjs`: add `'sharp'` to `external`; pass a non-JSON, non-text body to
    `(req, res)` handlers as the raw `Buffer`, not as a utf-8 string
  - `api/webhook.ts`: move `nodeBody` to `api/_lib/http.ts` and import it from there

**Interfaces:**
- Consumes: Tasks 1, 3 and 4; `requireAdmin`.
- Produces (`images.ts`):
  - `sniff(bytes: Buffer): 'jpeg' | 'png' | 'webp' | null`, by the leading bytes.
  - `makeMaster(bytes): Promise<{ data: Buffer; width; height }>`:
    1. `rotate()` (EXIF)
    2. sRGB output
    3. fit inside 3200 px, without enlarging
    4. WebP at quality 82, alpha kept
  - `makeSlot(master: Buffer, kind: SlotKind): Promise<{ data; width; height }>`: fit
    inside `maxSide`. When `alpha` is false, flatten onto `#ffffff` first.
  - `hashName(data: Buffer): string`: the first 20 hex characters of the sha256.
- Produces (`media.ts`), admin only, Node `(req, res)` with `export const config = { api: { bodyParser: false } }`:

  | Request | What it does |
  | --- | --- |
  | `POST` (raw bytes) | Over 4,400,000 bytes answers 413 `That photo is too large to upload.` Not JPEG, PNG or WebP answers 415 `That file type can't be used. Save it as JPEG or PNG and try again.` Otherwise stores a master and answers `{ file: 'm/<h>.webp', url, width, height }`. Each upload first runs `purgeStale(30)`. |
  | `POST ?derive=<file>&kind=<SlotKind>` | Answers `{ path: '/assets/cms/<h>.webp', width, height }`. The master comes from the store, or from the repo through `readBinary` when it is already published. |
  | `GET ?file=<file>` | The bytes as `image/webp`, `Cache-Control: private, max-age=3600`. |
  | `GET` | `{ photos: [{ file, url, width, height, published, createdAt }], site: string[] }`. `site` is every `/assets/client/*` path, from `listFiles`. |

  A `url` for a stored photo is `/api/admin/media?file=<file>`.

- [ ] **Step 1: Write failing tests**, with fixture images generated by sharp inside the tests:
  - `a transparent 8000 px PNG becomes a 3200 px WebP master that keeps its alpha`: the
    output `metadata().hasAlpha` is true and the longest side is 3200.
  - `a JPEG with EXIF orientation 6 comes out upright`: a 400×300 input with orientation 6
    gives a 300×400 master.
  - `a Display P3 photo is converted to sRGB`: the output metadata `space` is `srgb`.
  - `refuses a file that is not JPEG, PNG or WebP`: 415 for `Buffer.from('not an image')`.
  - `refuses an upload over the limit`: 413.
  - `derive makes a 900 px store photo on white`: from a transparent master, the longest
    side is 900 and `hasAlpha` is false.
  - `serves a stored photo only to a signed-in admin`.
- [ ] **Step 2:** `npm i sharp`, then `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4:** Run `npm test`, `npm run check:functions` and `npx tsc --noEmit`. Expected: PASS, with 10 functions loading.
- [ ] **Step 5:** Commit: `feat(content): photo upload, processing and library API`.

### Task 7: Preview mode on the site

**Files:**
- Create: `src/content/registry.ts`, `src/content/preview.ts`,
  `src/components/PreviewRibbon.tsx`, `src/content/preview.test.ts`
- Modify: `src/lib/asset.ts`, `src/main.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `DOC_KEYS` and `DocKey` from `api/_lib/content/keys.ts`, and the content JSON
  (Task 2).
- Produces:
  - `registry.ts`: `CONTENT: Record<DocKey, Record<string, unknown>>`. These are the very
    objects that `src/data/faq.ts` and `src/data/stores.ts` export.
  - `preview.ts`:
    - `previewRequested(search: string, stored: string | null): boolean`: true when `search`
      has `preview` or `stored === '1'`.
    - `applyDrafts(drafts, target = CONTENT): void`: empties each targeted object's own keys,
      then `Object.assign`s the draft into it, so the object's identity is kept.
    - `bootPreview(): Promise<boolean>`: fetches `GET /api/admin/content?action=preview`
      with credentials.
      - On success: `applyDrafts`, `setPreviewMedia(media)`, sets sessionStorage
        `legendary-preview` to `1`, returns `true`.
      - On 401: clears the flag and returns `false`.
    - `isPreview(): boolean` and `exitPreview(): void`. Exiting clears the flag and reloads
      without `?preview`.
  - `asset.ts`: `setPreviewMedia(paths: string[])`. `asset(p)` returns
    `/api/admin/media?file=<p minus /assets/cms/>` for those paths. Everything else is
    unchanged.
  - `main.tsx`: when `previewRequested(...)` is true, `bootPreview().finally(render)`;
    otherwise it renders at once, exactly as today.
  - `PreviewRibbon`: shown when `isPreview()`. A fixed pill, bottom left, above the
    concierge: "Preview, not published", with "Exit preview".

- [ ] **Step 1: Write failing tests** (vitest, node):
  - `applyDrafts keeps object identity`: the same object, now with the draft's keys and
    without the old ones.
  - `previewRequested reads the query or the session flag`.
  - `asset maps only unpublished dashboard photos`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement. App renders `<PreviewRibbon />` inside `Layout`.
- [ ] **Step 4: Check it in the browser.**
  - `npm test` and `npx tsc --noEmit` pass.
  - Run the fake GitHub, dev-api and Vite (the env in Task 9 Step 1). Sign in, save an FAQ
    draft through the API, and open `/faq?preview`: the draft text and the ribbon show.
  - In a fresh context without the cookie, `/faq?preview` shows the published text and no
    ribbon.
- [ ] **Step 5:** Commit: `feat(content): preview the real pages with drafts`.

### Task 8a: Dashboard state, publishing and history

**Files:**
- Create:
  - `src/admin/contentStore.ts`, `src/admin/contentStore.test.ts`
  - `src/admin/PublishBar.tsx`, `src/admin/History.tsx`
- Modify:
  - `src/lib/api.ts`: typed wrappers for Tasks 5 and 6
  - `src/App.tsx`: `Admin` becomes `React.lazy` inside `Suspense`, with a fallback of
    "Loading the dashboard…"
  - `src/pages/Admin.tsx`: tabs `faq`, `stores`, `photos` and `history`; an "Unpublished
    changes" card on Overview

**Interfaces:**
- Consumes:
  - From `src/lib/api.ts`:
    - `adminContentState()`, `adminSaveDraft(doc, data)`, `adminDiscardDraft(doc)`
    - `adminPublish(docs, overwrite?)`, `adminRestore(doc, sha)`
    - `adminHistory(doc?)`, `adminDeployStatus(sha)`
  - Each throws `ApiError` with `status`, as the existing wrappers do.
- Produces `useContent`, a zustand store in `contentStore.ts`:
  - **Fields.**
    - `status: 'loading' | 'ready' | 'unconfigured' | 'error'`
    - `docs: Partial<Record<DocKey, { label; published; sha; working; draftBase; errors; warnings; save: 'idle' | 'saving' | 'saved' | 'error' | 'signed-out' }>>`
    - `publishing: { state: 'idle' | 'publishing' | 'deploying' | 'live' | 'failed' | 'conflict'; commit?; conflicts?: DocKey[]; message? }`
  - **Actions.**
    - `load()`
    - `edit(doc, next)`: sets `working` and autosaves after 800 ms of quiet.
    - `flush(doc)`, `discard(doc)`
    - `publish(docs, overwrite?)`
    - `dirty(): DocKey[]`: documents whose `working` differs from `published`, compared
      by deep equality.
  - **After publishing,** `deployState` is polled every 5 s, for at most 5 minutes:
    `success` makes it `live`, `failure` makes it `failed`, and running out of time makes it
    `failed` with "Not live after 5 minutes. The site is unchanged."
  - `PublishBar`, sticky at the bottom of an editing tab:
    - lists the dirty documents' labels
    - **Preview** opens `/faq?preview` or `/stores?preview` in a new tab
    - **Publish** and **Discard** (the latter asks for confirmation)
    - shows "Publishing…", "Live", the failure text, and a conflict dialog: **Keep mine**
      publishes again with `overwrite`; **Take the newer one** discards the draft and
      reloads
    - is disabled while any document being published has `errors`
  - `History`: commits, newest first, with date, message and the documents changed. Each
    document has **Restore**, which asks "Put the FAQ back as it was on 3 November 2026?"
    first.

- [ ] **Step 1: Write failing tests** with `vi.mock('../lib/api')`:
  - `edit marks the document dirty and autosaves once after 800 ms`, using fake timers.
  - `a 401 on autosave keeps the edits`: `working` is unchanged and `save` is `signed-out`.
  - `a 409 on publish shows the conflict`: `publishing.state` is `conflict` and `conflicts`
    is `['faq']`.
  - `a successful publish polls until live`.
  - `a failed deploy is reported and the drafts are kept`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement the store, `PublishBar`, `History`, the lazy route and the tabs.
- [ ] **Step 4: Check it.**
  - `npm test` and `npx tsc --noEmit` pass.
  - `npm run build`: the main `index-*.js` chunk contains no `zod`. Check with
    `rg -l "ZodError" dist/assets` and expect only the lazy dashboard chunk.
- [ ] **Step 5:** Commit: `feat(dashboard): drafts, publishing and history screens`.

### Task 8b: FAQ and Stores editors, photo field and library

**Files:**
- Create:
  - `src/admin/fields.tsx`, `src/admin/text.ts`, `src/admin/shrink.ts`
  - `src/admin/PhotoField.tsx`, `src/admin/PhotoLibrary.tsx`
  - `src/admin/FaqEditor.tsx`, `src/admin/StoresEditor.tsx`
  - `src/admin/text.test.ts`, `src/admin/shrink.test.ts`
- Modify: `src/pages/Admin.tsx` (mount the editors in their tabs)

**Interfaces:**
- Consumes: `useContent` (Task 8a); `adminUploadPhoto(blob, name)`, `adminDerivePhoto(file, kind)` and `adminLibrary()` (Task 6 wrappers in `src/lib/api.ts`); `SLOT_KINDS`.
- Produces:
  - **`text.ts`:**
    - `hasLongDash(s): boolean`
    - `replaceLongDashes(s): string`: `" — "`, `"—"`, `" – "` and `"–"` all become `", "`;
      a resulting `", ,"` collapses.
    - `newId(name, taken: Set<string>): string`: lowercase letters and digits only, at most
      24 characters, `2`, `3`… appended when taken.
  - **`shrink.ts`:**
    - `nextScale(bytes, maxBytes, scale): number | null`: `null` when `bytes <= maxBytes`,
      otherwise `scale * 0.8`.
    - `shrinkForUpload(file: File): Promise<{ blob: Blob; width: number; height: number }>`:
      1. `createImageBitmap(file, { imageOrientation: 'from-image' })`
      2. fit inside 3200 px
      3. find transparency by drawing at most 256 px and scanning the alpha
      4. encode WebP; if the browser hands back another type, JPEG at 0.9, or PNG when
         there is transparency
      5. scale down by `nextScale` until the result is at most 3,800,000 bytes

      A decode failure throws `This photo's format isn't supported. Save it as JPEG or PNG
      and try again.`
  - **`fields.tsx`:**
    - `TextField` and `TextArea`. They show a dash warning with a **Use a comma** button.
    - `ListEditor<T>({ items, onChange, render, blank, addLabel })`: add, remove (with
      confirmation), and move up or down.
  - **`PhotoField({ kind, value, onChange })`:**
    - shows the photo, with **Upload** and **Choose from library**
    - a library master is derived for `kind`; a site photo is used as it is
    - on a device whose `matchMedia('(pointer: coarse)')` matches, **Upload** is replaced by
      "Use a computer to add photos"
  - **`PhotoLibrary`:** a drop zone that takes many files, uploaded one after another with
    progress. Below it, a grid of the uploaded photos, then the site's photos.
  - **`FaqEditor`:** the intro; sections (title, then questions with an answer and optional
    list lines); and the product-page questions. Every list can be added to, removed from
    and reordered.
  - **`StoresEditor`:**
    - the regions list
    - the stores list: name, region (a select of `regions`), address, phone, opening hours
      (lines), map search text, and photo (`PhotoField`, kind `store`)
    - a new store's id comes from `newId`; an existing id never changes
    - removing a region that a store uses is blocked, with the store named

- [ ] **Step 1: Write failing tests**:
  - `replaceLongDashes turns a long dash into a comma`: `'Spirit I — Hope'` becomes
    `'Spirit I, Hope'`, and `'a–b'` becomes `'a, b'`.
  - `newId has no dashes and avoids taken ids`: `newId('KLIA T1 · Eraman', new Set(['kliat1eraman']))`
    is `'kliat1eraman2'`.
  - `shrink loop always ends under the byte limit`: run `nextScale` repeatedly on sizes that
    fall with the area. From 15,000,000 bytes it reaches `null` within 10 steps.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(dashboard): FAQ and Stores editors, photo field and library`.

### Task 9: End to end, docs and release

**Files:**
- Create: `scripts/dashboard-e2e.mjs`
- Modify: `README.md` (a "Content dashboard" section), `vercel.json` only if a function needs more than its 30 s

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Bring up an isolated stack.** None of these processes reads production
  values.
  - Postgres: embedded-postgres on port 54329, in the scratchpad.
  - Fake GitHub: `node scripts/fake-github.mjs 4010`.
  - API: `node scripts/dev-api.mjs` with every `.env` key overridden:
    - `DATABASE_URL` pointing at the local database
    - `STRIPE_SECRET_KEY=sk_test_dummy`, `ADMIN_PASSWORD=test`, `RESEND_API_KEY=" "`
    - `GITHUB_TOKEN=fake`, `GITHUB_REPO=local/legendary`, `GITHUB_API_URL=http://localhost:4010`
  - Site: Vite with `VITE_DEV_API=http://localhost:3000`.
- [ ] **Step 2: Write and run `scripts/dashboard-e2e.mjs`.** It uses Playwright with
  installed Chrome, a 1440×900 window and Safari's WebKit for the upload checks, and asserts:
  1. Sign in.
  2. On the FAQ tab, change the first answer and wait for "Saved".
  3. Preview shows the new answer on `/faq` with the ribbon.
  4. Publish runs from "Publishing…" to "Live".
  5. The fake's `src/content/faq.json` holds the answer.
  6. On Stores, add a store with an 8000 px transparent PNG made by sharp, then publish.
     The commit has `stores.json`, the 900 px photo and its master.
  7. History lists both. Restoring the FAQ to its first version makes a third commit.
  8. Change `faq.json` in the fake, edit the FAQ, then Publish: the conflict dialog
     appears, and **Keep mine** publishes.
  9. A HEIC-named non-image shows the format message.
  10. On a phone-sized touch context, photo upload says to use a computer.

  Expected: every assertion passes.
- [ ] **Step 3: Build like production.** `npm run build`: catalogue, tsc, check:functions
  (10 functions), the Vite build and the SEO files all pass. `npm test` passes.
- [ ] **Step 4: Document it.** The README's "Content dashboard" section covers:
  - what the client can edit at this stage
  - `GITHUB_TOKEN`: a fine-grained token on `23f3000111/legendary-perfume-v2` with Contents
    read and write, nothing else
  - `GITHUB_REPO=23f3000111/legendary-perfume-v2` and `GITHUB_BRANCH=main`
  - that dashboard publishes land on `main`, so developers `git pull --rebase` before
    pushing
  - how to run the dashboard locally against the fake GitHub
- [ ] **Step 5: Release.** Commit `feat(dashboard): stage 1 end to end checks and docs`, then
  `git push v2 main`. Wait for the Vercel "Vercel" status on the commit to be `success`. Ask
  the user to add the three variables in Vercel and redeploy.
- [ ] **Step 6: Verify on the live dashboard once the token is in.**
  - The FAQ tab loads.
  - Publishing an unchanged FAQ is refused: there is nothing to publish.
  - Edit one FAQ answer, publish it, see "Live", then restore it. The site ends as it began.

  Report the two commit links.
