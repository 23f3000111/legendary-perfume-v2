import type { Box, PosterImage } from '../../api/_lib/content/schema'
import type { DerivedPhoto } from '../lib/api'

/**
 * The Poster tab's two boxes, as fractions of the poster: left, top, right,
 * bottom. Every move keeps a box whole on the poster and at least MIN_BOX
 * across and down, and rounds to three places, as the boxes were first
 * measured.
 */

/** The smallest a box may be, across and down: below this it marks nothing. */
export const MIN_BOX = 0.04

/** How far one press of an arrow key moves a box, or one of its edges. */
const STEP = 0.005

export type Corner = 'tl' | 'tr' | 'bl' | 'br'

const round = (n: number) => Math.round(n * 1000) / 1000
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** The box moved by `dx` and `dy`, stopping whole at the poster's edges. */
export function moveBox([left, top, right, bottom]: Box, dx: number, dy: number): Box {
  const x = clamp(dx, -left, 1 - right)
  const y = clamp(dy, -top, 1 - bottom)
  return [round(left + x), round(top + y), round(right + x), round(bottom + y)]
}

/** The box with one corner moved by `dx` and `dy`, kept on the poster and never smaller than MIN_BOX. */
export function resizeBox([left, top, right, bottom]: Box, corner: Corner, dx: number, dy: number): Box {
  const l = corner === 'tl' || corner === 'bl' ? clamp(left + dx, 0, right - MIN_BOX) : left
  const r = corner === 'tr' || corner === 'br' ? clamp(right + dx, left + MIN_BOX, 1) : right
  const t = corner === 'tl' || corner === 'tr' ? clamp(top + dy, 0, bottom - MIN_BOX) : top
  const b = corner === 'bl' || corner === 'br' ? clamp(bottom + dy, top + MIN_BOX, 1) : bottom
  return [round(l), round(t), round(r), round(b)]
}

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-STEP, 0],
  ArrowRight: [STEP, 0],
  ArrowUp: [0, -STEP],
  ArrowDown: [0, STEP],
}

/**
 * The box after an arrow key: moved a step, or with `resize` (Shift held) its
 * right or bottom edge moved a step. Any other key leaves it alone: `null`.
 */
export function nudgeBox(box: Box, key: string, resize: boolean): Box | null {
  const step = ARROWS[key]
  if (!step) return null
  return resize ? resizeBox(box, 'br', step[0], step[1]) : moveBox(box, step[0], step[1])
}

/** Squarer than this, a poster is cut down hard on a wide screen. 16:9 is about 1.78. */
const LANDSCAPE = 1.5

/**
 * A word for the team when a poster is much squarer than the 16:9 the hero is
 * drawn for: a wide screen then keeps a band of it around the words, and the
 * picture may not survive. A warning, not a refusal, as the spec asks of a
 * design's practical limits; `null` for a landscape poster.
 */
export function posterShapeWarning(image: { width: number; height: number }): string | null {
  if (image.width / image.height >= LANDSCAPE) return null
  return 'This poster is squarer than the hero is drawn for, so a wide screen keeps only a band of it around the words. Check the previews below: a landscape poster, about 16 by 9, fills the hero best.'
}

/** A poster fitted from the library, as the document holds it; `null` when the fitting made no prints. */
export function posterImageFrom(derived: DerivedPhoto): PosterImage | null {
  if (!derived.prints?.length || !derived.fill) return null
  return { prints: derived.prints, fill: derived.fill, width: derived.width, height: derived.height }
}
