import type { ProductEntry } from '../../api/_lib/content/schema'
import { scentPlaces } from '../data/places'
import { getProduct } from '../data/products'
import { newId } from './text'

/**
 * The Products tab's rules: what a new product starts as, a copy of one, how a
 * new product's address follows its name, and which products the site's own
 * code points at, so they cannot be removed from here.
 */

/** What every box holds after its first line, which names the scent and its pour. */
const HOUSE_INCLUDES = [
  { label: 'Signature carrier', detail: 'Legendary gold embossed shopping bag, ready for gifting' },
  { label: 'Gift box', detail: 'Hand finished rigid box in house ivory and gold' },
  { label: 'Post card', detail: 'A personalised card to write your own note' },
  { label: 'Discovery samples', detail: 'Complimentary vials to explore other iconic scents from the house' },
]

/** A new, empty product in a collection, with an address no other product has. */
export function blankProduct(taken: Set<string>, collection: { id: string; name: string }): ProductEntry {
  return {
    id: newId('new product', taken),
    name: '',
    subtitle: '',
    collection: collection.name,
    collectionId: collection.id,
    family: '',
    audience: 'Unisex',
    moods: ['Serene'],
    price: 0,
    size: '',
    image: '',
    hoverImage: '',
    box: '',
    included: '',
    includedItems: [{ label: '', detail: '' }, ...HOUSE_INCLUDES.map((item) => ({ ...item }))],
    radar: '',
    accent: 'gold',
    badges: [],
    story: '',
    description: '',
    notes: { top: [], heart: [], base: [] },
  }
}

/**
 * A copy of a product to start a new one from, as the Spirit I singles were
 * made from Spirit II's. It is not a bestseller and has no pin on the map
 * until someone puts it there.
 */
export function duplicateProduct(product: ProductEntry, taken: Set<string>): ProductEntry {
  const { bestseller: _bestseller, place: _place, ...rest } = structuredClone(product)
  const name = `${product.name} copy`
  return { ...rest, name, id: newId(name, taken) }
}

/**
 * The product with a new name. Until it is published its address follows the
 * name, letters and digits only and never another product's. Once published
 * the address stays: overrides, links and search results all point at it.
 */
export function renameProduct(
  product: ProductEntry,
  name: string,
  publishedIds: Set<string>,
  taken: Set<string>,
): ProductEntry {
  if (publishedIds.has(product.id)) return { ...product, name }
  // Never a published product's address either, even one removed in this
  // draft: the price table's settings and old links still point at it.
  return { ...product, name, id: newId(name || 'new product', new Set([...taken, ...publishedIds])) }
}

/**
 * Why a product cannot be removed from the dashboard, or null when it can:
 * Home's Signature section shows Orchid, and the Scented Memory map pins
 * products by their address.
 */
export function pinReason(id: string): string | null {
  if (id === 'orchid') return "Orchid leads the Home page's Signature section."
  if (scentPlaces.some((place) => place.productId === id)) {
    return `${getProduct(id)?.name ?? id} is pinned on the Scented Memory map.`
  }
  return null
}
