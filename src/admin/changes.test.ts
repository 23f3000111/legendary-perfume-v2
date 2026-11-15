import { describe, expect, it } from 'vitest'
import type { JournalArticle } from '../../api/_lib/content/schema'
import { changeSummary, journalChanges, restoreChanges } from './changes'
import pagesJson from '../content/pages.json'

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

  // The collections and the map's pins are lists in one document each as well.
  it('changeSummary names the collections a publish adds, changes and removes', () => {
    const c = (id: string, name: string, over: Record<string, unknown> = {}) => ({ id, name, tagline: 'The scents that made us', ...over })
    const live = { collections: [c('signature', 'Signature'), c('spirit', 'Spirit')] }
    const working = { collections: [c('signature', 'Signature', { tagline: 'New words' }), c('merdeka', 'Merdeka')] }
    expect(changeSummary('collections', working, live)).toBe('New: Merdeka. Changed: Signature. Removed: Spirit.')
  })

  it('changeSummary names the map pins a publish changes', () => {
    const pin = (id: string, place: string, note: string) => ({ id, place, note })
    const live = { places: [pin('melaka', 'Melaka', 'Old words.'), pin('genting', 'Genting Highlands', 'Cool air.')] }
    const working = { places: [pin('melaka', 'Melaka', 'New words.'), pin('genting', 'Genting Highlands', 'Cool air.')] }
    expect(changeSummary('places', working, live)).toBe('Changed: Melaka.')
  })

  // The four policy pages are one document: a publish says which pages it changes.
  it('changeSummary names the policy pages a publish changes', () => {
    const page = (slug: string, title: string, intro: string) => ({ slug, title, intro })
    const live = { policies: [page('shipping', 'Shipping Policy', 'Old.'), page('returns', 'Return, Refund & Exchange', 'Same.')] }
    const working = { policies: [page('shipping', 'Shipping Policy', 'New.'), page('returns', 'Return, Refund & Exchange', 'Same.')] }
    expect(changeSummary('policies', working, live)).toBe('Changed: Shipping Policy.')
  })

  // Every page's words are one document: a publish says which pages it changes.
  it('changeSummary names the pages a publish changes', () => {
    const live = structuredClone(pagesJson)
    const working = structuredClone(pagesJson)
    working.home.signature.button = 'Meet Orchid'
    working.about.cta.shop = 'Shop now'
    expect(changeSummary('pages', working, live)).toBe('Changed: Home and Our Story.')
    expect(changeSummary('pages', live, live)).toBeNull()
  })
})
