import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import faqJson from './faq.json'
import storesJson from './stores.json'
import journalJson from './journal.json'
import { faq } from '../data/faq'
import { storesDoc } from '../data/stores'
import { articleList, formatDate, journal } from '../data/articles'
import { DOCS } from '../../api/_lib/content/docs'
import { FaqDocSchema, JournalDocSchema, StoresDocSchema } from '../../api/_lib/content/schema'

describe('published content', () => {
  it('the published FAQ and stores pass their schemas', () => {
    expect(FaqDocSchema.safeParse(faq).success).toBe(true)
    expect(StoresDocSchema.safeParse(storesDoc).success).toBe(true)
  })

  it('the published journal passes its schema', () => {
    const result = JournalDocSchema.safeParse(journal)
    expect(result.success ? [] : result.error.issues).toEqual([])
  })

  // Publish writes what the schema returns. If that differed from the file
  // (keys in another order, a string trimmed), the first dashboard publish
  // would rewrite the whole file and bury the team's one change in the diff.
  it('each content file is exactly what a publish would write', () => {
    for (const spec of Object.values(DOCS)) {
      // A Windows checkout turns LF into CRLF; the repository and every publish hold LF.
      const file = readFileSync(spec.path, 'utf8').replace(/\r\n/g, '\n')
      expect(JSON.stringify(spec.schema.parse(JSON.parse(file)), null, 2) + '\n', spec.path).toBe(file)
    }
  })

  // Preview swaps drafts into these objects before the first render, so the
  // site must read the JSON objects themselves, not copies made at load.
  it('the site reads the very objects the JSON files export', () => {
    expect(faq).toBe(faqJson)
    expect(storesDoc).toBe(storesJson)
    expect(journal).toBe(journalJson)
  })
})

describe('the journal', () => {
  it('formatDate writes the date the way the pages show it', () => {
    expect(formatDate('2026-10-22')).toBe('22 October 2026')
    expect(formatDate('2025-01-05')).toBe('5 January 2025')
  })

  it('articles run newest first, with the date and reading time the pages show', () => {
    const list = articleList()
    expect(list.map((a) => a.slug)).toEqual(['elevenyears', 'nyonya', 'alcoholfree', 'gifting', 'longevity'])
    expect(list[0].date).toBe('22 October 2026')
    expect(list[0].readTime).toBe('3 min')
  })
})
