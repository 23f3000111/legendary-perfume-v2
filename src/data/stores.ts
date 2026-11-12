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

/**
 * Client amendment: the contact page pointed at the Melaka flagship. It now
 * carries the registered office the client supplied in revision 2.
 */
export const HEAD_OFFICE = {
  name: 'Legendary Distribution Sdn Bhd',
  address:
    '12E, Pusat Teknologi Sunsuria, Jalan Teknologi, Taman Sains Selangor, PJU 5, Kota Damansara, 47810 Petaling Jaya, Selangor',
  mapQuery:
    'Legendary Distribution Sdn Bhd, Pusat Teknologi Sunsuria, Jalan Teknologi, Kota Damansara, 47810 Petaling Jaya, Selangor',
  /**
   * The client's own pinned embed. A place query resolves to the road rather
   * than the unit, so this exact URL is used for the head office map.
   */
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.5034513756564!2d101.5665319!3d3.1534984999999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc4f0aa97cbbb1%3A0xb45be6e10820e74d!2sLegendary%20Distribution%20Sdn%20Bhd!5e1!3m2!1sen!2sin!4v1786498622660!5m2!1sen!2sin',
}

export function mapEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`
}

export function directionsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
