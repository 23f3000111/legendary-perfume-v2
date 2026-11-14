import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { catalogueSource } from '../../api/_lib/content/catalogue-source'
import productsJson from '../../src/content/products.json'

describe("the server's price list", () => {
  // The build writes api/_catalogue.ts and so does every dashboard publish of
  // the products. If the two disagreed, the build would quietly change the
  // file the publish wrote, or checkout would price from a stale copy.
  it('the committed catalogue is what the products file generates', () => {
    const committed = readFileSync('api/_catalogue.ts', 'utf8').replace(/\r\n/g, '\n')
    expect(catalogueSource(productsJson.products)).toBe(committed)
  })

  it('a price the server cannot charge is refused', () => {
    const free = { id: 'gift', name: 'Gift', size: '30ml Eau de Parfum', price: 0, collection: 'Signature' }
    expect(() => catalogueSource([free])).toThrow(/cannot charge/)
    const half = { ...free, price: 88.5 }
    expect(() => catalogueSource([half])).toThrow(/cannot charge/)
  })
})
