/**
 * Capture what every public page shows, to prove a refactor changed nothing.
 *
 * Moving content out of code and into the dashboard's JSON must not change a
 * single word or photo on the site. This visits every route in the built
 * sitemap (so every product and article is included), and records the page's
 * visible text and the address of every image on it.
 *
 *   node scripts/parity.mjs <baseUrl> <out.json>      capture
 *   node scripts/parity.mjs --compare <a.json> <b.json>  exit 1 if they differ
 *
 * Capture runs the installed Chrome through playwright-core, with reduced
 * motion so counters and reveals are read at rest, and the intro curtain
 * skipped. Serve a build first: `npx vite preview --port 4230` after building
 * with VITE_BASE set to "/".
 */
import { readFileSync, writeFileSync } from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

if (process.argv[2] === '--compare') {
  const [a, b] = process.argv.slice(3).map((f) => JSON.parse(readFileSync(f, 'utf8')))
  const routes = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  let differ = 0
  for (const route of routes) {
    const x = a[route]
    const y = b[route]
    if (JSON.stringify(x) === JSON.stringify(y)) continue
    differ += 1
    console.log(`DIFFERS  ${route}`)
    if (!x || !y) {
      console.log(`  only in ${x ? 'the first' : 'the second'} capture`)
      continue
    }
    if (x.text !== y.text) {
      let i = 0
      while (i < x.text.length && x.text[i] === y.text[i]) i++
      console.log(`  text from character ${i}:`)
      console.log(`    before: …${x.text.slice(Math.max(0, i - 40), i + 80)}…`)
      console.log(`    after:  …${y.text.slice(Math.max(0, i - 40), i + 80)}…`)
    }
    const gone = x.images.filter((s) => !y.images.includes(s))
    const added = y.images.filter((s) => !x.images.includes(s))
    for (const s of gone) console.log(`  image gone:  ${s}`)
    for (const s of added) console.log(`  image added: ${s}`)
  }
  console.log(differ ? `\n${differ} of ${routes.length} routes differ` : `\nall ${routes.length} routes identical`)
  process.exit(differ ? 1 : 0)
}

const [base, out] = process.argv.slice(2)
if (!base || !out) {
  console.error('usage: node scripts/parity.mjs <baseUrl> <out.json>')
  process.exit(2)
}

const { chromium } = await import('playwright-core')

const xml = await (await fetch(`${base}/sitemap.xml`)).text()
const routes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
  const url = new URL(m[1].replace(/&amp;/g, '&'))
  return url.pathname + url.search
})
if (routes.length === 0) {
  console.error(`no routes in ${base}/sitemap.xml`)
  process.exit(1)
}

const browser = await chromium.launch({ executablePath: CHROME })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
await context.addInitScript(() => sessionStorage.setItem('legendary-intro', '1'))

const result = {}
for (const route of routes) {
  const page = await context.newPage()
  await page.goto(base + route, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  result[route] = await page.evaluate(() => ({
    text: document.body.innerText.replace(/\s+/g, ' ').trim(),
    images: [...document.images].map((img) => img.currentSrc || img.src).sort(),
  }))
  await page.close()
  process.stdout.write('.')
}
await browser.close()

writeFileSync(out, JSON.stringify(result, null, 1))
console.log(`\n${routes.length} routes -> ${out}`)
