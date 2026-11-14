import type { CollectionEntry } from '../../api/_lib/content/schema'
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
 * A collection with a new name. While it is unpublished its address follows
 * the name, as an article's does; once published it stays, because the menu,
 * old links and search results point at it. Never a published address either,
 * even one this draft removed.
 */
export function renameCollection(
  collection: CollectionEntry,
  name: string,
  publishedIds: Set<string>,
  taken: Set<string>,
): CollectionEntry {
  if (publishedIds.has(collection.id)) return { ...collection, name }
  return { ...collection, name, id: newId(name || 'new collection', new Set([...taken, ...publishedIds])) }
}

/**
 * Why a collection must stay, or null when it can go: products are in it, or
 * a pin on the Scented Memory map opens it. Given the working products and
 * places, so a change the team has not published yet counts.
 */
export function collectionInUse(
  collection: { id: string; name: string },
  products: { name: string; collectionId: string }[],
  places: { place: string; collectionId?: string }[],
): string | null {
  const inIt = products.filter((p) => p.collectionId === collection.id).map((p) => p.name || 'An unnamed product')
  if (inIt.length === 1) return `${inIt[0]} is in ${collection.name}. Move it to another collection first.`
  if (inIt.length > 1) return `${titleList(inIt)} are in ${collection.name}. Move them to another collection first.`
  const pin = places.find((p) => p.collectionId === collection.id)
  if (pin) return `The Scented Memory map's ${pin.place} pin opens ${collection.name}.`
  return null
}
