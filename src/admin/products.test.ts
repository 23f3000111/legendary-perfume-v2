import { describe, expect, it } from 'vitest'
import { getProduct } from '../data/products'
import { blankProduct, duplicateProduct, pinReason, renameProduct } from './products'

const signature = { id: 'signature', name: 'Signature' }

describe('products in the dashboard', () => {
  it("a new product starts with the house's included lines and a mood", () => {
    const fresh = blankProduct(new Set(['orchid']), signature)
    expect(fresh.id).toBe('newproduct')
    expect(fresh.moods).toEqual(['Serene'])
    expect(fresh.collectionId).toBe('signature')
    expect(fresh.collection).toBe('Signature')
    // The first line names the scent and its pour, so it starts empty; the
    // rest is what every box holds.
    expect(fresh.includedItems.map((i) => i.label)).toEqual(['', 'Signature carrier', 'Gift box', 'Post card', 'Discovery samples'])
  })

  it('renameProduct makes the address from the name while the product is new', () => {
    const fresh = blankProduct(new Set(['orchid']), signature)
    const named = renameProduct(fresh, 'Saffron Dusk', new Set(['orchid']), new Set(['orchid']))
    expect(named).toMatchObject({ name: 'Saffron Dusk', id: 'saffrondusk' })
  })

  // The price table's settings key on the address: a new product given a
  // published one's would come up with that product's price, stock or hidden.
  it('renaming a new product never takes a published address', () => {
    const fresh = blankProduct(new Set(), signature)
    expect(renameProduct(fresh, 'Love', new Set(['love', 'orchid']), new Set()).id).toBe('love2')
  })

  // Overrides, links and search results key on a published product's address.
  it('renameProduct keeps a published address', () => {
    const orchid = getProduct('orchid')!
    expect(renameProduct(orchid, 'Orchid Noir', new Set(['orchid']), new Set())).toMatchObject({ name: 'Orchid Noir', id: 'orchid' })
  })

  it('a duplicate is a copy with its own address, not on the map or the bestseller list', () => {
    const orchid = getProduct('orchid')!
    expect(orchid.bestseller).toBe(true)
    expect(orchid.place).toBeTruthy()
    const copy = duplicateProduct(orchid, new Set(['orchid']))
    expect(copy).toMatchObject({ name: 'Orchid copy', id: 'orchidcopy', price: orchid.price, story: orchid.story })
    expect(copy.bestseller).toBeUndefined()
    expect(copy.place).toBeUndefined()
    expect(copy.notes).toEqual(orchid.notes)
    expect(copy.notes).not.toBe(orchid.notes)
  })

  // The site's own code points at these; removing one would empty Home's
  // Signature section or a pin on the map.
  it('pinned products cannot be removed', () => {
    expect(pinReason('orchid')).toBe("Orchid leads the Home page's Signature section.")
    expect(pinReason('mahsuri')).toBe('Mahsuri is pinned on the Scented Memory map.')
    expect(pinReason('violet')).toBeNull()
  })
})
