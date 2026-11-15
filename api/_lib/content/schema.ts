import { z } from 'zod'
import { linkAllowed, linksIn, ON_SITE } from './markup.js'

/**
 * What each editable document must look like before it can be published.
 *
 * The same schemas run in the dashboard, which blocks Publish and points at
 * the field, in the publish function, which refuses anything the dashboard
 * let through, and at build time (scripts/check-content.mjs), so a bad edit
 * can at worst fail a build and leave the live site as it was.
 *
 * Messages are written for the Legendary team, who see them beside the field.
 */

const text = (max: number) =>
  z.string().trim().min(1, 'Fill this in.').max(max, `Keep this under ${max} characters.`)

const optionalText = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`)

/**
 * Every object in a document, with its keys kept even when the schema does not
 * know them. Publish writes what the schema returns, and zod drops unknown keys
 * by default, so a field a developer adds by hand (for code that reads it)
 * would otherwise vanish at the team's next publish without a word.
 *
 * zod also writes an object's keys in the order they are declared, so each
 * schema lists its keys in the order the JSON file has them.
 */
const object = <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough()

/**
 * A photo the site already serves: the delivery's, one from the dashboard, or
 * one of the older journal photos in public/Journal_Images.
 */
const SITE_PHOTO = /^\/(assets|Journal_Images)\/[\w./-]+\.(webp|jpg|png)$/

// --------------------------------------------------------------------- FAQ

export const FaqItemSchema = object({
  q: text(200),
  a: text(2000),
  /** Extra lines shown as a bulleted list under the answer. */
  list: z.array(text(300)).optional(),
})

export const FaqDocSchema = object({
  intro: text(600),
  sections: z
    .array(
      object({
        title: text(80),
        items: z.array(FaqItemSchema).min(1, 'Add at least one question.'),
      }),
    )
    .min(1, 'Add at least one group of questions.'),
  /** The questions on every product page. */
  product: z.array(FaqItemSchema).min(1, 'Add at least one question.'),
})

export type FaqDoc = z.infer<typeof FaqDocSchema>

// ------------------------------------------------------------------ stores

export const StoreSchema = object({
  /** Fixed once a store exists: the map and the page anchors refer to it. */
  id: z.string().trim().regex(/^[a-z0-9-]{1,40}$/, 'Use lowercase letters and numbers only.'),
  name: text(80),
  region: text(40),
  address: text(300),
  phone: optionalText(40),
  hours: z.array(text(80)).max(5, 'Up to five lines.'),
  /** What Google Maps is asked to find, for the map and Get directions. */
  mapQuery: text(200),
  image: z.string().trim().regex(SITE_PHOTO, 'Choose a photo from the library.').optional(),
})

export const StoresDocSchema = object({
  /** The filter tabs on the Stores page, in order. The page adds "All". */
  regions: z.array(text(40)).min(1, 'Add at least one region.').max(12, 'Up to twelve regions.'),
  stores: z.array(StoreSchema).min(1, 'Keep at least one store.'),
}).superRefine((doc, ctx) => {
  const regions = new Set<string>()
  doc.regions.forEach((region, i) => {
    if (regions.has(region)) {
      ctx.addIssue({ code: 'custom', path: ['regions', i], message: 'This region is listed twice.' })
    }
    regions.add(region)
  })
  const ids = new Set<string>()
  doc.stores.forEach((store, i) => {
    if (!regions.has(store.region)) {
      ctx.addIssue({ code: 'custom', path: ['stores', i, 'region'], message: 'Choose one of the regions.' })
    }
    if (ids.has(store.id)) {
      ctx.addIssue({ code: 'custom', path: ['stores', i, 'id'], message: 'Another store already uses this id.' })
    }
    ids.add(store.id)
  })
})

export type StoresDoc = z.infer<typeof StoresDocSchema>

// ----------------------------------------------------------------- journal

const LINK_MESSAGE = 'A link needs an address starting with / or https://.'

/**
 * Every link the page would draw from the text goes somewhere it may: not
 * `product/orchid` without its slash, which breaks on every article page, and
 * never a javascript: address. Links are found exactly as the page finds them.
 */
const linksResolve = (s: string) => linksIn(s).every(linkAllowed)

/** Long-form text, which may carry links and bold. */
const rich = (max: number) => text(max).refine(linksResolve, LINK_MESSAGE)
const optionalRich = (max: number) => optionalText(max).refine(linksResolve, LINK_MESSAGE)

/** A calendar day written YYYY-MM-DD that exists: no 30 February. */
function isRealDay(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const [y, month, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const day = new Date(Date.UTC(y, month - 1, d))
  return day.getUTCFullYear() === y && day.getUTCMonth() === month - 1 && day.getUTCDate() === d
}

const photo = z.string().trim().regex(SITE_PHOTO, 'Choose a photo.')

const lines = z.array(rich(1000)).min(1, 'Add at least one line.')

/**
 * The blocks an article's body is built from: the ones the five articles use,
 * as src/components/ui/Prose.tsx draws them. Prose's `duo` is left out on
 * purpose, since no article uses it and the dashboard publishes only what it
 * can edit. Keys are declared in the order the articles file writes them.
 */
export const BlockSchema = z.discriminatedUnion('t', [
  object({ t: z.literal('p'), text: rich(3000) }),
  object({ t: z.literal('lead'), text: rich(3000) }),
  object({ t: z.literal('h2'), text: text(160) }),
  object({ t: z.literal('h3'), text: text(160) }),
  object({ t: z.literal('ul'), items: lines }),
  object({ t: z.literal('ol'), items: lines }),
  object({ t: z.literal('quote'), text: rich(1000), cite: optionalText(200).optional() }),
  object({ t: z.literal('tip'), text: rich(3000) }),
  object({
    t: z.literal('image'),
    src: photo,
    alt: text(300),
    caption: optionalText(300).optional(),
    /** An upright photo, shown narrower than the column. */
    narrow: z.boolean().optional(),
  }),
  object({
    t: z.literal('table'),
    head: z.array(text(80)).min(1, 'Add at least one column.').max(6, 'Up to six columns.'),
    rows: z.array(z.array(optionalRich(600))).min(1, 'Add at least one row.').max(50, 'Up to fifty rows.'),
  }),
  object({
    t: z.literal('cta'),
    label: text(60),
    to: z.string().trim().regex(ON_SITE, 'Use an address on this site, starting with /.'),
  }),
  object({
    t: z.literal('faq'),
    items: z
      .array(object({ q: text(200), a: rich(2000) }))
      .min(1, 'Add at least one question.')
      .max(30, 'Up to thirty questions.'),
  }),
  object({ t: z.literal('refs'), items: lines }),
])

export type JournalBlock = z.infer<typeof BlockSchema>

/** A table row short of a cell would shift every cell after the gap. */
function tablesComplete(body: JournalBlock[], ctx: z.RefinementCtx, at: (string | number)[]): void {
  body.forEach((block, j) => {
    if (block.t !== 'table') return
    block.rows.forEach((row, r) => {
      if (row.length !== block.head.length) {
        ctx.addIssue({ code: 'custom', path: [...at, j, 'rows', r], message: 'Every row needs a cell for each column.' })
      }
    })
  })
}

const minutes = 'Between 1 and 60 minutes.'

export const ArticleSchema = object({
  /** The address, /journal/<slug>: made from the title, and fixed once published. */
  slug: z.string().trim().regex(/^[a-z0-9]{1,40}$/, 'Use lowercase letters and numbers only.'),
  title: text(140),
  /** A shorter title for the Journal page and the links between articles. */
  cardTitle: text(80).optional(),
  category: text(40),
  /** The day it was published, YYYY-MM-DD. The pages write it out as "22 October 2026". */
  published: z.string().trim().refine(isRealDay, 'Choose a date.'),
  /** Reading time, shown as "5 min". */
  minutes: z.number({ invalid_type_error: minutes }).int(minutes).min(1, minutes).max(60, minutes),
  /** The summary on the Journal page and under the title. */
  excerpt: text(400),
  /** The header photo. */
  hero: photo,
  /** The Journal page's picture, where the header photo crops badly in a card. */
  cardImage: photo.optional(),
  /** What the header photo shows, for anyone who cannot see it. */
  heroAlt: text(300),
  body: z.array(BlockSchema).min(1, 'Write at least one paragraph.'),
}).superRefine((article, ctx) => tablesComplete(article.body, ctx, ['body']))

export const JournalDocSchema = object({
  /** Every article, newest first as the file is kept; the pages sort by date anyway. */
  articles: z.array(ArticleSchema).min(1, 'Keep at least one article.'),
}).superRefine((doc, ctx) => {
  const slugs = new Set<string>()
  doc.articles.forEach((a, i) => {
    if (slugs.has(a.slug)) {
      ctx.addIssue({ code: 'custom', path: ['articles', i, 'slug'], message: 'Another article already uses this address.' })
    }
    slugs.add(a.slug)
  })
})

export type JournalDoc = z.infer<typeof JournalDocSchema>
export type JournalArticle = JournalDoc['articles'][number]

// ---------------------------------------------------------------- products

export const MOODS = ['Serene', 'Bold', 'Romantic', 'Playful'] as const
export const AUDIENCES = ['For Her', 'For Him', 'Unisex'] as const
export const ACCENTS = ['gold', 'rose', 'jade', 'amber', 'plum', 'teal', 'graphite'] as const

const RINGGIT = 'Use a whole number of ringgit, from 1 to 10000.'
/** A price the server can charge: whole ringgit, as the catalogue and checkout keep them. */
const ringgit = z.number({ invalid_type_error: RINGGIT }).int(RINGGIT).min(1, RINGGIT).max(10000, RINGGIT)

const noteList = z.array(text(30)).min(1, 'Add at least one note.').max(8, 'Up to eight notes.')

/** Top, heart and base notes, as the composition band shows them. */
export const ScentNotesSchema = object({ top: noteList, heart: noteList, base: noteList })

/** One fragrance in a set, with its own notes, occasion chart and botanical. */
export const ProductVariantSchema = object({
  name: text(40),
  family: text(40).optional(),
  notes: ScentNotesSchema,
  radar: photo,
  bloom: photo.optional(),
})

const slug = z.string().trim().regex(/^[a-z0-9-]{1,40}$/, 'Use lowercase letters and numbers only.')

/**
 * A product, as the shop, its page and the server's price list read it.
 * Keys are declared in the order products.json writes them.
 */
export const ProductSchema = object({
  /** The address, /product/<id>, and the key product overrides use: fixed once published. */
  id: slug,
  name: text(60),
  subtitle: text(80),
  collection: text(40),
  collectionId: slug,
  family: text(40),
  audience: z.enum(AUDIENCES, { errorMap: () => ({ message: 'Choose who it is for.' }) }),
  moods: z
    .array(z.enum(MOODS, { errorMap: () => ({ message: 'Choose a mood from the list.' }) }))
    .min(1, 'Choose at least one mood.')
    .max(4, 'Choose each mood once.')
    .refine((moods) => new Set(moods).size === moods.length, 'Choose each mood once.'),
  /** What a new product costs. A published product's price is changed in the price table. */
  price: ringgit,
  compareAt: ringgit.optional(),
  size: text(60),
  /** The lifestyle shot, the resting state of every product tile. */
  image: photo,
  /** The transparent pack cut-out, shown on hover. */
  hoverImage: photo,
  /** The box shot, third in the gallery. */
  box: photo,
  /** The flat-lay for the "What's included" block. */
  included: photo,
  includedItems: z
    .array(object({ label: text(60), detail: text(160) }))
    .min(1, 'Add at least one item.')
    .max(8, 'Up to eight items.'),
  /** The occasion chart. */
  radar: photo,
  /** The cut-out botanical that dresses the composition band. */
  bloom: photo.optional(),
  /** A set's fragrances, each with its own composition band. */
  variants: z.array(ProductVariantSchema).min(1, 'Add at least one fragrance.').max(6, 'Up to six fragrances.').optional(),
  accent: z.enum(ACCENTS, { errorMap: () => ({ message: 'Choose a colour.' }) }),
  /** The composition band's wash, where it differs from the accent's. */
  compositionTint: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Use a colour written like #D1E5ED.').optional(),
  badges: z.array(text(30)).max(4, 'Up to four badges.'),
  bestseller: z.boolean().optional(),
  /** Counts towards the Gifts & Sets filter. */
  gift: z.boolean().optional(),
  story: text(600),
  description: text(1500),
  goodToKnow: text(400).optional(),
  care: text(600).optional(),
  notes: ScentNotesSchema,
  /** Links the scent to a place on the Scented Memory map. */
  place: text(60).optional(),
}).superRefine((product, ctx) => {
  if (product.compareAt !== undefined && product.compareAt <= product.price) {
    ctx.addIssue({ code: 'custom', path: ['compareAt'], message: 'The was price must be more than the price.' })
  }
})

export const ProductsDocSchema = object({
  /** Every product, in the order the shop shows them. */
  products: z.array(ProductSchema).min(1, 'Keep at least one product.'),
}).superRefine((doc, ctx) => {
  const ids = new Set<string>()
  doc.products.forEach((p, i) => {
    if (ids.has(p.id)) {
      ctx.addIssue({ code: 'custom', path: ['products', i, 'id'], message: 'Another product already uses this address.' })
    }
    ids.add(p.id)
  })
})

export type ProductsDoc = z.infer<typeof ProductsDocSchema>
export type ProductEntry = ProductsDoc['products'][number]
export type ProductVariant = z.infer<typeof ProductVariantSchema>
export type ScentNotesEntry = z.infer<typeof ScentNotesSchema>

// ------------------------------------------------------------ site details

/** An address on one site: the house's page there. `shown` is how the message writes its start. */
const linkOn = (host: string, name: string, shown: string) =>
  z
    .string()
    .trim()
    .regex(new RegExp(`^https://(www\\.)?${host.replace(/\./g, '\\.')}/\\S*$`), `Use the full ${name} address, starting https://${shown}/.`)

