import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth.js'
import { handler, HttpError, json } from '../_lib/http.js'
import { DOC_KEYS, DOCS, isDocKey, type DocKey } from '../_lib/content/docs.js'
import { findDashes, mediaRefs } from '../_lib/content/schema.js'
import { contentStore, type ContentStore, type Draft } from '../_lib/content/store.js'
import {
  blobSha, branchHead, commitDate, commitFiles, deployState, fileHistory, githubConfig, GitHubError, listFiles,
  readFile, StaleBranchError, type GitHubConfig,
} from '../_lib/github.js'

/**
 * The content dashboard's documents, for the Legendary team to edit and publish.
 *
 *   GET    ?action=state            every document, published and drafted
 *   PUT    ?action=draft            { doc, data, base } save as they type
 *   DELETE ?action=draft&doc=       discard a draft
 *   GET    ?action=preview          drafts and unpublished photos, for ?preview
 *   POST   ?action=publish          { docs, overwrite? } one commit, Vercel deploys it; answers { commit, shas }
 *   GET    ?action=history&doc=     what changed, newest first
 *   GET    ?action=version&doc=&sha=  a document as it was
 *   POST   ?action=restore          { doc, sha } put one document back, as a new commit
 *   GET    ?action=status&sha=      whether Vercel has deployed a commit
 *
 * Published content is read from GitHub, not from this deployment's bundle, so
 * the dashboard edits what is on the branch even while a deploy is running.
 *
 * The conflict rule: a draft remembers the version it started from. If the
 * document has changed on GitHub since (a developer's commit, a second tab),
 * publishing stops with 409 and the dashboard asks which to keep. Nothing is
 * ever silently overwritten, and the ref update itself is never forced.
 */

const NOT_SET_UP = 'Publishing is not set up yet. Add GITHUB_TOKEN and GITHUB_REPO in Vercel.'
const TOKEN_REFUSED = 'GitHub refused the publishing token. Ask the developer to renew it.'
const MAX_DOC_CHARS = 1_000_000

interface Issue {
  path: string
  message: string
}

function check(doc: DocKey, data: unknown): { issues: Issue[]; parsed: unknown } {
  const result = DOCS[doc].schema.safeParse(data)
  if (result.success) return { issues: [], parsed: result.data }
  return {
    issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    parsed: null,
  }
}

/** The repository's format for content, so a dashboard edit diffs cleanly. */
const asFile = (data: unknown) => JSON.stringify(data, null, 2) + '\n'

const labels = (docs: DocKey[]) => docs.map((d) => DOCS[d].label).join(', ')

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)

function readBody(req: VercelRequest): Record<string, unknown> {
  const raw = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

function want(req: VercelRequest, method: string) {
  if (req.method !== method) throw new HttpError(405, `Use ${method} for this.`)
}

function docParam(value: unknown): DocKey {
  const doc = first(value)
  if (!isDocKey(doc)) throw new HttpError(400, 'Unknown document.')
  return doc
}

function shaParam(value: unknown): string {
  const sha = first(value)
  if (typeof sha !== 'string' || !/^[0-9a-f]{7,40}$/.test(sha)) throw new HttpError(400, 'Unknown version.')
  return sha
}

/** A published document's version as the dashboard last read it: a blob sha, or null when it had none. */
function baseParam(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || !/^[0-9a-f]{40}$/.test(value)) throw new HttpError(400, 'Unknown version.')
  return value
}

async function published(cfg: GitHubConfig, doc: DocKey): Promise<{ data: unknown; sha: string | null }> {
  const file = await readFile(cfg, DOCS[doc].path)
  return { data: file ? JSON.parse(file.text) : null, sha: file?.sha ?? null }
}

async function draftsByDoc(store: ContentStore): Promise<Map<DocKey, Draft>> {
  return new Map((await store.drafts()).map((d) => [d.doc, d]))
}

// ------------------------------------------------------------------ actions

async function state(cfg: GitHubConfig, store: ContentStore) {
  const [drafts, current] = await Promise.all([
    draftsByDoc(store),
    Promise.all(DOC_KEYS.map((doc) => published(cfg, doc))),
  ])
  const docs: Record<string, unknown> = {}
  DOC_KEYS.forEach((doc, i) => {
    const draft = drafts.get(doc)
    const showing = draft ? draft.data : current[i].data
    docs[doc] = {
      label: DOCS[doc].label,
      published: current[i].data,
      sha: current[i].sha,
      draft: draft?.data ?? null,
      draftBase: draft?.baseSha ?? null,
      errors: check(doc, showing).issues,
      warnings: findDashes(showing),
    }
  })
  return { configured: true, branch: cfg.branch, durable: store.durable, docs }
}

