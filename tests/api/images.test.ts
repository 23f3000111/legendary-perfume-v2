import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { makeMaster, makePoster } from '../../api/_lib/content/images'

/** A poster full of fine detail, where every extra lossy encode shows; `edge` gives it a 4 px see-through fringe. */
async function detailed(width: number, height: number, edge: boolean): Promise<Buffer> {
  const channels = edge ? 4 : 3
  const px = Buffer.alloc(width * height * channels)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      px[i] = ((x >> 1) + (y >> 1)) % 2 ? 225 : 45
      px[i + 1] = (x * 7 + y * 3) % 256
      px[i + 2] = (x ^ y) & 255
      if (edge) px[i + 3] = x < 4 || y < 4 || x >= width - 4 || y >= height - 4 ? 0 : 255
    }
  }
  return sharp(px, { raw: { width, height, channels } }).png().toBuffer()
}

/** How close two pictures' pixels are, in decibels: higher is closer. */
function psnr(a: Buffer, b: Buffer): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return 10 * Math.log10((255 * 255) / (sum / a.length))
}

describe('the hero poster files', () => {
  // The poster is the site's flagship picture. Each print is one encode of the
  // master's own pixels: an encode on the way, as a copy to print from, blurs
  // its lettering for nothing (26 dB against 28.7 on this pattern).
  it("a poster's prints are each encoded once from the master", async () => {
    for (const edge of [false, true]) {
      const master = (await makeMaster(await detailed(1608, 908, edge))).data
      const { prints } = await makePoster(master)
      const widest = prints[prints.length - 1]
      let pixels = sharp(master)
      if (edge) pixels = pixels.extract({ left: 4, top: 4, width: 1600, height: 900 })
      const reference = await pixels.flatten({ background: '#ffffff' }).raw().toBuffer()
      const shipped = await sharp(widest.data).removeAlpha().raw().toBuffer()
      expect(shipped.length).toBe(reference.length)
      expect(psnr(shipped, reference)).toBeGreaterThan(27.5)
    }
  })
})
