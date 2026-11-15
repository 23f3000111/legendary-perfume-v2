# Content dashboard, stage 4b (each page's own words) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Legendary team can change the words on every public page from the dashboard's new Pages tab, in page order. That covers headings, introductions, buttons in the copy, the header and footer words, two page photos, and each page's search-engine title and description.

**Architecture:**
- **One document.** Every page's own words move out of the components into one document, `src/content/pages.json` (key `pages`, label `Pages`), keyed by page. Nothing visible changes. The document is one file, like the Journal and the Products, so the dashboard loads one more file, not nine, and a publish names the pages it changes.
- **Headings keep their shape.** A heading that breaks over two lines today keeps a newline in its text. A word set in gold italic is written `*like this*`. One small renderer draws both.
- **The form is a table, not hand-written JSX.** `src/admin/pages.ts` lists each page's sections and fields in page order, each with its plain label, for example "Home · Signature · Heading". One generic form draws any page from that table. A test proves every word in the document has a field and every field has a word.
- **Out of this stage:**
  - **Banners** (with their phone crops and focus point), each collection's shop banner, and each page's sharing image are stage 4c.
  - **The hero poster** is stage 5.

**Tech Stack:** As stages 1 to 4a. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-12-content-dashboard-design.md`. This plan covers these parts of it:
- under "What counts as page text and photos", the copy of every public page, and the header and footer text
- under "Where content lives", that headings that break keep a newline
- under "Screens", the **Pages** entry
- under "Editing rules", the soft limits
- under "In", each page's search-engine title and description

It builds on the stage 4a plan (`docs/superpowers/plans/2026-11-14-content-dashboard-stage-4a.md`).

## Global Constraints

- **The earlier stages' constraints still apply.** Every Global Constraint of the stage 1 to 4a plans applies here. In particular:
  - schemas use `object()` (passthrough) with keys in file order, and the JSON is written from the schema's `parse`
  - nothing is computed from content when a module loads
  - no em or en dash in any visible copy or new label
  - no new function files (10 stay)
  - the local `.env` is production
- **What stays in code** (the spec's "Out"):
  - interface wording: form labels, filter and sort labels, menu labels, "Add to bag", the cart and search, the 404 page and the intro curtain
  - the order and Track pages
  - icons and brand artwork
  - each section's layout
  - which product a section links to (Signature and the menu card open Orchid)
  - the Shop's view titles (All Fragrances, Bestsellers and the rest), which are filter labels
- **Markup.**
  - **Headings** take a newline for a line break and `*word*` for the gold italic accent, and nothing else.
  - **Body text** stays plain, except where a field says it takes the journal's light markup.
- **The WhatsApp number stays live.** Two pages put the number or its link inside a sentence:
  - the Contact form's line
  - the FAQ page's "Ask us anything"

  So the words before and after it are separate fields, and the number and link still come from Site details.
- **Release.** Merged into local `main` after its review. Do not push (memory `cms-live-testing-at-the-end`).

## Review Focus

1. **A heading with a line break or an accent.**
   - After the move, "Orchid, the scent / that began it all" and "Every scent is born / of a *place*" read exactly as before.
   - A heading the team types with three lines, or with a stray single `*`, draws without breaking.
   - Test: Task 1 `headings keep their line breaks and their gold word`, and its stray-asterisk case.
2. **A word in the document with no field.** Every string and number in `pages.json` must be reachable from the Pages form, and every field must point at one, or a word becomes uneditable. Test: Task 4 `every word on the pages has a field, and every field a word`.
3. **Previewing a page.** A draft of any page's words shows on that page, the header and footer included: nothing reads `pages` when a module loads. Test: Task 2 `a draft of the pages is what the pages read`.
4. **The WhatsApp number inside a sentence.** It still comes from Site details on the Contact and FAQ pages after the move. Test: Task 3 `the FAQ page's help line carries the number from Site details`.
5. **A publish names its pages.** Changing two pages says which two, not just "Pages". Test: Task 4 `changeSummary names the pages a publish changes`.

---

### Task 1: The pages schema, the heading renderer and the page photo kind

**Files:**
- Modify: `api/_lib/content/schema.ts`, `api/_lib/content/slots.ts`
- Create: `src/components/ui/Heading.tsx`, `src/lib/heading.ts`, `src/lib/heading.test.ts`
- Test: `tests/api/content-schema.test.ts`