/**
 * The house's contact details and links. Every WhatsApp button, the footer's
 * social links, the Contact page and the facts search engines are given are
 * made from these when they render.
 */
export const SiteDocSchema = object({
  /** As the pages show it. Every WhatsApp link is made from its digits. */
  whatsapp: z.string().trim().regex(/^\+\d[\d ]{6,18}\d$/, 'Write the number with its country code, spaced like +60 19 383 6633.'),
  /** The house's address, as search engines are given it. */
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Use an email address, like hello@legendary.com.my.'),
  instagram: object({ handle: text(60), url: linkOn('instagram.com', 'Instagram', 'www.instagram.com') }),
  facebook: object({ handle: text(60), url: linkOn('facebook.com', 'Facebook', 'www.facebook.com') }),
  tiktok: linkOn('tiktok.com', 'TikTok', 'www.tiktok.com'),
  shopee: linkOn('shopee.com.my', 'Shopee', 'shopee.com.my'),
  /** The registered office on the Contact page, with the client's own pinned map. */
  office: object({
    name: text(80),
    address: text(300),
    mapQuery: text(300),
    mapEmbed: z
      .string()
      .trim()
      .regex(
        /^https:\/\/www\.google\.com\/maps\/embed\?\S+$/,
        'Paste the map address from Google Maps: Share, then Embed a map. It starts https://www.google.com/maps/embed?',
      ),
  }),
})

