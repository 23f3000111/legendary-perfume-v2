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
 * its photo, restores the Journal, publishes a product and restores it, changes
 * the WhatsApp number, adds a partner logo, previews a review, publishes a
 * policy, restores the site details, changes a page's words and the footer,
 * restores the pages, publishes a new Our Story banner with its phone crop and
 * its spot, previews
 * the Stores page's sharing image, and checks the photo paths in Safari's
 * engine and on a phone.
 * It refuses to run against anything but a local GitHub, so it can never
 * publish to the real repository.
 */
import { chromium, webkit } from 'playwright-core'
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

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
const seedProducts = (await ghFile('src/content/products.json')).toString('utf8')
const seedSite = (await ghFile('src/content/site.json')).toString('utf8')
const seedPages = (await ghFile('src/content/pages.json')).toString('utf8')
const browser = await chromium.launch({ executablePath: CHROME })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
/** Every question the dashboard asked, accepted, so the checks can read what it said. */
const dialogs = []
page.on('dialog', (d) => {
  dialogs.push(d.message())
  d.accept()
})

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
  // The description goes in while the photo is still uploading, as the form invites.
  // Placing the photo must not undo it.
  const description = page.getByLabel('Header photo description', { exact: true })
  await description.fill('A plain sand coloured card')
  await header.locator('img').waitFor({ timeout: 60000 })
  const descriptionKept = (await description.inputValue()) === 'A plain sand coloured card'
  check('13c. typing while the photo uploads is kept', descriptionKept, descriptionKept ? '' : `the box holds "${await description.inputValue()}"`)
  if (!descriptionKept) await description.fill('A plain sand coloured card')
  await body.locator('textarea').first().fill('The first paragraph of the new article.')
  await body.locator('button:text-is("Add below")').first().click()
  await body.locator('select').first().selectOption('h2')
  await body.locator('button:text-is("Add")').first().click()
  await body.getByLabel('Heading', { exact: true }).fill('A heading added below')
  await page.waitForSelector('text=Saved as a draft')
  const bar = (await page.locator('div.sticky', { hasText: 'Unpublished changes' }).innerText()).replace(/\s+/g, ' ')
  check(
    '13d. the publish bar names the articles it will put live',
    bar.includes('New: Testing the journal') && bar.includes('Changed: Benefits of Alcohol-Free Perfumes'),
    bar.slice(0, 200),
  )
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
  check(
    '14c. the restore question names the article it takes off the site',
    (dialogs.at(-1) ?? '').includes('This takes Testing the journal off the site.'),
    dialogs.at(-1),
  )
  const journalLog = await ghLog('src/content/journal.json')
  check(
    '14b. restoring the Journal puts the seeded file back byte for byte, as a new commit',
    journalLog[0].startsWith('Dashboard: restore Journal to '),
    journalLog.join(' | '),
  )

  // 15. Two windows on the Journal share its one draft: the window that missed
  // the other's save is told so, and the other window's draft stands.
  const second = await context.newPage()
  second.on('pageerror', (e) => errors.push(String(e)))
  second.on('dialog', (d) => d.accept())
  await second.goto(`${site}/admin`, { waitUntil: 'networkidle' })
  await openTab(second, 'Journal')
  await openTab(page, 'Journal')
  await page.waitForSelector('text=Newest first, as the Journal page shows them.')
  await second.waitForSelector('text=Newest first, as the Journal page shows them.')
  await second.locator('li', { hasText: 'Nyonya Collection' }).locator('button:text-is("Edit")').click()
  await second.getByLabel('Summary', { exact: true }).fill('Changed in the second window.')
  await second.waitForSelector('text=Saved as a draft')
  await page.locator('li', { hasText: 'Perfume Gift Guide' }).locator('button:text-is("Edit")').click()
  await page.getByLabel('Summary', { exact: true }).fill('Changed in the first window.')
  await page.waitForSelector('text=Journal changed in another window. Reload the page to see the latest.', { timeout: 15000 })
  const stored = await second.evaluate(async () => (await (await fetch('/api/admin/content?action=preview', { credentials: 'include' })).json()).drafts.journal)
  check(
    "15. a window that missed another window's save is told so, and the other window's draft stands",
    JSON.stringify(stored).includes('Changed in the second window.') && !JSON.stringify(stored).includes('Changed in the first window.'),
  )
  await second.close()

  // 16. A new product with every photo, previewed, then published at its price
  await openTab(page, 'Products')
  await page.waitForSelector('text=Products on the shop')
  await page.click('button:text-is("New product")')
  await page.waitForSelector('text=Address: /product/newproduct')
  await page.getByLabel('Name', { exact: true }).fill('E2E Test Scent')
  await page.getByLabel('Subtitle', { exact: true }).fill('Written by the end to end check')
  await page.getByLabel('Scent family', { exact: true }).fill('Warm Amber')
  await page.getByLabel('Size', { exact: true }).fill('30ml Eau de Parfum')
  await page.getByLabel('Price (RM)', { exact: true }).fill('95')
  await page.getByLabel('Story', { exact: true }).fill('A product made by the end to end check.')
  await page.getByLabel('Description', { exact: true }).fill('Saffron and amber over a soft musk.')
  await page.getByLabel('Item', { exact: true }).first().fill('E2E Test Scent')
  await page.getByLabel('Detail', { exact: true }).first().fill('30ml eau de parfum')
  await page.getByLabel('Top notes', { exact: true }).fill('Saffron')
  await page.getByLabel('Heart notes', { exact: true }).fill('Amber')
  await page.getByLabel('Base notes', { exact: true }).fill('Musk')
  const productPhoto = async (label, buffer, name, type, onWhite = false) => {
    const place = page.locator(`div:has(> span:text-is("${label}"))`).first()
    if (onWhite) await place.getByLabel('The photo is on a white background: make the white see-through').check()
    await place.locator('input[type="file"]').setInputFiles({ name, mimeType: type, buffer })
    await place.locator('img').waitFor({ timeout: 60000 })
  }
  const solid = (w, h, background) => sharp({ create: { width: w, height: h, channels: 3, background } }).jpeg().toBuffer()
  const seeThrough = (w, h) =>
    sharp({ create: { width: w, height: h, channels: 4, background: { r: 120, g: 60, b: 90, alpha: 0.6 } } }).png().toBuffer()
  const redSquare = await sharp({ create: { width: 400, height: 400, channels: 3, background: { r: 200, g: 20, b: 30 } } }).png().toBuffer()
  const packOnWhite = await sharp({ create: { width: 1200, height: 800, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite([{ input: redSquare, left: 400, top: 200 }])
    .jpeg({ quality: 95 })
    .toBuffer()
  await productPhoto('Lifestyle photo', await solid(3000, 2000, { r: 196, g: 160, b: 104 }), 'life.jpg', 'image/jpeg')
  await productPhoto('Pack cut-out', packOnWhite, 'pack.jpg', 'image/jpeg', true)
  await productPhoto('Box shot', await solid(2000, 2000, { r: 90, g: 60, b: 40 }), 'box.jpg', 'image/jpeg')
  await productPhoto("What's included flat-lay", await seeThrough(1600, 700), 'included.png', 'image/png')
  await productPhoto('Occasion chart', await seeThrough(1100, 875), 'chart.png', 'image/png')
  await page.waitForSelector('text=Saved as a draft')

  const [productPreview] = await Promise.all([context.waitForEvent('page'), page.click('button:text-is("Preview")')])
  await productPreview.waitForURL(/\/product\/e2etestscent\?preview/)
  await productPreview.waitForLoadState('networkidle')
  const productText = await productPreview.evaluate(() => document.body.innerText)
  check(
    '16a. preview shows the new product at /product/e2etestscent with the ribbon',
    productText.includes('E2E Test Scent') && /preview, not published/i.test(productText),
  )
  await productPreview.close()

  await page.click('button:text-is("Publish")')
  await page.waitForSelector('text=Live. The site shows your changes.', { timeout: 30000 })
  await page.click('button:text-is("OK")')
  const shelf = await ghJson('src/content/products.json')
  const made = shelf.products.find((x) => x.id === 'e2etestscent')
  const priceList = (await ghFile('api/_catalogue.ts')).toString('utf8')
  const priced = JSON.parse(priceList.slice(priceList.indexOf('=', priceList.indexOf('PRODUCTS')) + 1))
  check(
    '16b. the product is published, and the server catalogue charges 95 for it',
    made?.price === 95 && priced.e2etestscent?.price === 95,
    `${made?.id} catalogue price ${priced.e2etestscent?.price}`,
  )
  const productFiles = await ghTree()
  const committed = (path) => productFiles.find((f) => `/${f.replace(/^public\//, '')}` === path)
  const lifeSize = await sharp(await ghFile(committed(made.image))).metadata()
  const packSize = await sharp(await ghFile(committed(made.hoverImage))).metadata()
  check(
    '16c. its lifestyle photo is framed square at 1400 px, and its pack shot is see-through',
    lifeSize.width === 1400 && lifeSize.height === 1400 && packSize.hasAlpha === true,
    `${lifeSize.width}x${lifeSize.height}, pack alpha ${packSize.hasAlpha}`,
  )

  // 17. Orchid leads Home's Signature section, so it cannot be removed here
  await page.click('button:text-is("All products")')
  await page.locator('section:has(h2:text-is("Products on the shop")) li', { hasText: 'Orchid' }).first().locator('button:text-is("Remove")').click()
  check("17. Orchid cannot be removed: it leads Home's Signature section", (dialogs.at(-1) ?? '').includes('Signature section'), dialogs.at(-1))

  // 19. Restoring the products puts the shelf and the server catalogue back
  await openTab(page, 'History')
  await page.waitForSelector('text=Every published change')
  await page.click('button:text-is("Restore Products")')
  await until(async () => (await ghFile('src/content/products.json')).toString('utf8') === seedProducts, 'the restored products')
  const restoredPrices = (await ghFile('api/_catalogue.ts')).toString('utf8')
  check(
    '19. restoring the products puts the shelf and the server catalogue back, and the question named what it took off',
    restoredPrices === readFileSync('api/_catalogue.ts', 'utf8').replace(/\r\n/g, '\n') &&
      (dialogs.at(-1) ?? '').includes('This takes E2E Test Scent off the site.'),
    dialogs.at(-1),
  )

  // 20. A new WhatsApp number: previewed on the Contact page and in the footer, then published
  await openTab(page, 'Site')
  await page.waitForSelector('text=WhatsApp number')
  await page.getByLabel('WhatsApp number').fill('+60 12 345 6789')
  await page.waitForSelector('text=Saved as a draft')
  const [contactPreview] = await Promise.all([context.waitForEvent('page'), page.click('button:text-is("Preview")')])
  await contactPreview.waitForURL(/\/contact\?preview/)
  await contactPreview.waitForLoadState('networkidle')
  const contactText = await contactPreview.evaluate(() => document.body.innerText)
  const footerWhatsApp = await contactPreview.locator('footer a[aria-label="WhatsApp"]').getAttribute('href')
  await contactPreview.close()
  await page.click('button:text-is("Publish")')
  await page.waitForSelector('text=Live. The site shows your changes.', { timeout: 30000 })
  await page.click('button:text-is("OK")')
  const publishedSite = await ghJson('src/content/site.json')
  check(
    '20. a new WhatsApp number shows in preview and in the footer link, and is published',
    contactText.includes('+60 12 345 6789') && (footerWhatsApp ?? '').includes('60123456789') && publishedSite.whatsapp === '+60 12 345 6789',
    footerWhatsApp ?? '',
  )

  // 21. A collection products are in cannot be removed
  await page.click('main nav button:has-text("Collections")')
  await page.waitForSelector('text=Add a collection')
  await page.locator('section', { hasText: 'Add a collection' }).getByRole('button', { name: 'Remove' }).first().click()
  check(
    '21. Signature cannot be removed while products are in it',
    /are in Signature\. Move them to another collection first\./.test(dialogs.at(-1) ?? ''),
    dialogs.at(-1),
  )

  // 22. A new partner logo, sent on white, goes live with both its prints
  await page.click('main nav button:has-text("Partner logos")')
  await page.waitForSelector('text=Add a row')
  await page.evaluate(() => {
    const span = [...document.querySelectorAll('span')].find((s) => s.textContent === 'Row 3')
    span.parentElement.parentElement.setAttribute('data-row', '3')
  })
  const row3 = page.locator('[data-row="3"]')
  await row3.locator('button:text-is("Add a logo")').click()
  await row3.getByLabel('Name', { exact: true }).last().fill('E2E Partner')
  const logoBar = await sharp({ create: { width: 600, height: 150, channels: 3, background: { r: 170, g: 20, b: 40 } } }).png().toBuffer()
  const logoOnWhite = await sharp({ create: { width: 900, height: 600, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite([{ input: logoBar, left: 150, top: 225 }])
    .png()
    .toBuffer()
  await row3.locator('input[type="file"]').last().setInputFiles({ name: 'partner.png', mimeType: 'image/png', buffer: logoOnWhite })
  await row3.locator('img[src*="/api/admin/media?file="]').waitFor({ timeout: 60000 })
  await page.waitForSelector('text=Saved as a draft')
  await page.click('button:text-is("Publish")')
  await page.waitForSelector('text=Live. The site shows your changes.', { timeout: 30000 })
  await page.click('button:text-is("OK")')
  const wall = await ghJson('src/content/partners.json')
  const newLogo = wall.rows[2]?.logos.at(-1)
  const logoFiles = await ghTree()
  const inRepo = (path) => logoFiles.find((f) => `/${f.replace(/^public\//, '')}` === path)
  const colourFile = newLogo && inRepo(newLogo.logo)
  const monoFile = newLogo && inRepo(newLogo.mono)
  const colourPrint = colourFile ? await sharp(await ghFile(colourFile)).metadata() : null
  let monoIsGrey = false
  if (monoFile) {
    const { data } = await sharp(await ghFile(monoFile)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    monoIsGrey = true
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 255 && (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2])) monoIsGrey = false
    }
  }
  check(
    '22. a new partner logo goes live last in row 3, its white gone and its black and white print grey',
    newLogo?.name === 'E2E Partner' &&
      Boolean(colourFile && monoFile) &&
      colourPrint?.hasAlpha === true &&
      (colourPrint?.height ?? 999) < 160 &&
      monoIsGrey,
    `${newLogo?.logo} ${newLogo?.mono} ${colourPrint?.width}x${colourPrint?.height}`,
  )

  // 23. A review with four stars shows in preview, and is then discarded
  await page.click('main nav button:has-text("Reviews")')
  await page.waitForSelector('text=Add a review')
  await page.click('button:text-is("Add a review")')
  const reviewQuote = `A review written by the end to end check, ${Date.now()}.`
  await page.getByLabel('Quote').last().fill(reviewQuote)
  await page.getByLabel('Name', { exact: true }).last().fill('e2e.checker')
  await page.getByLabel('Stars').last().selectOption('4')
  await page.waitForSelector('text=Saved as a draft')
  const [homePreview] = await Promise.all([context.waitForEvent('page'), page.click('button:text-is("Preview")')])
  await homePreview.waitForURL(/\/\?preview/)
  await homePreview.waitForLoadState('networkidle')
  const homeText = await homePreview.evaluate(() => document.body.innerText)
  await homePreview.close()
  await page.click('button:text-is("Discard")')
  await page.waitForFunction(() => !document.body.innerText.includes('Unpublished changes:'), null, { timeout: 15000 })
  check('23. a four star review shows its quote in preview, and is discarded', homeText.includes(reviewQuote))

  // 24. A policy's first paragraph: previewed, then published
  await openTab(page, 'Policies')
  await page.waitForSelector('text=The customer care pages')
  await page.locator('main ul li', { hasText: 'Shipping Policy' }).locator('button:text-is("Edit")').click()
  await page.waitForSelector('text=The page')
  const shippingWords = `Orders leave us within one business day, written by the end to end check, ${Date.now()}.`
  await page.locator('textarea').filter({ hasText: 'Orders are typically processed' }).fill(shippingWords)
  await page.waitForSelector('text=Saved as a draft')
  const [policyPreview] = await Promise.all([context.waitForEvent('page'), page.click('button:text-is("Preview")')])
  await policyPreview.waitForURL(/\/shipping\?preview/)
  await policyPreview.waitForLoadState('networkidle')
  const policyText = await policyPreview.evaluate(() => document.body.innerText)
  await policyPreview.close()
  await page.click('button:text-is("Publish")')
  await page.waitForSelector('text=Live. The site shows your changes.', { timeout: 30000 })
  await page.click('button:text-is("OK")')
  const publishedPolicies = await ghJson('src/content/policies.json')
  check(
    "24. the Shipping Policy's new paragraph shows in preview and is published",
    policyText.includes(shippingWords) && JSON.stringify(publishedPolicies.policies[0].body).includes(shippingWords),
  )

  // 25. Restoring the site details puts the seeded file back
  await openTab(page, 'History')
  await page.waitForSelector('text=Every published change')
  await page.click('button:text-is("Restore Site details")')
  await until(async () => (await ghFile('src/content/site.json')).toString('utf8') === seedSite, 'the restored site details')
  check(
    '25. restoring the site details puts the seeded file back, and the question reads as plural',
    (dialogs.at(-1) ?? '').startsWith('Put the Site details back as they were on'),
    dialogs.at(-1),
  )

  // 26. A page's words: the Signature heading, previewed and published
  await openTab(page, 'Pages')
  await page.waitForSelector('text=Each page')
  await page.locator('main ul li', { hasText: 'Home' }).first().locator('button:text-is("Edit")').click()
  await page.waitForSelector('button:text-is("All pages")')
  const signatureLine = `that began it all, ${Date.now()}`
  await page.getByLabel('Heading').first().fill(`Orchid, the scent\n${signatureLine}`)
  await page.waitForSelector('text=Saved as a draft')
  const [signaturePreview] = await Promise.all([context.waitForEvent('page'), page.click('button:text-is("Preview")')])
  await signaturePreview.waitForURL(/\/\?preview/)
  await signaturePreview.waitForLoadState('networkidle')
  const signatureText = await signaturePreview.evaluate(() => document.body.innerText)
  await signaturePreview.close()
  await page.click('button:text-is("Publish")')
  await page.waitForSelector('text=Live. The site shows your changes.', { timeout: 30000 })
  await page.click('button:text-is("OK")')
  const publishedPages = await ghJson('src/content/pages.json')
  check(
    "26. Home's Signature heading shows in preview and is published, its line break kept",
    signatureText.includes(signatureLine) && publishedPages.home.signature.heading === `Orchid, the scent\n${signatureLine}`,
  )

  // 27. The footer's last line shows on every page in preview
  await page.click('button:text-is("All pages")')
  await page.locator('main ul li', { hasText: 'Every page' }).first().locator('button:text-is("Edit")').click()
  await page.waitForSelector('button:text-is("All pages")')
  const copyright = `© 2026 Legendary Perfume, checked ${Date.now()}`
  await page.getByLabel('Last line').fill(copyright)
  await page.waitForSelector('text=Saved as a draft')
  const aboutPreview = await context.newPage()
  await aboutPreview.goto(`${site}/about?preview`, { waitUntil: 'networkidle' })
  const footerText = await aboutPreview.locator('footer').innerText()
  await aboutPreview.close()
  await page.click('button:text-is("Discard")')
  await page.waitForFunction(() => !document.body.innerText.includes('Unpublished changes:'), null, { timeout: 15000 })
  check("27. the footer's last line shows on another page in preview", footerText.includes(copyright))

  // 28. Restoring the pages puts the seeded file back, and the question names the page
  await openTab(page, 'History')
  await page.waitForSelector('text=Every published change')
  await page.click('button:text-is("Restore Pages")')
  await until(async () => (await ghFile('src/content/pages.json')).toString('utf8') === seedPages, 'the restored pages')
  check('28. restoring the pages puts the seeded file back, and the question names Home', (dialogs.at(-1) ?? '').includes('It changes Home.'), dialogs.at(-1))

  // 29. A new banner for Our Story, its spot near the right edge, goes live with both prints
  await openTab(page, 'Pages')
  await page.waitForSelector('text=Each page')
  await page.locator('main ul li', { hasText: 'Our Story' }).first().locator('button:text-is("Edit")').click()
  await page.waitForSelector('button:text-is("All pages")')
  const storyBar = page.locator('section', { has: page.locator('h3', { hasText: 'Our Story · Title bar' }) })
  const storyBottle = await sharp({ create: { width: 300, height: 700, channels: 3, background: { r: 40, g: 30, b: 20 } } }).png().toBuffer()
  const storyPhoto = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: { r: 214, g: 196, b: 160 } } })
    .composite([{ input: storyBottle, left: 2400, top: 400 }])
    .png()
    .toBuffer()
  const storyInputs = storyBar.locator('input[type="file"]')
  await storyInputs.first().setInputFiles({ name: 'story-banner.png', mimeType: 'image/png', buffer: storyPhoto })
  await storyBar.locator('img[src*="/api/admin/media?file="]').first().waitFor({ timeout: 60000 })
  // The designer's phone crop, 1200 by 1000 in the brief, sent larger.
  const storyCrop = await sharp({ create: { width: 2400, height: 2000, channels: 3, background: { r: 214, g: 196, b: 160 } } })
    .composite([{ input: storyBottle, left: 1050, top: 650 }])
    .png()
    .toBuffer()
  await storyInputs.nth(1).setInputFiles({ name: 'story-banner-phone.png', mimeType: 'image/png', buffer: storyCrop })
  await page.waitForFunction(
    () => new Set([...document.querySelectorAll('img[src*="/api/admin/media?file="]')].map((i) => i.getAttribute('src'))).size >= 2,
    null,
    { timeout: 60000 },
  )
  // The spot is set on the new photo, so it waits for that photo to draw.
  const picker = storyBar.locator('[aria-label="Set the spot that stays in view"]')
  await picker.locator('img[src*="/api/admin/media?file="]').evaluate((img) =>
    img.complete && img.naturalWidth > 0 ? null : new Promise((done) => img.addEventListener('load', done, { once: true })),
  )
  // Clicked through the element, which waits for the page's smooth scroll to
  // settle and for the spot to be clear of the publish bar.
  const spot = await picker.boundingBox()
  await picker.click({ position: { x: spot.width * 0.85, y: spot.height * 0.5 } })
  await picker.locator('span[style*="left: 85%"]').waitFor()
  await page.click('button:text-is("Publish")')
  await page.waitForSelector('text=Live. The site shows your changes.', { timeout: 30000 })
  await page.click('button:text-is("OK")')
  const storyBanner = (await ghJson('src/content/pages.json')).about.banner
  const bannerTree = await ghTree()
  const bannerFile = (path) => bannerTree.find((f) => `/${f.replace(/^public\//, '')}` === path)
  const wideFile = storyBanner && bannerFile(storyBanner.image)
  const phoneFile = storyBanner && bannerFile(storyBanner.phone)
  const widePrint = wideFile ? await sharp(await ghFile(wideFile)).metadata() : null
  const phonePrint = phoneFile ? await sharp(await ghFile(phoneFile)).metadata() : null
  check(
    "29. Our Story's new banner and its phone crop go live, 2400 wide and 1200 by 1000, its spot near the right edge",
    /^\/assets\/cms\//.test(storyBanner?.image ?? '') &&
      /^\/assets\/cms\//.test(storyBanner?.phone ?? '') &&
      storyBanner.image !== storyBanner.phone &&
      Boolean(wideFile && phoneFile) &&
      (storyBanner.focus?.x ?? 0) > 0.7 &&
      widePrint?.width === 2400 &&
      phonePrint?.width === 1200 &&
      phonePrint?.height === 1000,
    `${storyBanner?.image} ${storyBanner?.phone} ${JSON.stringify(storyBanner?.focus)} ${widePrint?.width} ${phonePrint?.width}x${phonePrint?.height}`,
  )

  // 30. The Stores page's sharing image is the one og:image its preview carries
  await page.click('button:text-is("All pages")')
  await page.locator('main ul li', { hasText: 'Stores' }).first().locator('button:text-is("Edit")').click()
  await page.waitForSelector('button:text-is("All pages")')
  const storesSearch = page.locator('section', { has: page.locator('h3', { hasText: 'Stores · Search engines' }) })
  const shareCard = await sharp({ create: { width: 1600, height: 840, channels: 3, background: { r: 120, g: 90, b: 60 } } }).png().toBuffer()
  await storesSearch.locator('input[type="file"]').setInputFiles({ name: 'stores-card.png', mimeType: 'image/png', buffer: shareCard })
  const shareImg = storesSearch.locator('img[src*="/api/admin/media?file="]')
  await shareImg.waitFor({ timeout: 60000 })
  const shareFile = (await shareImg.getAttribute('src')).replace(/^.*file=/, '')
  await page.waitForSelector('text=Saved as a draft')
  const storesPreview = await context.newPage()
  await storesPreview.goto(`${site}/stores?preview`, { waitUntil: 'networkidle' })
  const ogImages = await storesPreview.evaluate(() => [...document.querySelectorAll('meta[property="og:image"]')].map((m) => m.content))
  await storesPreview.close()
  await page.click('button:text-is("Discard")')
  await page.waitForFunction(() => !document.body.innerText.includes('Unpublished changes:'), null, { timeout: 15000 })
  check(
    "30. the Stores page's sharing image is the one og:image in its preview",
    ogImages.length === 1 && ogImages[0].endsWith(`/assets/cms/${shareFile}`),
    ogImages.join(' | '),
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
