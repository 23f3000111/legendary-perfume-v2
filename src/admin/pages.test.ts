import { describe, expect, it } from 'vitest'
import pagesJson from '../content/pages.json'
import { getAt, PAGE_SPECS, setAt } from './pages'

/**
 * Every editable place in the document, as a dotted path. A list of words (the
 * payment marks) is one field, and so is a banner (its two prints and focus);
 * a list of parts (the four promises) is a field for each word in each part.
 */
function leaves(value: unknown, path: string[] = []): string[] {
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === 'string')) return [path.join('.')]
    return value.flatMap((v, i) => leaves(v, [...path, String(i)]))
  }
  if (value && typeof value === 'object') {
    if ('image' in value && 'phone' in value) return [path.join('.')]
    return Object.entries(value).flatMap(([k, v]) => leaves(v, [...path, k]))
  }
  return [path.join('.')]
}

describe('the Pages tab', () => {
  // A word with no field can never be changed from the dashboard; a field
  // with no word writes somewhere the pages never read. A field the document
  // may leave out, like a sharing image not chosen yet, may have no word.
  it('every word on the pages has a field, and every field a word', () => {
    const fields = PAGE_SPECS.flatMap((page) => page.sections.flatMap((section) => section.fields))
    const paths = fields.map((f) => f.path)
    const words = leaves(pagesJson)
    for (const word of words) expect(paths, word).toContain(word)
    for (const f of fields.filter((f) => !f.optional)) expect(words, f.path).toContain(f.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('setAt changes one field and copies along its path', () => {
    const doc = structuredClone(pagesJson)
    const next = setAt(doc, 'about.services.2.title', 'Free Delivery')
    expect(getAt(next, 'about.services.2.title')).toBe('Free Delivery')
    expect(getAt(doc, 'about.services.2.title')).toBe('Complimentary Delivery')
    expect(next.about.values).toBe(doc.about.values)
    expect(next.home).toBe(doc.home)
  })
})
