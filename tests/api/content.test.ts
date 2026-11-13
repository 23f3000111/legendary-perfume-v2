import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// @ts-expect-error: a plain .mjs dev tool, without types
import { startFakeGitHub } from '../../scripts/fake-github.mjs'
import content from '../../api/admin/content'
import { issueSession } from '../../api/_lib/auth'
import { contentStore } from '../../api/_lib/content/store'
import { commitFiles } from '../../api/_lib/github'
import { invoke, type Call } from './http-doubles'

const FAQ = (intro = 'We answer what customers ask.') => ({
  intro,
  sections: [{ title: 'About Orchid', items: [{ q: 'Is every perfume orchid based?', a: 'No.' }] }],
  product: [{ q: 'How long does it last?', a: 'Four to seven hours.' }],
})

const STORES = (image?: string) => ({
  regions: ['Kuala Lumpur'],
  stores: [
    {
      id: 'bsas',
      name: 'Bangunan Sultan Abdul Samad',
      region: 'Kuala Lumpur',
      address: 'Jln Raja, 50050 Kuala Lumpur',
      phone: '+60 11 6767 1888',
      hours: ['Now open'],
      mapQuery: 'Bangunan Sultan Abdul Samad, Jalan Raja',
      ...(image ? { image } : {}),
    },
  ],
})

const JOURNAL = () => ({
  articles: [
    {
      slug: 'nyonya',
      title: 'Nyonya Collection: From Heritage to Legendary Perfume',
      category: 'Heritage',
      published: '2025-12-31',
      minutes: 5,
      excerpt: 'Inside the Peranakan culture that shaped the Nyonya Collection.',
      hero: '/assets/client/collection-nyonya.webp',
      heroAlt: 'The three Nyonya Collection bottles beside their patterned boxes',
      body: [{ t: 'p', text: 'Malaysia is a land rich in culture, stories and traditions.' }],
    },
  ],
})

/** The published format, written out by hand here rather than by the code under test. */
const asFile = (data: unknown) => JSON.stringify(data, null, 2) + '\n'

let work: string
let previous: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fake: any
let cookie: string

const env = () => ({
  token: 'test-token',
  repo: 'local/legendary',
  branch: 'main',
  apiUrl: fake.url as string,
})

const call = (c: Call) => invoke(content, { cookie, ...c })
const publishedText = (path: string) => fake.files().get(path)?.toString('utf8')

beforeEach(async () => {
  delete process.env.DATABASE_URL
  previous = process.cwd()
  work = mkdtempSync(join(tmpdir(), 'content-api-'))
  const seed = join(work, 'repo')
  mkdirSync(join(seed, 'src/content'), { recursive: true })
  writeFileSync(join(seed, 'src/content/faq.json'), asFile(FAQ()))
  writeFileSync(join(seed, 'src/content/stores.json'), asFile(STORES()))
  writeFileSync(join(seed, 'src/content/journal.json'), asFile(JOURNAL()))
  mkdirSync(join(seed, 'public/assets/client'), { recursive: true })
  writeFileSync(join(seed, 'public/assets/client/store-bsas.webp'), Buffer.from([1, 2, 3]))
  // The draft store's files go here, away from the seed.
  mkdirSync(join(work, 'app'))
  process.chdir(join(work, 'app'))

  fake = await startFakeGitHub({ port: 0, seedDir: seed, token: 'test-token', statusDelayMs: null })
  process.env.ADMIN_SESSION_SECRET = 'test-secret'
  process.env.GITHUB_TOKEN = 'test-token'
  process.env.GITHUB_REPO = 'local/legendary'
  process.env.GITHUB_BRANCH = 'main'
  process.env.GITHUB_API_URL = fake.url
  cookie = issueSession().cookie.split(';')[0]
})

afterEach(async () => {
  await fake.close()
  process.chdir(previous)
  rmSync(work, { recursive: true, force: true })
})