export type SiteDoc = z.infer<typeof SiteDocSchema>

/** Each item's `field` is its own: a second one is pointed at. */
function noRepeats<T>(items: T[], field: keyof T & string, at: string, message: string, ctx: z.RefinementCtx): void {
  const seen = new Set<unknown>()
  items.forEach((item, i) => {
    if (seen.has(item[field])) ctx.addIssue({ code: 'custom', path: [at, i, field], message })
    seen.add(item[field])
  })
}

// ------------------------------------------------------------- collections

export const CollectionSchema = object({
  /** The address, /shop?collection=<id>: made from the name, and fixed once published. */
  id: slug,
  name: text(40),
  /** Under its name in the menu, and on its card on the Home page. */
  tagline: text(80),
  /** Its card on the Home page's collection rail. */
  description: text(600),
  /** Under the title when the shop shows this collection. */
  intro: text(400),
  accent: z.enum(ACCENTS, { errorMap: () => ({ message: 'Choose a colour.' }) }),
  /** The square cover. */
  image: photo,
  /** The banner behind the shop's title for this collection. */
  banner: photo.optional(),
})

export const CollectionsDocSchema = object({
  /** In the order the menu, the shop and the Home page's rail show them. */
  collections: z.array(CollectionSchema).min(1, 'Keep at least one collection.'),
}).superRefine((doc, ctx) => noRepeats(doc.collections, 'id', 'collections', 'Another collection already uses this address.', ctx))

