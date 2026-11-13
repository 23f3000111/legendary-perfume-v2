import type { ZodTypeAny } from 'zod'
import { DOC_KEYS, isDocKey, type DocKey } from './keys.js'
import { FaqDocSchema, JournalDocSchema, StoresDocSchema } from './schema.js'

/**
 * Every document the dashboard edits: where it lives in the repository, what
 * the dashboard calls it, and what it must look like to be published.
 *
 * Publishing writes `path` in one commit through the GitHub API, and the site
 * imports the same file at build time.
 */
export interface DocSpec {
  path: string
  label: string
  schema: ZodTypeAny
}

export const DOCS: Record<DocKey, DocSpec> = {
  faq: { path: 'src/content/faq.json', label: 'FAQ', schema: FaqDocSchema },
  stores: { path: 'src/content/stores.json', label: 'Stores', schema: StoresDocSchema },
  journal: { path: 'src/content/journal.json', label: 'Journal', schema: JournalDocSchema },
}

export { DOC_KEYS, isDocKey, type DocKey }
