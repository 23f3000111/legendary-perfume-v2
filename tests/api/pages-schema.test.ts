import { describe, expect, it } from 'vitest'
import { PagesDocSchema } from '../../api/_lib/content/schema'
import pagesJson from '../../src/content/pages.json'

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

  // The values sit beside four icons, in a row of four.
  it('the four values stay four', () => {
    const doc = structuredClone(pagesJson)
    doc.about.values.items = doc.about.values.items.slice(0, 3)
    expect(firstIssuePath(PagesDocSchema.safeParse(doc))).toEqual(['about', 'values', 'items'])
  })
})
