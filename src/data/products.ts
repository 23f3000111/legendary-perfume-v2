import { pages } from './pages'
import data from '../content/products.json'
import type { ProductEntry, ProductsDoc, ProductVariant } from '../../api/_lib/content/schema'
import { asset } from '../lib/asset'

/* ------------------------------------------------------------------
   The shop's products, in shelf order.

   They live in src/content/products.json, which the Legendary team edits
   in the dashboard, each written out in full: the Spirit and Wish singles
   that used to be built from templates, and the "What's included" lines
   every box shares, are spelled out per product. Photo paths are stored
   from the site root, and whatever draws them calls asset() at render, so
   the GitHub Pages preview still finds them under its subpath.

   The notes on where each product's copy came from (the client's sheets,
   the revision that added each SKU, the two card wordings the sheet
   asks for) are in this file's history from before the move to JSON:
   git log -p -- src/data/products.ts

   Prices here are what a product launched at. The server prices every
   basket from api/_catalogue.ts, which is generated from the same file,
   and the dashboard's price table changes a published product's price
   at once through product overrides.

   Read it when rendering (`products`, the very array the file holds, or
   the helpers below), never into a copy taken at import, so a preview's
   drafts, put into that array before the first render, show.
   ------------------------------------------------------------------ */

export type Product = ProductEntry
export type Mood = Product['moods'][number]
export type Audience = Product['audience']
export type AccentKey = Product['accent']
/** Top, heart and base: the three tiers the composition band shows. */
export interface ScentNotes {
  top: string[]
  heart: string[]
  base: string[]
}
export type IncludedItem = Product['includedItems'][number]
export type Variant = ProductVariant

/**
 * The products file, as the site holds it. JSON imports type the moods,
 * audiences and accents as plain strings; the schema check at build time is
 * what holds the file to them.
 */
export const productsDoc = data as ProductsDoc

/** Every product in shelf order: the array the products file holds. */
export const products: Product[] = productsDoc.products

/** The product page's gallery: the lifestyle shot, the pack cut-out, the box shot. */
export function galleryOf(product: Product): string[] {
  return [product.image, product.hoverImage, product.box]
}

export const moodList: Mood[] = ['Serene', 'Bold', 'Romantic', 'Playful']

/**
 * The line on a mood's tile. Client change: the tile carries this headline
 * rather than a separate ingredient hint. The words are the Home page's
 * (src/content/pages.json), read when called so a preview's drafts show.
 */
export function moodLine(mood: Mood): string {
  return pages.home.finder.moods[mood]
}

/** Client-supplied line art, re-tinted to the house gold at build time. */
export const moodIcon: Record<Mood, string> = {
  Serene: asset('/assets/client/mood-serene.png'),
  Bold: asset('/assets/client/mood-bold.png'),
  Romantic: asset('/assets/client/mood-romantic.png'),
  Playful: asset('/assets/client/mood-playful.png'),
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

/**
 * "You may also like": the rest of the product's collection first, then the
 * rest of the house.
 *
 * Revision 12: `hidden` is what the dashboard has taken off the shop. The
 * client hid Spirit II and Dream and still found both recommended on Passion,
 * because the shop and Bestsellers left hidden products out and this did not.
 */
export function relatedProducts(product: Product, count = 4, hidden: string[] = []): Product[] {
  const others = products.filter((p) => p.id !== product.id && !hidden.includes(p.id))
  const same = others.filter((p) => p.collectionId === product.collectionId)
  const rest = others.filter((p) => p.collectionId !== product.collectionId)
  return [...same, ...rest].slice(0, count)
}

export function productsByMood(mood: Mood): Product[] {
  return products.filter((p) => p.moods.includes(mood))
}

export function productsByCollection(collectionId: string): Product[] {
  return products.filter((p) => p.collectionId === collectionId)
}
