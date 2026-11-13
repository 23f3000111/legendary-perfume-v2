/**
 * The content dashboard, end to end, in real browsers, against a local stack.
 *
 *   node scripts/dashboard-e2e.mjs [siteUrl] [fakeGitHubUrl]
 *
 * Needs, all local and none of it production:
 *  - scripts/fake-github.mjs on fakeGitHubUrl (default http://127.0.0.1:4010),
 *    freshly started so it holds only the seed commit;
 *  - scripts/dev-api.mjs with GITHUB_API_URL at that fake, GITHUB_TOKEN=fake,
 *    GITHUB_REPO=local/legendary, ADMIN_PASSWORD=test, and DATABASE_URL at a
 *    throwaway Postgres (or unset, for the file store);
 *  - Vite on siteUrl (default http://localhost:5180) with VITE_DEV_API at the API.
 *
 * Signs in, edits and previews the FAQ, publishes it and waits for "Live",
 * adds a store with an 8000 px photo, restores the FAQ from History, resolves
 * a conflict, edits and previews a journal article, publishes a new one with
 * its photo, restores the Journal, and checks the photo paths in Safari's
 * engine and on a phone.
 * It refuses to run against anything but a local GitHub, so it can never
 * publish to the real repository.
 */
import { chromium, webkit } from 'playwright-core'
import sharp from 'sharp'

const site = process.argv[2] ?? 'http://localhost:5180'
const github = process.argv[3] ?? 'http://127.0.0.1:4010'
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(github)) {
  console.error('Refusing to run: the GitHub URL must be the local fake (scripts/fake-github.mjs).')
  process.exit(2)
}
const PASSWORD = process.env.E2E_PASSWORD ?? 'test'
const TOKEN = process.env.FAKE_GITHUB_TOKEN ?? 'fake'
const REPO = 'local/legendary'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

// ------------------------------------------------------------ the fake GitHub

async function gh(method, route, body) {
  const res = await fetch(`${github}/repos/${REPO}/${route}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${method} ${route} answered ${res.status}`)
  return res.json()
}
const ghFile = async (path) => Buffer.from((await gh('GET', `contents/${path}?ref=main`)).content, 'base64')
const ghJson = async (path) => JSON.parse((await ghFile(path)).toString('utf8'))
async function ghTree() {
  const ref = await gh('GET', 'git/ref/heads/main')
  const commit = await gh('GET', `git/commits/${ref.object.sha}`)
  return (await gh('GET', `git/trees/${commit.tree.sha}?recursive=1`)).tree.map((e) => e.path)
}
/** A change made outside the dashboard, as a developer's push would be. */
async function ghCommit(path, text, message) {
  const ref = await gh('GET', 'git/ref/heads/main')
  const head = await gh('GET', `git/commits/${ref.object.sha}`)
  const blob = await gh('POST', 'git/blobs', { content: text, encoding: 'utf-8' })
  const tree = await gh('POST', 'git/trees', { base_tree: head.tree.sha, tree: [{ path, mode: '100644', type: 'blob', sha: blob.sha }] })
  const commit = await gh('POST', 'git/commits', { message, tree: tree.sha, parents: [ref.object.sha] })
  await gh('PATCH', 'git/refs/heads/main', { sha: commit.sha, force: false })
}
const ghLog = async (path) => (await gh('GET', `commits?path=${encodeURIComponent(path)}&sha=main`)).map((c) => c.commit.message.split('\n')[0])

async function until(test, label, ms = 30000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (await test()) return
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`timed out waiting for ${label}`)
}

// ------------------------------------------------------------------ checks

let failures = 0
const check = (label, ok, detail = '') => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
}

async function signIn(page) {
  await page.goto(`${site}/admin`, { waitUntil: 'networkidle' })
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForSelector('text=Sign out')
}
const openTab = (page, name) => page.click(`header nav button:text-is("${name}")`)

const seedFaq = (await ghFile('src/content/faq.json')).toString('utf8')
const seedJournal = (await ghFile('src/content/journal.json')).toString('utf8')
const browser = await chromium.launch({ executablePath: CHROME })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('dialog', (d) => d.accept())

