# Content Dashboard Stage 5: The Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Legendary team can change the Home hero from the dashboard: the words over the film, and the campaign poster that follows it (on or off, its image, the two boxes that say what must stay in view, and whether the header turns dark over it).

**Architecture:**
- **The hero's words join the other Home words.** They move from `src/sections/Hero.tsx` into `pages.json` as `home.hero`, edited in the Pages tab as Home's first section, "Hero". The heading keeps the newline and `*gold*` rules and gets the spec's soft length warning.
- **The poster is its own document.** `src/content/hero.json` (key `hero`, label `Hero poster`) holds `poster`: `show`, `image` (its prints, its blurred fill, its size), `alt`, `tone`, and the `words` and `picture` boxes as fractions `[left, top, right, bottom]`. A new **Poster** tab edits it.
- **One upload makes the four files** `save_hero_poster` makes: widths 1280, 2400 and 3200, never enlarged, and a 480 px blurred fill. A new `poster` slot kind; the derive answers every print with its width.
- **The framing stays one function.** `frameFor` moves out of `Hero.tsx` into `src/lib/poster.ts` as a pure function of the window, the poster and the header's height, so the Poster tab's previews frame the poster exactly as the site does.
- **Out of this stage:** the hero film, the poster's hold time, and per route static heads.

**Tech Stack:** As stages 1 to 4c. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-12-content-dashboard-design.md`. This plan covers, under "Screens", the **Hero poster** entry; under "Photos", the hero poster's output; under "Editing rules", the hero headline's soft limit; and under "What counts as page text and photos", the Home hero's copy.

## Global Constraints

- No em or en dashes in any visible copy, label or hint.
- `api/` imports use `.js` extensions; `npm run check:functions` loads all 10 functions.
- Content is read at render, never at module load, so a preview's drafts show.
- JSON keys stay in file order, and a document is written through its schema's `parse`.
- Every photo has alt text.
- Never run the API with the local `.env` (production). Tests and the e2e use the isolated stack.
- A publish carries every `/assets/cms/` file the document names (`mediaRefs`).
- Nothing visible changes until the team edits: all 45 routes match the parity baseline captured from main 7f7f87b.

## Review Focus

1. **The poster turned off.** The film plays alone and loops, with no arrows, ring or poster layer, and the header stays light. Test: Task 2 `with the poster off, the hero shows the film alone`.
2. **A box dragged past the poster's edge, or shrunk to nothing,** stays on the poster and keeps a minimum size, and the schema refuses a box with no width. Tests: Task 4 `a box dragged past the edge stays on the poster` and `a corner dragged across the box keeps it at least 4% across`; Task 2 `a box with no width or height is refused`.
3. **A poster smaller than 3200 px** is never enlarged, and its `srcset` names each print at its real width. Tests: Task 3 `a poster narrower than 3200 px is never enlarged`; Task 2 `the poster's sources name each print at its own width`.
4. **The hero's words after the move** read as before on every route, and a gold word in the middle of a line keeps its spaces. Test: Task 1 `a hero heading keeps the spaces around a gold word`; parity in Tasks 1 and 2.
5. **A new poster's four files** all reach the repository. Tests: Task 2 `a publish carries every print of the poster and its fill`; Task 5 e2e check 32.

---

### Task 1: The hero's words in the Pages tab

**Files:**
- Modify: `api/_lib/content/schema.ts` (`PagesDocSchema.home`), `src/content/pages.json`, `src/admin/pages.ts`, `src/sections/Hero.tsx`
- Create: `src/components/ui/HeroHeading.tsx`, `src/components/ui/HeroHeading.test.tsx`
- Test: `src/admin/pages.test.ts` (the existing table test)

**Interfaces:**
- Produces: `home.hero = { eyebrow, heading, intro, shop, orchid, label }` in `PagesDoc`, placed after `home.seo` in the file and the schema. `HeroHeading({ text }: { text: string })`: the hero's `h1` contents.

- [ ] **Step 1: Write the failing tests.**
  - `src/components/ui/HeroHeading.test.tsx`, `a hero heading keeps the spaces around a gold word`: `renderToStaticMarkup(<HeroHeading text={'A Scented *Memory* of\n*Malaysia*'} />)` contains `aria-label="A Scented"`, then a space, then `<span class="italic text-gilt">`; contains `aria-label="of"` preceded by a space; and contains ` <br/>` before the second line.
  - The table test `every word on the pages has a field, and every field a word` fails once `home.hero` is in `pages.json` (Step 3 writes it first).
