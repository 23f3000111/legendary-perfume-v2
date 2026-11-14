/**
 * The documents the content dashboard edits, by key.
 *
 * Kept free of imports on purpose: the public site names documents to apply
 * preview drafts to, and importing the schemas here would pull zod into the
 * shop's own bundle for nothing.
 */
export const DOC_KEYS = ['faq', 'stores', 'journal', 'products'] as const

export type DocKey = (typeof DOC_KEYS)[number]

export function isDocKey(value: unknown): value is DocKey {
  return typeof value === 'string' && (DOC_KEYS as readonly string[]).includes(value)
}
