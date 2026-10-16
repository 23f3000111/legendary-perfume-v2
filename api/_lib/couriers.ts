/**
 * The couriers the dashboard offers, and where each lets a customer follow a
 * parcel.
 *
 * Every link was opened in Chrome with a sample number on 16 October 2026 to
 * confirm the courier's own page reads the number from it: Pos Laju, DHL and
 * City-Link search it straight away, J&T, Ninja Van and SPX fill it into their
 * search box. GDex is not listed because its site refused the automated check,
 * and an unverified link in a customer's inbox is worse than none. It, and any
 * other courier, goes under Other, with the name and link the house types in.
 *
 * `{n}` is replaced with the tracking number, URL encoded.
 */
export interface Courier {
  id: string
  name: string
  url?: string
}

export const COURIERS: Courier[] = [
  { id: 'jt', name: 'J&T Express', url: 'https://www.jtexpress.my/tracking/{n}' },
  { id: 'poslaju', name: 'Pos Laju', url: 'https://tracking.pos.com.my/tracking/{n}' },
  { id: 'ninjavan', name: 'Ninja Van', url: 'https://www.ninjavan.co/en-my/tracking?id={n}' },
  { id: 'citylink', name: 'City-Link Express', url: 'https://www.citylinkexpress.com/tracking-result/?track0={n}' },
  {
    id: 'dhl',
    name: 'DHL eCommerce',
    url: 'https://www.dhl.com/my-en/home/tracking/tracking-ecommerce.html?submit=1&tracking-id={n}',
  },
  { id: 'spx', name: 'SPX Express', url: 'https://spx.com.my/track?{n}' },
  { id: 'other', name: 'Other' },
]

export function courierById(id: string): Courier | undefined {
  return COURIERS.find((c) => c.id === id)
}

/** The courier's own tracking page for this number, where one is known. */
export function trackingLink(courierId: string, trackingNumber: string): string | undefined {
  const template = courierById(courierId)?.url
  return template ? template.replace('{n}', encodeURIComponent(trackingNumber)) : undefined
}
