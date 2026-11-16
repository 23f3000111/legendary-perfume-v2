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

/** A poster fitted from the library, as the document holds it; `null` when the fitting made no prints. */
export function posterImageFrom(derived: DerivedPhoto): PosterImage | null {
  if (!derived.prints?.length || !derived.fill) return null
  return { prints: derived.prints, fill: derived.fill, width: derived.width, height: derived.height }
}
