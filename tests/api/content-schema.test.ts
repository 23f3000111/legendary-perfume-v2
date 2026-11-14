import { describe, expect, it } from 'vitest'
import {
  CollectionsDocSchema,
  FaqDocSchema,
  JourneyDocSchema,
  JournalDocSchema,
  PartnersDocSchema,
  PoliciesDocSchema,
  ProductsDocSchema,
  ReviewsDocSchema,
  SellersDocSchema,
  SiteDocSchema,
  StoresDocSchema,
  findDashes,
  mediaRefs,
} from '../../api/_lib/content/schema'

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

const article = (over: Record<string, unknown> = {}) => ({
  slug: 'nyonya',
  title: 'Nyonya Collection: From Heritage to Legendary Perfume',
  category: 'Heritage',
  published: '2025-12-31',
  minutes: 5,
  excerpt: 'Inside the Peranakan culture that shaped the Nyonya Collection.',
  hero: '/assets/client/collection-nyonya.webp',
  heroAlt: 'The three Nyonya Collection bottles beside their patterned boxes',
  body: [{ t: 'p', text: 'Malaysia is a land rich in culture, stories and traditions.' }],
  ...over,
})

const journal = (...articles: Record<string, unknown>[]) => ({ articles })

/** A journal whose one article has this one block. */
const withBlock = (block: Record<string, unknown>) => journal(article({ body: [block] }))

describe('Journal schema', () => {
  it('accepts a minimal article', () => {
    expect(JournalDocSchema.safeParse(journal(article())).success).toBe(true)
  })

  // The Journal page leads with the newest article and has nothing to show without one.
  it('the journal keeps at least one article', () => {
    expect(firstIssuePath(JournalDocSchema.safeParse(journal()))).toEqual(['articles'])
  })

  it('an article needs a header photo with a description', () => {
    expect(firstIssuePath(JournalDocSchema.safeParse(journal(article({ hero: '' }))))).toEqual(['articles', 0, 'hero'])
    expect(firstIssuePath(JournalDocSchema.safeParse(journal(article({ heroAlt: '  ' }))))).toEqual([
      'articles', 0, 'heroAlt',
    ])
  })

  it('an article needs a reading time and something to read', () => {
    expect(firstIssuePath(JournalDocSchema.safeParse(journal(article({ minutes: 0 }))))).toEqual(['articles', 0, 'minutes'])
    expect(firstIssuePath(JournalDocSchema.safeParse(journal(article({ minutes: 2.5 }))))).toEqual([
      'articles', 0, 'minutes',
    ])
    expect(firstIssuePath(JournalDocSchema.safeParse(journal(article({ body: [] }))))).toEqual(['articles', 0, 'body'])
  })

  it('an article address has letters and numbers only, and is its own', () => {
    expect(firstIssuePath(JournalDocSchema.safeParse(journal(article({ slug: 'eleven-years' }))))).toEqual([
      'articles', 0, 'slug',
    ])
    const twice = journal(article(), article({ title: 'Another piece on the same address' }))
    expect(firstIssuePath(JournalDocSchema.safeParse(twice))).toEqual(['articles', 1, 'slug'])
  })

  it('an article date must be a real day', () => {
    expect(firstIssuePath(JournalDocSchema.safeParse(journal(article({ published: '2026-02-30' }))))).toEqual([
      'articles', 0, 'published',
    ])
    expect(firstIssuePath(JournalDocSchema.safeParse(journal(article({ published: '31 December 2025' }))))).toEqual([
      'articles', 0, 'published',
    ])
  })

  it('a link needs an address the site can follow', () => {
    const relative = withBlock({ t: 'p', text: 'See [Orchid](product/orchid).' })
    expect(firstIssuePath(JournalDocSchema.safeParse(relative))).toEqual(['articles', 0, 'body', 0, 'text'])
    expect(JournalDocSchema.safeParse(withBlock({ t: 'p', text: 'See [Orchid](/product/orchid).' })).success).toBe(true)
    expect(JournalDocSchema.safeParse(withBlock({ t: 'p', text: 'See [the study](https://example.com).' })).success).toBe(true)
  })

  it('every table row has a cell for each column', () => {
    const uneven = withBlock({ t: 'table', head: ['Location', 'What to expect'], rows: [['a', 'b'], ['c']] })
    expect(firstIssuePath(JournalDocSchema.safeParse(uneven))).toEqual(['articles', 0, 'body', 0, 'rows', 1])
  })

  it('a button goes to a page on this site', () => {
    const away = withBlock({ t: 'cta', label: 'Read more', to: 'https://example.com' })
    expect(firstIssuePath(JournalDocSchema.safeParse(away))).toEqual(['articles', 0, 'body', 0, 'to'])
  })

  // `//example.com` starts with a slash but leaves the site, and browsers read `/\` the same way.
  it('an address on this site cannot lead off it', () => {
    for (const away of ['//example.com', '/\\example.com']) {
      const link = withBlock({ t: 'p', text: `See [this](${away}).` })
      expect(firstIssuePath(JournalDocSchema.safeParse(link))).toEqual(['articles', 0, 'body', 0, 'text'])
      const button = withBlock({ t: 'cta', label: 'Read more', to: away })
      expect(firstIssuePath(JournalDocSchema.safeParse(button))).toEqual(['articles', 0, 'body', 0, 'to'])
    }
  })

  // The page reads italic and bold before links. Checked any other way, this
  // line passes as one link to /ok..., while the page finds `[x](javascript:...)`.
  it('a link is read the way the page reads it', () => {
    const hidden = withBlock({ t: 'p', text: '*z[a*](/ok[x](javascript:alert%281%29)' })
    expect(firstIssuePath(JournalDocSchema.safeParse(hidden))).toEqual(['articles', 0, 'body', 0, 'text'])
  })

  it('a photo block needs a description', () => {
    const bare = withBlock({ t: 'image', src: '/assets/client/journal-nyonya.webp', alt: '' })
    expect(firstIssuePath(JournalDocSchema.safeParse(bare))).toEqual(['articles', 0, 'body', 0, 'alt'])
  })

  it('an older journal photo path is accepted', () => {
    const older = journal(article({ hero: '/Journal_Images/gift-guide-orchid.webp' }))
    expect(JournalDocSchema.safeParse(older).success).toBe(true)
  })
})

