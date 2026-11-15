import { describe, expect, it } from 'vitest'
import { blankCollection, collectionInUse, moveLogo, renameCollection, setStars, siteMono } from './site'

describe('the Site tab', () => {
  // A collection's id is its address in the shop, /shop?collection=<id>.
  it('a new collection gets an address of its own', () => {
    const blank = blankCollection(new Set(['newcollection']))
    expect(blank.id).toBe('newcollection2')
    expect(blank.accent).toBe('gold')
    expect(renameCollection(blank, 'Merdeka', new Set(), new Set()).id).toBe('merdeka')
    // Never a published address, even one this draft removed: old links point at it.
    expect(renameCollection(blank, 'Signature', new Set(['signature']), new Set()).id).toBe('signature2')
    const signature = { ...blank, id: 'signature', name: 'Signature' }
    expect(renameCollection(signature, 'Signature Line', new Set(['signature']), new Set()).id).toBe('signature')
  })

  it('a collection in use cannot be removed', () => {
    const signature = { id: 'signature', name: 'Signature' }
    const nyonya = { id: 'nyonya', name: 'Nyonya' }
    const products = [
      { name: 'Orchid', collectionId: 'signature' },
      { name: 'Violet', collectionId: 'signature' },
    ]
    const places = [{ place: 'Melaka', collectionId: 'nyonya' }]
    expect(collectionInUse(signature, products, places)).toBe('Orchid and Violet are in Signature. Move them to another collection first.')
    expect(collectionInUse(signature, products.slice(0, 1), [])).toBe('Orchid is in Signature. Move it to another collection first.')
    expect(collectionInUse(nyonya, [], places)).toBe("The Scented Memory map's Melaka pin opens Nyonya.")
    expect(collectionInUse(nyonya, products, [])).toBeNull()
  })

  it('five stars is the default and is left out', () => {
    const review = { quote: 'I like the smell.', author: 'anson.gan' }
    expect(setStars(review, 4)).toEqual({ ...review, rating: 4 })
    expect(setStars({ ...review, rating: 4 }, 5)).toEqual(review)
  })

  it('moveLogo moves a logo to the end of another row', () => {
    const logo = (name: string) => ({ name, logo: `/assets/client/partner-${name}.png`, mono: `/assets/client/partner-${name}-mono.png` })
    const rows = [{ logos: [logo('airasia'), logo('sogo')] }, { logos: [logo('ctrip')] }]
    expect(moveLogo(rows, { row: 0, index: 1 }, 1)).toEqual([{ logos: [logo('airasia')] }, { logos: [logo('ctrip'), logo('sogo')] }])
    expect(moveLogo(rows, { row: 0, index: 1 }, 0)).toEqual(rows)
  })

  // A logo the site already has keeps its black and white print beside it.
  it('siteMono finds the black and white print beside a site logo', () => {
    expect(siteMono('/assets/client/partner-sogo.png')).toBe('/assets/client/partner-sogo-mono.png')
    expect(siteMono('/assets/client/seller-zapin.png')).toBe('/assets/client/seller-zapin-mono.png')
    expect(siteMono('/assets/client/partner-sogo-mono.png')).toBeNull()
    expect(siteMono('/assets/client/store-bsas.webp')).toBeNull()
    expect(siteMono('/assets/cms/abc.webp')).toBeNull()
  })

  // A typo fixed in a new collection's name must not leave its products in a
  // collection that no longer exists.
  it('a new collection keeps its address once products are in it', () => {
    const merdeka = { ...blankCollection(new Set()), id: 'merdeka', name: 'Merdeka' }
    expect(renameCollection(merdeka, 'Merdeka Raya', new Set(), new Set(), new Set(['merdeka'])).id).toBe('merdeka')
    expect(renameCollection(merdeka, 'Merdeka Raya', new Set(), new Set(), new Set()).id).toBe('merdekaraya')
  })

  // Removing it while the site still has products in it, their move out only a
  // draft, would leave them in a collection that is gone if that draft is dropped.
  it('a collection products are in on the site cannot be removed until their move is published', () => {
    const signature = { id: 'signature', name: 'Signature' }
    const live = [
      { name: 'Orchid', collectionId: 'signature' },
      { name: 'Violet', collectionId: 'signature' },
    ]
    expect(collectionInUse(signature, [], [], live.slice(0, 1))).toBe(
      'Orchid is in Signature on the site. Publish its move to another collection first.',
    )
    expect(collectionInUse(signature, [], [], live)).toBe(
      'Orchid and Violet are in Signature on the site. Publish their move to another collection first.',
    )
    expect(collectionInUse(signature, [], [], [])).toBeNull()
  })
})
