import { describe, expect, it } from 'vitest'
import type { JournalArticle } from '../../api/_lib/content/schema'
import { blankArticle, byDate, issueCount, retitle, todayInKL } from './journal'

const article = (over: Partial<JournalArticle> = {}): JournalArticle => ({
  slug: 'nyonya',
  title: 'Nyonya Collection: From Heritage to Legendary Perfume',
  category: 'Heritage',
  published: '2025-12-31',
  minutes: 5,
  excerpt: 'Inside the Peranakan culture that shaped the Nyonya Collection.',
  hero: '/assets/client/collection-nyonya.webp',
  heroAlt: 'The three Nyonya Collection bottles beside their patterned boxes',
  body: [{ t: 'p', text: 'Malaysia is a land rich in culture.' }],
  ...over,
})

describe('journal articles in the dashboard', () => {
  it('a new article starts empty, dated today', () => {
    expect(blankArticle(new Set(['nyonya']), '2026-11-13')).toEqual({
      slug: 'newarticle',
      title: '',
      category: '',
      published: '2026-11-13',
      minutes: 1,
      excerpt: '',
      hero: '',
      heroAlt: '',
      body: [{ t: 'p', text: '' }],
    })
  })

  it('retitle makes the address from the title while the article is new', () => {
    const fresh = blankArticle(new Set(['nyonya']), '2026-11-13')
    const named = retitle(fresh, 'Eleven Years: A Journey', new Set(['nyonya']), new Set(['nyonya']))
    expect(named.title).toBe('Eleven Years: A Journey')
    expect(named.slug).toBe('elevenyearsajourney')
  })

  // Old links and search results point at a published address.
  it('retitle keeps a published address', () => {
    const renamed = retitle(article(), 'A new name', new Set(['nyonya']), new Set())
    expect(renamed.title).toBe('A new name')
    expect(renamed.slug).toBe('nyonya')
  })

  it("retitle never takes another article's address", () => {
    const fresh = article({ slug: 'newarticle', title: '' })
    expect(retitle(fresh, 'Gifting', new Set(['gifting']), new Set(['gifting'])).slug).toBe('gifting2')
  })

  it('byDate lists newest first and remembers where each article sits', () => {
    const listed = byDate([article({ slug: 'older', published: '2025-01-01' }), article({ slug: 'newer', published: '2026-01-01' })])
    expect(listed.map((x) => x.index)).toEqual([1, 0])
    expect(listed.map((x) => x.article.slug)).toEqual(['newer', 'older'])
  })

  it('issueCount finds the problems inside one article', () => {
    const errors = [
      { path: 'articles.1.title', message: 'Fill this in.' },
      { path: 'articles.1.body.0.text', message: 'A link needs an address starting with / or https://.' },
      { path: 'articles.10.title', message: 'Fill this in.' },
    ]
    expect(issueCount(errors, 1)).toBe(2)
    expect(issueCount(errors, 10)).toBe(1)
    expect(issueCount(errors, 0)).toBe(0)
  })

  // Malaysia is eight hours ahead of UTC: half past five in the afternoon in
  // London is half past one the next morning in Kuala Lumpur.
  it('todayInKL is the date in Kuala Lumpur', () => {
    expect(todayInKL(new Date('2026-11-13T17:30:00Z'))).toBe('2026-11-14')
    expect(todayInKL(new Date('2026-11-13T15:30:00Z'))).toBe('2026-11-13')
  })
})