**Interfaces:**
- Produces:
  - **`schema.ts`:** `PagesDocSchema`, `type PagesDoc`, and a `heading(max)` rule. The rule is `text(max)` with at most 4 lines, and an even number of `*`: `Close the gold word with a second *.`
  - **`slots.ts`:** `page: { label: 'Page photo', maxSide: 1800, alpha: false }`.
  - **`src/lib/heading.ts`:** `headingLines(text: string): { text: string; accent: boolean }[][]`. It returns one array per line, each line a list of runs. An unmatched `*` is kept as a plain character.
  - **`Heading({ text, accentClass })`** in `src/components/ui/Heading.tsx`. It draws the lines with `<br />` between them, and accent runs as `<span className={accentClass}>`. The default `accentClass` is `italic text-gilt`.

**The document**, in this key order. Every leaf is `text(n)` unless the table says otherwise. `H` marks a heading (`heading(n)`) and `P` marks paragraphs (`text(n)`, with a blank line between paragraphs). The "Today" column says where each value is now; the executor copies the words exactly.

| Path | Kind, limit | Today |
| --- | --- | --- |
| `layout.menu.eyebrow`, `.title`, `.photo`, `.alt` | text 40, text 40, photo, text 120 | The header mega menu's Orchid card |
| `layout.footer.blurb` | text 300 | The footer's line under the wordmark |
| `layout.footer.newsletter.eyebrow`, `.heading` H, `.text`, `.thanks` | 40, 120, 300, 120 | The Contact page's sign-up block |
| `layout.footer.copyright` | 120 | The footer's last line |
| `layout.footer.payments` | 1 to 10 of text 30 | The payment marks |
| `home.seo.title`, `.description` | 70, 300 | The Home `Seo` |
| `home.signature.kicker`, `.heading` H, `.since` H, `.figure` (whole number 1 to 100000000), `.suffix` (text 4, may be empty), `.figureLabel`, `.button`, `.note`, `.photo` (photo), `.alt` | 40, 80, 20, number, 4, 60, 40, 60, photo, 120 | `Signature.tsx` |
| `home.collections.kicker`, `.heading` H, `.intro`, `.cue` | 40, 60, 400, 40 | `CollectionsRail.tsx` (desktop and phone share the heading) |
| `home.map.kicker`, `.heading` H, `.intro` | 60, 80, 400 | `ScentMemory.tsx` |
| `home.bestsellers.kicker`, `.heading` H, `.link` | 40, 60, 30 | `Bestsellers.tsx` |
| `home.finder.kicker`, `.heading` H, `.intro`, `.link`, `.moods.Serene` / `.Bold` / `.Romantic` / `.Playful` | 40, 80, 300, 30, 4 × 60 | `Finder.tsx`, plus `moodCopy` in `src/data/products.ts` |
| `home.partners.heading` H | 60 | `PartneredWith.tsx` |
| `home.reviews.kicker`, `.heading` H, `.link` | 60, 80, 40 | `Reviews.tsx` |
| `shop.eyebrow` | 40 | Shop's `PageHeader` |
| `shop.intros.all`, `.bestsellers`, `.gifts`, `.her`, `.him` | 5 × 400 | `INTROS` in `Shop.tsx` |
| `about.seo.title`, `.description` | 70, 300 | About `Seo` |
| `about.header.eyebrow`, `.title` H, `.intro` | 40, 80, 400 | About `PageHeader` |
| `about.beginning.photo`, `.alt`, `.kicker`, `.heading` H, `.body` P, `.button` | photo, 120, 40, 80, 2000, 40 | The "Our Beginning" block |
| `about.services` | exactly 4 of `{ title: 40, copy: 160 }` | `Services.tsx` (icons stay in code, by position) |
| `about.journey.kicker`, `.heading` H | 40, 80 | The journey section |
| `about.purpose.kicker`, `.heading` H, `.items` | 40, 80, and exactly 2 of `{ label: 40, title: 120, body: 600 }` | Vision and mission |
| `about.values.kicker`, `.heading` H, `.items` | 40, 80, and exactly 4 of `{ title: 40, body: 200 }` | The values (icons stay in code, by position) |
| `about.cta.heading` H, `.shop`, `.stores` | 80, 30, 30 | The closing section |
| `stores.seo.title`, `.description` | 70, 300 | Stores `Seo` |
| `stores.header.eyebrow`, `.title` H, `.intro` | 40, 80, 400 | Stores `PageHeader` |
| `stores.sellers.heading` H, `.intro` | 60, 300 | Trusted Sellers |
| `contact.seo.title`, `.description` | 70, 300 | Contact `Seo` |
| `contact.header.eyebrow`, `.title` H, `.intro` | 60, 80, 400 | Contact `PageHeader` |
| `contact.form.kicker`, `.heading` H, `.intro`, `.link` | 40, 80, 200, 30 | "Fill in the form below, or reach us directly on" and "WhatsApp" |
| `contact.office.kicker`, `.directions`, `.stores` | 40, 30, 30 | Find us, Get directions, Our boutiques |
| `contact.faq.kicker`, `.heading` H, `.button` | 40, 80, 30 | Good to Know |
| `faq.seo.title`, `.description` | 70, 300 | FAQ `Seo` (today the description is the FAQ's intro) |
| `faq.header.eyebrow`, `.title` H | 40, 80 | FAQ `PageHeader` (its intro stays the FAQ document's) |
| `faq.help.kicker`, `.heading` H, `.before`, `.after`, `.whatsapp`, `.message` | 40, 80, 200, 300, 30, 30 | Still wondering: "...on WhatsApp at" + number + ", or you can send..." |
| `journal.seo.title`, `.description` | 70, 300 | Journal `Seo` |
| `journal.header.eyebrow`, `.title` H, `.intro` | 40, 80, 400 | Journal `PageHeader` |
| `policies.more` | 40 | "Also worth reading" |

- [ ] **Step 1: Write the failing tests**
  - `heading.test.ts`, `headings keep their line breaks and their gold word`:
    - `headingLines('Every scent is born\nof a *place*')` equals `[[{ text: 'Every scent is born', accent: false }], [{ text: 'of a ', accent: false }, { text: 'place', accent: true }]]`.
    - A stray `*` stays plain: `headingLines('5 * stars')` equals `[[{ text: '5 * stars', accent: false }]]`.
  - `content-schema.test.ts`:
    - `a page heading closes its gold word`: `home.map.heading` of `of a *place` fails at `['home', 'map', 'heading']`.
    - `the four values stay four`: three values fail at `['about', 'values', 'items']`.
- [ ] **Step 2:** `npx vitest run src/lib/heading.test.ts tests/api/content-schema.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4:** `npm test` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(content): the pages schema, the heading renderer and the page photo kind`.

### Task 2: Move the header, footer and Home words into JSON, nothing visible changed

**Files:**
- Create:
  - `src/content/pages.json`, holding every key of the document. The inner pages' values are copied from their components now, and wired in Task 3.
  - `src/data/pages.ts`
- Modify:
  - the registry: `keys.ts`, `docs.ts`, `src/content/registry.ts`
  - layout: `src/components/layout/Header.tsx`, `Footer.tsx`
  - Home: `src/pages/Home.tsx`, and `src/sections/Signature.tsx`, `CollectionsRail.tsx`, `ScentMemory.tsx`, `Bestsellers.tsx`, `Finder.tsx`, `PartneredWith.tsx`, `Reviews.tsx`
  - moods: `src/data/products.ts` (`moodCopy` reads the document), `src/lib/concierge.ts`
  - `src/components/Seo.tsx`: an `exact` prop
- Test: `src/content/content.test.ts`, `src/content/preview.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - **The registry.** `DOC_KEYS` adds `'pages'`, with the label `Pages`.
  - **`src/data/pages.ts`:** `export const pages: PagesDoc` (the imported JSON). Every component reads `pages.<page>...` when it renders.
  - **`moodLine(m: Mood): string`** in `src/data/products.ts`, reading `pages.home.finder.moods[m]` when called. `moodCopy` goes, and `Finder` and the concierge use `moodLine`.
  - **Photos** are root paths, drawn through `asset()`.
  - **Headings** are drawn with `Heading`.
  - **`Seo` `exact?: boolean`.** It uses `title` as given, without " · Legendary". `home.seo.title` holds today's full title, `Legendary · A Scented Memory of Malaysia`, and Home passes `exact`.
- [ ] **Step 1: Record the before state** with parity, which records links since 4a: build in PowerShell with `$env:VITE_BASE = "/"`, preview on 4230, and capture `.parity-before.json`.
- [ ] **Step 2: Write `pages.json`** by hand, every value copied exactly from the code, and run it through `PagesDocSchema.parse` so its keys are in schema order.
- [ ] **Step 3: Write the failing tests**
  - `content.test.ts`:
    - `the published pages pass their schema`.
    - The identity test adds `pages`.
  - `preview.test.ts`, `a draft of the pages is what the pages read`:
    - Apply a draft with a new `home.signature.heading` and a new `layout.footer.copyright`.
    - `pages.home.signature.heading` reads the new heading.
    - `pages.layout.footer.copyright` reads the new line.
    - `moodLine('Bold')` reads the draft's line.
    - Restore afterwards.
- [ ] **Step 4:** `npm test`. Expected: FAIL.
- [ ] **Step 5:** Wire the header, footer and Home sections. Run `npx tsc --noEmit`, `npm test` and `npm run check:content`. Expected: all pass, and the last prints `content: 13 documents valid`.
- [ ] **Step 6: Prove nothing changed.** Rebuild, capture `.parity-after.json`, and compare. Expected: all 45 routes identical in text, images and links.
- [ ] **Step 7:** Commit: `refactor(content): the header, footer and Home words live in src/content/pages.json`.

### Task 3: Move the inner pages' words, nothing visible changed

**Files:**
- Modify:
  - `src/pages/About.tsx`, `src/sections/Services.tsx`
  - `src/pages/Stores.tsx`, `Contact.tsx`, `Faq.tsx`, `Journal.tsx`, `Shop.tsx`, `Policy.tsx`
  - `src/lib/seo.ts`: `organisationLd` and `websiteLd` describe the house with `pages.home.seo.description`, and `SITE.description` goes
- Test: `src/data/site.test.ts`, `src/content/content.test.ts`

**Interfaces:**
- Consumes: Task 2.
- Produces:
  - **`About`'s body paragraphs** come from `about.beginning.body`, split on blank lines.
  - **Icons by position.** `Services` keeps its four icons and the vial artwork by position, with the words from `about.services`. The values do the same.
  - **The FAQ page's help line** is `{before} {site.whatsapp}{after}`.
  - **The Contact form's line** is `{intro} <a href={waLink(...)}>{link}</a>.`
- [ ] **Step 1:** Task 2's after-capture is this task's before state.
- [ ] **Step 2: Write the failing tests**
  - `site.test.ts`, `the FAQ page's help line carries the number from Site details`:
    - Apply a site draft with the number `+60 12 345 6789`.
    - Render the help line with `renderToStaticMarkup` from `react-dom/server`, through the small `FaqHelp` component that `Faq.tsx` exports, inside a `MemoryRouter`, since it links to `/contact`.
    - It contains `WhatsApp at +60 12 345 6789, or you`.
  - `content.test.ts`, `the house is described as the Home page is`: `organisationLd().description` equals `pages.home.seo.description`.
- [ ] **Step 3:** `npm test`. Expected: FAIL.
- [ ] **Step 4:** Implement. Run `npx tsc --noEmit` and `npm test`. Expected: PASS.
- [ ] **Step 5: Prove nothing changed.** Rebuild, capture, and compare with Task 2's after state. Expected: all 45 routes identical in text, images and links.
- [ ] **Step 6:** Commit: `refactor(content): the inner pages' words live in src/content/pages.json`.

### Task 4: The Pages tab

**Files:**
- Create: `src/admin/pages.ts`, `src/admin/pages.test.ts`, `src/admin/PagesEditor.tsx`
- Modify: `src/admin/changes.ts`, `src/admin/History.tsx`, `src/pages/Admin.tsx`
- Test: `src/admin/pages.test.ts`, `src/admin/changes.test.ts`

**Interfaces:**
- Consumes: Tasks 1 to 3; `TextField`, `TextArea`, `LinesField`, `NumberField`, `PhotoField`, `PublishBar`, `useContent`, `ContentGate`.
- Produces:
  - **The page table in `src/admin/pages.ts`:**
    - `type FieldKind = 'text' | 'heading' | 'area' | 'paragraphs' | 'lines' | 'number' | 'photo'`
    - `interface PageField { path: string; label: string; kind: FieldKind; hint?: string; warnAt?: number }`
    - `interface PageSection { title: string; fields: PageField[] }`
    - `interface PageSpec { key: keyof PagesDoc; title: string; preview: string; sections: PageSection[] }`
    - `PAGE_SPECS: PageSpec[]`, in this order, each section in page order:
      - Every page (header and footer), previewing `/contact`, where the sign-up shows
      - Home, `/`
      - Shop, `/shop`
      - Our Story, `/about`
      - Stores, `/stores`
      - Contact, `/contact`
      - FAQ, `/faq`
      - Journal, `/journal`
      - Policies, `/shipping`

      Each page ends with a **Search engines** section (title and description) where the page has one.
    - **Labels** are plain words. A field's full label is `<page> · <section> · <field>`, for example `Home · Signature · Heading`. The form shows the section as a heading and the field's own label under it.
    - **Hints:**
      - **Every `heading` field:** `A new line starts a new line on the page. Put *stars* around a word to set it in gold italic.`
      - **`home.signature.heading`, `home.map.heading` and every `about.*.heading`:** also `warnAt: 40`, with the hint `Longer than the design was drawn for: check it in Preview.` past it.
      - **Every SEO title:** `warnAt: 60`, with the hint `Search engines cut titles past about 60 characters.`
      - **Every SEO description:** `warnAt: 160`, with the hint `Search engines show about 160 characters.`
    - `getAt(doc: unknown, path: string): unknown` and `setAt<T>(doc: T, path: string, value: unknown): T`. Paths are dotted, array indexes included (`about.services.2.title`), and `setAt` copies along the path.
  - **`PagesEditor`:**
    - **The list.** The pages, each with **Changed** and **Needs attention** tags (issue paths under the page's key), and **Edit**.
    - **One page.** A form of its sections under an **All pages** link.
      - Fields are drawn by kind: `TextField`, `TextArea` for `heading`, `area` and `paragraphs`, `LinesField`, `NumberField`, and `PhotoField` kind `page`.
      - Errors are read at the field's path.
    - **The publish bar:** `docs={['pages']}`, previewing the open page's `preview`, or `/` from the list.
  - **`changes.ts`.** `changeSummary('pages', working, published)` names the pages whose key differs, by their `PAGE_SPECS` titles: `Changed: Home and Our Story.`
    - It uses a small `SECTIONS` map beside `LISTS`, for documents made of named parts.
    - `namesItems('pages')` is true, so History names the pages a restore puts back. `restoreChanges` gives them as `returned`, and nothing as `removed`.
  - **`Admin.tsx`.** A `pages` tab, labelled `Pages`, comes after Journal, and `DOC_TABS.pages = 'pages'`.
- [ ] **Step 1: Write the failing tests**
  - `pages.test.ts`:
    - `every word on the pages has a field, and every field a word`. Walk `pages.json`'s leaves (strings, numbers, and the strings of `payments`). The set of leaf paths, with `payments` counted as one `lines` field, equals the set of `PAGE_SPECS` field paths.
    - `setAt changes one field and copies along its path`. Set `about.services.2.title` on a fixture: the result reads the new title, the input is unchanged, and `about.values` is the same object.
  - `changes.test.ts`, `changeSummary names the pages a publish changes`. A working copy with `home` and `about` changed gives `Changed: Home and Our Story.`
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4: Check it in the browser** against the isolated stack, with a throwaway script as in stage 4a:
  - The Pages tab lists nine pages.
  - Home's form shows Signature's heading on two lines. Changing it to `Orchid, the scent\nthat started it all` shows in Preview `/`.
  - A heading with an unclosed `*` is marked red, and Publish is held.
  - Every page's form opens without errors.
  - Discard returns the words.

  Review the screenshots.
- [ ] **Step 5:** Commit: `feat(dashboard): the Pages tab`.

### Task 5: End to end and docs

**Files:**
- Modify: `scripts/dashboard-e2e.mjs`, `README.md`

- [ ] **Step 1:** Bring up a fresh isolated stack.
- [ ] **Step 2: Extend the e2e.** Keep checks 1 to 25, and add:
  26. **The Signature heading.** Change it, see the new words in Preview `/`, and publish to Live. The fake's `pages.json` holds them.
  27. **The footer.** Change the footer's copyright line. Preview `/about` shows it in the footer.
  28. **Restoring the pages.** Restore Pages to the seeded version. The question names the pages it puts back, and `pages.json` is back byte for byte.

  Expected: every check passes.
- [ ] **Step 3: Build like production.** Expected: `npm run build` passes with `content: 13 documents valid` and 10 functions, and `npm test` passes.
- [ ] **Step 4: Document it.** The README's Content dashboard section covers:
  - the Pages tab and `pages.json`
  - the heading markup
  - the WhatsApp number staying live inside the two sentences
  - what stays in code
  - that banners and sharing images follow in 4c
- [ ] **Step 5:** Commit: `feat(dashboard): stage 4b end to end checks and docs`. Do not push.