export type CollectionsDoc = z.infer<typeof CollectionsDocSchema>
export type CollectionEntry = CollectionsDoc['collections'][number]

// ----------------------------------------------------------------- reviews

const STARS = 'Choose from one to five stars.'

export const ReviewSchema = object({
  quote: text(1000),
  author: text(60),
  /** What they bought, shown under the name. */
  product: text(80).optional(),
  /** Stars as left on the platform; five when left out. */
  rating: z.number({ invalid_type_error: STARS }).int(STARS).min(1, STARS).max(5, STARS).optional(),
  /** The review where it was left, linked from the product line. */
  href: z
    .string()
    .trim()
    .max(1000, 'Keep this under 1000 characters.')
    .regex(/^https:\/\/\S+$/, 'Use the full web address, starting https://.')
    .optional(),
})

export const ReviewsDocSchema = object({
  /** The customer wall on the Home page, in order. */
  reviews: z.array(ReviewSchema).min(1, 'Keep at least one review.'),
})

export type ReviewsDoc = z.infer<typeof ReviewsDocSchema>
export type ReviewEntry = ReviewsDoc['reviews'][number]

// ----------------------------------------------------------------- journey

export const MilestoneSchema = object({
  year: z.string().trim().regex(/^\d{4}$/, 'Write the year, like 2026.'),
  title: text(60),
  body: text(400),
  /** The card's photo. Without one, the card shows the house motif. */
  photo: photo.optional(),
})