const product = (over: Record<string, unknown> = {}) => ({
  id: 'orchid',
  name: 'Orchid',
  subtitle: 'Exotic Orchid for an Extraordinary Soul',
  collection: 'Signature',
  collectionId: 'signature',
  family: 'Floral Fruity',
  audience: 'For Her',
  moods: ['Serene'],
  price: 188,
  compareAt: 238,
  size: '30ml Eau de Parfum',
  image: '/assets/client/p-orchid-life.webp',
  hoverImage: '/assets/client/p-orchid-pack.webp',
  box: '/assets/client/p-orchid-box.webp',
  included: '/assets/client/p-orchid-included.webp',
  includedItems: [{ label: 'Orchid', detail: '30ml eau de parfum' }],
  radar: '/assets/client/p-orchid-radar.webp',
  accent: 'gold',
  badges: ['Signature Scent'],
  story: 'Orchid is the definitive signature of Legendary.',
  description: 'Opening with a crisp burst of zesty citrus, it unfolds into a serene floral haven.',
  notes: { top: ['Orange'], heart: ['Jasmine'], base: ['Vetiver'] },
  ...over,
})

const shelf = (...products: Record<string, unknown>[]) => ({ products })

describe('Products schema', () => {
  it('accepts a minimal product', () => {
    const result = ProductsDocSchema.safeParse(shelf(product()))
    expect(result.success ? [] : result.error.issues).toEqual([])
  })

  it('a price is whole ringgit', () => {
    expect(firstIssuePath(ProductsDocSchema.safeParse(shelf(product({ price: 188.5 }))))).toEqual(['products', 0, 'price'])
    expect(firstIssuePath(ProductsDocSchema.safeParse(shelf(product({ price: 0, compareAt: undefined }))))).toEqual([
      'products', 0, 'price',
    ])
  })

  it('the was price is above the price', () => {
    expect(firstIssuePath(ProductsDocSchema.safeParse(shelf(product({ compareAt: 150 }))))).toEqual(['products', 0, 'compareAt'])
  })

  it('product addresses are their own', () => {
    expect(firstIssuePath(ProductsDocSchema.safeParse(shelf(product(), product({ name: 'Another' }))))).toEqual([
      'products', 1, 'id',
    ])
  })

  it('a product needs a mood and its notes', () => {
    expect(firstIssuePath(ProductsDocSchema.safeParse(shelf(product({ moods: [] }))))).toEqual(['products', 0, 'moods'])
    const bare = product({ notes: { top: [], heart: ['Jasmine'], base: ['Vetiver'] } })
    expect(firstIssuePath(ProductsDocSchema.safeParse(shelf(bare)))).toEqual(['products', 0, 'notes', 'top'])
  })

  it('each fragrance in a set needs its own chart', () => {
    const set = product({
      variants: [{ name: 'Hope', notes: { top: ['Pear'], heart: ['Jasmine'], base: ['Amber'] }, radar: '' }],
    })
    expect(firstIssuePath(ProductsDocSchema.safeParse(shelf(set)))).toEqual(['products', 0, 'variants', 0, 'radar'])
  })

  it('a composition colour is a colour', () => {
    expect(firstIssuePath(ProductsDocSchema.safeParse(shelf(product({ compositionTint: 'blue' }))))).toEqual([
      'products', 0, 'compositionTint',
    ])
    expect(ProductsDocSchema.safeParse(shelf(product({ compositionTint: '#D1E5ED' }))).success).toBe(true)
  })

  it('the shop keeps at least one product', () => {
    expect(firstIssuePath(ProductsDocSchema.safeParse(shelf()))).toEqual(['products'])
  })
})

