import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { products, type Product } from '../data/products'

export interface CartLine {
  id: string
  qty: number
}

interface ShopState {
  items: CartLine[]
  wishlist: string[]
  add: (id: string, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  toggleWish: (id: string) => void
  isWished: (id: string) => boolean
}

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      add: (id, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === id)
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === id ? { ...i, qty: i.qty + qty } : i,
              ),
            }
          }
          return { items: [...s.items, { id, qty }] }
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.id !== id)
              : s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
      toggleWish: (id) =>
        set((s) => ({
          wishlist: s.wishlist.includes(id)
            ? s.wishlist.filter((w) => w !== id)
            : [...s.wishlist, id],
        })),
      isWished: (id) => get().wishlist.includes(id),
    }),
    { name: 'legendary-shop' },
  ),
)

// --- Derived selectors (call with the store's items) ---
export interface CartDetail {
  product: Product
  qty: number
  lineTotal: number
}

export function cartDetails(items: CartLine[]): CartDetail[] {
  return items
    .map((line) => {
      const product = products.find((p) => p.id === line.id)
      if (!product) return null
      return { product, qty: line.qty, lineTotal: product.price * line.qty }
    })
    .filter((x): x is CartDetail => x !== null)
}

export function cartCount(items: CartLine[]): number {
  return items.reduce((n, i) => n + i.qty, 0)
}

export function cartSubtotal(items: CartLine[]): number {
  return cartDetails(items).reduce((sum, l) => sum + l.lineTotal, 0)
}
