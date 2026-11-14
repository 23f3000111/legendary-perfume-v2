import type { JournalArticle } from '../../api/_lib/content/schema'
import type { ContentIssue } from '../lib/api'
import { newId } from './text'

/**
 * The Journal tab's rules: what a new article starts as, how its address
 * follows its title, the order the list shows, and where its problems are.
 */

/** Today in Kuala Lumpur as YYYY-MM-DD: the day a new article is dated. */
export function todayInKL(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** A new, empty article, dated `today`, with an address no other article has. */
export function blankArticle(taken: Set<string>, today: string): JournalArticle {
  return {
    slug: newId('new article', taken),
    title: '',
    category: '',
    published: today,
    minutes: 1,
    excerpt: '',
    hero: '',
    heroAlt: '',
    body: [{ t: 'p', text: '' }],
  }
}

/**
 * The article with a new title. Until it is published its address follows the
 * title, letters and digits only and never another article's. Once published
 * the address stays, because links and search results point at it.
 */
export function retitle(
  article: JournalArticle,
  title: string,
  publishedSlugs: Set<string>,
  taken: Set<string>,
): JournalArticle {
  if (publishedSlugs.has(article.slug)) return { ...article, title }
  return { ...article, title, slug: newId(title || 'new article', taken) }
}

/**
 * Articles newest first, as the Journal page lists them, each with its place in
 * the document, which its error paths and its updates use.
 */
export function byDate(articles: JournalArticle[]): { article: JournalArticle; index: number }[] {
  return articles
    .map((article, index) => ({ article, index }))
    .sort((a, b) => b.article.published.localeCompare(a.article.published))
}

/** How many problems the server found inside the item at `index` of a list document (articles, or products). */
export function issueCount(errors: ContentIssue[], index: number, list = 'articles'): number {
  const at = `${list}.${index}`
  return errors.filter((e) => e.path === at || e.path.startsWith(`${at}.`)).length
}
