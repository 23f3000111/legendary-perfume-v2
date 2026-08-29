/**
 * Write the files crawlers read, into dist/ after the Vite build.
 *
 *   sitemap.xml  every indexable URL, with a change frequency and a priority
 *   robots.txt   what may be crawled, and where the sitemap is
 *   llms.txt     the emerging convention for answer engines and assistants: a
 *                plain text brief of what the site is and where its facts live,
 *                for the crawlers that will not run JavaScript to find out
 *   404.html     GitHub Pages has no rewrite rule, so a deep link there is
 *                bounced back through the app rather than dead ending
 *
 * The route list is derived from the real data, so a new fragrance or article
 * appears in the sitemap without anyone remembering to add it.
 *
 * Run: node scripts/build-seo.mjs   (npm run build does this last)
 */
import { build } from 'esbuild'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(ROOT, 'dist')

if (!existsSync(DIST)) {
  console.error('build-seo: dist/ does not exist, run the Vite build first')
  process.exit(1)
}

const SITE = (process.env.SITE_URL ?? 'https://legendary.com.my').replace(/\/$/, '')

/** Bundle a data module so Node can read it, stubbing the browser only bits. */
const stubAsset = {
  name: 'stub-asset',
  setup(b) {
    b.onResolve({ filter: /(^|\/)lib\/asset$/ }, (a) => ({ path: a.path, namespace: 'stub' }))
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'export function asset(p) { return p }',
      loader: 'js',
    }))
  },
}

async function load(entry) {
  const out = await build({
    entryPoints: [resolve(ROOT, entry)],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    target: 'node18',
    plugins: [stubAsset],
  })
  return import(
    'data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64')
  )
}

const { products } = await load('src/data/products.ts')
const { collections } = await load('src/data/collections.ts')
const { articles } = await load('src/data/articles.ts')
const { stores } = await load('src/data/stores.ts')

const today = new Date().toISOString().slice(0, 10)

/** [path, changefreq, priority, lastmod] */
const routes = [
  ['/', 'weekly', '1.0', today],
  ['/shop', 'weekly', '0.9', today],
  ['/shop?filter=bestsellers', 'weekly', '0.8', today],
  ['/shop?for=her', 'weekly', '0.8', today],
  ['/shop?for=him', 'weekly', '0.8', today],
  ['/shop?filter=gifts', 'weekly', '0.8', today],
  ...collections.map((c) => [`/shop?collection=${c.id}`, 'weekly', '0.7', today]),
  ...products.map((p) => [`/product/${p.id}`, 'weekly', '0.9', today]),
  ['/stores', 'monthly', '0.8', today],
  ['/about', 'monthly', '0.7', today],
  ['/journal', 'weekly', '0.7', today],
  ...articles.map((a) => [`/journal/${a.slug}`, 'monthly', '0.6', a.published ?? today]),
  ['/contact', 'monthly', '0.6', today],
  ['/faq', 'monthly', '0.7', today],
  ['/shipping', 'yearly', '0.4', today],
  ['/returns', 'yearly', '0.4', today],
  ['/terms', 'yearly', '0.3', today],
  ['/privacy', 'yearly', '0.3', today],
]

const xmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9"
        xmlns:x="http://www.w3.org/1999/xhtml">
${routes
  .map(
    ([path, freq, priority, lastmod]) => `  <url>
    <loc>${xmlEscape(SITE + path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`.replace('http://www.sitemap.org/schemas/sitemap/0.9', 'http://www.sitemaps.org/schemas/sitemap/0.9')

writeFileSync(resolve(DIST, 'sitemap.xml'), sitemap, 'utf8')

// Checkout and the order lookup are useful to a person and useless to an
// index, and crawling them would only spend budget on pages that carry a
// noindex anyway.
const robots = `# Legendary Perfume
User-agent: *
Allow: /
Disallow: /checkout
Disallow: /order
Disallow: /track
Disallow: /admin
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`
writeFileSync(resolve(DIST, 'robots.txt'), robots, 'utf8')

// llms.txt: a plain brief for answer engines. Facts, not marketing, because
// what gets quoted back to a customer should be true and checkable.
const bestsellers = products.filter((p) => p.bestseller).map((p) => p.name)
const llms = `# Legendary

> A Malaysian perfume house, founded in 2015 in Kuala Lumpur. Legendary composes
> eau de parfum inspired by Malaysia's landscapes, Peranakan heritage and
> culture, and sells across Malaysia online and through its own counters.

## Facts

- Founded: 2015, Kuala Lumpur, Malaysia
- Flagship boutique: Jalan Hang Lekir, Melaka
- Currency: Malaysian Ringgit (MYR)
- Delivery: free on every order, within Malaysia only. No international shipping.
- Payment: card, FPX online banking and other Malaysian methods, via Stripe
- Orders: no account is needed. Every order gets a reference of the form
  LG-XXXX-XXXX, and can be looked up at ${SITE}/track with that reference and
  the email address it was placed with.
- Contact: noreply@legendary.com.my, WhatsApp +60 19 383 6633

## Collections

${collections.map((c) => `- **${c.name}** (${c.tagline}): ${c.description}`).join('\n')}

## Fragrances

${products
  .map((p) => `- [${p.name}](${SITE}/product/${p.id}) — ${p.size}, RM ${p.price}. ${p.description}`)
  .join('\n')}

## Bestsellers

${bestsellers.map((n) => `- ${n}`).join('\n')}

## Boutiques

${stores.map((s) => `- ${s.name}, ${s.address}`).join('\n')}

## Pages

- [All fragrances](${SITE}/shop)
- [Our story](${SITE}/about)
- [Store locator](${SITE}/stores)
- [Journal](${SITE}/journal)
${articles.map((a) => `- [${a.title}](${SITE}/journal/${a.slug})`).join('\n')}
- [Frequently asked questions](${SITE}/faq)
- [Shipping policy](${SITE}/shipping)
- [Returns, refunds and exchanges](${SITE}/returns)
- [Contact](${SITE}/contact)
`
writeFileSync(resolve(DIST, 'llms.txt'), llms, 'utf8')

/*
 * GitHub Pages serves no rewrite, so a deep link lands on its 404. This copy of
 * index.html restores the path from sessionStorage once the app has booted, so
 * the static preview keeps working now that the site is on real paths rather
 * than hash fragments. Vercel never reaches this: its rewrite handles the same
 * case server side.
 */
const index = readFileSync(resolve(DIST, 'index.html'), 'utf8')
const redirect = `<script>
  // Remember where the visitor was actually going, then load the app at the
  // root so its own router can take them there.
  sessionStorage.setItem('legendary:redirect', location.pathname + location.search + location.hash)
  location.replace(document.querySelector('base')?.href || '/')
</script>`
writeFileSync(resolve(DIST, '404.html'), index.replace('</head>', `${redirect}</head>`), 'utf8')

console.log(
  `seo: sitemap.xml (${routes.length} urls), robots.txt, llms.txt, 404.html -> dist/  [${SITE}]`,
)
