import { describe, expect, it } from 'vitest'
import type { JournalArticle } from '../../api/_lib/content/schema'
import { changeSummary, journalChanges, restoreChanges } from './changes'

const article = (slug: string, title: string, over: Partial<JournalArticle> = {}): JournalArticle => ({
  slug,
  title,
  category: 'Notes',
  published: '2026-01-01',
  minutes: 3,
  excerpt: 'A summary.',
  hero: '/assets/client/journal-nyonya.webp',
  heroAlt: 'A photo',
  body: [{ t: 'p', text: 'A paragraph.' }],
  ...over,
})
const journal = (...articles: JournalArticle[]) => ({ articles })

const nyonya = article('nyonya', 'Nyonya Collection')
const gifting = article('gifting', 'Perfume Gift Guide')
const longevity = article('longevity', 'Perfume Longevity Secrets')

describe('what a journal change does to the site', () => {
  it('journalChanges names the articles a publish adds, changes and takes off the site', () => {
    const working = journal(
      article('testing', 'Testing the journal'),
      { ...nyonya, excerpt: 'A new summary.' },
      gifting,
    )
    expect(journalChanges(working, journal(nyonya, gifting, longevity))).toEqual({
      added: ['Testing the journal'],
      changed: ['Nyonya Collection'],
      removed: ['Perfume Longevity Secrets'],
    })
  })

  it('restoreChanges names what a restore takes off the site and brings back', () => {
    expect(restoreChanges(journal(nyonya, article('testing', 'Testing the journal')), journal(nyonya, gifting))).toEqual({
      removed: ['Testing the journal'],
      returned: ['Perfume Gift Guide'],
    })
  })

  it('changeSummary says it in one line, for the Journal only', () => {
    const working = journal(article('testing', 'Testing the journal'), { ...nyonya, excerpt: 'New.' })
    expect(changeSummary('journal', working, journal(nyonya, gifting, longevity))).toBe(
      'New: Testing the journal. Changed: Nyonya Collection. Removed: Perfume Gift Guide and Perfume Longevity Secrets.',
    )
    expect(changeSummary('journal', journal(nyonya), journal(nyonya))).toBeNull()
    expect(changeSummary('faq', { intro: 'a' }, { intro: 'b' })).toBeNull()
  })
  // The products are one document too: a publish, discard or restore acts on
  // every product in it, so each says which.
  const scent = (id: string, name: string, over: Record<string, unknown> = {}) => ({ id, name, price: 188, ...over })
  const shelf = (...products: Record<string, unknown>[]) => ({ products })

  it('changeSummary names the products a publish adds, changes and removes', () => {
    const live = shelf(scent('violet', 'Violet'), scent('dream', 'Dream'))
    const working = shelf(scent('violet', 'Violet', { price: 158 }), scent('saffrondusk', 'Saffron Dusk'))
    expect(changeSummary('products', working, live)).toBe('New: Saffron Dusk. Changed: Violet. Removed: Dream.')
  })

  it('restoreChanges names the products a restore takes off and brings back', () => {
    const now = shelf(scent('violet', 'Violet'), scent('saffrondusk', 'Saffron Dusk'))
    const then = shelf(scent('violet', 'Violet'), scent('dream', 'Dream'))
    expect(restoreChanges(now, then, 'products')).toEqual({ removed: ['Saffron Dusk'], returned: ['Dream'] })
  })
})
