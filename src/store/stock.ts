import { create } from 'zustand'
import { fetchCatalogueChanges, type StockChange } from '../lib/api'
import type { Product } from '../data/products'

/**
 * Live stock and price, from the dashboard.
 *
 * The catalogue is baked into the bundle at build time, which is right for
 * copy and photography and wrong for whether something is on the shelf. So the
 * shop asks `/api/catalogue` once per page load for the handful of products
 * that currently differ, and reads through this everywhere a price or a buy
 * button is drawn.
 *
 * Failing to load is not an error worth showing anyone: the site simply falls
 * back to the built catalogue, which is what it did before the dashboard
 * existed. The one place that must not fall back is the checkout, and it does
 * not: the server prices and stock checks the basket again regardless of
 * anything decided here.
 */
interface StockState {
  changes: Record<string, StockChange>
  hidden: string[]
  loaded: boolean
  load: () => Promise<void>
}

export const useStock = create<StockState>((set, get) => ({
  changes: {},
  hidden: [],
  loaded: false,
  load: async () => {
    if (get().loaded) return
    try {
      const { products, hidden } = await fetchCatalogueChanges()
      set({ changes: products, hidden, loaded: true })
    } catch {
      // The built catalogue stands.
      set({ loaded: true })
    }
  },
}))

export interface LiveProduct {
  price: number
  compareAt?: number
  inStock: boolean
}

/** A product's current price and availability, the override applied. */
export function live(product: Product, changes: Record<string, StockChange>): LiveProduct {
  const change = changes[product.id]
  if (!change) return { price: product.price, compareAt: product.compareAt, inStock: true }
  return {
    price: change.price ?? product.price,
    compareAt:
      change.compareAt === null ? undefined : change.compareAt ?? product.compareAt,
    inStock: change.inStock,
  }
}

/**
 * Whether a product is in the Bestsellers edit.
 *
 * The dashboard can put one in or take one out; otherwise the catalogue's own
 * flag stands.
 */
export function isBestseller(product: Product, changes: Record<string, StockChange>): boolean {
  return changes[product.id]?.bestseller ?? Boolean(product.bestseller)
}

/**
 * Whether a product belongs in a listing at all.
 *
 * Out of stock still shows, marked sold out: someone looking for it should find
 * it and see that it exists. Hidden is gone.
 */
export function isListed(product: Product, hidden: string[]): boolean {
  return !hidden.includes(product.id)
}
