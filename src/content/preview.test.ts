import { afterEach, describe, expect, it } from 'vitest'
import { applyDrafts, previewRequested } from './preview'
import { CONTENT } from './registry'
import { asset, setPreviewMedia } from '../lib/asset'
import { faq } from '../data/faq'
import { articleList, getArticle } from '../data/articles'
import { getProduct, products } from '../data/products'
import { collectionName, collections } from '../data/collections'
import { partnersDoc } from '../data/logos'
import { pages } from '../data/pages'
import { moodLine } from '../data/products'
import faqJson from './faq.json'
import journalJson from './journal.json'
import productsJson from './products.json'
import collectionsJson from './collections.json'
import partnersJson from './partners.json'
import pagesJson from './pages.json'

afterEach(() => setPreviewMedia([]))

describe('preview', () => {
  it('applyDrafts keeps object identity', () => {
    const target = {
      faq: { intro: 'old', sections: [1], product: [2] } as Record<string, unknown>,
      stores: { regions: ['A'], stores: [] } as Record<string, unknown>,
    }
    const faqObject = target.faq

    applyDrafts({ faq: { intro: 'new', sections: [] } }, target)

    expect(target.faq).toBe(faqObject)
    expect(target.faq).toEqual({ intro: 'new', sections: [] })
    expect(target.stores).toEqual({ regions: ['A'], stores: [] })
  })

  it('ignores a draft for a document the site does not have', () => {
    const target = { faq: { intro: 'old' } as Record<string, unknown>, stores: {} as Record<string, unknown> }
    applyDrafts({ products: { anything: true } } as Record<string, unknown>, target)
    expect(target).toEqual({ faq: { intro: 'old' }, stores: {} })
  })

  it("a draft applied to the registry is what the site's FAQ reads", () => {
    const saved = structuredClone(faqJson)
    try {
      applyDrafts({ faq: { ...saved, intro: 'A draft intro.' } }, CONTENT)
      expect(faq.intro).toBe('A draft intro.')
    } finally {
      applyDrafts({ faq: saved }, CONTENT)
    }
    expect(faq.intro).toBe(saved.intro)
  })

  // A new article only exists in the draft until it is published, and preview
  // has to show its page and put it first on the Journal page.
  it('a draft applied to the registry is what the journal reads', () => {
    const saved = structuredClone(journalJson)
    const fresh = { ...saved.articles[0], slug: 'newpiece', title: 'A new piece', published: '2027-01-01' }
    try {
      // Added at the end of the file: the pages put it first by its date.
      applyDrafts({ journal: { articles: [...saved.articles, fresh] } }, CONTENT)
      expect(getArticle('newpiece')?.title).toBe('A new piece')
      expect(articleList()[0].slug).toBe('newpiece')
    } finally {
      applyDrafts({ journal: saved }, CONTENT)
    }
    expect(getArticle('newpiece')).toBeUndefined()
  })

  it('previewRequested reads the query or the session flag', () => {
    expect(previewRequested('?preview', null)).toBe(true)
    expect(previewRequested('?preview=1', null)).toBe(true)
    expect(previewRequested('?collection=spirit&preview', null)).toBe(true)
    expect(previewRequested('', '1')).toBe(true)
    expect(previewRequested('', null)).toBe(false)
    expect(previewRequested('?previewed=1', null)).toBe(false)
  })

  it('asset maps only unpublished dashboard photos', () => {
    setPreviewMedia(['/assets/cms/0123456789abcdef0123.webp', '/assets/cms/m/aaaaaaaaaaaaaaaaaaaa.webp'])
    expect(asset('/assets/cms/0123456789abcdef0123.webp')).toBe('/api/admin/media?file=0123456789abcdef0123.webp')
    expect(asset('/assets/cms/m/aaaaaaaaaaaaaaaaaaaa.webp')).toBe('/api/admin/media?file=m/aaaaaaaaaaaaaaaaaaaa.webp')
    expect(asset('/assets/cms/ffffffffffffffffffff.webp')).toBe('/assets/cms/ffffffffffffffffffff.webp')
    expect(asset('/assets/client/store-bsas.webp')).toBe('/assets/client/store-bsas.webp')
  })
  // A new product is only in the draft until it is published. The shop, its
  // page and search read the products array the site already holds, so the
  // draft is put into that array rather than in place of it.
  it('a draft applied to the registry is what the shop reads', () => {
    const saved = structuredClone(productsJson)
    const held = products
    const fresh = { ...saved.products[1], id: 'newscent', name: 'New Scent' }
    try {
      applyDrafts({ products: { products: [...saved.products, fresh] } }, CONTENT)
      expect(getProduct('newscent')?.name).toBe('New Scent')
      expect(products).toBe(held)
      expect(products).toHaveLength(saved.products.length + 1)
    } finally {
      applyDrafts({ products: saved }, CONTENT)
    }
    expect(getProduct('newscent')).toBeUndefined()
    expect(products).toHaveLength(saved.products.length)
  })

  // A renamed collection shows on every product at once, and a rearranged
  // logo wall shows as drawn: the pages read these documents when they render.
  it('drafts applied to the lists are what the pages read', () => {
    const savedCollections = structuredClone(collectionsJson)
    const savedPartners = structuredClone(partnersJson)
    const held = collections
    const renamed = savedCollections.collections.map((c) => (c.id === 'signature' ? { ...c, name: 'Signature Line' } : c))
    const twoRows = { rows: [savedPartners.rows[0], { logos: [...savedPartners.rows[1].logos, ...savedPartners.rows[2].logos] }] }
    try {
      applyDrafts({ collections: { collections: renamed }, partners: twoRows }, CONTENT)
      expect(collectionName(getProduct('orchid')!)).toBe('Signature Line')
      expect(collections).toBe(held)
      expect(partnersDoc.rows).toHaveLength(2)
    } finally {
      applyDrafts({ collections: savedCollections, partners: savedPartners }, CONTENT)
    }
    expect(collectionName(getProduct('orchid')!)).toBe('Signature')
    expect(partnersDoc.rows).toHaveLength(3)
  })

  it('a banner draft is what the page reads', () => {
    const saved = structuredClone(pagesJson)
    const draft = structuredClone(pagesJson)
    draft.about.banner.image = '/assets/cms/0123456789abcdef0123.webp'
    try {
      applyDrafts({ pages: draft }, CONTENT)
      expect(pages.about.banner.image).toBe('/assets/cms/0123456789abcdef0123.webp')
    } finally {
      applyDrafts({ pages: saved }, CONTENT)
    }
    expect(pages.about.banner.image).toBe('/assets/client/banner-our-story.webp')
  })

  // Every page's own words, the header and footer among them, are read when
  // they render, so a preview of the Pages shows its drafts everywhere.
  it('a draft of the pages is what the pages read', () => {
    const saved = structuredClone(pagesJson)
    const draft = structuredClone(pagesJson)
    draft.home.signature.heading = 'Orchid, the scent\nthat started it all'
    draft.layout.footer.copyright = '© 2027 Legendary Perfume'
    draft.home.finder.moods.Bold = 'Warm and brave'
    try {
      applyDrafts({ pages: draft }, CONTENT)
      expect(pages.home.signature.heading).toBe('Orchid, the scent\nthat started it all')
      expect(pages.layout.footer.copyright).toBe('© 2027 Legendary Perfume')
      expect(moodLine('Bold')).toBe('Warm and brave')
    } finally {
      applyDrafts({ pages: saved }, CONTENT)
    }
    expect(moodLine('Bold')).toBe('Warm, spirited and unforgettable')
  })
})