- [ ] **Step 2:** Run `npx vitest run src/components/ui/HeroHeading.test.tsx`. Expected: FAIL, the module does not exist.
- [ ] **Step 3: Implement.**
  - `pages.json` `home.hero`: `eyebrow` `Est. 2015 · Kuala Lumpur, Malaysia`, `heading` `A Scented Memory\n*of Malaysia*`, `intro` (today's sentence, one line), `shop` `Explore Fragrances`, `orchid` `Discover Orchid`, `label` `N°01 · The House of Legendary`.
  - Schema: `hero: object({ eyebrow: text(60), heading: heading(80), intro: text(300), shop: text(30), orchid: text(30), label: text(60) })`.
  - `HeroHeading`: each line from `headingLines`; a line after the first is preceded by `' '` and `<br />`; each run is a `SplitText` with `delay={0.35 * line}`, gold runs inside `<span className="italic text-gilt">`; a run's outer spaces are written as plain text outside the `SplitText`, whose inline blocks would swallow them.
  - `Hero.tsx` reads `pages.home.hero` at render; the button links stay `/shop` and `/product/orchid`.
  - `PAGE_SPECS` Home gains a first section `Hero`: `Small line above the heading` (hint `The words over the film. The poster that follows it is on the Poster tab.`), `Heading` (heading kind, `warnAt: 34`, the `DRAWN_FOR` warning), `Introduction` (area, `warnAt: 160`), `First button` (hint `Opens the shop.`), `Second button` (hint `Opens Orchid.`), `Side label` (hint `Runs up the left edge beside the film, on a wide screen.`).
- [ ] **Step 4:** Run `npm test` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5:** Commit: `refactor(content): the hero's words live with the Home page's`.

### Task 2: The poster document, and the hero reading it

**Files:**
- Modify: `api/_lib/content/schema.ts`, `api/_lib/content/keys.ts`, `api/_lib/content/docs.ts`, `src/content/registry.ts`, `src/sections/Hero.tsx`
- Create: `src/content/hero.json`, `src/data/hero.ts`, `src/lib/poster.ts`, `src/lib/poster.test.ts`, `src/sections/Hero.test.tsx`, `tests/api/hero-schema.test.ts`

**Interfaces:**
- Consumes: Task 1's `Hero.tsx`.
- Produces:
  - `HeroDocSchema = object({ poster: PosterSchema })`, `type HeroDoc`, `type PosterEntry`, `type PosterImage`, `type Box = [number, number, number, number]`.
    - `PosterSchema = object({ show: boolean, image: PosterImageSchema, alt: text(300), tone: 'light' | 'dark', words: box, picture: box })`.
    - `PosterImageSchema = object({ prints: array of object({ path: photo, width: positive int }), min 1, widths rising; fill: photo; width; height })`.
    - `box`: a tuple of four fractions with `right - left` and `bottom - top` at least 0.02, message `Give the box some width and height.`
  - `DOC_KEYS` gains `hero`; `DOCS.hero = { path: 'src/content/hero.json', label: 'Hero poster', schema: HeroDocSchema }`; the registry imports it.
  - `src/data/hero.ts`: `export const hero = data as HeroDoc`, read at render.
  - `src/lib/poster.ts`, no React or DOM:
    - `frameFor(width: number, height: number, poster: { image: { width: number; height: number }; words: Box; picture: Box }, header: number): { fit: 'cover' | 'band' | 'card'; x: number; y: number }`: today's function, unchanged, with the header's height passed in.
    - `posterSources(image: PosterImage, resolve?: (path: string) => string): { src: string; srcSet: string }`: `src` is the widest print no wider than 2400 (else the narrowest); `srcSet` lists every print as `<path> <width>w`.
    - `heroSlides(poster: { show: boolean }): readonly ('film' | 'poster')[]`.
- [ ] **Step 1: Write the failing tests.**
  - `src/lib/poster.test.ts`:
    - `the poster frames as it always has`: for the balloon (3200 by 1802 and today's boxes), `frameFor` gives, at 1440 by 900 with an 80 px header, `{ fit: 'cover', x: 74, y: 50 }`; at 1366 by 1024, `band`; at 1024 by 1366 and at 390 by 844, `card`; and at 2560 by 1080 the value today's function gives (computed from the current `Hero.tsx` before the move and pinned).
    - `the poster's sources name each print at its own width`: the balloon gives `src` = its 2400 print and `srcSet` = `…-1280.webp 1280w, …-2400.webp 2400w, …-3200.webp 3200w`; an image with prints 1280 and 2000 gives `src` = the 2000 one.
    - `the poster is a slide only while it is shown`: `heroSlides({ show: true })` is `['film', 'poster']`, `{ show: false }` is `['film']`.
  - `tests/api/hero-schema.test.ts`:
    - `the seeded hero document is valid`.
    - `a box with no width or height is refused`: words `[0.5, 0.3, 0.5, 0.7]` fails at `['poster', 'words']` with the message above.
    - `a publish carries every print of the poster and its fill`: `mediaRefs` of a poster whose three prints and fill are `/assets/cms/` paths returns all four.
  - `src/sections/Hero.test.tsx`, `with the poster off, the hero shows the film alone`: rendered in a `MemoryRouter` with `hero.poster.show` set false (and put back), the markup has no `img` with the poster's alt, no `Next slide` button, and the `video` has `loop`; with it true, both are there.
- [ ] **Step 2:** Run the three files. Expected: FAIL, the modules do not exist.
- [ ] **Step 3: Implement.**
  - `hero.json` holds today's balloon: prints `/assets/client/hero-balloon-1280.webp` (1280), `-2400` (2400), `-3200` (3200), fill `/assets/client/hero-balloon-fill.webp`, size 3200 by 1802, today's alt, `tone: 'light'`, `words: [0.515, 0.288, 0.928, 0.767]`, `picture: [0.12, 0.41, 0.475, 0.955]`, `show: true`.
  - `Hero.tsx`: the slides come from `heroSlides(hero.poster)`; with one slide the film loops and the arrows, ring and poster layer are not drawn; `frameFor` gets `--header-h`; the poster's `src`, `srcSet`, `width`, `height`, `alt` and tone come from the document; `document.hidden` is read only where `document` exists, so the hero renders on the server for the test.
  - `POSTER`, `posterFile` and the local `frameFor` are removed.
- [ ] **Step 4:** Run `npm test` and `npx tsc --noEmit`. Expected: PASS. Then build like production, serve it on 4230 and capture parity. Expected: `node scripts/parity.mjs --compare` against the baseline reports no route differs, and `check:content` says 14 documents valid.
- [ ] **Step 5:** Commit: `refactor(content): the hero poster is a document the site reads`.

### Task 3: One upload makes the poster's four files

**Files:**
- Modify: `api/_lib/content/slots.ts`, `api/_lib/content/images.ts`, `api/admin/media.ts`, `src/lib/api.ts`, `src/admin/PhotoField.tsx`, `src/admin/PhotoLibrary.tsx`
- Test: `tests/api/media.test.ts`

**Interfaces:**
- Produces:
  - `SlotSpec.poster?: boolean`; kind `poster: { label: 'Poster', maxSide: 3200, alpha: false, poster: true }`.
  - `makePoster(master: Buffer): Promise<{ prints: Print[]; fill: Print }>`. A master that is not opaque loses 4 px all round first (the translucent fringe `save_hero_poster` trims), then is laid on white. Prints at 1280, 2400 and 3200 px wide, each no wider than the poster, without repeats, WebP quality 84. The fill is 480 px wide, blurred (sigma 18), WebP quality 70.
  - The derive for a poster kind answers `{ path, prints: [{ path, width }], fill, width, height }`; `path`, `width` and `height` are the widest print's.
  - `adminDerivePhoto` returns those optional fields; `PhotoField`'s `onChange(path, second?, derived?)` passes the whole answer third.
  - The photo picker offers no site photos for the poster kind: the library does not know a site poster's prints or size.
- [ ] **Step 1: Write the failing tests** in `tests/api/media.test.ts`:
  - `a poster gets three widths and a blurred fill`: a 3600 by 2025 upload (master 3200 by 1800) gives prints 1280, 2400 and 3200 wide, a fill 480 wide, and `width` 3200, `height` 1800.
  - `a poster narrower than 3200 px is never enlarged`: 2000 by 1125 gives prints 1280 and 2000.
  - `a poster's see-through edge is trimmed, as the delivery's was`: a 1008 by 568 PNG with a 4 px transparent border gives one print, 1000 wide.
- [ ] **Step 2:** Run it. Expected: FAIL, the kind is unknown.
- [ ] **Step 3:** Implement as above.
- [ ] **Step 4:** Run `npm test`, `npx tsc --noEmit` and `npm run check:functions`. Expected: PASS, 10 functions.
- [ ] **Step 5:** Commit: `feat(content): a poster upload makes its three widths and its fill`.

### Task 4: The Poster tab

**Files:**
- Create: `src/admin/poster.ts`, `src/admin/poster.test.ts`, `src/admin/PosterEditor.tsx`
- Modify: `src/pages/Admin.tsx`

**Interfaces:**
- Consumes: Tasks 2 and 3.
- Produces:
  - `src/admin/poster.ts`, fractions rounded to three places:
    - `moveBox(box: Box, dx: number, dy: number): Box`, kept whole on the poster.
    - `resizeBox(box: Box, corner: 'tl' | 'tr' | 'bl' | 'br', dx: number, dy: number): Box`, kept on the poster and at least `MIN_BOX = 0.04` across and down.
    - `nudgeBox(box: Box, key: string, resize: boolean): Box | null`: an arrow key moves the box by `0.005`, or with `resize` moves its right or bottom edge; any other key gives `null`.
    - `posterImageFrom(derived: { prints?: { path: string; width: number }[]; fill?: string; width: number; height: number }): PosterImage | null`.
  - `PosterEditor`, on a tab `poster` labelled `Poster`, after Pages; the Overview sends `hero` there. Its fields:
    - `Show the poster after the film` (checkbox; hint `Off, the film plays on its own, over and over.`)
    - `Poster` (`PhotoField` kind `poster`, not removable; a new image keeps the boxes)
    - `Describe the poster` (alt; hint `Read aloud to people who cannot see it.`)
    - `Header over the poster` (`Light poster: the header and arrows turn dark` or `Dark poster: they stay light`)
  - **The two boxes.** They sit over the poster: gold for `Words` and ivory for `Picture`. Each can be dragged by its body, resized by its corners, and focused and moved with the arrow keys (Shift with an arrow resizes).
    - Hint: `Drag the gold box over the lettering and the ivory one over the bottle, and a corner to resize. On other screens the poster is cropped around them: the words always stay whole, the picture as far as the words allow.`
  - Three previews, drawn with `frameFor` and an 80 px header: `A laptop` (1440 by 900), `A wide screen` (2560 by 1080) and `A phone` (390 by 844).
- [ ] **Step 1: Write the failing tests** in `src/admin/poster.test.ts`:
  - `a box dragged past the edge stays on the poster`: `moveBox([0.5, 0.3, 0.9, 0.7], 0.3, -0.5)` is `[0.6, 0, 1, 0.4]`.
  - `a corner dragged across the box keeps it at least 4% across`: `resizeBox([0.5, 0.3, 0.9, 0.7], 'br', -0.6, -0.6)` is `[0.5, 0.3, 0.54, 0.34]`; `resizeBox([0.5, 0.3, 0.9, 0.7], 'tl', -0.7, 0.1)` is `[0, 0.4, 0.9, 0.7]`.
  - `the arrow keys move a box, and with Shift resize it`: `nudgeBox([0.5, 0.3, 0.9, 0.7], 'ArrowRight', false)` is `[0.505, 0.3, 0.905, 0.7]`; `nudgeBox(..., 'ArrowDown', true)` is `[0.5, 0.3, 0.9, 0.705]`; `'a'` gives `null`.
  - `a derived poster becomes the poster's image`: prints, fill, width and height carried over; no `prints` gives `null`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test` and `npx tsc --noEmit`. Expected: PASS. **Check it in the browser** on the isolated stack:
  - the tab shows the balloon with both boxes where `hero.json` puts them
  - dragging the gold box moves it, and the laptop preview follows
  - Shift with an arrow key grows it
  - switching the poster off and Previewing `/` shows the film alone
  - Discard returns everything

  Review the screenshots.
- [ ] **Step 5:** Commit: `feat(dashboard): the Poster tab`.

### Task 5: End to end and docs

**Files:**
- Modify: `scripts/dashboard-e2e.mjs`, `README.md`

- [ ] **Step 1:** Bring up a fresh isolated stack.
- [ ] **Step 2: Extend the e2e.** Keep checks 1 to 30, and add:
  31. **The words box and the tone.** Focus the words box and press ArrowRight four times, choose the dark header, and publish. The fake's `hero.json` has `words[0]` 0.02 more than before and `tone: 'dark'`.
  32. **A new poster.** Upload 3600 by 2025 and publish. The fake's `hero.json` names three prints (1280, 2400, 3200) and a fill under `/assets/cms/`, and the fake holds all four files.
  33. **The poster off.** Untick it, then Preview `/`. There is no poster image and no `Next slide` button. Discard.

  Expected: every check passes.
- [ ] **Step 3:** Run `npm run build`. Expected: PASS, with `content: 14 documents valid` and 10 functions. `npm test` passes.
- [ ] **Step 4: Document it.** The README covers:
  - the hero's words, now in Pages, Home, Hero
  - the Poster tab
  - one upload making the four files
  - the boxes and the previews
  - `save_hero_poster` staying for the developer's batch work
- [ ] **Step 5:** Commit: `feat(dashboard): stage 5 end to end checks and docs`. Do not push.
