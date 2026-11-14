/**
 * The server's price list, api/_catalogue.ts, written from the products.
 *
 * Two things write that file, and they must agree byte for byte: the build
 * (`npm run catalogue`, scripts/build-catalogue.mjs) and the dashboard, which
 * puts it in the same commit as every change to the products, so checkout
 * knows a new product at its price whatever order Vercel builds things in.
 * Both call this.
 *
 * No imports, so the build script can bundle it on its own.
 */

/** What checkout needs of a product: whole ringgit, and the words an order keeps. */
export interface CatalogueProduct {
  id: string
  name: string
  size: string
  price: number
  collection: string
}

export function catalogueSource(products: CatalogueProduct[]): string {
  const catalogue: Record<string, CatalogueProduct> = {}
  for (const p of products) {
    if (catalogue[p.id]) throw new Error(`duplicate product id: ${p.id}`)
    if (!Number.isInteger(p.price) || p.price <= 0) {
      throw new Error(`product ${p.id} has a price the server cannot charge: ${p.price}`)
    }
    catalogue[p.id] = { id: p.id, name: p.name, size: p.size, price: p.price, collection: p.collection }
  }

  return `/**
 * Generated from src/content/products.json by api/_lib/content/catalogue-source.ts,
 * when the site builds (\`npm run catalogue\`) and whenever the dashboard publishes
 * or restores the products. Do not edit by hand.
 *
 * This is the server's own copy of what things cost. The checkout prices every
 * basket from here, so a price sent by a browser is never trusted.
 */
export interface CatalogueEntry {
  id: string
  name: string
  size: string
  /** Whole ringgit. */
  price: number
  collection: string
}

export const CURRENCY = 'MYR' as const

export const PRODUCTS: Record<string, CatalogueEntry> = ${JSON.stringify(catalogue, null, 2)}
`
}
