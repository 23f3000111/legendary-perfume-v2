import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/auth.js'
import { handler, HttpError, json, nodeBody } from '../_lib/http.js'
import { hashName, makeMaster, makeSlot, sniff } from '../_lib/content/images.js'
import { isSlotKind, SLOT_KINDS } from '../_lib/content/slots.js'
import { contentStore } from '../_lib/content/store.js'
import { githubConfig, listFiles, readBinary } from '../_lib/github.js'

/**
 * The dashboard's photo library.
 *
 *   POST  (the photo's bytes)          add a photo; it is kept large, as a master
 *   POST  ?derive=<file>&kind=<kind>   a copy of a master sized for one place;
 *                                      &white=1 makes a cut-out's white background see-through
 *   GET   ?file=<file>                 a stored photo, for the dashboard and previews
 *   GET                                the library, and the photos the site already has
 *
 * Photos stay in the draft store until a publish commits the ones a document
 * uses (see api/admin/content.ts). Uploads nobody used are cleared after 30 days.
 *
 * The browser shrinks every photo before it is sent, because Vercel refuses a
 * request body over 4.5 MB on every plan.
 */

const MAX_UPLOAD = 4_400_000
const FILE = /^(m\/)?[0-9a-f]{20}\.webp$/
const MASTER = /^m\/[0-9a-f]{20}\.webp$/

/** Read the body ourselves: it is an image, not JSON. */
export const config = { api: { bodyParser: false } }

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)
const urlFor = (file: string) => `/api/admin/media?file=${file}`

export default handler(async (req: VercelRequest, res: VercelResponse) => {
  requireAdmin(req)
  const store = contentStore()

  if (req.method === 'GET') {
    const file = first(req.query.file)
    if (file !== undefined) {
      if (typeof file !== 'string' || !FILE.test(file)) throw new HttpError(400, 'Unknown photo.')
      const row = await store.getMedia(file)
      if (!row) throw new HttpError(404, 'That photo is not in the library.')
      res.status(200)
      res.setHeader('Content-Type', 'image/webp')
      res.setHeader('Cache-Control', 'private, max-age=3600')
      res.send(row.bytes)
      return
    }
    const cfg = githubConfig()
    const [media, site] = await Promise.all([
      store.listMedia(),
      cfg ? listFiles(cfg, 'public/assets/client/') : Promise.resolve(new Set<string>()),
    ])
    json(res, 200, {
      photos: media
        .filter((m) => m.kind === 'master')
        .map((m) => ({ file: m.file, url: urlFor(m.file), width: m.width, height: m.height, published: m.published, createdAt: m.createdAt })),
      site: [...site].filter((p) => /\.(webp|jpe?g|png)$/i.test(p)).map((p) => p.slice('public'.length)).sort(),
    })
    return
  }

  if (req.method !== 'POST') throw new HttpError(405, 'Use GET or POST for this.')

  const derive = first(req.query.derive)
  if (derive !== undefined) {
    const kind = first(req.query.kind)
    if (typeof derive !== 'string' || !MASTER.test(derive)) throw new HttpError(400, 'Unknown photo.')
    if (!isSlotKind(kind)) throw new HttpError(400, 'Unknown place for a photo.')
    // Making white see-through is for cut-outs; a photograph keeps its background.
    const white = first(req.query.white) === '1'
    if (white && !SLOT_KINDS[kind].alpha) throw new HttpError(400, 'That kind of photo keeps its background.')
    let master = (await store.getMedia(derive))?.bytes
    if (!master) {
      // Published and cleared from the store since: the repository has it.
      const cfg = githubConfig()
      master = (cfg && (await readBinary(cfg, `public/assets/cms/${derive}`))) || undefined
    }
    if (!master) throw new HttpError(404, 'That photo is no longer in the library. Upload it again.')
    const slot = await makeSlot(master, kind, { white })
    const file = `${hashName(slot.data)}.webp`
    await store.putMedia({ file, bytes: slot.data, width: slot.width, height: slot.height, kind, source: derive })
    json(res, 200, { path: `/assets/cms/${file}`, width: slot.width, height: slot.height })
    return
  }

  const bytes = await nodeBody(req)
  if (bytes.length > MAX_UPLOAD) throw new HttpError(413, 'That photo is too large to upload.')
  if (!sniff(bytes)) throw new HttpError(415, "That file type can't be used. Save it as JPEG or PNG and try again.")
  await store.purgeStale(30)

  let master
  try {
    master = await makeMaster(bytes)
  } catch {
    throw new HttpError(415, "That photo could not be read. Save it as JPEG or PNG and try again.")
  }
  const file = `m/${hashName(master.data)}.webp`
  await store.putMedia({ file, bytes: master.data, width: master.width, height: master.height, kind: 'master', source: null })
  json(res, 200, { file, url: urlFor(file), width: master.width, height: master.height })
})
