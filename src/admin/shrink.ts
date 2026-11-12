/**
 * Make a photo small enough to upload, in the browser.
 *
 * Vercel refuses any request over 4.5 MB, and the client's originals run to
 * 8000 px and 15 MB. So the photo is decoded here, turned upright, fitted
 * inside 3200 px (the largest size any place on the site needs) and encoded
 * again, a little smaller each time, until it is under 3.8 MB. Drawing it onto
 * a canvas also converts it to sRGB, which keeps a Display P3 photo's colours.
 *
 * WebP where the browser can write it. Safari cannot write WebP from a canvas,
 * so there it is JPEG, or PNG when the photo has transparency to keep. The
 * server makes the final WebP either way.
 */
const MAX_SIDE = 3200
const MAX_BYTES = 3_800_000
const MAX_STEPS = 12

/** The next scale to try, or null when this size already fits. */
export function nextScale(bytes: number, maxBytes: number, scale: number): number | null {
  return bytes <= maxBytes ? null : scale * 0.8
}

export async function shrinkForUpload(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error("This photo's format isn't supported. Save it as JPEG or PNG and try again.")
  }
  try {
    const alpha = hasTransparency(bitmap)
    let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    for (let step = 0; step < MAX_STEPS; step++) {
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))
      const blob = await encode(bitmap, width, height, alpha)
      const next = nextScale(blob.size, MAX_BYTES, scale)
      if (next === null) return { blob, width, height }
      scale = next
    }
    throw new Error('This photo is too large to upload, even made smaller. Try a smaller copy of it.')
  } finally {
    bitmap.close()
  }
}

/** Whether any pixel is see-through, judged on a copy at most 256 px across. */
function hasTransparency(bitmap: ImageBitmap): boolean {
  const s = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * s))
  const h = Math.max(1, Math.round(bitmap.height * s))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  ctx.drawImage(bitmap, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true
  return false
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

async function encode(bitmap: ImageBitmap, width: number, height: number, alpha: boolean): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser cannot prepare photos. Try Chrome, Edge, Safari or Firefox.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  const webp = await toBlob(canvas, 'image/webp', 0.9)
  if (webp && webp.type === 'image/webp') return webp
  const fallback = await toBlob(canvas, alpha ? 'image/png' : 'image/jpeg', 0.9)
  if (!fallback) throw new Error('This photo could not be prepared for upload.')
  return fallback
}