try {
  // 1. Sign in
  await signIn(page)
  check('1. signs in', true)

  // 2. Change the first FAQ answer
  const answer = `An answer written by the end to end check, ${Date.now()}.`
  await openTab(page, 'FAQ')
  await page.waitForSelector('text=Questions on the FAQ page')
  await page.locator('textarea').nth(1).fill(answer)
  await page.waitForSelector('text=Saved as a draft')
  check('2. the edit is saved as a draft', true)

  // 3. Preview shows it, with the ribbon
  const [preview] = await Promise.all([context.waitForEvent('page'), page.click('button:text-is("Preview")')])
  await preview.waitForURL(/\/faq\?preview/)
  await preview.waitForLoadState('networkidle')
  const previewText = await preview.evaluate(() => document.body.innerText)
  check('3. preview shows the new answer with the ribbon', previewText.includes(answer) && /preview, not published/i.test(previewText))
  await preview.close()

  // 4. Publish runs to Live
  await page.click('button:text-is("Publish")')
  await page.waitForSelector('text=Published. The site updates in about a minute', { timeout: 15000 })
  await page.waitForSelector('text=Live. The site shows your changes.', { timeout: 30000 })
  check('4. publish goes from publishing to live', true)
  await page.click('button:text-is("OK")')

  // 5. The repository holds it
  const faq = await ghJson('src/content/faq.json')
  check('5. the published faq.json holds the answer', faq.sections[0].items[0].a === answer)

  // 6. A new store with an 8000 px transparent photo
  await openTab(page, 'Stores')
  await page.waitForSelector('text=Map search')
  await page.click('button:text-is("Add a store")')
  await page.getByLabel('Name', { exact: true }).last().fill('E2E Test Counter')
  await page.getByLabel('Region', { exact: true }).last().selectOption('Melaka')
  await page.getByLabel('Address', { exact: true }).last().fill('Jalan Hang Jebat, 75200 Melaka')
  await page.getByLabel('Phone', { exact: true }).last().fill('+60 11 0000 0000')
  await page.getByLabel('Opening hours', { exact: true }).last().fill('Daily · 10:00 to 22:00')
  await page.getByLabel('Map search', { exact: true }).last().fill('Jonker Street, Melaka')
  const big = await sharp({ create: { width: 8000, height: 6000, channels: 4, background: { r: 120, g: 60, b: 90, alpha: 0.6 } } })
    .png()
    .toBuffer()
  await page.locator('input[type="file"]').last().setInputFiles({ name: 'counter.png', mimeType: 'image/png', buffer: big })
  await page.waitForFunction(
    () => [...document.images].some((i) => i.src.includes('/api/admin/media?file=') && i.complete && i.naturalWidth > 0),
    null,
    { timeout: 60000 },
  )
  await page.waitForSelector('text=Saved as a draft')
  await page.click('button:text-is("Publish")')
  await page.waitForSelector('text=Live. The site shows your changes.', { timeout: 30000 })
  await page.click('button:text-is("OK")')
  const stores = await ghJson('src/content/stores.json')
  const added = stores.stores.find((s) => s.name === 'E2E Test Counter')
  const files = await ghTree()
  const slot = added?.image && files.find((p) => `/${p.replace(/^public\//, '')}` === added.image)
  const masters = files.filter((p) => p.startsWith('public/assets/cms/m/'))
  const slotSize = slot ? await sharp(await ghFile(slot)).metadata() : null
  check(
    '6. the store, its 900 px photo and the photo master are committed',
    added?.id === 'e2etestcounter' && Boolean(slot) && masters.length === 1 && Math.max(slotSize?.width ?? 0, slotSize?.height ?? 0) === 900,
    `${added?.id} ${added?.image} ${slotSize?.width}x${slotSize?.height}, ${masters.length} master`,
  )

  // 7. History lists both; restoring the FAQ makes a third commit
  await openTab(page, 'History')
  await page.waitForSelector('text=Every published change')
  const history = await page.locator('main').innerText()
  check('7a. history lists the FAQ and Stores publishes', /\bFAQ\b/.test(history) && /\bStores\b/.test(history))
  await page.click('button:text-is("Restore FAQ")')
  await until(async () => (await ghFile('src/content/faq.json')).toString('utf8') === seedFaq, 'the restored FAQ')
  const faqLog = await ghLog('src/content/faq.json')
  check('7b. restoring the FAQ puts the first version back as a third commit', faqLog.length === 3 && faqLog[0].startsWith('Dashboard: restore FAQ to '), faqLog.join(' | '))

  // 8. A conflict: someone changes the FAQ after the draft began
  await openTab(page, 'FAQ')
  await page.waitForSelector('text=Questions on the FAQ page')
  const mine = `Mine, from the dashboard, ${Date.now()}.`
  await page.locator('textarea').nth(1).fill(mine)
  await page.waitForSelector('text=Saved as a draft')
  const theirs = JSON.parse(seedFaq)
  theirs.intro = 'Theirs, changed outside the dashboard.'
  await ghCommit('src/content/faq.json', JSON.stringify(theirs, null, 2) + '\n', 'A developer edit')
  await page.click('button:text-is("Publish")')
  await page.waitForSelector('text=Someone else changed this')
  check('8a. publishing over a newer change opens the conflict dialog', true)
  await page.click('button:text-is("Keep mine")')
  await page.waitForSelector('text=Live. The site shows your changes.', { timeout: 30000 })
  const kept = await ghJson('src/content/faq.json')
  check('8b. Keep mine publishes over it', kept.sections[0].items[0].a === mine)
  await page.click('button:text-is("OK")')

  // 9. A photo that is not really one
  await openTab(page, 'Photos')
  await page.waitForSelector('text=Drop photos here')
  await page.locator('input[type="file"][multiple]').setInputFiles({ name: 'IMG_0001.heic', mimeType: 'image/heic', buffer: Buffer.from('not an image') })
  await page.waitForSelector("text=This photo's format isn't supported. Save it as JPEG or PNG and try again.")
  check('9. a HEIC file gets the format message', true)

  // 11. The Journal: change the first paragraph of an article
  await openTab(page, 'Journal')
  await page.waitForSelector('text=Newest first, as the Journal page shows them.')
  await page.locator('li', { hasText: 'Benefits of Alcohol-Free Perfumes' }).locator('button:text-is("Edit")').click()
  await page.waitForSelector('text=Address: /journal/alcoholfree')
  const body = page.locator('section:has(h2:text-is("Article"))')
  const paragraph = `A paragraph written by the end to end check, ${Date.now()}.`
  await body.locator('textarea').first().fill(paragraph)
  await page.waitForSelector('text=Saved as a draft')
  check('11. a journal paragraph is saved as a draft', true)

  // 12. Preview shows it on the article's own page
  const [articlePreview] = await Promise.all([context.waitForEvent('page'), page.click('button:text-is("Preview")')])
  await articlePreview.waitForURL(/\/journal\/alcoholfree\?preview/)
  await articlePreview.waitForLoadState('networkidle')
  const articleText = await articlePreview.evaluate(() => document.body.innerText)
  check(
    '12. preview shows the new paragraph on /journal/alcoholfree with the ribbon',
    articleText.includes(paragraph) && /preview, not published/i.test(articleText),
  )
  await articlePreview.close()

  // 13. A new article with a 3000 px photo and a heading added below its paragraph, published
  await page.click('button:text-is("All articles")')
  await page.click('button:text-is("New article")')
  await page.waitForSelector('text=Address: /journal/newarticle')
  await page.getByLabel('Title', { exact: true }).fill('Testing the journal')
  await page.getByLabel('Category', { exact: true }).fill('Notes')
  await page.getByLabel('Summary', { exact: true }).fill('A short piece written by the end to end check.')
  const header = page.locator('div:has(> span:text-is("Header photo"))')
  const photo = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: { r: 196, g: 160, b: 104 } } })
    .jpeg()
    .toBuffer()
  await header.locator('input[type="file"]').setInputFiles({ name: 'header.jpg', mimeType: 'image/jpeg', buffer: photo })
  await header.locator('img').waitFor({ timeout: 60000 })
  await page.getByLabel('Header photo description', { exact: true }).fill('A plain sand coloured card')
  await body.locator('textarea').first().fill('The first paragraph of the new article.')
  await body.locator('button:text-is("Add below")').first().click()
  await body.locator('select').first().selectOption('h2')
  await body.locator('button:text-is("Add")').first().click()
  await body.getByLabel('Heading', { exact: true }).fill('A heading added below')
  await page.waitForSelector('text=Saved as a draft')
  await page.click('button:text-is("Publish")')
  await page.waitForSelector('text=Live. The site shows your changes.', { timeout: 30000 })
  await page.click('button:text-is("OK")')
  const journal = await ghJson('src/content/journal.json')
  const fresh = journal.articles.find((a) => a.slug === 'testingthejournal')
  const tree = await ghTree()
  const heroFile = fresh?.hero && tree.find((p) => `/${p.replace(/^public\//, '')}` === fresh.hero)
  const heroSize = heroFile ? await sharp(await ghFile(heroFile)).metadata() : null
  const allMasters = tree.filter((p) => p.startsWith('public/assets/cms/m/'))
  check(
    '13a. the new article is published at its address, the heading after its paragraph',
    fresh?.body?.[1]?.t === 'h2' && fresh?.hero?.startsWith('/assets/cms/') && journal.articles.some((a) => a.body.some((b) => b.text === paragraph)),
    `${fresh?.slug} ${fresh?.hero}`,
  )
  check(
    '13b. its 1600 px photo and the photo master are committed',
    Boolean(heroFile) && Math.max(heroSize?.width ?? 0, heroSize?.height ?? 0) === 1600 && allMasters.length === 2,
    `${heroSize?.width}x${heroSize?.height}, ${allMasters.length} masters in all`,
  )

  // 14. History lists it; restoring the Journal puts the seeded version back
  await openTab(page, 'History')
  await page.waitForSelector('text=Every published change')
  check('14a. history lists the Journal publish', /\bJournal\b/.test(await page.locator('main').innerText()))
  await page.click('button:text-is("Restore Journal")')
  await until(async () => (await ghFile('src/content/journal.json')).toString('utf8') === seedJournal, 'the restored Journal')
  const journalLog = await ghLog('src/content/journal.json')
  check(
    '14b. restoring the Journal puts the seeded file back byte for byte, as a new commit',
    journalLog[0].startsWith('Dashboard: restore Journal to '),
    journalLog.join(' | '),
  )
} catch (err) {
  failures++
  console.log(`FAIL  stopped: ${err.message}`)
  await page.screenshot({ path: 'dashboard-e2e-failure.png' }).catch(() => {})
}

