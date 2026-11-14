import { describe, expect, it } from 'vitest'
import { placeTarget, scentPlaces } from './places'

describe('the Scented Memory map', () => {
  // A product removed from the shop must not take the map down with it.
  it('the map and Home cope with a missing product', () => {
    expect(placeTarget({ ...scentPlaces[0], productId: 'nosuchscent' })).toBeNull()
    expect(placeTarget(scentPlaces[0])).not.toBeNull()
  })
})
