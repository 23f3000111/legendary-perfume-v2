import { afterEach, describe, expect, it } from 'vitest'
import { applyDrafts, previewRequested } from './preview'
import { CONTENT } from './registry'
import { asset, setPreviewMedia } from '../lib/asset'
import { faq } from '../data/faq'
import faqJson from './faq.json'

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
})
