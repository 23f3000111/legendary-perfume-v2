import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import faqJson from './faq.json'
import storesJson from './stores.json'
import journalJson from './journal.json'
import productsJson from './products.json'
import collectionsJson from './collections.json'
import reviewsJson from './reviews.json'
import journeyJson from './journey.json'
import partnersJson from './partners.json'
import sellersJson from './sellers.json'
import placesJson from './places.json'
import siteJson from './site.json'
import policiesJson from './policies.json'
import { faq } from '../data/faq'
import { storesDoc } from '../data/stores'
import { articleList, formatDate, journal } from '../data/articles'
import { products, productsDoc } from '../data/products'
import { collections, collectionsDoc, getCollection } from '../data/collections'
import { reviews, reviewsDoc } from '../data/reviews'
import { journeyDoc } from '../data/journey'
import { partnersDoc, sellersDoc } from '../data/logos'
import { placesDoc, scentPlaces } from '../data/places'
import { site } from '../data/site'
import { policies, policiesDoc } from '../data/policies'
import { DOCS } from '../../api/_lib/content/docs'
import {
  CollectionsDocSchema,
  FaqDocSchema,
  JourneyDocSchema,
  JournalDocSchema,
  PartnersDocSchema,
  PlacesDocSchema,
  PoliciesDocSchema,
  ProductsDocSchema,
  ReviewsDocSchema,
  SellersDocSchema,
  SiteDocSchema,
  StoresDocSchema,
} from '../../api/_lib/content/schema'

describe('published content', () => {
  it('the published FAQ and stores pass their schemas', () => {
    expect(FaqDocSchema.safeParse(faq).success).toBe(true)
    expect(StoresDocSchema.safeParse(storesDoc).success).toBe(true)
  })

  it('the published site details and policies pass their schemas', () => {
    for (const result of [SiteDocSchema.safeParse(site), PoliciesDocSchema.safeParse(policiesDoc)]) {
      expect(result.success ? [] : result.error.issues).toEqual([])
    }
  })

  it('the published journal passes its schema', () => {
    const result = JournalDocSchema.safeParse(journal)
    expect(result.success ? [] : result.error.issues).toEqual([])
  })

  it('the published products pass their schema', () => {
    const result = ProductsDocSchema.safeParse(productsDoc)
    expect(result.success ? [] : result.error.issues).toEqual([])
  })

  it('the published lists pass their schemas', () => {
    const lists = [
      [CollectionsDocSchema, collectionsJson],
      [ReviewsDocSchema, reviewsJson],
      [JourneyDocSchema, journeyJson],
      [PartnersDocSchema, partnersJson],
      [SellersDocSchema, sellersJson],
      [PlacesDocSchema, placesJson],
    ] as const
    for (const [schema, doc] of lists) {
      const result = schema.safeParse(doc)
      expect(result.success ? [] : result.error.issues).toEqual([])
    }
  })

  // Products keep a copy of their collection's name; the pages show the
  // collection's own, so the two must agree for nothing on the site to change.
  it("every product's collection is a collection, under its current name", () => {
    for (const p of products) expect(getCollection(p.collectionId)?.name, p.id).toBe(p.collection)
  })

  // Publish writes what the schema returns. If that differed from the file
  // (keys in another order, a string trimmed), the first dashboard publish
  // would rewrite the whole file and bury the team's one change in the diff.
  it('each content file is exactly what a publish would write', () => {
    for (const spec of Object.values(DOCS)) {
      // A Windows checkout turns LF into CRLF; the repository and every publish hold LF.
      const file = readFileSync(spec.path, 'utf8').replace(/\r\n/g, '\n')
      expect(JSON.stringify(spec.schema.parse(JSON.parse(file)), null, 2) + '\n', spec.path).toBe(file)
    }
  })

  // Preview swaps drafts into these objects before the first render, so the
  // site must read the JSON objects themselves, not copies made at load.
  it('the site reads the very objects the JSON files export', () => {
    expect(faq).toBe(faqJson)
    expect(storesDoc).toBe(storesJson)
    expect(journal).toBe(journalJson)
    expect(productsDoc).toBe(productsJson)
    expect(products).toBe(productsJson.products)
    expect(collectionsDoc).toBe(collectionsJson)
    expect(collections).toBe(collectionsJson.collections)
    expect(reviewsDoc).toBe(reviewsJson)
    expect(reviews).toBe(reviewsJson.reviews)
    expect(journeyDoc).toBe(journeyJson)
    expect(partnersDoc).toBe(partnersJson)
    expect(sellersDoc).toBe(sellersJson)
    expect(placesDoc).toBe(placesJson)
    expect(scentPlaces).toBe(placesJson.places)
    expect(site).toBe(siteJson)
    expect(policiesDoc).toBe(policiesJson)
    expect(policies).toBe(policiesJson.policies)
  })
})

describe('the journal', () => {
  it('formatDate writes the date the way the pages show it', () => {
    expect(formatDate('2026-10-22')).toBe('22 October 2026')
    expect(formatDate('2025-01-05')).toBe('5 January 2025')
  })

  it('articles run newest first, with the date and reading time the pages show', () => {
    const list = articleList()
    expect(list.map((a) => a.slug)).toEqual(['elevenyears', 'nyonya', 'alcoholfree', 'gifting', 'longevity'])
    expect(list[0].date).toBe('22 October 2026')
    expect(list[0].readTime).toBe('3 min')
  })
})
