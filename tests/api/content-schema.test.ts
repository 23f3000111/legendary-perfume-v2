import { describe, expect, it } from 'vitest'
import { FaqDocSchema, StoresDocSchema, findDashes, mediaRefs } from '../../api/_lib/content/schema'

const faq = () => ({
  intro: 'We answer the questions customers ask most.',
  sections: [{ title: 'About Orchid', items: [{ q: 'Is every perfume orchid based?', a: 'No.' }] }],
  product: [{ q: 'How long does it last?', a: 'Four to seven hours.' }],
})

const store = (over: Record<string, unknown> = {}) => ({
  id: 'bsas',
  name: 'Bangunan Sultan Abdul Samad',
  region: 'Kuala Lumpur',
  address: 'Jln Raja, Kuala Lumpur City Centre, 50050 Kuala Lumpur',
  phone: '+60 11 6767 1888',
  hours: ['Now open'],
  mapQuery: 'Bangunan Sultan Abdul Samad, Jalan Raja, Kuala Lumpur',
  image: '/assets/client/store-bsas.webp',
  ...over,
})

/** The path of the first issue, the way the dashboard points at a field. */
function firstIssuePath(result: { success: boolean; error?: { issues: { path: (string | number)[] }[] } }) {
  expect(result.success).toBe(false)
  return result.error!.issues[0].path
}

describe('FAQ schema', () => {
  it('accepts a minimal valid FAQ', () => {
    expect(FaqDocSchema.safeParse(faq()).success).toBe(true)
  })

  it('rejects an FAQ answer left empty', () => {
    const doc = faq()
    doc.sections[0].items[0].a = '   '
    expect(firstIssuePath(FaqDocSchema.safeParse(doc))).toEqual(['sections', 0, 'items', 0, 'a'])
  })
})

describe('Stores schema', () => {
  it('stores need at least one store and every field filled', () => {
    expect(StoresDocSchema.safeParse({ regions: ['Kuala Lumpur'], stores: [] }).success).toBe(false)
    const blankName = { regions: ['Kuala Lumpur'], stores: [store({ name: '  ' })] }
    expect(firstIssuePath(StoresDocSchema.safeParse(blankName))).toEqual(['stores', 0, 'name'])
  })

  it("a store's region must be listed", () => {
    const doc = { regions: ['Kuala Lumpur'], stores: [store({ region: 'Penang' })] }
    expect(firstIssuePath(StoresDocSchema.safeParse(doc))).toEqual(['stores', 0, 'region'])
  })

  it('store ids must be unique', () => {
    const doc = { regions: ['Kuala Lumpur'], stores: [store(), store({ name: 'Another counter' })] }
    expect(firstIssuePath(StoresDocSchema.safeParse(doc))).toEqual(['stores', 1, 'id'])
  })

  it('a store photo must be a path on the site', () => {
    const bad = { regions: ['Kuala Lumpur'], stores: [store({ image: 'javascript:alert(1)' })] }
    expect(firstIssuePath(StoresDocSchema.safeParse(bad))).toEqual(['stores', 0, 'image'])
    const dashboardPhoto = { regions: ['Kuala Lumpur'], stores: [store({ image: '/assets/cms/0123456789abcdef0123.webp' })] }
    expect(StoresDocSchema.safeParse(dashboardPhoto).success).toBe(true)
  })
})

describe('fields the dashboard has no form for', () => {
  // A developer can add a field by hand for code that reads it. Publish writes
  // what the schema returns, so a schema that dropped unknown keys would
  // quietly delete that field at the team's next publish.
  it('keeps keys it does not know', () => {
    const doc = {
      intro: 'We answer the questions customers ask most.',
      sections: [{ title: 'About Orchid', items: [{ q: 'Is every perfume orchid based?', a: 'No.', source: 'sheet' }] }],
      product: [{ q: 'How long does it last?', a: 'Four to seven hours.' }],
      note: 'x',
    }
    expect(FaqDocSchema.parse(doc)).toEqual(doc)

    const stores = { regions: ['Kuala Lumpur'], stores: [store({ extra: 1 })] }
    expect(StoresDocSchema.parse(stores)).toEqual(stores)
  })
})

describe('content helpers', () => {
  it('findDashes reports where a long dash is', () => {
    expect(findDashes({ a: ['ok', 'x — y'], b: 'p–q', c: 'well-known' })).toEqual(['a.1', 'b'])
  })

  it('mediaRefs lists dashboard photos once', () => {
    const value = {
      stores: [{ image: '/assets/cms/abc.webp' }, { image: '/assets/cms/abc.webp' }, { image: '/assets/client/x.webp' }],
    }
    expect(mediaRefs(value)).toEqual(['/assets/cms/abc.webp'])
  })
})
