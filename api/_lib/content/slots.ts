/**
 * The kinds of place a dashboard photo can go, and the size each one needs.
 *
 * A photo is uploaded once, kept large in the library, and a copy at the size
 * below is made when it is put somewhere. The sizes match what
 * scripts/prepare-assets.py writes for the same places, so a photo from the
 * dashboard and one from the delivery look alike on the page. `alpha: false`
 * means the place shows a photograph, so any transparency is laid on white;
 * `alpha: true` keeps it, for cut-outs. `square` frames the photo square, as
 * the shop's product tiles are.
 *
 * No imports, so the dashboard can read these without the image code.
 */
export interface SlotSpec {
  label: string
  maxSide: number
  alpha: boolean
  square?: boolean
}

const KINDS = {
  store: { label: 'Store photo', maxSide: 900, alpha: false },
  /** A journal article's header or body photo. Upright ones are shown narrower, not made smaller. */
  journal: { label: 'Journal photo', maxSide: 1600, alpha: false },
  /** The lifestyle shot, the resting state of every product tile. */
  productLife: { label: 'Lifestyle photo', maxSide: 1400, alpha: false, square: true },
  /** The box shot, third in the product page's gallery. */
  productBox: { label: 'Box shot', maxSide: 1400, alpha: false, square: true },
  /** The transparent pack cut-out shown when a tile is hovered. */
  productPack: { label: 'Pack cut-out', maxSide: 1400, alpha: true },
  productIncluded: { label: "What's included flat-lay", maxSide: 1600, alpha: true },
  productChart: { label: 'Occasion chart', maxSide: 1100, alpha: true },
  productBloom: { label: 'Botanical', maxSide: 1000, alpha: true },
} satisfies Record<string, SlotSpec>

export const SLOT_KINDS: Record<keyof typeof KINDS, SlotSpec> = KINDS

export type SlotKind = keyof typeof KINDS

export function isSlotKind(value: unknown): value is SlotKind {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SLOT_KINDS, value)
}