async function saveDraft(cfg: GitHubConfig, store: ContentStore, req: VercelRequest) {
  const input = readBody(req)
  const doc = docParam(input.doc)
  const data = input.data
  if (!data || typeof data !== 'object') throw new HttpError(400, 'Nothing to save.')
  if (JSON.stringify(data).length > MAX_DOC_CHARS) throw new HttpError(413, 'That is too much to save at once.')
  // The base is the published version the draft starts from. The dashboard
  // sends the version its copy was loaded from, which may be older than what
  // GitHub holds now: a second tab may have published, or a developer pushed,
  // while this one sat open. Reading GitHub here instead would make that newer
  // change the base and let the publish overwrite it unasked. A later save
  // keeps the first base (see store.ts).
  const sent = 'base' in input ? baseParam(input.base) : undefined
  const existing = (await draftsByDoc(store)).get(doc)
  const baseSha = existing ? existing.baseSha : sent !== undefined ? sent : (await published(cfg, doc)).sha
  const draft = await store.saveDraft(doc, data, baseSha)
  return { draft, errors: check(doc, data).issues, warnings: findDashes(data) }
}

async function preview(store: ContentStore) {
  const [drafts, media] = await Promise.all([store.drafts(), store.listMedia()])
  return {
    drafts: Object.fromEntries(drafts.map((d) => [d.doc, d.data])),
    media: media.filter((m) => !m.published).map((m) => `/assets/cms/${m.file}`),
  }
}

/**
 * The photos a publish has to carry: every dashboard photo the documents use
 * that the repository does not have yet, with the large copy it was made from
 * so it can be reused later. A missing large copy does not stop the publish;
 * a missing photo does, because the page would show a broken image.
 */
async function photosFor(
  cfg: GitHubConfig,
  store: ContentStore,
  ready: { doc: DocKey; parsed: unknown }[],
): Promise<{ files: { path: string; content: Buffer }[]; photos: string[] }> {
  const refs = new Map<string, DocKey>()
  for (const { doc, parsed } of ready) for (const ref of mediaRefs(parsed)) if (!refs.has(ref)) refs.set(ref, doc)
  if (refs.size === 0) return { files: [], photos: [] }

  const inRepo = await listFiles(cfg, 'public/assets/cms/')
  const files: { path: string; content: Buffer }[] = []
  const photos: string[] = []
  const add = async (file: string): Promise<boolean> => {
    const path = `public/assets/cms/${file}`
    if (inRepo.has(path) || photos.includes(file)) return true
    const row = await store.getMedia(file)
    if (!row) return false
    files.push({ path, content: row.bytes })
    photos.push(file)
    if (row.source) await add(row.source)
    return true
  }
  for (const [ref, doc] of refs) {
    if (!(await add(ref.slice('/assets/cms/'.length)))) {
      throw new HttpError(400, `A photo in ${DOCS[doc].label} is missing. Upload it again.`)
    }
  }
  return { files, photos }
}

async function publish(cfg: GitHubConfig, store: ContentStore, req: VercelRequest): Promise<[number, unknown]> {
  const input = readBody(req)
  const docs = Array.isArray(input.docs) ? [...new Set(input.docs)] : []
  if (docs.length === 0 || !docs.every(isDocKey)) throw new HttpError(400, 'Choose what to publish.')
  const overwrite = new Set(Array.isArray(input.overwrite) ? input.overwrite.filter(isDocKey) : [])

  const drafts = await draftsByDoc(store)
  const ready: { doc: DocKey; draft: Draft; parsed: unknown }[] = []
  const errors: Partial<Record<DocKey, Issue[]>> = {}
  for (const doc of docs) {
    const draft = drafts.get(doc)
    if (!draft) throw new HttpError(400, `There are no changes to publish in ${DOCS[doc].label}.`)
    const { issues, parsed } = check(doc, draft.data)
    if (issues.length) errors[doc] = issues
    else ready.push({ doc, draft, parsed })
  }
  if (Object.keys(errors).length) {
    return [400, { error: 'Some fields need attention before this can be published.', errors }]
  }

  // A branch that moves mid-publish gets one more try, conflict check included.
  // Each try checks the documents at one head and commits on that same head,
  // so a push landing between the check and the commit is never built over.
  for (let attempt = 0; ; attempt++) {
    const head = await branchHead(cfg)
    const conflicts: DocKey[] = []
    for (const { doc, draft } of ready) {
      const current = await readFile(cfg, DOCS[doc].path, head.commit)
      if ((current?.sha ?? null) !== draft.baseSha && !overwrite.has(doc)) conflicts.push(doc)
    }
    if (conflicts.length) {
      return [409, { error: `${labels(conflicts)} changed since you began editing.`, conflicts }]
    }

    const { files, photos } = await photosFor(cfg, store, ready)
    const written = ready.map(({ doc, parsed }) => ({ doc, path: DOCS[doc].path, content: asFile(parsed) }))
    try {
      const commit = await commitFiles(cfg, {
        message: `Dashboard: ${labels(docs)}`,
        files: [...files, ...written.map(({ path, content }) => ({ path, content }))],
        parent: head,
      })
      // The dashboard holds editing while a publish runs, so nothing typed
      // since the draft was read is lost here.
      for (const { doc } of ready) await store.deleteDraft(doc)
      await store.markPublished(photos)
      // The version each document is now, so the dashboard's next draft of
      // it starts from what was just published.
      const shas = Object.fromEntries(written.map(({ doc, content }) => [doc, blobSha(content)]))
      return [200, { commit, shas }]
    } catch (err) {
      if (!(err instanceof StaleBranchError)) throw err
      if (attempt > 0) return [409, { error: 'The site changed while publishing. Please try again.', conflicts: [] }]
    }
  }
}

