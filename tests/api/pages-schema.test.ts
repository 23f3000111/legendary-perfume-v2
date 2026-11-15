import { describe, expect, it } from 'vitest'
import { PagesDocSchema } from '../../api/_lib/content/schema'
import pagesJson from '../../src/content/pages.json'
import { headingLines } from '../../src/lib/heading'

/** The path of the first issue, the way the dashboard points at a field. */
function firstIssuePath(result: { success: boolean; error?: { issues: { path: (string | number)[] }[] } }) {
  expect(result.success).toBe(false)
  return result.error!.issues[0].path
}

describe('the pages schema', () => {
  it('the published pages pass their schema', () => {
    const result = PagesDocSchema.safeParse(pagesJson)
    expect(result.success ? [] : result.error.issues).toEqual([])
  })

  it('a page heading closes its gold word', () => {
    const doc = structuredClone(pagesJson)
    doc.home.map.heading = 'of a *place'
    expect(firstIssuePath(PagesDocSchema.safeParse(doc))).toEqual(['home', 'map', 'heading'])
  })

  // **bold** is the Journal's habit; a gold phrase cannot run across a line.
  it('a heading the page would show stars in is refused', () => {
    for (const bad of ['Come find **your** scent', 'of a *place\nand time*', 'a ** b']) {
      const doc = structuredClone(pagesJson)
      doc.home.map.heading = bad
      expect(firstIssuePath(PagesDocSchema.safeParse(doc)), bad).toEqual(['home', 'map', 'heading'])
    }
  })

  it('the schema accepts a heading exactly when the page shows no star', () => {
    const samples = [
      'Every scent is born\nof a *place*',
      '*Gold* and *more gold*',
      'Come find **your** scent',
      'of a *place\nand time*',
      'a ** b',
      'plain',
      '5 * stars',
    ]
    for (const heading of samples) {
      const doc = structuredClone(pagesJson)
      doc.home.map.heading = heading
      const starsShown = headingLines(heading).flat().some((run) => run.text.includes('*'))
      expect(PagesDocSchema.safeParse(doc).success, heading).toBe(!starsShown)
    }
  })

  // The values sit beside four icons, in a row of four.
  it('the four values stay four', () => {
    const doc = structuredClone(pagesJson)
    doc.about.values.items = doc.about.values.items.slice(0, 3)
    expect(firstIssuePath(PagesDocSchema.safeParse(doc))).toEqual(['about', 'values', 'items'])
  })
})