const siteDoc = (over: Record<string, unknown> = {}) => ({
  whatsapp: '+60 19 383 6633',
  email: 'noreply@legendary.com.my',
  instagram: { handle: '@legendaryofficial.my', url: 'https://www.instagram.com/legendaryofficial.my/' },
  facebook: { handle: 'LegendaryPerfumeMY', url: 'https://www.facebook.com/LegendaryPerfumeMY' },
  tiktok: 'https://www.tiktok.com/@legendary.my',
  shopee: 'https://shopee.com.my/legendaryperfume',
  office: {
    name: 'Legendary Distribution Sdn Bhd',
    address: '12E, Pusat Teknologi Sunsuria, 47810 Petaling Jaya, Selangor',
    mapQuery: 'Legendary Distribution Sdn Bhd, Petaling Jaya',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12',
  },
  ...over,
})

const collection = (over: Record<string, unknown> = {}) => ({
  id: 'signature',
  name: 'Signature',
  tagline: 'The scents that made us',
  description: 'Orchid, Mahsuri, Violet and Man, the defining icons of Legendary.',
  intro: 'Explore the foundational scents that built our reputation.',
  accent: 'gold',
  image: '/assets/client/collection-signature.webp',
  ...over,
})

const review = (over: Record<string, unknown> = {}) => ({ quote: 'I like the smell.', author: 'anson.gan', ...over })

const milestone = (over: Record<string, unknown> = {}) => ({
  year: '2015',
  title: 'A House is Born',
  body: 'Founded in this year, the beginning of a journey in fine fragrance.',
  ...over,
})