describe('the content API', () => {
  it('rejects a request without a session', async () => {
    const res = await invoke(content, { query: { action: 'state' } })
    expect(res.status).toBe(401)
  })

  it('state shows the published FAQ and no draft', async () => {
    const res = await call({ query: { action: 'state' } })
    expect(res.status).toBe(200)
    expect(res.body.configured).toBe(true)
    expect(res.body.docs.faq.label).toBe('FAQ')
    expect(res.body.docs.faq.published).toEqual(FAQ())
    expect(res.body.docs.faq.sha).toMatch(/^[0-9a-f]{40}$/)
    expect(res.body.docs.faq.draft).toBeNull()
    expect(res.body.docs.stores.published).toEqual(STORES())
  })

  it('a draft with an empty answer saves and reports the error', async () => {
    const draft = FAQ()
    draft.sections[0].items[0].a = ''
    const saved = await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: draft } })
    expect(saved.status).toBe(200)
    expect(saved.body.errors.map((e: { path: string }) => e.path)).toEqual(['sections.0.items.0.a'])

    const state = await call({ query: { action: 'state' } })
    expect(state.body.docs.faq.draft).toEqual(draft)
    expect(state.body.docs.faq.draftBase).toBe(state.body.docs.faq.sha)

    const publish = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })
    expect(publish.status).toBe(400)
    expect(publish.body.errors.faq[0].path).toBe('sections.0.items.0.a')
  })

  it('a long dash comes back as a warning on its field', async () => {
    const saved = await call({
      method: 'PUT',
      query: { action: 'draft' },
      body: { doc: 'faq', data: FAQ('Spirit I — Hope') },
    })
    expect(saved.body.warnings).toEqual(['intro'])
  })

  it('publish commits the FAQ and clears the draft', async () => {
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Updated intro.') } })
    const publish = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })
    expect(publish.status).toBe(200)
    expect(publish.body.commit).toMatch(/^[0-9a-f]{40}$/)
    expect(publishedText('src/content/faq.json')).toBe(asFile(FAQ('Updated intro.')))
    expect(publishedText('src/content/stores.json')).toBe(asFile(STORES()))

    const state = await call({ query: { action: 'state' } })
    expect(state.body.docs.faq.draft).toBeNull()
    expect(state.body.docs.faq.published.intro).toBe('Updated intro.')

    const history = await call({ query: { action: 'history', doc: 'faq' } })
    expect(history.body.commits.map((c: { message: string }) => c.message)).toEqual(['Dashboard: FAQ', 'Seed'])

    const status = await call({ query: { action: 'status', sha: publish.body.commit } })
    expect(status.body.state).toBe('pending')
    fake.setStatus(publish.body.commit, 'success')
    expect((await call({ query: { action: 'status', sha: publish.body.commit } })).body.state).toBe('success')
  })

  it('publish refuses a stale base', async () => {
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Mine.') } })
    // A developer changes the FAQ after the draft began.
    await commitFiles(env(), { message: 'Developer', files: [{ path: 'src/content/faq.json', content: asFile(FAQ('Theirs.')) }] })

    const refused = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })
    expect(refused.status).toBe(409)
    expect(refused.body.conflicts).toEqual(['faq'])
    expect(publishedText('src/content/faq.json')).toBe(asFile(FAQ('Theirs.')))

    const kept = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'], overwrite: ['faq'] } })
    expect(kept.status).toBe(200)
    expect(publishedText('src/content/faq.json')).toBe(asFile(FAQ('Mine.')))
  })

  it('a draft typed into the copy the dashboard loaded conflicts with a change made since', async () => {
    // The dashboard opens the FAQ; a developer changes it before the first autosave.
    const loaded = (await call({ query: { action: 'state' } })).body.docs.faq.sha
    await commitFiles(env(), { message: 'Developer', files: [{ path: 'src/content/faq.json', content: asFile(FAQ('Theirs.')) }] })
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Mine, typed into the older copy.'), base: loaded } })

    const refused = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })
    expect(refused.status).toBe(409)
    expect(refused.body.conflicts).toEqual(['faq'])
    expect(publishedText('src/content/faq.json')).toBe(asFile(FAQ('Theirs.')))
  })

  it('a push landing just after publish checked the FAQ is not built over', async () => {
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Mine.') } })
    // Publish reads the FAQ to check for a conflict; a developer's push lands on
    // the very next call, before anything is written.
    let checked = false
    let pushed = false
    fake.onRequest(async (method: string, route: string) => {
      if (method === 'GET' && route === 'contents/src/content/faq.json') {
        checked = true
        return
      }
      if (checked && !pushed) {
        pushed = true
        await commitFiles(env(), { message: 'Developer', files: [{ path: 'src/content/faq.json', content: asFile(FAQ('Theirs.')) }] })
      }
    })

    const res = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })
    expect(pushed).toBe(true)
    expect(res.status).toBe(409)
    expect(res.body.conflicts).toEqual(['faq'])
    expect(publishedText('src/content/faq.json')).toBe(asFile(FAQ('Theirs.')))
  })

  it('a draft whose base is not a version is refused', async () => {
    const res = await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Mine.'), base: 'yesterday' } })
    expect(res.status).toBe(400)
    expect(await contentStore().drafts()).toEqual([])
  })

  it('publish answers with the version of each document it wrote', async () => {
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Updated intro.') } })
    const publish = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })
    const state = await call({ query: { action: 'state' } })
    expect(publish.body.shas).toEqual({ faq: state.body.docs.faq.sha })
  })

  it('publish carries a new photo and its master', async () => {
    const store = contentStore()
    await store.putMedia({ file: 'm/master1.webp', bytes: Buffer.from([9, 9, 9]), width: 3200, height: 2400, kind: 'master', source: null })
    await store.putMedia({ file: 'slot1.webp', bytes: Buffer.from([7, 7]), width: 900, height: 675, kind: 'store', source: 'm/master1.webp' })
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'stores', data: STORES('/assets/cms/slot1.webp') } })

    const publish = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['stores'] } })
    expect(publish.status).toBe(200)
    const files = fake.files()
    expect(files.get('public/assets/cms/slot1.webp')).toEqual(Buffer.from([7, 7]))
    expect(files.get('public/assets/cms/m/master1.webp')).toEqual(Buffer.from([9, 9, 9]))
    expect(publishedText('src/content/stores.json')).toBe(asFile(STORES('/assets/cms/slot1.webp')))
    expect((await store.listMedia()).every((m) => m.published)).toBe(true)
  })

  it('a photo the store has lost stops the publish', async () => {
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'stores', data: STORES('/assets/cms/gone.webp') } })
    const publish = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['stores'] } })
    expect(publish.status).toBe(400)
    expect(publish.body.error).toBe('A photo in Stores is missing. Upload it again.')
  })

  it('preview returns the drafts and the unpublished photos', async () => {
    await contentStore().putMedia({ file: 'm/new.webp', bytes: Buffer.from([1]), width: 10, height: 10, kind: 'master', source: null })
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Preview me.') } })
    const res = await call({ query: { action: 'preview' } })
    expect(res.body.drafts).toEqual({ faq: FAQ('Preview me.') })
    expect(res.body.media).toEqual(['/assets/cms/m/new.webp'])
  })

  it('history without a document lists what each commit changed', async () => {
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Both.') } })
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'stores', data: { ...STORES(), regions: ['Kuala Lumpur', 'Melaka'] } } })
    await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq', 'stores'] } })

    const history = await call({ query: { action: 'history' } })
    expect(history.body.commits[0].message).toBe('Dashboard: FAQ, Stores')
    expect(history.body.commits[0].docs).toEqual(['faq', 'stores'])
  })

  it('publishing is refused when GitHub is not configured', async () => {
    delete process.env.GITHUB_TOKEN
    const publish = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })
    expect(publish.status).toBe(503)
    expect(publish.body.error).toBe('Publishing is not set up yet. Add GITHUB_TOKEN and GITHUB_REPO in Vercel.')
    const state = await call({ query: { action: 'state' } })
    expect(state.status).toBe(200)
    expect(state.body.configured).toBe(false)
  })

  it('a GitHub 401 keeps the drafts', async () => {
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Keep me.') } })
    process.env.GITHUB_TOKEN = 'revoked'
    const publish = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })
    expect(publish.status).toBe(502)
    expect(publish.body.error).toBe('GitHub refused the publishing token. Ask the developer to renew it.')
    expect((await contentStore().drafts()).map((d) => d.doc)).toEqual(['faq'])
  })

  /** Publish the FAQ while GitHub refuses the first write with `status` and `message`. */
  async function publishRefusedWith(status: number, message: string) {
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Keep me.') } })
    // Reads still work: a token that can read but not write gets this far.
    fake.onRequest((method: string, route: string) =>
      method === 'POST' && route === 'git/blobs' ? [status, { message }] : undefined,
    )
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const publish = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })
      return { publish, logged: logged.mock.calls }
    } finally {
      logged.mockRestore()
    }
  }

  it('a GitHub 403 says the token cannot change the site', async () => {
    const { publish, logged } = await publishRefusedWith(403, 'Resource not accessible by personal access token')
    expect(publish.status).toBe(502)
    expect(publish.body.error).toBe(
      'The publishing token can read the site but not change it. Ask the developer to give it Contents: Read and write.',
    )
    // GitHub's own reason reaches the function log, for whoever fixes the token.
    expect(logged).toContainEqual(['[content] GitHub answered', 403, 'Resource not accessible by personal access token'])
    expect((await contentStore().drafts()).map((d) => d.doc)).toEqual(['faq'])
  })

  it('a GitHub rate limit asks to try again later', async () => {
    const { publish } = await publishRefusedWith(403, 'API rate limit exceeded for user ID 1.')
    expect(publish.status).toBe(502)
    expect(publish.body.error).toBe('GitHub is busy right now. Please try again in a few minutes.')
  })

  // Two windows on one document share its one draft. Each says which version of
  // the draft it last saw, so neither quietly replaces what the other saved.
  const ANOTHER_WINDOW = 'FAQ changed in another window. Reload the page to see the latest.'
  const save = (data: unknown, rev: string | null) =>
    call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data, rev } })

  it('a save from a window that missed a newer save is refused', async () => {
    const a = await save(FAQ('Window A.'), null)
    expect(a.status).toBe(200)
    // Window B opened before A saved: as far as it knows there is no draft.
    const b = await save(FAQ('Window B.'), null)
    expect(b.status).toBe(409)
    expect(b.body.error).toBe(ANOTHER_WINDOW)
    expect((await contentStore().drafts())[0].data).toEqual(FAQ('Window A.'))
    // A knows its own save, and carries on.
    expect((await save(FAQ('Window A, again.'), a.body.draft.rev)).status).toBe(200)
  })

  it('state names the version of each draft, which a reload starts from', async () => {
    const a = await save(FAQ('Window A.'), null)
    expect(a.body.draft.rev).toMatch(/^[0-9a-f]{40}$/)
    const state = await call({ query: { action: 'state' } })
    expect(state.body.docs.faq.draftRev).toBe(a.body.draft.rev)
    expect(state.body.docs.stores.draftRev).toBeNull()
  })

  it('publish from a window that missed a newer save is refused, and nothing is committed', async () => {
    const a = await save(FAQ('Window A.'), null)
    const b = await save(FAQ('Window B.'), a.body.draft.rev)
    const stale = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'], revs: { faq: a.body.draft.rev } } })
    expect(stale.status).toBe(409)
    expect(stale.body.error).toBe(ANOTHER_WINDOW)
    expect(stale.body.conflicts).toEqual([])
    expect(publishedText('src/content/faq.json')).toBe(asFile(FAQ()))

    const fresh = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'], revs: { faq: b.body.draft.rev } } })
    expect(fresh.status).toBe(200)
    expect(publishedText('src/content/faq.json')).toBe(asFile(FAQ('Window B.')))
  })

  it('a discard from a window that missed a newer save is refused', async () => {
    const a = await save(FAQ('Window A.'), null)
    const b = await save(FAQ('Window B.'), a.body.draft.rev)
    const stale = await call({ method: 'DELETE', query: { action: 'draft', doc: 'faq', rev: a.body.draft.rev } })
    expect(stale.status).toBe(409)
    expect(stale.body.error).toBe(ANOTHER_WINDOW)
    expect(await contentStore().drafts()).toHaveLength(1)
    expect((await call({ method: 'DELETE', query: { action: 'draft', doc: 'faq', rev: b.body.draft.rev } })).status).toBe(200)
    expect(await contentStore().drafts()).toHaveLength(0)
  })

  it('publish keeps fields the dashboard does not know', async () => {
    // A developer adds a field by hand, for code that reads it.
    const handEdited = {
      ...FAQ(),
      sections: [{ title: 'About Orchid', items: [{ q: 'Is every perfume orchid based?', a: 'No.', note: 'kept' }] }],
      note: 'kept',
    }
    await commitFiles(env(), { message: 'Developer', files: [{ path: 'src/content/faq.json', content: asFile(handEdited) }] })

    // The dashboard edits the copy it loaded, which carries both fields.
    const state = (await call({ query: { action: 'state' } })).body.docs.faq
    const draft = structuredClone(state.published)
    draft.product[0].a = 'Six to eight hours.'
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: draft, base: state.sha } })
    const publish = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })
    expect(publish.status).toBe(200)

    const committed = JSON.parse(publishedText('src/content/faq.json')!)
    expect(committed.product[0].a).toBe('Six to eight hours.')
    expect(committed.note).toBe('kept')
    expect(committed.sections[0].items[0].note).toBe('kept')
  })

  it('restore puts back one document', async () => {
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Version two.') } })
    const first = await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Version three.') } })
    await call({ method: 'POST', query: { action: 'publish' }, body: { docs: ['faq'] } })

    const version = await call({ query: { action: 'version', doc: 'faq', sha: first.body.commit } })
    expect(version.body.data).toEqual(FAQ('Version two.'))

    const restore = await call({ method: 'POST', query: { action: 'restore' }, body: { doc: 'faq', sha: first.body.commit } })
    expect(restore.status).toBe(200)
    expect(publishedText('src/content/faq.json')).toBe(asFile(FAQ('Version two.')))
    expect(publishedText('src/content/stores.json')).toBe(asFile(STORES()))
    const history = await call({ query: { action: 'history', doc: 'faq' } })
    expect(history.body.commits[0].message).toMatch(/^Dashboard: restore FAQ to \d{1,2} [A-Z][a-z]+ \d{4}$/)
  })

  it('restore waits while the document has a draft', async () => {
    await call({ method: 'PUT', query: { action: 'draft' }, body: { doc: 'faq', data: FAQ('Unpublished.') } })
    const head = (await call({ query: { action: 'history', doc: 'faq' } })).body.commits[0].sha
    const restore = await call({ method: 'POST', query: { action: 'restore' }, body: { doc: 'faq', sha: head } })
    expect(restore.status).toBe(409)
  })
})
