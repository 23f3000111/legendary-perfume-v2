import data from '../content/collections.json'
import type { CollectionEntry, CollectionsDoc } from '../../api/_lib/content/schema'

export type Collection = CollectionEntry

/**
 * The collections, in the order the menu, the shop and the Home page's rail
 * show them: each one's name, tagline, words, colour, square cover and shop
 * banner.
 *
 * They live in src/content/collections.json, which the Legendary team edits in
 * the dashboard. Photo paths are stored from the site root, and components
 * call asset() on them when they render. Read `collections` when rendering,
 * never a copy taken at import, so a preview's drafts show.
 *
 * Revision 4 and the Spirit amendment rewrote the 3 Wishes and Spirit copy so
 * it covers the singles, the travel kit and Spirit II; the file holds those
 * words as the client last sent them.
 */
export const collectionsDoc = data as CollectionsDoc
export const collections = collectionsDoc.collections

export function getCollection(id: string): Collection | undefined {
  return collections.find((c) => c.id === id)
}

/**
 * The name a product's collection goes by now.
 *
 * Products keep a copy of their collection's name, written when the product
 * was last saved. The pages show the collection's own, so a collection renamed
 * in the dashboard is renamed on every card and product page at once. The copy
 * stands in only if the collection itself is gone.
 */
export function collectionName(p: { collection: string; collectionId: string }): string {
  return getCollection(p.collectionId)?.name ?? p.collection
}
