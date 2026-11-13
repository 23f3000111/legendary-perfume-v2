/**
 * A small, in-memory GitHub for working on the content dashboard locally.
 *
 * The dashboard publishes by committing to the repository Vercel deploys from.
 * Pointing it at the real repository while developing would put test edits on
 * the live site, so this stands in for the handful of REST endpoints that
 * api/_lib/github.ts calls, against an in-memory git seeded from the working
 * tree (src/content and public/assets).
 *
 * It keeps git's own rules where they matter to the dashboard: blob shas are
 * real git blob shas, a ref update that is not a fast forward is refused with a
 * 422, a request without the expected token gets a 401, and every commit gets
 * a "Vercel" status that reads pending and then success, like a deployment.
 *
 *   node scripts/fake-github.mjs 4010
 *
 * then run the API with GITHUB_API_URL=http://localhost:4010, GITHUB_TOKEN=fake
 * and GITHUB_REPO set to anything of the form owner/name. Tests import
 * startFakeGitHub() and use the returned handle to look inside.
 */
import { createHash, randomBytes } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const sha1 = (data) => createHash('sha1').update(data).digest('hex')
const blobSha = (bytes) => sha1(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes]))

function walk(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...walk(full))
    else found.push(full)
  }
  return found
}

export async function startFakeGitHub({
  port = 4010,
  seedDir = process.cwd(),
  token = 'fake',
  branch = 'main',
  statusDelayMs = 1500,
} = {}) {
  const blobs = new Map() // sha -> Buffer
  const trees = new Map() // sha -> Map(path -> blob sha)
  const commits = new Map() // sha -> { tree, parents, message, date }
  const refs = new Map() // branch -> commit sha
  const statuses = new Map() // commit sha -> state
  let beforeRefUpdate = null
  let onRequest = null

  const putBlob = (bytes) => {
    const sha = blobSha(bytes)
    blobs.set(sha, bytes)
    return sha
  }
  const putTree = (map) => {
    const sha = sha1(JSON.stringify([...map.entries()].sort()))
    trees.set(sha, map)
    return sha
  }
  const putCommit = (commit) => {
    const sha = sha1(JSON.stringify(commit) + randomBytes(8).toString('hex'))
    commits.set(sha, commit)
    return sha
  }

  // The content files are seeded as GitHub holds them. A Windows checkout
  // (core.autocrlf) has CRLF in text files where git stores LF; photos are
  // bytes and are left exactly as they are.
  const seed = new Map()
  for (const sub of ['src/content', 'public/assets']) {
    const dir = resolve(seedDir, sub)
    if (!existsSync(dir)) continue
    for (const file of walk(dir)) {
      const bytes = readFileSync(file)
      const content = sub === 'src/content' ? Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8') : bytes
      seed.set(relative(seedDir, file).split('\\').join('/'), putBlob(content))
    }
  }
  const first = putCommit({ tree: putTree(seed), parents: [], message: 'Seed', date: new Date().toISOString() })
  refs.set(branch, first)
  statuses.set(first, 'success')

  const commitOf = (ref) => refs.get(ref) ?? (commits.has(ref) ? ref : null)
  const isAncestor = (ancestor, of) => {
    const queue = [of]
    while (queue.length) {
      const sha = queue.shift()
      if (sha === ancestor) return true
      queue.push(...(commits.get(sha)?.parents ?? []))
    }
    return false
  }
  /** The entries a commit holds under `path`: the file itself, or everything below it. */
  const slice = (commitSha, path) => {
    const map = trees.get(commits.get(commitSha).tree)
    return JSON.stringify([...map.entries()].filter(([p]) => p === path || p.startsWith(`${path}/`)).sort())
  }

  const readBody = (req) =>
    new Promise((ok, fail) => {
      const chunks = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => ok(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}))
      req.on('error', fail)
    })

  async function route(method, path, query, req) {
    let m
    if (method === 'GET' && (m = path.match(/^git\/ref\/heads\/(.+)$/))) {
      const sha = refs.get(decodeURIComponent(m[1]))
      return sha ? [200, { ref: `refs/heads/${m[1]}`, object: { sha, type: 'commit' } }] : [404, { message: 'Not Found' }]
    }
    if (method === 'GET' && (m = path.match(/^git\/commits\/([0-9a-f]{40})$/))) {
      const commit = commits.get(m[1])
      if (!commit) return [404, { message: 'Not Found' }]
      return [200, {
        sha: m[1],
        tree: { sha: commit.tree },
        parents: commit.parents.map((sha) => ({ sha })),
        message: commit.message,
        author: { date: commit.date },
        committer: { date: commit.date },
      }]
    }
    if (method === 'GET' && (m = path.match(/^git\/trees\/([0-9a-f]{40})$/))) {
      const map = trees.get(m[1])
      if (!map) return [404, { message: 'Not Found' }]
      const tree = [...map.entries()].map(([p, sha]) => ({ path: p, mode: '100644', type: 'blob', sha, size: blobs.get(sha).length }))
      return [200, { sha: m[1], tree, truncated: false }]
    }
    if (method === 'GET' && (m = path.match(/^git\/blobs\/([0-9a-f]{40})$/))) {
      const bytes = blobs.get(m[1])
      return bytes
        ? [200, { sha: m[1], size: bytes.length, encoding: 'base64', content: bytes.toString('base64') }]
        : [404, { message: 'Not Found' }]
    }
    if (method === 'POST' && path === 'git/blobs') {
      const body = await readBody(req)
      return [201, { sha: putBlob(Buffer.from(body.content, body.encoding === 'base64' ? 'base64' : 'utf8')) }]
    }
    if (method === 'POST' && path === 'git/trees') {
      const body = await readBody(req)
      const map = new Map(body.base_tree ? trees.get(body.base_tree) : [])
      for (const entry of body.tree) {
        if (entry.sha === null) map.delete(entry.path)
        else map.set(entry.path, entry.sha)
      }
      return [201, { sha: putTree(map) }]
    }
    if (method === 'POST' && path === 'git/commits') {
      const body = await readBody(req)
      if (!trees.has(body.tree)) return [422, { message: 'Tree SHA does not exist' }]
      const sha = putCommit({ tree: body.tree, parents: body.parents, message: body.message, date: new Date().toISOString() })
      return [201, { sha, tree: { sha: body.tree }, parents: body.parents.map((p) => ({ sha: p })) }]
    }
    if (method === 'PATCH' && (m = path.match(/^git\/refs\/heads\/(.+)$/))) {
      const body = await readBody(req)
      if (beforeRefUpdate) {
        const hook = beforeRefUpdate
        beforeRefUpdate = null
        await hook()
      }
      const name = decodeURIComponent(m[1])
      const current = refs.get(name)
      if (!commits.has(body.sha)) return [422, { message: 'Object does not exist' }]
      if (!body.force && current && !isAncestor(current, body.sha)) {
        return [422, { message: 'Update is not a fast forward' }]
      }
      refs.set(name, body.sha)
      statuses.set(body.sha, 'pending')
      // statusDelayMs: null leaves it pending until setStatus(), for tests
      // that must not race a timer.
      if (statusDelayMs !== null) {
        setTimeout(() => {
          if (statuses.get(body.sha) === 'pending') statuses.set(body.sha, 'success')
        }, statusDelayMs).unref()
      }
      return [200, { ref: `refs/heads/${name}`, object: { sha: body.sha, type: 'commit' } }]
    }
    if (method === 'GET' && (m = path.match(/^contents\/(.+)$/))) {
      const filePath = m[1].split('/').map(decodeURIComponent).join('/')
      const commitSha = commitOf(query.get('ref') ?? branch)
      const sha = commitSha && trees.get(commits.get(commitSha).tree).get(filePath)
      if (!sha) return [404, { message: 'Not Found' }]
      const bytes = blobs.get(sha)
      return [200, { type: 'file', path: filePath, sha, size: bytes.length, encoding: 'base64', content: bytes.toString('base64') }]
    }
    if (method === 'GET' && (m = path.match(/^commits\/([0-9a-f]{40})\/status$/))) {
      if (!commits.has(m[1])) return [422, { message: `No commit found for SHA: ${m[1]}` }]
      const state = statuses.get(m[1])
      return [200, {
        state: state ?? 'pending',
        statuses: state ? [{ context: 'Vercel', state, description: 'Fake deployment' }] : [],
      }]
    }
    if (method === 'GET' && path === 'commits') {
      const filePath = query.get('path') ?? ''
      const limit = Number(query.get('per_page') ?? 30)
      const out = []
      let sha = commitOf(query.get('sha') ?? branch)
      while (sha && out.length < limit) {
        const commit = commits.get(sha)
        const parent = commit.parents[0]
        const changed = filePath ? slice(sha, filePath) !== (parent ? slice(parent, filePath) : '[]') : true
        if (changed) {
          out.push({ sha, commit: { message: commit.message, author: { date: commit.date }, committer: { date: commit.date } } })
        }
        sha = parent
      }
      return [200, out]
    }
    return [404, { message: `The fake does not know ${method} ${path}` }]
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const m = url.pathname.match(/^\/repos\/[^/]+\/[^/]+\/(.+)$/)
    let status = 404
    let body = { message: 'Not Found' }
    try {
      if (req.headers.authorization !== `Bearer ${token}`) {
        ;[status, body] = [401, { message: 'Bad credentials' }]
      } else if (m) {
        const answer = onRequest ? await onRequest(req.method, m[1]) : undefined
        ;[status, body] = answer ?? (await route(req.method, m[1], url.searchParams, req))
      }
    } catch (err) {
      ;[status, body] = [500, { message: String(err?.message ?? err) }]
    }
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
  })

  await new Promise((ok) => server.listen(port, '127.0.0.1', ok))
  const url = `http://127.0.0.1:${server.address().port}`

  return {
    url,
    close: () =>
      new Promise((ok) => {
        server.closeAllConnections?.()
        server.close(() => ok())
      }),
    /** Every file at the branch head, path -> bytes. */
    files: () => {
      const map = trees.get(commits.get(refs.get(branch)).tree)
      return new Map([...map.entries()].map(([p, sha]) => [p, blobs.get(sha)]))
    },
    setStatus: (sha, state) => statuses.set(sha, state),
    /** Run `fn` once, just before the next ref update is applied. */
    onBeforeRefUpdate: (fn) => {
      beforeRefUpdate = fn
    },
    /**
     * Run `fn(method, route)` before every request is answered, `route` being
     * the part after /repos/owner/name/ without the query. Lets a test land a
     * change at an exact point in someone else's sequence of calls. When `fn`
     * returns `[status, body]`, that is the answer and the request goes no
     * further, so a test can have GitHub refuse one kind of call.
     */
    onRequest: (fn) => {
      onRequest = fn
    },
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.argv[2] ?? 4010)
  const token = process.env.FAKE_GITHUB_TOKEN ?? 'fake'
  const fake = await startFakeGitHub({ port, seedDir: process.cwd(), token })
  console.log(`fake GitHub on ${fake.url}, branch main, token "${token}", seeded from ${process.cwd()}`)
}
