import { z } from 'zod'

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

/** A photo the site already serves: the delivery's, or one from the dashboard. */
const SITE_PHOTO = /^\/assets\/[\w./-]+\.(webp|jpg|png)$/

// --------------------------------------------------------------------- FAQ

export const FaqItemSchema = z.object({
  q: text(200),
  a: text(2000),
  /** Extra lines shown as a bulleted list under the answer. */
  list: z.array(text(300)).optional(),
})

export const FaqDocSchema = z.object({
  intro: text(600),
  sections: z
    .array(
      z.object({
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

export const StoreSchema = z.object({
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

export const StoresDocSchema = z
  .object({
    /** The filter tabs on the Stores page, in order. The page adds "All". */
    regions: z.array(text(40)).min(1, 'Add at least one region.').max(12, 'Up to twelve regions.'),
    stores: z.array(StoreSchema).min(1, 'Keep at least one store.'),
  })
  .superRefine((doc, ctx) => {
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
