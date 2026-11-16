import type { CollectionEntry, PartnersDoc, ReviewEntry } from '../../api/_lib/content/schema'
import { titleList } from './changes'
import { newId } from './text'

/**
 * Helpers for the Site tab's lists: the collections, the reviews, the journey
 * and the logo walls.
 */

/** A collection to fill in: its address is made from its name until it is published. */
export function blankCollection(taken: Set<string>): CollectionEntry {
  return {
    id: newId('new collection', taken),
    name: '',
    tagline: '',
    description: '',
    intro: '',
    accent: 'gold',
    image: '',
  }
}

/**
 * A collection with a new name. While it is unpublished and nothing is in it,
 * its address follows the name, as an article's does. Once published it stays,
 * because the menu, old links and search results point at it; and once
 * products are in it (`inUse`), it stays too, or a corrected typo in the name
 * would leave them in a collection that no longer exists. Never a published
 * address either, even one this draft removed.
 */
export function renameCollection(
  collection: CollectionEntry,
  name: string,
  publishedIds: Set<string>,
  taken: Set<string>,
  inUse: Set<string> = new Set(),
): CollectionEntry {
  if (publishedIds.has(collection.id) || inUse.has(collection.id)) return { ...collection, name }
  return { ...collection, name, id: newId(name || 'new collection', new Set([...taken, ...publishedIds])) }
}

/**
 * Why a collection must stay, or null when it can go: products are in it, or
 * a pin on the Scented Memory map opens it.
 *
 * Given the working products and places, so a change the team has not
 * published yet counts, and the products on the site (`live`) as well: a
 * collection whose products have moved out only in a draft must wait until
 * that move is published, or dropping the draft would leave them in a
 * collection that is gone.
 */
export function collectionInUse(
  collection: { id: string; name: string },
  products: { name: string; collectionId: string }[],
  places: { place: string; collectionId?: string }[],
  live: { name: string; collectionId: string }[] = [],
): string | null {
  const names = (list: { name: string; collectionId: string }[]) =>
    list.filter((p) => p.collectionId === collection.id).map((p) => p.name || 'An unnamed product')
  const inIt = names(products)
  if (inIt.length === 1) return `${inIt[0]} is in ${collection.name}. Move it to another collection first.`
  if (inIt.length > 1) return `${titleList(inIt)} are in ${collection.name}. Move them to another collection first.`
  const onSite = names(live)
  if (onSite.length === 1) return `${onSite[0]} is in ${collection.name} on the site. Publish its move to another collection first.`
  if (onSite.length > 1) {
    return `${titleList(onSite)} are in ${collection.name} on the site. Publish their move to another collection first.`
  }
  const pin = places.find((p) => p.collectionId === collection.id)
  if (pin) return `The Scented Memory map's ${pin.place} pin opens ${collection.name}.`
  return null
}

/** A review with `stars`. Five, the default every review the client sent had, is left out of the data. */
export function setStars(review: ReviewEntry, stars: number): ReviewEntry {
  const { rating: _old, ...rest } = review
  return stars === 5 ? rest : { ...rest, rating: stars }
}

/** The partner rows with one logo moved to the end of row `to`; nothing else changes. */
export function moveLogo(
  rows: PartnersDoc['rows'],
  from: { row: number; index: number },
  to: number,
): PartnersDoc['rows'] {
  const logo = rows[from.row]?.logos[from.index]
  if (!logo || from.row === to || !rows[to]) return rows
  return rows.map((r, i) => {
    if (i === from.row) return { ...r, logos: r.logos.filter((_, j) => j !== from.index) }
    if (i === to) return { ...r, logos: [...r.logos, logo] }
    return r
  })
}

/**
 * The black and white print beside a logo the site already has, which
 * scripts/prepare-assets.py writes as <name>-mono.png next to <name>.png.
 * Null for anything else, a black and white print itself included.
 */
export function siteMono(path: string): string | null {
  const m = /^(\/assets\/client\/(?:partner|seller)-[\w-]+)\.png$/.exec(path)
  if (!m || m[1].endsWith('-mono')) return null
  return `${m[1]}-mono.png`
}

/**
 * The phone crop beside a banner the site already has, which
 * scripts/prepare-assets.py writes as banner-<name>-sm.webp next to it.
 * Null for anything else, a phone crop itself included.
 */
export function sitePhone(path: string): string | null {
  const m = /^(\/assets\/client\/banner-[\w-]+)\.webp$/.exec(path)
  if (!m || m[1].endsWith('-sm')) return null
  return `${m[1]}-sm.webp`
}

/** The second print beside a site photo, for a kind that needs one: a logo's black and white, a banner's phone crop. */
export function siteSecond(kind: { mono?: boolean; phone?: boolean }, path: string): string | null {
  if (kind.mono) return siteMono(path)
  if (kind.phone) return sitePhone(path)
  return null
}
