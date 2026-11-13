/**
 * The storefront's own API.
 *
 * Same origin in production, where the functions under /api are deployed
 * alongside the site. `VITE_API_BASE` points somewhere else when the two are
 * split, e.g. a static preview on GitHub Pages talking to the Vercel
 * deployment.
 */
import type { DocKey } from '../../api/_lib/content/keys'
import type { SlotKind } from '../../api/_lib/content/slots'

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

/** The parcel, once the house has recorded its tracking number. */
export interface TrackedShipment {
  courierName: string
  trackingNumber: string
  /** The courier's own tracking page for this parcel, where one is known. */
  trackingUrl?: string
  shippedAt: string
}

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
  shipment?: TrackedShipment
}

/** An error carrying a message that is safe, and useful, to show a customer. */
export class ApiError extends Error {
  /** `detail` is the parsed error body, for answers that carry more than a message. */
  constructor(readonly status: number, message: string, readonly detail?: unknown) {
    super(message)
  }
}

/** An API path as the browser should request it, with VITE_API_BASE in front. */
export function apiUrl(path: string): string {
  return `${BASE}${path}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(apiUrl(path), {
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
    throw new ApiError(res.status, message, body)
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
  shipment: AdminShipment | null
}

export interface AdminShipment extends TrackedShipment {
  /** One of the couriers below, or 'other'. */
  courier: string
  /** When the customer was last emailed it; absent if no email has gone. */
  notifiedAt?: string
}

/** A courier the dashboard offers. `linked` is whether the site knows its tracking page. */
export interface AdminCourier {
  id: string
  name: string
  linked: boolean
}

export interface ShipmentInput {
  courier: string
  trackingNumber: string
  /** Only for an 'other' courier. */
  courierName?: string
  trackingUrl?: string
}

/** What the dashboard learns after recording a parcel. */
export interface ShipResult {
  order: AdminOrder
  /** Null when nothing needed sending; otherwise whether the customer's email went. */
  email: { sent: boolean; reason?: string } | null
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
  couriers: AdminCourier[]
}> {
  return request<{ orders: AdminOrder[]; summary: AdminSummary; storage: string; couriers: AdminCourier[] }>(
    `/api/admin/orders?limit=${limit}`,
    withCookies,
  )
}

function patchOrder(body: Record<string, unknown>): Promise<ShipResult> {
  return request<ShipResult>('/api/admin/orders', { ...withCookies, method: 'PATCH', body: JSON.stringify(body) })
}

/** Record the parcel's tracking number and email it to the customer. */
export const adminShipOrder = (reference: string, shipment: ShipmentInput) => patchOrder({ reference, shipment })

/** Email the customer the tracking number already on the order, again. */
export const adminResendShipping = (reference: string) => patchOrder({ reference, resend: true })

/** Take the tracking number off an order. The customer is not emailed. */
export const adminClearShipping = (reference: string) => patchOrder({ reference, shipment: null })

/* --------------------------------------------------------------- content ---
 * The content dashboard: drafts, preview, publishing and photos. See
 * api/admin/content.ts and api/admin/media.ts.
 * -------------------------------------------------------------------------- */

export interface PreviewDrafts {
  drafts: Record<string, unknown>
  /** Unpublished dashboard photos, as /assets/cms/... paths. */
  media: string[]
}

/** The drafts a preview tab shows in place of the published content. */
export function adminPreviewDrafts(): Promise<PreviewDrafts> {
  return request<PreviewDrafts>('/api/admin/content?action=preview', withCookies)
}

export interface ContentIssue {
  /** Dotted path to the field, e.g. "sections.0.items.2.a". */
  path: string
  message: string
}

export interface ContentDocState {
  label: string
  published: unknown
  /** The published document's blob sha on GitHub. */
  sha: string | null
  draft: unknown | null
  draftBase: string | null
  errors: ContentIssue[]
  /** Paths of fields holding a long dash, which house style avoids. */
  warnings: string[]
}

export interface ContentState {
  /** False until GITHUB_TOKEN and GITHUB_REPO are set. */
  configured: boolean
  branch: string
  durable: boolean
  docs: Partial<Record<DocKey, ContentDocState>>
}

export interface ContentCommit {
  sha: string
  date: string
  message: string
  docs: DocKey[]
}

export type DeployState = 'pending' | 'success' | 'failure' | 'none'

const contentApi = (query: string) => `/api/admin/content?${query}`

export function adminContentState(): Promise<ContentState> {
  return request<ContentState>(contentApi('action=state'), withCookies)
}

/**
 * Save a draft. `base` is the published version (blob sha) the editor's copy
 * began from, so a publish can tell when someone else changed the document
 * in the meantime. A draft that already exists keeps the base it began with.
 */
export function adminSaveDraft(
  doc: DocKey,
  data: unknown,
  base: string | null,
): Promise<{ draft: { baseSha: string | null; updatedAt: string }; errors: ContentIssue[]; warnings: string[] }> {
  return request(contentApi('action=draft'), { ...withCookies, method: 'PUT', body: JSON.stringify({ doc, data, base }) })
}

export function adminDiscardDraft(doc: DocKey): Promise<{ ok: true }> {
  return request(contentApi(`action=draft&doc=${doc}`), { ...withCookies, method: 'DELETE' })
}

/**
 * One commit with every listed document. A 409's `detail.conflicts` names the ones changed meanwhile.
 * `shas` is each published document's new version.
 */
export function adminPublish(
  docs: DocKey[],
  overwrite: DocKey[] = [],
): Promise<{ commit: string; shas: Partial<Record<DocKey, string>> }> {
  return request(contentApi('action=publish'), { ...withCookies, method: 'POST', body: JSON.stringify({ docs, overwrite }) })
}

export function adminRestore(doc: DocKey, sha: string): Promise<{ commit: string }> {
  return request(contentApi('action=restore'), { ...withCookies, method: 'POST', body: JSON.stringify({ doc, sha }) })
}

export function adminHistory(doc?: DocKey): Promise<{ commits: ContentCommit[] }> {
  return request(contentApi(doc ? `action=history&doc=${doc}` : 'action=history'), withCookies)
}

export function adminDeployStatus(sha: string): Promise<{ state: DeployState }> {
  return request(contentApi(`action=status&sha=${sha}`), withCookies)
}

export interface LibraryPhoto {
  /** `m/<hash>.webp` */
  file: string
  url: string
  width: number
  height: number
  published: boolean
  createdAt: string
}

/**
 * Add a photo to the library. The browser has already shrunk it under the upload limit.
 *
 * Sent as application/octet-stream whatever the photo is. Vercel's runtime
 * reads a request body before the function runs and passes it on only for the
 * types it knows (octet-stream as the raw bytes); sent as image/png, the
 * function would receive nothing. The server reads the real type from the
 * bytes themselves.
 */
export function adminUploadPhoto(photo: Blob): Promise<{ file: string; url: string; width: number; height: number }> {
  return request('/api/admin/media', {
    ...withCookies,
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: photo,
  })
}

/** A copy of a library photo sized for one kind of place; the path goes into the content. */
export function adminDerivePhoto(file: string, kind: SlotKind): Promise<{ path: string; width: number; height: number }> {
  return request(`/api/admin/media?derive=${encodeURIComponent(file)}&kind=${kind}`, { ...withCookies, method: 'POST' })
}

export function adminLibrary(): Promise<{ photos: LibraryPhoto[]; site: string[] }> {
  return request('/api/admin/media', withCookies)
}
