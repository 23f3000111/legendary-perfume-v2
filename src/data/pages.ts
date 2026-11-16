import data from '../content/pages.json'
import type { PagesDoc } from '../../api/_lib/content/schema'

/**
 * Every page's own words, and its two photographs: the headings, intros and
 * buttons in the copy, the header menu's featured card, the footer, and what
 * search engines are told about each page.
 *
 * They live in src/content/pages.json, which the Legendary team edits in the
 * dashboard's Pages tab. Read them when rendering (`pages.home.signature`),
 * never from a copy taken at import, so a preview's drafts show. Headings take
 * a newline and *gold words*; see src/lib/heading.ts.
 */
export const pages = data as PagesDoc

/**
 * The picture a shared link to a page shows: its own sharing image, or else
 * its banner, as every page shared before. Undefined when it has neither (the
 * Home page), and the house's default picture is used.
 */
export function shareImage(page: { seo: { image?: string }; banner?: { image: string } }): string | undefined {
  return page.seo.image ?? page.banner?.image
}
