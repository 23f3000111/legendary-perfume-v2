import { describe, expect, it } from 'vitest'
import { cartCount, cartDetails, orderLines } from './shop'

describe('the bag', () => {
  // A bag is kept in the browser. If the team removes a product someone has
  // in theirs, that line must not be counted, and must not reach checkout,
  // which refuses ids it does not know, every time, for good.
  it('a product that left the shop neither counts nor blocks checkout', () => {
    const saved = [
      { id: 'orchid', qty: 2 },
      { id: 'leftthesho', qty: 1 },
    ]
    expect(cartCount(saved)).toBe(2)
    expect(orderLines(saved)).toEqual([{ id: 'orchid', qty: 2 }])
    expect(cartDetails(saved).map((d) => d.product.id)).toEqual(['orchid'])
  })
})
