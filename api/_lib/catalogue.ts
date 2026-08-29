import { HttpError } from './http.js'
import { CURRENCY as GENERATED_CURRENCY, PRODUCTS } from '../_catalogue.js'

export interface CatalogueItem {
  id: string
  name: string
  size: string
  /** Whole ringgit, as shown on the site. */
  price: number
  collection: string
}

export interface OrderLine {
  id: string
  name: string
  size: string
  qty: number
  /** Whole ringgit. */
  unitPrice: number
  lineTotal: number
}

export const CURRENCY = GENERATED_CURRENCY

/** Malaysian ringgit is a two decimal currency, so Stripe wants sen. */
export function toMinorUnits(ringgit: number): number {
  return Math.round(ringgit * 100)
}

export function fromMinorUnits(sen: number): number {
  return sen / 100
}

const MAX_QTY_PER_LINE = 20
const MAX_LINES = 30

/**
 * Price a basket from the server's own catalogue.
 *
 * The browser sends product ids and quantities and nothing else. Every price
 * comes from `_catalogue.ts`, which is generated from src/data/products.ts at
 * build time, so a tampered basket cannot change what is charged.
 *
 * `overrides` is the dashboard's layer on top: a price set there wins, and a
 * product marked out of stock or hidden is refused outright. This is the only
 * place that decision can be trusted, since the shop's own buttons are just a
 * courtesy the browser could ignore.
 */
export async function priceOrder(
  raw: unknown,
): Promise<{ lines: OrderLine[]; subtotal: number; total: number }> {
  const { overrideStore, isBuyable } = await import('./overrides.js')
  const overrides = await overrideStore().all()
  return priceOrderWith(raw, (id) => {
    const o = overrides[id]
    return { price: o?.price, buyable: isBuyable(o) }
  })
}

export function priceOrderWith(
  raw: unknown,
  lookup: (id: string) => { price?: number; buyable: boolean },
): { lines: OrderLine[]; subtotal: number; total: number } {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new HttpError(400, 'Your bag is empty.')
  }
  if (raw.length > MAX_LINES) {
    throw new HttpError(400, 'That is more lines than we can take in one order.')
  }

  const seen = new Set<string>()
  const lines: OrderLine[] = []

  for (const entry of raw) {
    const id = (entry as { id?: unknown })?.id
    const qty = (entry as { qty?: unknown })?.qty
    if (typeof id !== 'string' || !PRODUCTS[id]) {
      throw new HttpError(400, 'One of the fragrances in your bag is no longer available.')
    }
    if (seen.has(id)) {
      throw new HttpError(400, 'That fragrance appears twice in your bag.')
    }
    seen.add(id)
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      throw new HttpError(400, `Choose between 1 and ${MAX_QTY_PER_LINE} of each fragrance.`)
    }
    const product = PRODUCTS[id]
    const state = lookup(id)
    if (!state.buyable) {
      throw new HttpError(409, `${product.name} has just gone out of stock. Please remove it to continue.`)
    }
    const unitPrice = state.price ?? product.price
    lines.push({
      id,
      name: product.name,
      size: product.size,
      qty,
      unitPrice,
      lineTotal: unitPrice * qty,
    })
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  // Client amendment: delivery is free on every order, so there is nothing to
  // add on top of the basket.
  return { lines, subtotal, total: subtotal }
}

export function getProduct(id: string): CatalogueItem | undefined {
  return PRODUCTS[id]
}

/** The whole catalogue in the order the shop merchandises it. */
export function catalogueList(): CatalogueItem[] {
  return Object.values(PRODUCTS)
}
