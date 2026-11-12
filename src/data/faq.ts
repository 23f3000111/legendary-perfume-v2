import data from '../content/faq.json'
import type { FaqDoc } from '../../api/_lib/content/schema'

export interface FaqItem {
  q: string
  a: string
  /** Extra lines rendered as a bulleted list under the answer. */
  list?: string[]
}

export interface FaqSection {
  title: string
  items: FaqItem[]
}

/**
 * The FAQ: the page's intro, its groups of questions, and the questions shown
 * on every product page (`product`, drawn from the care and returns copy in the
 * client's product sheets).
 *
 * The words live in src/content/faq.json, which the Legendary team edits in
 * the dashboard. Revision 5 set them from the client's copy sheet: about fifty
 * questions their counter staff are asked, kept in the sheet's own groups,
 * each counter answer ("Cannot", "Wish 2") set as a full sentence without
 * changing what it says, and no dashes anywhere in the wording.
 *
 * Read it when rendering (`faq.sections`, never a copy taken at import), so a
 * preview's drafts, swapped into this object before the first render, show.
 */
export const faq: FaqDoc = data
