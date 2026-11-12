import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
// @ts-expect-error: a plain .mjs dev tool, without types
import { startFakeGitHub } from '../../scripts/fake-github.mjs'
import media from '../../api/admin/media'
import { issueSession } from '../../api/_lib/auth'
import { commitFiles } from '../../api/_lib/github'
import { invoke, type Call } from './http-doubles'

let work: string
let previous: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fake: any
let cookie: string

const call = (c: Call) => invoke(media, { cookie, ...c })
const upload = (bytes: Buffer) => call({ method: 'POST', body: bytes, headers: { 'content-type': 'application/octet-stream' } })
const fetchFile = async (file: string) => (await call({ query: { file } })).body as Buffer

/** The first pixel's RGB, from the decoded image. */
async function firstPixel(image: Buffer): Promise<number[]> {
  const { data } = await sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return [data[0], data[1], data[2]]
}

beforeEach(async () => {
  delete process.env.DATABASE_URL
  previous = process.cwd()
  work = mkdtempSync(join(tmpdir(), 'media-api-'))
  const seed = join(work, 'repo')
  mkdirSync(join(seed, 'src/content'), { recursive: true })
  writeFileSync(join(seed, 'src/content/faq.json'), '{}\n')
  mkdirSync(join(seed, 'public/assets/client'), { recursive: true })
  writeFileSync(join(seed, 'public/assets/client/store-bsas.webp'), Buffer.from([1, 2, 3]))
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

describe('the photo API', () => {
  it('a transparent 8000 px PNG becomes a 3200 px WebP master that keeps its alpha', async () => {
    const png = await sharp({
      create: { width: 8000, height: 4000, channels: 4, background: { r: 240, g: 30, b: 60, alpha: 0.5 } },
    }).png().toBuffer()

    const res = await upload(png)
    expect(res.status).toBe(200)
    expect(res.body.file).toMatch(/^m\/[0-9a-f]{20}\.webp$/)
    expect([res.body.width, res.body.height]).toEqual([3200, 1600])
    expect(res.body.url).toBe(`/api/admin/media?file=${res.body.file}`)

    const meta = await sharp(await fetchFile(res.body.file)).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.hasAlpha).toBe(true)
    expect(Math.max(meta.width!, meta.height!)).toBe(3200)
  })

  it('a JPEG with EXIF orientation 6 comes out upright', async () => {
    const sideways = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#336699' } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer()
    const res = await upload(sideways)
    expect([res.body.width, res.body.height]).toEqual([300, 400])
  })

  it('a Display P3 photo is converted to sRGB', async () => {
    // sRGB (200, 100, 50), stored as Display P3 numbers with the P3 profile.
    const p3 = await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 200, g: 100, b: 50 } } })
      .withIccProfile('p3')
      .jpeg({ quality: 100 })
      .toBuffer()
    expect((await sharp(p3).metadata()).icc).toBeDefined()

    const res = await upload(p3)
    const master = await fetchFile(res.body.file)
    expect((await sharp(master).metadata()).icc).toBeUndefined()
    const [r, g, b] = await firstPixel(master)
    expect(Math.abs(r - 200)).toBeLessThanOrEqual(5)
    expect(Math.abs(g - 100)).toBeLessThanOrEqual(5)
    expect(Math.abs(b - 50)).toBeLessThanOrEqual(5)
  })

  it('refuses a file that is not JPEG, PNG or WebP', async () => {
    const res = await upload(Buffer.from('not an image'))
    expect(res.status).toBe(415)
    expect(res.body.error).toBe("That file type can't be used. Save it as JPEG or PNG and try again.")
  })

  it('refuses an upload over the limit', async () => {
    const res = await upload(Buffer.alloc(4_400_001))
    expect(res.status).toBe(413)
    expect(res.body.error).toBe('That photo is too large to upload.')
  })

  it('derive makes a 900 px store photo on white', async () => {
    const transparent = await sharp({
      create: { width: 2000, height: 1500, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).png().toBuffer()
    const master = (await upload(transparent)).body.file

    const res = await call({ method: 'POST', query: { derive: master, kind: 'store' } })
    expect(res.status).toBe(200)
    expect(res.body.path).toMatch(/^\/assets\/cms\/[0-9a-f]{20}\.webp$/)
    expect([res.body.width, res.body.height]).toEqual([900, 675])

    const slot = await fetchFile(res.body.path.slice('/assets/cms/'.length))
    const meta = await sharp(slot).metadata()
    expect(meta.hasAlpha).toBe(false)
    expect(Math.max(meta.width!, meta.height!)).toBe(900)
    expect(await firstPixel(slot)).toEqual([255, 255, 255])
  })

  it('derive reads a published master from the repository', async () => {
    const bytes = await sharp({ create: { width: 1200, height: 1200, channels: 3, background: '#808080' } }).webp().toBuffer()
    await commitFiles(
      { token: 'test-token', repo: 'local/legendary', branch: 'main', apiUrl: fake.url },
      { message: 'Published earlier', files: [{ path: 'public/assets/cms/m/0123456789abcdef0123.webp', content: bytes }] },
    )
    const res = await call({ method: 'POST', query: { derive: 'm/0123456789abcdef0123.webp', kind: 'store' } })
    expect(res.status).toBe(200)
    expect([res.body.width, res.body.height]).toEqual([900, 900])
  })

  it('lists the library and the site photos', async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).png().toBuffer()
    const uploaded = (await upload(png)).body.file
    const res = await call({})
    expect(res.body.photos.map((p: { file: string }) => p.file)).toEqual([uploaded])
    expect(res.body.photos[0].published).toBe(false)
    expect(res.body.site).toEqual(['/assets/client/store-bsas.webp'])
  })

  it('serves a stored photo only to a signed-in admin', async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).png().toBuffer()
    const file = (await upload(png)).body.file
    const signedOut = await invoke(media, { query: { file } })
    expect(signedOut.status).toBe(401)
    const signedIn = await call({ query: { file } })
    expect(signedIn.status).toBe(200)
    expect(signedIn.headers['content-type']).toBe('image/webp')
    expect(signedIn.headers['cache-control']).toBe('private, max-age=3600')
  })
})