export const JourneyDocSchema = object({
  /** The years on the Our Story page, in order. */
  milestones: z.array(MilestoneSchema).min(1, 'Keep at least one year.'),
}).superRefine((doc, ctx) => noRepeats(doc.milestones, 'year', 'milestones', 'This year is already on the journey.', ctx))

export type JourneyDoc = z.infer<typeof JourneyDocSchema>
export type MilestoneEntry = JourneyDoc['milestones'][number]

// ------------------------------------------------------------------- logos

/**
 * A partner or seller logo. The walls rest in black and white and show each
 * logo's own colours on hover, so a logo is two prints, made together.
 */
export const LogoSchema = object({
  /** For anyone who cannot see the logo. */
  name: text(60),
  /** The logo in its own colours, shown on hover. */
  logo: photo,
  /** The black and white print the wall rests in. */
  mono: photo,
  /** An upright or square mark, given more height than the wide ones. */
  tall: z.boolean().optional(),
})

export const PartnersDocSchema = object({
  /** The Partnered With wall on the Home page, row by row as a wide screen shows it. */
  rows: z
    .array(
      object({
        logos: z.array(LogoSchema).min(1, 'Add a logo to this row, or remove the row.').max(10, 'Up to ten logos in a row.'),
      }),
    )
    .min(1, 'Keep at least one row.')
    .max(6, 'Up to six rows.'),
})

export const SellersDocSchema = object({
  /** The Trusted Sellers wall on the Stores page. */
  logos: z.array(LogoSchema).min(1, 'Keep at least one logo.').max(40, 'Up to forty logos.'),
})

export type PartnersDoc = z.infer<typeof PartnersDocSchema>
export type SellersDoc = z.infer<typeof SellersDocSchema>
export type LogoEntry = z.infer<typeof LogoSchema>

// ------------------------------------------------------------------ places

/**
 * A pin on the Scented Memory map. Its words and card photo are the team's;
 * where it sits, the scent it opens and its boutiques stay as they are.
 */
