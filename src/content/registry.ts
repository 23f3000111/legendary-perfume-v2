import type { DocKey } from '../../api/_lib/content/keys'
import faq from './faq.json'
import stores from './stores.json'
import journal from './journal.json'
import products from './products.json'
import collections from './collections.json'
import reviews from './reviews.json'
import journey from './journey.json'
import partners from './partners.json'
import sellers from './sellers.json'
import places from './places.json'
import site from './site.json'
import policies from './policies.json'

/**
 * Every document the dashboard edits, as the site holds it: the very objects
 * src/data exports, not copies. Preview swaps drafts into these before the
 * first render (see preview.ts), which is why components read content when
 * they render rather than taking copies when a module loads.
 */
export const CONTENT: Record<DocKey, Record<string, unknown>> = {
  faq: faq as Record<string, unknown>,
  stores: stores as Record<string, unknown>,
  journal: journal as Record<string, unknown>,
  products: products as Record<string, unknown>,
  collections: collections as Record<string, unknown>,
  reviews: reviews as Record<string, unknown>,
  journey: journey as Record<string, unknown>,
  partners: partners as Record<string, unknown>,
  sellers: sellers as Record<string, unknown>,
  places: places as Record<string, unknown>,
  site: site as Record<string, unknown>,
  policies: policies as Record<string, unknown>,
}
