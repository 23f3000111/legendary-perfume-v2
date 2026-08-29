/**
 * Serve the /api functions locally, so the shop works end to end in dev.
 *
 * `vercel dev` does this too, and is the more faithful thing to run before a
 * release, but it needs the CLI installed and the project linked. This has no
 * such setup: it bundles each handler with esbuild, rebuilds it when the file
 * changes, and serves it on the port Vite's proxy already points at.
 *
 * Handles both handler shapes, because the webhook is written against the Web
 * `Request` to get at Stripe's raw body while the rest take (req, res).
 *
 * Run: npm run dev:api      (alongside npm run dev)
 */
import { build } from 'esbuild'
import { createServer } from 'node:http'
import { readFileSync, readdirSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const API = resolve(ROOT, 'api')
const PORT = Number(process.env.API_PORT ?? 3000)
/* Inside node_modules, not the OS temp dir: a bundle keeps `stripe`, `pg` and
   `resend` external, so it has to sit somewhere Node will resolve them from. */
const WORK = resolve(ROOT, 'node_modules/.cache/legendary-api')
mkdirSync(WORK, { recursive: true })

// Load .env the way the platform would.
if (existsSync(resolve(ROOT, '.env'))) {
  for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

/** Route -> source file, for every api/**.ts that is not a _private one. */
/*
 * Refuse to run the local API against live Stripe keys.
 *
 * Nothing about localhost makes a payment pretend: a live key here creates real
 * PaymentIntents and a real card entered on the local checkout is really
 * charged. Live keys belong in the hosting platform's environment, never in a
 * .env on a laptop, so this stops rather than warns.
 *
 * ALLOW_LIVE_KEYS_LOCALLY=1 overrides it, for the one case that is legitimate:
 * a final smoke of the live path before launch, done deliberately.
 */
const liveKey = (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_live_')
if (liveKey && process.env.ALLOW_LIVE_KEYS_LOCALLY !== '1') {
  console.error('')
  console.error('  Refusing to start: STRIPE_SECRET_KEY is a LIVE key.')
  console.error('')
  console.error('  A live key here takes real payments from real cards. Put the live keys')
  console.error('  in Vercel and keep the sk_test_ / pk_test_ pair in .env for local work')
  console.error('  (Stripe dashboard, Test mode toggle, Developers -> API keys).')
  console.error('')
  console.error('  If you really mean to exercise the live path, run with')
  console.error('  ALLOW_LIVE_KEYS_LOCALLY=1.')
  console.error('')
  process.exit(1)
}

const routes = new Map()
function scan(dir, prefix) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      scan(full, `${prefix}/${entry.name}`)
    } else if (entry.name.endsWith('.ts')) {
      routes.set(`${prefix}/${entry.name.replace(/\.ts$/, '')}`, full)
    }
  }
}
scan(API, '/api')

const cache = new Map()

async function loadHandler(file) {
  const stamp = statSync(file).mtimeMs
  const hit = cache.get(file)
  if (hit?.stamp === stamp) return hit.handler
  const outfile = join(WORK, `${Buffer.from(file).toString('hex').slice(-24)}-${stamp}.mjs`)
  await build({
    entryPoints: [file],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    external: ['pg', 'stripe', 'resend'],
    absWorkingDir: ROOT,
    loader: { '.json': 'json' },
    logLevel: 'error',
  })
  const mod = await import(pathToFileURL(outfile).href)
  cache.set(file, { stamp, handler: mod.default })
  return mod.default
}

function readBody(req) {
  return new Promise((ok, fail) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => ok(Buffer.concat(chunks)))
    req.on('error', fail)
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const file = routes.get(url.pathname)

  if (!file) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: `No such endpoint: ${url.pathname}` }))
    return
  }

  const started = Date.now()
  try {
    const handler = await loadHandler(file)
    const raw = await readBody(req)

    // A handler that takes one argument is written against the Web Request.
    if (handler.length === 1) {
      const request = new Request(url.href, {
        method: req.method,
        headers: req.headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : raw,
      })
      const out = await handler(request)
      res.writeHead(out.status, Object.fromEntries(out.headers))
      res.end(Buffer.from(await out.arrayBuffer()))
    } else {
      const isJson = (req.headers['content-type'] ?? '').includes('application/json')
      req.body = isJson && raw.length ? JSON.parse(raw.toString('utf8')) : raw.toString('utf8')
      req.query = Object.fromEntries(url.searchParams)
      let status = 200
      const shim = {
        status(c) { status = c; return shim },
        setHeader(k, v) { res.setHeader(k, v) },
        send(b) { res.writeHead(status); res.end(b) },
      }
      await handler(req, shim)
    }
  } catch (err) {
    console.error(`[dev-api] ${url.pathname} threw:`, err)
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Handler failed. See the dev:api console.' }))
  }
  console.log(`[dev-api] ${req.method} ${url.pathname} ${res.statusCode} ${Date.now() - started}ms`)
})

process.on('exit', () => { try { rmSync(WORK, { recursive: true, force: true }) } catch {} })

server.listen(PORT, () => {
  console.log(`[dev-api] ${routes.size} endpoints on http://localhost:${PORT}`)
  for (const path of routes.keys()) console.log(`[dev-api]   ${path}`)
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[dev-api] STRIPE_SECRET_KEY is unset, the checkout will not open')
  }
})
