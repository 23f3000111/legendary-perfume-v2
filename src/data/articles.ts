import data from '../content/journal.json'
import type { JournalArticle, JournalDoc } from '../../api/_lib/content/schema'

/* ------------------------------------------------------------------
   The Journal: long-form articles, newest first.

   The words and photos live in src/content/journal.json, which the
   Legendary team edits in the dashboard. Bodies are Block[] so the Prose
   renderer owns every type decision (see components/ui/Prose). Photo
   paths are stored from the site root, and whatever draws them calls
   asset() at render, so the GitHub Pages preview still finds them under
   its subpath.

   House rule: no dash characters in visible copy. The client's articles
   arrived full of them, so the connectors were re-punctuated and the
   number ranges spelled out. Hyphenated English words stay, and so do
   the titles the client published.

   The notes on where each article came from (the anniversary piece kept
   as the client wrote it, the Nyonya card cut from the top of its cover,
   and the rest) are in this file's history from before the move to JSON:
   git log -p -- src/data/articles.ts

   Read it when rendering (articleList(), never a copy taken at import),
   so a preview's drafts, swapped into the JSON object before the first
   render, show.
   ------------------------------------------------------------------ */

/**
 * The published articles, as the file holds them. JSON imports type each
 * block's `t` as a plain string; the schema check at build time is what
 * holds the file to the block types.
 */
export const journal = data as JournalDoc

/** An article as the pages show it: its date written out, and its reading time. */
export type Article = JournalArticle & { date: string; readTime: string }

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * `2026-10-22` the way the pages write it: `22 October 2026`. Worked out from
 * the digits, so no time zone can move the day.
 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/**
 * Newest first. The index and the previous / next rail both read this order,
 * so it is sorted here rather than left to the order the file keeps. Articles
 * from the same day keep the file's order.
 */
export function articleList(): Article[] {
  return [...journal.articles]
    .sort((a, b) => b.published.localeCompare(a.published))
    .map((a) => ({ ...a, date: formatDate(a.published), readTime: `${a.minutes} min` }))
}

export const getArticle = (slug: string) => articleList().find((a) => a.slug === slug)

/** Neighbours for the previous / next rail at the foot of an article. */
export function articleNeighbours(slug: string) {
  const list = articleList()
  const i = list.findIndex((a) => a.slug === slug)
  return {
    prev: i > 0 ? list[i - 1] : undefined,
    next: i >= 0 && i < list.length - 1 ? list[i + 1] : undefined,
  }
}
