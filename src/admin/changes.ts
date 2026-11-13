import type { DocKey } from '../../api/_lib/content/keys'
import type { JournalArticle, JournalDoc } from '../../api/_lib/content/schema'
import { sameContent } from './contentStore'

/**
 * What a change to the Journal does to the site, article by article.
 *
 * The Journal is one document, so Publish, Discard, "Keep mine" and Restore
 * each act on every article in it at once. The dashboard names the articles
 * they touch, so nobody publishes, throws away or takes down an article
 * without being told which.
 */

const bySlug = (doc: unknown): Map<string, JournalArticle> =>
  new Map(((doc as JournalDoc | null)?.articles ?? []).map((a) => [a.slug, a]))

const titleOf = (a: JournalArticle) => a.cardTitle || a.title || 'An untitled article'

/** What publishing `working` over `published` would do: the articles it adds, changes and takes off the site. */
export function journalChanges(working: unknown, published: unknown): { added: string[]; changed: string[]; removed: string[] } {
  const mine = bySlug(working)
  const live = bySlug(published)
  return {
    added: [...mine.values()].filter((a) => !live.has(a.slug)).map(titleOf),
    changed: [...mine.values()].filter((a) => live.has(a.slug) && !sameContent(a, live.get(a.slug))).map(titleOf),
    removed: [...live.values()].filter((a) => !mine.has(a.slug)).map(titleOf),
  }
}

/** What restoring the Journal to `old` would do to `current`: the articles it takes off the site and brings back. */
export function restoreChanges(current: unknown, old: unknown): { removed: string[]; returned: string[] } {
  const now = bySlug(current)
  const then = bySlug(old)
  return {
    removed: [...now.values()].filter((a) => !then.has(a.slug)).map(titleOf),
    returned: [...then.values()].filter((a) => !now.has(a.slug)).map(titleOf),
  }
}

/** Titles for a sentence: "A", "A and B", "A, B and C". */
export function titleList(titles: string[]): string {
  if (titles.length <= 1) return titles.join('')
  return `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`
}

/** One line saying which articles an unpublished Journal adds, changes and removes. Null for other documents, or no change. */
export function changeSummary(doc: DocKey, working: unknown, published: unknown): string | null {
  if (doc !== 'journal') return null
  const { added, changed, removed } = journalChanges(working, published)
  const parts = [
    added.length ? `New: ${titleList(added)}.` : '',
    changed.length ? `Changed: ${titleList(changed)}.` : '',
    removed.length ? `Removed: ${titleList(removed)}.` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' ') : null
}
