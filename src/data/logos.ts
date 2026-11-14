import partners from '../content/partners.json'
import sellers from '../content/sellers.json'
import type { LogoEntry, PartnersDoc, SellersDoc } from '../../api/_lib/content/schema'

export type Logo = LogoEntry

/**
 * The two logo walls: Partnered With on the Home page, and Trusted Sellers on
 * the Stores page.
 *
 * Revision 5: each wall rests in black and white and shows a logo's own
 * colours when it is hovered, so every logo is two prints, `logo` and `mono`.
 * The delivery's were drawn by scripts/prepare-assets.py; the dashboard makes
 * both from one upload the same way.
 *
 * Revision 4: the client drew the partner wall as six across, then five, then
 * three, and set the order within it, so the partners are kept as rows.
 * Revision 5's circled Tourism Malaysia and Discover Malaysia are `tall`.
 *
 * Both live in src/content, edited in the dashboard. Read them when rendering,
 * so a preview's drafts show.
 */
export const partnersDoc: PartnersDoc = partners
export const sellersDoc: SellersDoc = sellers
