import type { DocKey } from '../../api/_lib/content/keys'
import { sameContent } from './contentStore'
import { PAGE_SPECS } from './pages'

/**
 * What a change to a list document does to the site, item by item.
 *
 * The Journal holds every article, and Products every product, in one
 * document each. So Publish, Discard, "Keep mine" and Restore each act on
 * every item at once, and the dashboard names the items they touch, so nobody
 * publishes, throws away or takes down an article or a product without being
 * told which.
 */

interface ListShape {
  /** Where the items are in the document. */
  key: string
  /** What tells one item from another: its address. */
  id: (item: Record<string, unknown>) => string
  /** What the dashboard calls an item. */
  title: (item: Record<string, unknown>) => string
}

const LISTS: Partial<Record<DocKey, ListShape>> = {
  journal: {
    key: 'articles',
    id: (a) => String(a.slug),
    title: (a) => String(a.cardTitle || a.title || 'An untitled article'),
  },
  products: {
    key: 'products',
    id: (p) => String(p.id),
    title: (p) => String(p.name || 'An unnamed product'),
  },
  collections: {
    key: 'collections',
    id: (c) => String(c.id),
    title: (c) => String(c.name || 'An unnamed collection'),
  },
  places: {
    key: 'places',
    id: (p) => String(p.id),
    title: (p) => String(p.place),
  },
  policies: {
    key: 'policies',
    id: (p) => String(p.slug),
    title: (p) => String(p.title || p.slug),
  },
}

/**
 * Documents made of named parts rather than a list: the Pages hold each page's
 * words under the page's key, so a change names the pages it touches.
 */
const SECTIONS: Partial<Record<DocKey, { key: string; title: string }[]>> = {
  pages: PAGE_SPECS.map((p) => ({ key: p.key, title: p.title })),
}

/** The parts of a sectioned document that differ between `a` and `b`, by name. */
function sectionChanges(doc: DocKey, a: unknown, b: unknown): string[] {
  const at = (value: unknown, key: string) => (value as Record<string, unknown> | null)?.[key]
  return (SECTIONS[doc] ?? []).filter(({ key }) => !sameContent(at(a, key), at(b, key))).map((p) => p.title)
}

/** Whether a document's changes are named part by part: its items have addresses, or its parts names, of their own. */
export function namesItems(doc: DocKey): boolean {
  return Boolean(LISTS[doc] || SECTIONS[doc])
}

const itemsOf = (shape: ListShape, doc: unknown): Map<string, Record<string, unknown>> => {
  const items = ((doc as Record<string, unknown> | null)?.[shape.key] ?? []) as Record<string, unknown>[]
  return new Map(items.map((item) => [shape.id(item), item]))
}

/** What publishing `working` over `published` would do: the items it adds, changes and takes off the site. */
export function listChanges(
  doc: DocKey,
  working: unknown,
  published: unknown,
): { added: string[]; changed: string[]; removed: string[] } {
  const shape = LISTS[doc]
  if (!shape) return { added: [], changed: [], removed: [] }
  const mine = itemsOf(shape, working)
  const live = itemsOf(shape, published)
  const titles = (items: Record<string, unknown>[]) => items.map(shape.title)
  return {
    added: titles([...mine.entries()].filter(([id]) => !live.has(id)).map(([, item]) => item)),
    changed: titles([...mine.entries()].filter(([id, item]) => live.has(id) && !sameContent(item, live.get(id))).map(([, item]) => item)),
    removed: titles([...live.entries()].filter(([id]) => !mine.has(id)).map(([, item]) => item)),
  }
}

/** The Journal's changes: `listChanges` for articles. */
export function journalChanges(working: unknown, published: unknown) {
  return listChanges('journal', working, published)
}

/** What restoring a list document to `old` would do to `current`: the items it takes off the site and brings back. */
export function restoreChanges(
  current: unknown,
  old: unknown,
  doc: DocKey = 'journal',
): { removed: string[]; returned: string[]; changed?: string[] } {
  // A sectioned document takes nothing off the site: a restore changes its parts.
  if (SECTIONS[doc]) return { removed: [], returned: [], changed: sectionChanges(doc, old, current) }
  const { added, removed } = listChanges(doc, old, current)
  // Restoring `old` over `current` adds what only `old` has and removes what only `current` has.
  return { removed, returned: added }
}

/** Names for a sentence: "A", "A and B", "A, B and C". */
export function titleList(titles: string[]): string {
  if (titles.length <= 1) return titles.join('')
  return `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`
}

/** One line saying which items an unpublished list document adds, changes and removes. Null otherwise. */
export function changeSummary(doc: DocKey, working: unknown, published: unknown): string | null {
  if (SECTIONS[doc]) {
    const changed = sectionChanges(doc, working, published)
    return changed.length ? `Changed: ${titleList(changed)}.` : null
  }
  if (!LISTS[doc]) return null
  const { added, changed, removed } = listChanges(doc, working, published)
  const parts = [
    added.length ? `New: ${titleList(added)}.` : '',
    changed.length ? `Changed: ${titleList(changed)}.` : '',
    removed.length ? `Removed: ${titleList(removed)}.` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' ') : null
}
