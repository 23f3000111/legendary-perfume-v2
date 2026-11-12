/**
 * The kinds of place a dashboard photo can go, and the size each one needs.
 *
 * A photo is uploaded once, kept large in the library, and a copy at the size
 * below is made when it is put somewhere. The sizes match what
 * scripts/prepare-assets.py writes for the same places, so a photo from the
 * dashboard and one from the delivery look alike on the page. `alpha: false`
 * means the place shows a photograph, so any transparency is laid on white.
 *
 * No imports, so the dashboard can read these without the image code.
 */
export const SLOT_KINDS = {
  store: { label: 'Store photo', maxSide: 900, alpha: false },
} as const

export type SlotKind = keyof typeof SLOT_KINDS

export function isSlotKind(value: unknown): value is SlotKind {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SLOT_KINDS, value)
}
