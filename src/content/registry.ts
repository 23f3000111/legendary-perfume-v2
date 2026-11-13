import type { DocKey } from '../../api/_lib/content/keys'
import faq from './faq.json'
import stores from './stores.json'
import journal from './journal.json'

/**
 * Every document the dashboard edits, as the site holds it: the very objects
 * src/data exports, not copies. Preview swaps drafts into these before the
 * first render (see preview.ts), which is why components read content when
 * they render rather than taking copies when a module loads.
 */
export const CONTENT: Record<DocKey, Record<string, unknown>> = {
  faq: faq as Record<string, unknown>,
  stores: stores as Record<string, unknown>,
  journal: journal as Record<string, unknown>,
}
