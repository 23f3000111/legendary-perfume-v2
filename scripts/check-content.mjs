/**
 * Refuse to build with content the dashboard would not have published.
 *
 * The dashboard checks every document against its schema before Publish, and
 * the publish function checks again. This is the third check, at build time,
 * for content that reached the repository some other way: a hand edit, a
 * merge, or a dashboard bug. A failure here fails the Vercel build, and Vercel
 * then keeps the previous deployment live, so a bad document can never take
 * the site down.
 *
 * The schemas are TypeScript under api/_lib/content, so they are bundled with
 * esbuild first, the way build-catalogue.mjs reads the products.
 *
 * Run: node scripts/check-content.mjs [rootDir]   (npm run build does this)
 * rootDir defaults to the repository, so a scratch copy can be checked.
 */
import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = resolve(process.argv[2] ?? REPO)

const result = await build({
  entryPoints: [resolve(REPO, 'api/_lib/content/docs.ts')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  logLevel: 'error',
})
const { DOCS } = await import(
  'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
)

let failed = 0
for (const [key, spec] of Object.entries(DOCS)) {
  let data
  try {
    data = JSON.parse(readFileSync(resolve(root, spec.path), 'utf8'))
  } catch (err) {
    failed += 1
    console.log(`  ${key}  ${spec.path} cannot be read: ${err.message}`)
    continue
  }
  const parsed = spec.schema.safeParse(data)
  if (!parsed.success) {
    failed += 1
    for (const issue of parsed.error.issues) {
      console.log(`  ${key} ${issue.path.join('.')}  ${issue.message}`)
    }
  }
}

const total = Object.keys(DOCS).length
if (failed) {
  console.log(`\ncontent: ${failed} of ${total} documents would not publish`)
  process.exit(1)
}
console.log(`content: ${total} documents valid`)