export const PlaceSchema = object({
  id: slug,
  place: text(40),
  /** The line above the name, such as "Kedah · The Isles". */
  region: text(60),
  /** The words on its card. */
  note: text(300),
  /** The scent the pin opens. */
  productId: slug,
  /** Set when the pin stands for a whole collection. */
  collectionId: slug.optional(),
  /** The card's heading, where it is not the product's name. */
  scentLabel: text(60).optional(),
  /** The line under the heading, where it is not the product's family and price. */
  familyLabel: text(80).optional(),
  /** The card's photo, where it is not the product's lifestyle shot. */
  cardImage: photo.optional(),
  /** The boutiques at this place, by store id. */
  storeIds: z.array(slug),
  /** Where the pin sits over the map artwork, as percentages. */
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
})

export const PlacesDocSchema = object({
  places: z.array(PlaceSchema).min(1, 'Keep at least one place.'),
})

export type PlacesDoc = z.infer<typeof PlacesDocSchema>
export type PlaceEntry = PlacesDoc['places'][number]

// ---------------------------------------------------------------- policies

/** The four policy pages, each at its own address: /shipping and the rest. */
export const POLICY_SLUGS = ['shipping', 'returns', 'terms', 'privacy'] as const

export const PolicySchema = object({
  slug: z.enum(POLICY_SLUGS, { errorMap: () => ({ message: 'The four policy pages each appear once.' }) }),
  title: text(80),
  /** The small line above the title. */
  eyebrow: text(40),
  intro: text(400),
  /** As the page shows it, such as "August 2026". */
  updated: text(40),
  body: z.array(BlockSchema).min(1, 'Write at least one paragraph.'),
}).superRefine((policy, ctx) => tablesComplete(policy.body, ctx, ['body']))

export const PoliciesDocSchema = object({
  policies: z.array(PolicySchema),
}).superRefine((doc, ctx) => {
  const slugs = doc.policies.map((p) => p.slug)
  const once = POLICY_SLUGS.every((slug) => slugs.filter((s) => s === slug).length === 1)
  if (!once || slugs.length !== POLICY_SLUGS.length) {
    ctx.addIssue({ code: 'custom', path: ['policies'], message: 'The four policy pages each appear once.' })
  }
})

export type PoliciesDoc = z.infer<typeof PoliciesDocSchema>
export type PolicyEntry = PoliciesDoc['policies'][number]

// ------------------------------------------------------------------- pages

/**
 * A page heading: a newline starts a new line, and a word between stars is set
 * in the house's gold italic (src/lib/heading.ts reads it the same way).
 */
const heading = (max: number) =>
  text(max)
    .refine((s) => s.split('\n').length <= 4, 'Keep a heading to four lines.')
    .refine((s) => (s.match(/\*/g)?.length ?? 0) % 2 === 0, 'Close the gold word with a second *.')

/** What search engines show for a page. */
const seo = object({ title: text(70), description: text(300) })

/** A page's title bar. */
const header = (eyebrow = 40) => object({ eyebrow: text(eyebrow), title: heading(80), intro: text(400) })

const exactly = <T extends z.ZodTypeAny>(item: T, count: number, what: string) =>
  z.array(item).length(count, `Keep the ${count} ${what}: the page has a place for each.`)

const FIGURE = 'Use a whole number.'

/**
 * Every page's own words, and its two photographs, keyed by page. The words
 * of the lists (collections, reviews and the rest) live in their own
 * documents; banners and sharing images follow in stage 4c.
 */