async function history(cfg: GitHubConfig, req: VercelRequest) {
  if (first(req.query.doc)) {
    const doc = docParam(req.query.doc)
    return { commits: (await fileHistory(cfg, DOCS[doc].path)).map((c) => ({ ...c, docs: [doc] })) }
  }
  const merged = new Map<string, { sha: string; date: string; message: string; docs: DocKey[] }>()
  const all = await Promise.all(DOC_KEYS.map((doc) => fileHistory(cfg, DOCS[doc].path)))
  DOC_KEYS.forEach((doc, i) => {
    for (const c of all[i]) {
      const entry = merged.get(c.sha) ?? { ...c, docs: [] }
      entry.docs.push(doc)
      merged.set(c.sha, entry)
    }
  })
  return { commits: [...merged.values()].sort((a, b) => b.date.localeCompare(a.date)) }
}

async function version(cfg: GitHubConfig, req: VercelRequest) {
  const doc = docParam(req.query.doc)
  const file = await readFile(cfg, DOCS[doc].path, shaParam(req.query.sha))
  if (!file) throw new HttpError(404, 'That version could not be found.')
  return { data: JSON.parse(file.text) }
}

async function restore(cfg: GitHubConfig, store: ContentStore, req: VercelRequest) {
  const input = readBody(req)
  const doc = docParam(input.doc)
  const sha = shaParam(input.sha)
  const label = DOCS[doc].label
  if ((await draftsByDoc(store)).has(doc)) {
    throw new HttpError(409, `Publish or discard the unpublished changes to ${label} first.`)
  }
  const old = await readFile(cfg, DOCS[doc].path, sha)
  if (!old) throw new HttpError(404, 'That version could not be found.')
  const { issues, parsed } = check(doc, JSON.parse(old.text))
  if (issues.length) throw new HttpError(400, `That version of ${label} no longer fits the site, so it cannot be restored.`)

  const when = new Date(await commitDate(cfg, sha)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  })
  const change = {
    message: `Dashboard: restore ${label} to ${when}`,
    files: [{ path: DOCS[doc].path, content: asFile(parsed) }],
  }
  try {
    return { commit: await commitFiles(cfg, change) }
  } catch (err) {
    if (!(err instanceof StaleBranchError)) throw err
    return { commit: await commitFiles(cfg, change) }
  }
}

// ------------------------------------------------------------------ routing

export default handler(async (req: VercelRequest, res: VercelResponse) => {
  requireAdmin(req)
  const action = String(first(req.query.action) ?? '')
  const store = contentStore()
  const cfg = githubConfig()

  if (!cfg) {
    if (action !== 'state') throw new HttpError(503, NOT_SET_UP)
    want(req, 'GET')
    json(res, 200, { configured: false, branch: '', durable: store.durable, docs: {} })
    return
  }

  try {
    switch (action) {
      case 'state':
        want(req, 'GET')
        return json(res, 200, await state(cfg, store))
      case 'draft':
        if (req.method === 'DELETE') {
          await store.deleteDraft(docParam(req.query.doc))
          return json(res, 200, { ok: true })
        }
        want(req, 'PUT')
        return json(res, 200, await saveDraft(cfg, store, req))
      case 'preview':
        want(req, 'GET')
        return json(res, 200, await preview(store))
      case 'publish': {
        want(req, 'POST')
        const [status, body] = await publish(cfg, store, req)
        return json(res, status, body)
      }
      case 'history':
        want(req, 'GET')
        return json(res, 200, await history(cfg, req))
      case 'version':
        want(req, 'GET')
        return json(res, 200, await version(cfg, req))
      case 'restore':
        want(req, 'POST')
        return json(res, 200, await restore(cfg, store, req))
      case 'status':
        want(req, 'GET')
        return json(res, 200, { state: await deployState(cfg, shaParam(req.query.sha)) })
      default:
        throw new HttpError(400, 'Unknown action.')
    }
  } catch (err) {
    if (err instanceof GitHubError) {
      throw new HttpError(
        502,
        err.status === 401 || err.status === 403
          ? TOKEN_REFUSED
          : 'GitHub did not answer as expected. Please try again in a minute.',
      )
    }
    throw err
  }
})
