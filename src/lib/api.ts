/**
 * The storefront's own API.
 *
 * Same origin in production, where the functions under /api are deployed
 * alongside the site. `VITE_API_BASE` points somewhere else when the two are
 * split, e.g. a static preview on GitHub Pages talking to the Vercel
 * deployment.
 */
const BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

export interface OrderLine {
  id: string
  name: string
  size: string
  qty: number
  unitPrice: number
  lineTotal: number
}

export interface CheckoutRequest {
  items: { id: string; qty: number }[]
  customer: { email: string; name: string; phone: string }
  shipping: {
    line1: string
    line2?: string
    city: string
    postcode: string
    state: string
  }
  note?: string
}

export interface CheckoutSession {
  reference: string
  clientSecret: string
  currency: string
  lines: OrderLine[]
  subtotal: number
  shippingCost: number
  total: number
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'abandoned'

export interface TrackedOrder {
  reference: string
  status: OrderStatus
  currency: string
  lines: OrderLine[]
  subtotal: number
  shippingCost: number
  total: number
  placedAt: string
  paidAt?: string
  customer: { name: string; email: string }
  shipping: {
    line1: string
    line2?: string
    city: string
    postcode: string
    state: string
    country: string
  }
}

/** An error carrying a message that is safe, and useful, to show a customer. */
export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new ApiError(0, 'We could not reach the shop. Check your connection and try again.')
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      (body as { error?: string } | null)?.error ??
      'Something went wrong on our side. Please try again.'
    throw new ApiError(res.status, message)
  }
  return body as T
}

export function startCheckout(payload: CheckoutRequest): Promise<CheckoutSession> {
  return request<CheckoutSession>('/api/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function findOrder(reference: string, email: string): Promise<{ order: TrackedOrder }> {
  const q = new URLSearchParams({ reference, email })
  return request<{ order: TrackedOrder }>(`/api/order?${q}`)
}

export interface ContactMessage {
  name: string
  email: string
  message: string
  /** Honeypot field. A person never fills it, so anything here is a bot. */
  company?: string
  /** How long the form was open, which a bot gets wrong. */
  elapsedMs?: number
}

export function sendContactMessage(payload: ContactMessage): Promise<{ sent: true }> {
  return request<{ sent: true }>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/* ------------------------------------------------------------------ shop ---
 * Stock and price are the two things the dashboard changes between deploys, so
 * the storefront reads them at runtime. Everything else about a product comes
 * from the build.
 * -------------------------------------------------------------------------- */

export interface StockChange {
  inStock: boolean
  price?: number
  compareAt?: number | null
  /** Whether the dashboard has put this in, or taken it out of, Bestsellers. */
  bestseller?: boolean
}

export interface CatalogueChanges {
  products: Record<string, StockChange>
  /** Products the dashboard has taken off the shop entirely. */
  hidden: string[]
}

export function fetchCatalogueChanges(): Promise<CatalogueChanges> {
  return request<CatalogueChanges>('/api/catalogue')
}

/* ----------------------------------------------------------------- admin ---
 * The dashboard. Every call carries the session cookie, so `credentials` has to
 * be set: fetch omits cookies on cross origin requests by default, and the
 * static preview talks to the API on another origin.
 * -------------------------------------------------------------------------- */

const withCookies: RequestInit = { credentials: 'include' }

export interface AdminSession {
  signedIn: boolean
  storage: 'postgres' | 'file'
  durable: boolean
  passwordSet: boolean
  email: {
    from: string
    /** False while sending as a provider's shared address. */
    canReachCustomers: boolean
    configured: boolean
  }
  expiresAt?: number
}

export interface AdminProduct {
  id: string
  name: string
  size: string
  collection: string
  catalogue: { price: number }
  price: number
  compareAt: number | null
  inStock: boolean
  bestseller: boolean
  hidden: boolean
  buyable: boolean
  overridden: boolean
  updatedAt: string | null
}

export interface AdminOrder {
  reference: string
  status: OrderStatus
  total: number
  currency: string
  placedAt: string
  paidAt: string | null
  customer: { name: string; email: string; phone: string }
  shipping: TrackedOrder['shipping']
  note: string | null
  lines: OrderLine[]
}

export interface AdminSummary {
  window: number
  paid: number
  pending: number
  abandoned: number
  failed: number
  revenue: number
  averageOrder: number
  top: { id: string; name: string; qty: number; revenue: number }[]
}

export function adminSession(): Promise<AdminSession> {
  return request<AdminSession>('/api/admin/session', withCookies)
}

export function adminSignIn(password: string): Promise<AdminSession> {
  return request<AdminSession>('/api/admin/session', {
    ...withCookies,
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export function adminSignOut(): Promise<AdminSession> {
  return request<AdminSession>('/api/admin/session', { ...withCookies, method: 'DELETE' })
}

export function adminProducts(): Promise<{ products: AdminProduct[]; storage: string; durable: boolean }> {
  return request<{ products: AdminProduct[]; storage: string; durable: boolean }>(
    '/api/admin/products',
    withCookies,
  )
}

export function adminPatchProduct(
  id: string,
  patch: Partial<Pick<AdminProduct, 'inStock' | 'bestseller' | 'hidden' | 'price'>> &
    { compareAt?: number | null; reset?: boolean },
): Promise<{ products: AdminProduct[] }> {
  return request<{ products: AdminProduct[] }>('/api/admin/products', {
    ...withCookies,
    method: 'PATCH',
    body: JSON.stringify({ id, ...patch }),
  })
}

export function adminOrders(limit = 50): Promise<{
  orders: AdminOrder[]
  summary: AdminSummary
  storage: string
}> {
  return request<{ orders: AdminOrder[]; summary: AdminSummary; storage: string }>(
    `/api/admin/orders?limit=${limit}`,
    withCookies,
  )
}