export const PagesDocSchema = object({
  /** On every page: the header menu's featured card and the footer. */
  layout: object({
    menu: object({ eyebrow: text(40), title: text(40), photo, alt: text(120) }),
    footer: object({
      blurb: text(300),
      /** The sign-up on the Contact page. */
      newsletter: object({ eyebrow: text(40), heading: heading(120), text: text(300), thanks: text(120) }),
      copyright: text(120),
      payments: z.array(text(30)).min(1, 'Add at least one way to pay.').max(10, 'Up to ten.'),
    }),
  }),
  home: object({
    seo,
    signature: object({
      kicker: text(40),
      heading: heading(80),
      since: heading(20),
      figure: z.number({ invalid_type_error: FIGURE }).int(FIGURE).min(1, FIGURE).max(100_000_000, FIGURE),
      suffix: optionalText(4),
      figureLabel: text(60),
      button: text(40),
      note: text(60),
      photo,
      alt: text(120),
    }),
    collections: object({ kicker: text(40), heading: heading(60), intro: text(400), cue: text(40) }),
    map: object({ kicker: text(60), heading: heading(80), intro: text(400) }),
    bestsellers: object({ kicker: text(40), heading: heading(60), link: text(30) }),
    finder: object({
      kicker: text(40),
      heading: heading(80),
      intro: text(300),
      link: text(30),
      /** The line on each mood's tile. */
      moods: object({ Serene: text(60), Bold: text(60), Romantic: text(60), Playful: text(60) }),
    }),
    partners: object({ heading: heading(60) }),
    reviews: object({ kicker: text(60), heading: heading(80), link: text(40) }),
  }),
  shop: object({
    eyebrow: text(40),
    /** Under the title for each view of the shop. A collection's own is with the collection. */
    intros: object({ all: text(400), bestsellers: text(400), gifts: text(400), her: text(400), him: text(400) }),
  }),
  about: object({
    seo,
    header: header(),
    beginning: object({
      photo,
      alt: text(120),
      kicker: text(40),
      heading: heading(80),
      /** Paragraphs, a blank line between them. */
      body: text(2000),
      button: text(40),
    }),
    /** The four promises under the opening, each beside its icon. */
    services: exactly(object({ title: text(40), copy: text(160) }), 4, 'four promises'),
    journey: object({ kicker: text(40), heading: heading(80) }),
    purpose: object({
      kicker: text(40),
      heading: heading(80),
      items: exactly(object({ label: text(40), title: text(120), body: text(600) }), 2, 'vision and mission'),
    }),
    values: object({
      kicker: text(40),
      heading: heading(80),
      items: exactly(object({ title: text(40), body: text(200) }), 4, 'four values'),
    }),
    cta: object({ heading: heading(80), shop: text(30), stores: text(30) }),
  }),
  stores: object({
    seo,
    header: header(),
    sellers: object({ heading: heading(60), intro: text(300) }),
  }),
  contact: object({
    seo,
    header: header(60),
    /** "Fill in the form below, or reach us directly on" and the WhatsApp link's words. */
    form: object({ kicker: text(40), heading: heading(80), intro: text(200), link: text(30) }),
    office: object({ kicker: text(40), directions: text(30), stores: text(30) }),
    faq: object({ kicker: text(40), heading: heading(80), button: text(30) }),
  }),
  faq: object({
    seo,
    header: object({ eyebrow: text(40), title: heading(80) }),
    /** The words either side of the WhatsApp number, which comes from the site details. */
    help: object({
      kicker: text(40),
      heading: heading(80),
      before: text(200),
      after: text(300),
      whatsapp: text(30),
      message: text(30),
    }),
  }),
  journal: object({ seo, header: header() }),
  policies: object({ more: text(40) }),
})

export type PagesDoc = z.infer<typeof PagesDocSchema>

// ----------------------------------------------------------------- helpers

function eachString(value: unknown, path: string[], visit: (s: string, path: string[]) => void): void {
  if (typeof value === 'string') {
    visit(value, path)
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => eachString(v, [...path, String(i)], visit))
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) eachString(v, [...path, k], visit)
  }
}

/**
 * Where a long dash appears, as dotted paths ("sections.2.items.0.a").
 *
 * House style keeps em and en dashes out of the copy. The dashboard warns at
 * these fields and offers a comma; it never changes the text by itself.
 */
export function findDashes(value: unknown): string[] {
  const found: string[] = []
  eachString(value, [], (s, path) => {
    if (/[–—]/.test(s)) found.push(path.join('.'))
  })
  return found
}

/** Every dashboard photo a document refers to, each once. */
export function mediaRefs(value: unknown): string[] {
  const found = new Set<string>()
  eachString(value, [], (s) => {
    if (s.startsWith('/assets/cms/')) found.add(s)
  })
  return [...found]
}
