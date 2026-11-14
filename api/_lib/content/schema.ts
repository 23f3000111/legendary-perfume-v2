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
}).superRefine((article, ctx) => {
  // A table row short of a cell would shift every cell after the gap.
  article.body.forEach((block, j) => {
    if (block.t !== 'table') return
    block.rows.forEach((row, r) => {
      if (row.length !== block.head.length) {
        ctx.addIssue({ code: 'custom', path: ['body', j, 'rows', r], message: 'Every row needs a cell for each column.' })
      }
    })
  })
})

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
