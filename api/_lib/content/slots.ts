/**
 * The kinds of place a dashboard photo can go, and the size each one needs.
 *
 * A photo is uploaded once, kept large in the library, and a copy at the size
 * below is made when it is put somewhere. The sizes match what
 * scripts/prepare-assets.py writes for the same places, so a photo from the
 * dashboard and one from the delivery look alike on the page. `alpha: false`
 * means the place shows a photograph, so any transparency is laid on white;
 * `alpha: true` keeps it, for cut-outs. `square` frames the photo square, as
 * the shop's product tiles are: `cover` fills the square, `contain` fits the
 * whole photo inside it on white, so a box shot never loses its sides.
 *
 * No imports, so the dashboard can read these without the image code.
 */
export interface SlotSpec {
  label: string
  maxSide: number
  alpha: boolean
  square?: 'cover' | 'contain'
  /** The place also needs a black and white print, made with the colour one: the logo walls rest in black and white. */
  mono?: boolean
  /**
   * The site's own photos for the place have a phone crop beside them, named
   * `-sm` (the page banners from scripts/prepare-assets.py), which comes with
   * one picked from the library. A dashboard upload's phone crop is a photo of
   * its own, of the `bannerPhone` kind.
   */
  phone?: boolean
  /**
   * The place needs the files save_hero_poster in scripts/prepare-assets.py
   * makes: prints 1280, 2400 and 3200 px wide, and a small blurred fill. The
   * hero poster.
   */
  poster?: boolean
}

const KINDS = {
  store: { label: 'Store photo', maxSide: 900, alpha: false },
  /** A journal article's header or body photo. Upright ones are shown narrower, not made smaller. */
  journal: { label: 'Journal photo', maxSide: 1600, alpha: false },
  /** The lifestyle shot, the resting state of every product tile. */
  productLife: { label: 'Lifestyle photo', maxSide: 1400, alpha: false, square: 'cover' },
  /** The box shot, third in the product page's gallery. Revision 12: the client found one cut off at its sides. */
  productBox: { label: 'Box shot', maxSide: 1400, alpha: false, square: 'contain' },
  /** The transparent pack cut-out shown when a tile is hovered. */
  productPack: { label: 'Pack cut-out', maxSide: 1400, alpha: true },
  productIncluded: { label: "What's included flat-lay", maxSide: 1600, alpha: true },
  productChart: { label: 'Occasion chart', maxSide: 1100, alpha: true },
  productBloom: { label: 'Botanical', maxSide: 1000, alpha: true },
  /** A collection's square cover, on its card in the Home page's rail. */
  collection: { label: 'Collection cover', maxSide: 1600, alpha: false, square: 'cover' },
  /** A year's card on the Our Story journey. */
  journey: { label: 'Journey photo', maxSide: 1000, alpha: false },
  /** The photo on a Scented Memory map card. */
  place: { label: 'Map card photo', maxSide: 1200, alpha: false },
  /** A partner or seller logo: a colour print for hover and a black and white one, both see-through. */
  logo: { label: 'Logo', maxSide: 340, alpha: true, mono: true },
  /** A photograph on a page, such as the Signature section's Orchid or Our Story's first flower. */
  page: { label: 'Page photo', maxSide: 1800, alpha: false },
  /** A page's banner, behind its title: the wide photo, 2400 px. */
  banner: { label: 'Banner', maxSide: 2400, alpha: false, phone: true },
  /** The same banner framed for a phone's near square title bar: 1200 by 1000 in the banner brief. */
  bannerPhone: { label: 'Phone crop', maxSide: 1200, alpha: false },
  /** What a link to the page shows when it is shared. */
  share: { label: 'Sharing image', maxSide: 1200, alpha: false },
  /** The campaign poster after the film in the Home hero: three widths and a blurred fill. */
  poster: { label: 'Poster', maxSide: 3200, alpha: false, poster: true },
} satisfies Record<string, SlotSpec>

export const SLOT_KINDS: Record<keyof typeof KINDS, SlotSpec> = KINDS

export type SlotKind = keyof typeof KINDS

export function isSlotKind(value: unknown): value is SlotKind {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SLOT_KINDS, value)
}
