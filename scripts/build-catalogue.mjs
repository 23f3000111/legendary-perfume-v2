/**
 * Write api/_catalogue.ts, the server's price list, from src/content/products.json.
 *
 * The checkout must never take a price from the browser, so the serverless
 * functions need their own copy of what things cost. The same function writes
 * it here and in the dashboard, which puts it in the same commit as every change
 * to the products: api/_lib/content/catalogue-source.ts. It is TypeScript, so it
 * is bundled with esbuild first.
 *
 * Emitted as TypeScript rather than JSON: a JSON import from an ES module needs
 * an import attribute that older bundlers do not write and older runtimes do not
 * accept, and getting it wrong fails at import time rather than anywhere useful.
 *
 * Run: node scripts/build-catalogue.mjs   (npm run build does this first)
 */
import { build } from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'api/_catalogue.ts')

const result = await build({
  entryPoints: [resolve(ROOT, 'api/_lib/content/catalogue-source.ts')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'neutral',
  target: 'node18',
  logLevel: 'error',
})
const { catalogueSource } = await import(
  'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
)

const { products } = JSON.parse(readFileSync(resolve(ROOT, 'src/content/products.json'), 'utf8'))
if (!Array.isArray(products) || products.length === 0) throw new Error('src/content/products.json holds no products')

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, catalogueSource(products), 'utf8')
console.log(`catalogue: ${products.length} products -> api/_catalogue.ts`)
