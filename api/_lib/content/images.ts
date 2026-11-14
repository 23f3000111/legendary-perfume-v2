import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { SLOT_KINDS, type SlotKind } from './slots.js'

/**
 * What the dashboard does to a photo, so every one reaches the site the same
 * way whichever computer and browser it came from.
 *
 * The browser has already shrunk the original under the upload limit. Here it
 * is turned upright by its EXIF orientation, converted to sRGB through its
 * own colour profile (the client's Melaka shopfront was Display P3, and read
 * as sRGB its golds go flat), and saved as WebP with any transparency kept.
 */

const MASTER_SIDE = 3200

/** The file type, read from the leading bytes rather than from the name. */
export function sniff(bytes: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png'
  }
  if (bytes.length >= 12 && bytes.toString('latin1', 0, 4) === 'RIFF' && bytes.toString('latin1', 8, 12) === 'WEBP') {
    return 'webp'
  }
  return null
}

/**
 * The library's large copy: up to 3200 px, the largest size any place on the
 * site needs, so any place can be given a copy made from it later.
 */
export async function makeMaster(bytes: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(bytes, { failOn: 'error' })
    .rotate()
    .resize({ width: MASTER_SIDE, height: MASTER_SIDE, fit: 'inside', withoutEnlargement: true })
    .toColourspace('srgb')
    .webp({ quality: 82, alphaQuality: 90 })
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

/** A copy sized for one kind of place. Photographs that show no transparency go on white. */
export async function makeSlot(
  master: Buffer,
  kind: SlotKind,
  opts: { white?: boolean } = {},
): Promise<{ data: Buffer; width: number; height: number }> {
  const spec = SLOT_KINDS[kind]
  // A cut-out sent on white has its white made see-through first, unless it
  // already carries real transparency, which is then the cut the sender made.
  const input = opts.white && spec.alpha && (await sharp(master).stats()).isOpaque ? await groundToClear(master) : master
  let image = sharp(input)
  if (!spec.alpha) image = image.flatten({ background: '#ffffff' })
  if (spec.square === 'cover') {
    // Framed square, as the shop's tiles are, around what draws the eye; never enlarged.
    const { width = spec.maxSide, height = spec.maxSide } = await sharp(input).metadata()
    const side = Math.min(spec.maxSide, width, height)
    image = image.resize({ width: side, height: side, fit: 'cover', position: sharp.strategy.attention })
  } else if (spec.square === 'contain') {
    // The whole photo, fitted inside a square on white: nothing at its sides is lost.
    const { width = spec.maxSide, height = spec.maxSide } = await sharp(input).metadata()
    const side = Math.min(spec.maxSide, Math.max(width, height))
    image = image.resize({ width: side, height: side, fit: 'contain', background: '#ffffff' })
  } else {
    image = image.resize({ width: spec.maxSide, height: spec.maxSide, fit: 'inside', withoutEnlargement: true })
  }
  const { data, info } = await image.webp({ quality: 82, alphaQuality: 90 }).toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

/**
 * The white around a cut-out made transparent, and the transparent edges cut
 * away, as `ground_to_alpha` in scripts/prepare-assets.py does for the
 * delivery's pack shots and flat-lays. Only the white that touches the edge of
 * the photo goes: a fill starts at each near-white corner and spreads through
 * pixels within 26 (the sum of the red, green and blue differences) of that
 * corner's colour, so it stops at the pack's outline. A blanket "white becomes
 * transparent" pass would punch holes through the house's ivory boxes.
 */
async function groundToClear(master: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(master).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const seen = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  for (const start of [0, width - 1, (height - 1) * width, height * width - 1]) {
    const s = start * 4
    // A corner that is not near-white is part of the photo: leave it.
    if (seen[start] || data[s] + data[s + 1] + data[s + 2] < 690) continue
    const [r, g, b] = [data[s], data[s + 1], data[s + 2]]
    const near = (p: number) => {
      const i = p * 4
      return Math.abs(data[i] - r) + Math.abs(data[i + 1] - g) + Math.abs(data[i + 2] - b) <= 26
    }
    let head = 0
    let tail = 0
    queue[tail++] = start
    seen[start] = 1
    while (head < tail) {
      const p = queue[head++]
      data[p * 4 + 3] = 0
      const x = p % width
      if (x > 0 && !seen[p - 1] && near(p - 1)) { seen[p - 1] = 1; queue[tail++] = p - 1 }
      if (x < width - 1 && !seen[p + 1] && near(p + 1)) { seen[p + 1] = 1; queue[tail++] = p + 1 }
      if (p >= width && !seen[p - width] && near(p - width)) { seen[p - width] = 1; queue[tail++] = p - width }
      if (p < (height - 1) * width && !seen[p + width] && near(p + width)) { seen[p + width] = 1; queue[tail++] = p + width }
    }
  }
  return sharp(data, { raw: { width, height, channels: 4 } }).trim().png().toBuffer()
}

/**
 * The file name, from the content: a changed photo always gets a new name,
 * which /assets/ needs, since it is served immutable for a year.
 */
export function hashName(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex').slice(0, 20)
}