const logo = (over: Record<string, unknown> = {}) => ({
  name: 'SOGO',
  logo: '/assets/client/partner-sogo.png',
  mono: '/assets/client/partner-sogo-mono.png',
  ...over,
})

const policy = (slug: string, over: Record<string, unknown> = {}) => ({
  slug,
  title: 'Shipping Policy',
  eyebrow: 'Customer Care',
  intro: 'How your order reaches you.',
  updated: 'August 2026',
  body: [{ t: 'p', text: 'Orders are processed within two business days.' }],
  ...over,
})

describe('site details and list schemas', () => {
  it('site details need a number written with its country code', () => {
    expect(firstIssuePath(SiteDocSchema.safeParse(siteDoc({ whatsapp: '019-383 6633' })))).toEqual(['whatsapp'])
    expect(SiteDocSchema.safeParse(siteDoc()).success).toBe(true)
  })

  it('a social link goes to its own site', () => {
    const doc = siteDoc({ instagram: { handle: '@legendaryofficial.my', url: 'https://example.com/x' } })
    expect(firstIssuePath(SiteDocSchema.safeParse(doc))).toEqual(['instagram', 'url'])
  })

  it('collection addresses are their own', () => {
    expect(CollectionsDocSchema.safeParse({ collections: [collection()] }).success).toBe(true)
    const twice = { collections: [collection(), collection({ name: 'Signature Two' })] }
    expect(firstIssuePath(CollectionsDocSchema.safeParse(twice))).toEqual(['collections', 1, 'id'])
  })

  it('a review link is a full web address', () => {
    const fine = review({ product: 'Orchid 30ml', rating: 4, href: 'https://shopee.com.my/listing' })
    expect(ReviewsDocSchema.safeParse({ reviews: [fine] }).success).toBe(true)
    expect(firstIssuePath(ReviewsDocSchema.safeParse({ reviews: [review({ href: 'shopee.com.my/x' })] }))).toEqual(['reviews', 0, 'href'])
    expect(firstIssuePath(ReviewsDocSchema.safeParse({ reviews: [review({ rating: 6 })] }))).toEqual(['reviews', 0, 'rating'])
  })

  it('a year appears once on the journey', () => {
    expect(JourneyDocSchema.safeParse({ milestones: [milestone({ photo: '/assets/client/journey-2015.webp' })] }).success).toBe(true)
    const twice = { milestones: [milestone(), milestone({ title: 'Again' })] }
    expect(firstIssuePath(JourneyDocSchema.safeParse(twice))).toEqual(['milestones', 1, 'year'])
  })

  it('a logo row needs a logo', () => {
    expect(PartnersDocSchema.safeParse({ rows: [{ logos: [logo({ tall: true })] }] }).success).toBe(true)
    expect(SellersDocSchema.safeParse({ logos: [logo()] }).success).toBe(true)
    expect(firstIssuePath(PartnersDocSchema.safeParse({ rows: [{ logos: [] }] }))).toEqual(['rows', 0, 'logos'])
    const { mono: _mono, ...noMono } = logo()
    expect(firstIssuePath(PartnersDocSchema.safeParse({ rows: [{ logos: [noMono] }] }))).toEqual(['rows', 0, 'logos', 0, 'mono'])
  })

  it('the four policy pages stay', () => {
    const four = ['shipping', 'returns', 'terms', 'privacy'].map((slug) => policy(slug))
    expect(PoliciesDocSchema.safeParse({ policies: four }).success).toBe(true)
    expect(PoliciesDocSchema.safeParse({ policies: four.slice(0, 3) }).success).toBe(false)
    const table = { t: 'table', head: ['Service', 'Cost'], rows: [['Delivery']] }
    const short = { policies: [policy('shipping', { body: [{ t: 'p', text: 'Delivery is free.' }, table] }), ...four.slice(1)] }
    expect(firstIssuePath(PoliciesDocSchema.safeParse(short))).toEqual(['policies', 0, 'body', 1, 'rows', 0])
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
