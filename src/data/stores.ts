import data from '../content/stores.json'
import type { StoresDoc } from '../../api/_lib/content/schema'

export interface Store {
  id: string
  name: string
  region: string
  address: string
  phone: string
  hours: string[]
  /** Google Maps place query (no API key required for embed) */
  mapQuery: string
  /** A root path such as /assets/client/store-bsas.webp; pass it through asset(). */
  image?: string
}

/**
 * The store locator: the region filter, in order, and every counter.
 *
 * The words and photos live in src/content/stores.json, which the Legendary
 * team edits in the dashboard. The Stores page puts "All" in front of the
 * regions. Photo paths are stored from the site root, and components call
 * asset() on them when they render, so the GitHub Pages preview still finds
 * them under its subpath.
 *
 * Read it when rendering (`storesDoc.stores`, never a copy taken at import), so
 * a preview's drafts, swapped into this object before the first render, show.
 */
export const storesDoc: StoresDoc = data

export function mapEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`
}

export function directionsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
