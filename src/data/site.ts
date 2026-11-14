import data from '../content/site.json'
import type { SiteDoc } from '../../api/_lib/content/schema'

/**
 * The house's contact details and links: the WhatsApp number, the address
 * search engines are given, the social links and the head office.
 *
 * They live in src/content/site.json, which the Legendary team edits in the
 * dashboard. Every WhatsApp button, the footer's social links, the Contact
 * page and the structured data read them when they render, never from a copy
 * taken at import, so a preview's drafts show.
 *
 * Client house style: numbers are spaced, never hyphenated. Revision 2 made
 * WhatsApp the only number, and moved the Contact page's address from the
 * Melaka flagship to the registered head office. The head office map is the
 * client's own pinned embed: a place query resolves to the road rather than
 * the unit.
 */
export const site: SiteDoc = data

/** The WhatsApp number as WhatsApp's links want it: digits only, no plus or spaces. */
export function whatsappDigits(): string {
  return site.whatsapp.replace(/\D/g, '')
}

/** A WhatsApp chat with the house, opened with `text` typed in. */
export function waLink(text: string): string {
  return `https://api.whatsapp.com/send/?phone=%2B${whatsappDigits()}&text=${encodeURIComponent(
    text,
  )}&type=phone_number&app_absent=0`
}

/** A WhatsApp chat with the house and nothing typed, as the header's button opens. */
export function waChat(): string {
  return `https://api.whatsapp.com/send/?phone=%2B${whatsappDigits()}`
}

/** The house's pages elsewhere, as search engines are told: the links the site itself shows. */
export function sameAs(): string[] {
  return [site.instagram.url, site.facebook.url, site.tiktok, site.shopee]
}
