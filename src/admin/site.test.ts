import { describe, expect, it } from 'vitest'
import { blankCollection, collectionInUse, renameCollection } from './site'

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
})
