import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// @ts-expect-error: a plain .mjs dev tool, without types
import { startFakeGitHub } from '../../scripts/fake-github.mjs'
import media from '../../api/admin/media'
import { issueSession } from '../../api/_lib/auth'
import { commitFiles } from '../../api/_lib/github'
import { adminUploadPhoto } from '../../src/lib/api'
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

  it("a photo sent by the dashboard's upload call reaches the function on Vercel", async () => {
    const png = await sharp({ create: { width: 40, height: 30, channels: 4, background: { r: 10, g: 120, b: 90, alpha: 0.5 } } })
      .png()
      .toBuffer()
    // What the dashboard puts on the wire, caught at fetch.
    let sent: { type: string; bytes: Buffer } | undefined
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>
      sent = { type: headers['Content-Type'], bytes: Buffer.from(await (init.body as Blob).arrayBuffer()) }
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })
    try {
      await adminUploadPhoto(new Blob([png], { type: 'image/png' }))
    } finally {
      vi.unstubAllGlobals()
    }

    const res = await call({ method: 'POST', raw: sent!.bytes, headers: { 'content-type': sent!.type } })
    expect(res.status).toBe(200)
    expect(res.body.file).toMatch(/^m\/[0-9a-f]{20}\.webp$/)
    expect([res.body.width, res.body.height]).toEqual([40, 30])
  })

  /** A JPEG `width` by `height`, white, with a red square `side` across in the middle. */
  async function onWhite(width: number, height: number, side: number): Promise<Buffer> {
    const red = await sharp({ create: { width: side, height: side, channels: 3, background: { r: 200, g: 20, b: 30 } } })
      .png()
      .toBuffer()
    return sharp({ create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } } })
      .composite([{ input: red, left: Math.round((width - side) / 2), top: Math.round((height - side) / 2) }])
      .jpeg({ quality: 95 })
      .toBuffer()
  }

  /** The red, green, blue and alpha of one pixel. */
  async function pixel(image: Buffer, x: number, y: number): Promise<number[]> {
    const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const at = (y * info.width + x) * 4
    return [...data.subarray(at, at + 4)]
  }

  it('a lifestyle photo is framed square at 1400 px', async () => {
    const master = (await upload(await onWhite(3000, 2000, 800))).body.file
    const res = await call({ method: 'POST', query: { derive: master, kind: 'productLife' } })
    expect(res.status).toBe(200)
    expect([res.body.width, res.body.height]).toEqual([1400, 1400])
  })

  // The client sends some pack shots on white, like the first MAN photo.
  it('white is knocked out of a pack shot sent on white', async () => {
    const master = (await upload(await onWhite(1200, 800, 400))).body.file
    const res = await call({ method: 'POST', query: { derive: master, kind: 'productPack', white: '1' } })
    expect(res.status).toBe(200)
    const slot = await fetchFile(res.body.path.slice('/assets/cms/'.length))
    expect((await sharp(slot).metadata()).hasAlpha).toBe(true)
    // Cut down to the pack itself: the white page around it is gone.
    expect(res.body.width).toBeLessThan(450)
    expect(res.body.height).toBeLessThan(450)
    const centre = await pixel(slot, Math.floor(res.body.width / 2), Math.floor(res.body.height / 2))
    expect(centre[3]).toBe(255)
    expect(centre[0]).toBeGreaterThan(150)
  })

  // The house's boxes are ivory and gold. Only the white around the pack goes,
  // as the asset script's flood from the corners does; the box keeps its inside.
  it('a white box inside its outline keeps its inside when the white is made see-through', async () => {
    const inside = await sharp({ create: { width: 392, height: 292, channels: 3, background: { r: 252, g: 250, b: 244 } } })
      .png()
      .toBuffer()
    const box = await sharp({ create: { width: 400, height: 300, channels: 3, background: { r: 120, g: 110, b: 100 } } })
      .composite([{ input: inside, left: 4, top: 4 }])
      .png()
      .toBuffer()
    const onPage = await sharp({ create: { width: 1000, height: 800, channels: 3, background: { r: 255, g: 255, b: 255 } } })
      .composite([{ input: box, left: 300, top: 250 }])
      .png()
      .toBuffer()
    const master = (await upload(onPage)).body.file
    const res = await call({ method: 'POST', query: { derive: master, kind: 'productPack', white: '1' } })
    expect(res.status).toBe(200)
    // Cut down to the box: the page around it is gone...
    expect(res.body.width).toBeLessThan(450)
    expect(res.body.height).toBeLessThan(350)
    // ...and the box's ivory inside is still there.
    const slot = await fetchFile(res.body.path.slice('/assets/cms/'.length))
    expect((await pixel(slot, Math.floor(res.body.width / 2), Math.floor(res.body.height / 2)))[3]).toBe(255)
  })

  // Revision 12: the client found a box shot cut off at its sides.
  it('a box shot is framed square without losing its sides', async () => {
    const wide = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: { r: 200, g: 20, b: 30 } } })
      .jpeg()
      .toBuffer()
    const master = (await upload(wide)).body.file
    const res = await call({ method: 'POST', query: { derive: master, kind: 'productBox' } })
    expect([res.body.width, res.body.height]).toEqual([1400, 1400])
    const slot = await fetchFile(res.body.path.slice('/assets/cms/'.length))
    expect((await pixel(slot, 3, 700))[0]).toBeGreaterThan(150)
    expect(await pixel(slot, 700, 3)).toEqual([255, 255, 255, 255])
  })

  it('a cut-out that already has transparency is left as it is', async () => {
    const cutout = await sharp({
      create: { width: 600, height: 400, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.5 } },
    }).png().toBuffer()
    const master = (await upload(cutout)).body.file
    const res = await call({ method: 'POST', query: { derive: master, kind: 'productPack', white: '1' } })
    expect(res.status).toBe(200)
    expect([res.body.width, res.body.height]).toEqual([600, 400])
    expect((await pixel(await fetchFile(res.body.path.slice('/assets/cms/'.length)), 10, 10))[3]).toBeGreaterThan(100)
  })

  it('only a see-through kind takes white=1', async () => {
    const master = (await upload(await onWhite(800, 600, 200))).body.file
    const res = await call({ method: 'POST', query: { derive: master, kind: 'store', white: '1' } })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('That kind of photo keeps its background.')
  })

  /**
   * A PNG `width` by `height` with a bar of `ink` in the middle, on a see-through
   * page, or on a white one with no alpha channel at all, as a logo sent on white is.
   */
  async function bar(width: number, height: number, barW: number, barH: number, ink: { r: number; g: number; b: number }, page: 'clear' | 'white') {
    const mark = await sharp({ create: { width: barW, height: barH, channels: 4, background: { ...ink, alpha: 1 } } }).png().toBuffer()
    const ground =
      page === 'clear'
        ? sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        : sharp({ create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    const drawn = await ground.composite([{ input: mark, left: Math.round((width - barW) / 2), top: Math.round((height - barH) / 2) }]).png().toBuffer()
    return page === 'clear' ? drawn : sharp(drawn).flatten({ background: '#ffffff' }).removeAlpha().png().toBuffer()
  }
  const deriveLogo = (master: string) => call({ method: 'POST', query: { derive: master, kind: 'logo' } })
  const stored = (path: string) => fetchFile(path.slice('/assets/cms/'.length))

  // The walls rest in black and white and show each logo's colours on hover,
  // as scripts/prepare-assets.py's brand_mark draws the delivery's logos.
  it('a logo gets a colour print and a black and white print', async () => {
    const master = (await upload(await bar(1000, 400, 800, 200, { r: 200, g: 30, b: 30 }, 'clear'))).body.file
    const res = await deriveLogo(master)
    expect(res.status).toBe(200)
    expect(res.body.path).toMatch(/^\/assets\/cms\/[0-9a-f]{20}\.webp$/)
    expect(res.body.mono).toMatch(/^\/assets\/cms\/[0-9a-f]{20}\.webp$/)
    expect(res.body.mono).not.toBe(res.body.path)

    const colour = await stored(res.body.path)
    const { width, height } = await sharp(colour).metadata()
    // 340 px across, with a 20 px margin each side.
    expect(width).toBe(380)
    expect(res.body.width).toBe(380)
    expect((await pixel(colour, 0, 0))[3]).toBe(0)
    const [x, y] = [Math.floor(width! / 2), Math.floor(height! / 2)]
    const red = await pixel(colour, x, y)
    expect(red[0]).toBeGreaterThan(150)
    expect(red[1]).toBeLessThan(80)

    const mono = await stored(res.body.mono)
    const monoSize = await sharp(mono).metadata()
    expect([monoSize.width, monoSize.height]).toEqual([width, height])
    const grey = await pixel(mono, x, y)
    expect(grey[0]).toBe(grey[1])
    expect(grey[1]).toBe(grey[2])
    expect(Math.abs(grey[0] - 46)).toBeLessThanOrEqual(4)
  })

  it('a logo sent on white loses its white', async () => {
    const master = (await upload(await bar(1200, 800, 600, 200, { r: 0, g: 0, b: 0 }, 'white'))).body.file
    const res = await deriveLogo(master)
    expect(res.status).toBe(200)
    // Trimmed to the bar. With its white kept it would be about 380 by 267.
    expect(res.body.width).toBe(380)
    expect(res.body.height).toBeGreaterThanOrEqual(145)
    expect(res.body.height).toBeLessThanOrEqual(165)
  })

  // Half the delivered marks are gold or white lockups drawn for a dark ground.
  it('a white logo drawn for a dark ground comes out dark', async () => {
    const master = (await upload(await bar(1000, 400, 800, 200, { r: 255, g: 255, b: 255 }, 'clear'))).body.file
    const mono = await stored((await deriveLogo(master)).body.mono)
    const { width, height } = await sharp(mono).metadata()
    expect((await pixel(mono, Math.floor(width! / 2), Math.floor(height! / 2)))[0]).toBeLessThan(60)
  })

  it('a logo with nothing left is refused', async () => {
    const blank = await sharp({ create: { width: 600, height: 400, channels: 3, background: { r: 255, g: 255, b: 255 } } }).png().toBuffer()
    const res = await deriveLogo((await upload(blank)).body.file)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/white/)
  })

  // A page banner: the wide photo at 2400 px. A smaller print of it would only
  // be blurrier on a phone, whose near square title bar shows a slice of its
  // height, so phones get the designer's phone crop or else the wide photo.
  it('a banner gets its wide print, and no smaller print for phones', async () => {
    const wide = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: { r: 60, g: 40, b: 30 } } }).jpeg().toBuffer()
    const master = (await upload(wide)).body.file
    const res = await call({ method: 'POST', query: { derive: master, kind: 'banner' } })
    expect(res.status).toBe(200)
    expect([res.body.width, res.body.height]).toEqual([2400, 1200])
    expect(res.body.phone).toBeUndefined()
  })

  // The banner brief asks the designer for a phone banner of 1200 by 1000.
  it('a phone crop keeps its own framing at 1200 px', async () => {
    const crop = await sharp({ create: { width: 2400, height: 2000, channels: 3, background: { r: 60, g: 40, b: 30 } } }).jpeg().toBuffer()
    const master = (await upload(crop)).body.file
    const res = await call({ method: 'POST', query: { derive: master, kind: 'bannerPhone' } })
    expect(res.status).toBe(200)
    expect([res.body.width, res.body.height]).toEqual([1200, 1000])
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
