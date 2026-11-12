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
): Promise<{ data: Buffer; width: number; height: number }> {
  const spec = SLOT_KINDS[kind]
  let image = sharp(master)
  if (!spec.alpha) image = image.flatten({ background: '#ffffff' })
  const { data, info } = await image
    .resize({ width: spec.maxSide, height: spec.maxSide, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

/**
 * The file name, from the content: a changed photo always gets a new name,
 * which /assets/ needs, since it is served immutable for a year.
 */
export function hashName(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex').slice(0, 20)
}
