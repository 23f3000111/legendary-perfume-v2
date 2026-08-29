/**
 * Load every serverless function the way the platform does.
 *
 * Vercel does not bundle these. It transpiles each file on its own, leaving the
 * import specifiers exactly as written, and Node then resolves them at runtime
 * as ES modules. That is a stricter environment than a bundler: an extensionless
 * relative import works fine when esbuild resolves it and fails outright under
 * Node ESM, which is how six functions once deployed green and then returned
 * FUNCTION_INVOCATION_FAILED on every request.
 *
 * So this reproduces that exactly: transpile per file into a directory beside
 * the project, keeping the tree, then import each endpoint and check it exposes
 * a callable handler. Nothing is bundled and nothing is stubbed.
 *
 * Run: npm run check:functions   (npm run build does this before deploying)
 */
import { transform } from 'esbuild'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const API = resolve(ROOT, 'api')
// Inside the project, so node_modules and the root package.json "type" both
// resolve the way they will on the platform.
const OUT = resolve(ROOT, '.tmp-functions')

function walk(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...walk(full))
    else if (entry.name.endsWith('.ts')) found.push(full)
  }
  return found
}

rmSync(OUT, { recursive: true, force: true })

const sources = walk(API)
for (const file of sources) {
  const { code } = await transform(readFileSync(file, 'utf8'), {
    loader: 'ts',
    format: 'esm',
    target: 'node22',
    sourcefile: file,
  })
  const dest = join(OUT, relative(API, file).replace(/\.ts$/, '.js'))
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, code, 'utf8')
}

// Endpoints are the routed files: everything except the _private modules.
const endpoints = sources
  .map((f) => relative(API, f).replace(/\\/g, '/'))
  .filter((f) => !f.split('/').some((part) => part.startsWith('_')))

let failed = 0
for (const rel of endpoints) {
  const url = pathToFileURL(join(OUT, rel.replace(/\.ts$/, '.js'))).href
  try {
    const mod = await import(url)
    if (typeof mod.default !== 'function') {
      throw new Error('no callable default export')
    }
    console.log(`  ok    /api/${rel.replace(/\.ts$/, '')}`)
  } catch (err) {
    failed += 1
    const detail = String(err.message ?? err).split('\n')[0]
    console.log(`  FAIL  /api/${rel.replace(/\.ts$/, '')}`)
    console.log(`        ${detail}`)
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('        Node ESM does not guess extensions. Relative imports')
      console.log('        need the .js the transpiled file will have.')
    }
  }
}

rmSync(OUT, { recursive: true, force: true })

console.log(
  failed
    ? `\n${failed} of ${endpoints.length} functions would not load on the platform`
    : `\nall ${endpoints.length} functions load`,
)
process.exit(failed ? 1 : 0)
