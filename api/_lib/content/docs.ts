import type { ZodTypeAny } from 'zod'
import { DOC_KEYS, isDocKey, type DocKey } from './keys.js'
import { catalogueSource } from './catalogue-source.js'
import {
  CollectionsDocSchema,
  FaqDocSchema,
  JourneyDocSchema,
  JournalDocSchema,
  PartnersDocSchema,
  HeroDocSchema,
  PagesDocSchema,
  PlacesDocSchema,
  PoliciesDocSchema,
  ProductsDocSchema,
  ReviewsDocSchema,
  SellersDocSchema,
  SiteDocSchema,
  StoresDocSchema,
  type ProductsDoc,
} from './schema.js'

/**
 * Every document the dashboard edits: where it lives in the repository, what
 * the dashboard calls it, and what it must look like to be published.
 *
 * Publishing writes `path` in one commit through the GitHub API, and the site
 * imports the same file at build time.
 */
export interface DocSpec {
  path: string
  label: string
  schema: ZodTypeAny
  /**
   * Files that must change in the same commit as this document, written from
   * its checked data: the products carry the server's price list with them.
   */
  companions?: (data: unknown) => { path: string; content: string }[]
}

export const DOCS: Record<DocKey, DocSpec> = {
  faq: { path: 'src/content/faq.json', label: 'FAQ', schema: FaqDocSchema },
  stores: { path: 'src/content/stores.json', label: 'Stores', schema: StoresDocSchema },
  journal: { path: 'src/content/journal.json', label: 'Journal', schema: JournalDocSchema },
  products: {
    path: 'src/content/products.json',
    label: 'Products',
    schema: ProductsDocSchema,
    companions: (data) => [{ path: 'api/_catalogue.ts', content: catalogueSource((data as ProductsDoc).products) }],
  },
  collections: { path: 'src/content/collections.json', label: 'Collections', schema: CollectionsDocSchema },
  reviews: { path: 'src/content/reviews.json', label: 'Reviews', schema: ReviewsDocSchema },
  journey: { path: 'src/content/journey.json', label: 'Our Story journey', schema: JourneyDocSchema },
  partners: { path: 'src/content/partners.json', label: 'Partner logos', schema: PartnersDocSchema },
  sellers: { path: 'src/content/sellers.json', label: 'Trusted sellers', schema: SellersDocSchema },
  places: { path: 'src/content/places.json', label: 'Scented Memory map', schema: PlacesDocSchema },
  site: { path: 'src/content/site.json', label: 'Site details', schema: SiteDocSchema },
  policies: { path: 'src/content/policies.json', label: 'Policies', schema: PoliciesDocSchema },
  pages: { path: 'src/content/pages.json', label: 'Pages', schema: PagesDocSchema },
  hero: { path: 'src/content/hero.json', label: 'Hero poster', schema: HeroDocSchema },
}

export { DOC_KEYS, isDocKey, type DocKey }