// Safari's engine: canvas cannot write WebP there, so the PNG path is used.
try {
  const safari = await webkit.launch()
  const sp = await (await safari.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  await signIn(sp)
  await openTab(sp, 'Photos')
  await sp.waitForSelector('text=Drop photos here')
  const before = await sp.evaluate(async () => (await (await fetch('/api/admin/media', { credentials: 'include' })).json()).photos.length)
  const png = await sharp({ create: { width: 3000, height: 2000, channels: 4, background: { r: 10, g: 120, b: 90, alpha: 0.5 } } }).png().toBuffer()
  await sp.locator('input[type="file"][multiple]').setInputFiles({ name: 'safari.png', mimeType: 'image/png', buffer: png })
  await until(
    async () => (await sp.evaluate(async () => (await (await fetch('/api/admin/media', { credentials: 'include' })).json()).photos.length)) > before,
    'the Safari upload',
  )
  check('10a. a transparent PNG uploads from Safari\u2019s engine', true)
  await safari.close()
} catch (err) {
  check('10a. a transparent PNG uploads from Safari\u2019s engine', false, err.message)
}

// A phone is told to use a computer for photos.
const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage()
await signIn(phone)
await openTab(phone, 'Photos')
check('10b. on a phone, photo upload says to use a computer', (await phone.locator('text=Use a computer to add photos').count()) > 0)

check('no page errors', errors.length === 0, errors.join(' | '))
console.log(failures ? `\n${failures} FAILED` : '\nall passed')
await browser.close()
process.exit(failures ? 1 : 0)
