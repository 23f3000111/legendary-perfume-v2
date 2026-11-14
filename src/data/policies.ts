import data from '../content/policies.json'
import type { PoliciesDoc, PolicyEntry } from '../../api/_lib/content/schema'

/* ------------------------------------------------------------------
   The customer care pages: shipping, returns, terms and privacy.

   Copy is the client's, set in the house voice and typography. House
   style throughout: no hyphens or dashes anywhere in the wording, and
   phone numbers spaced rather than hyphenated.

   The pages live in src/content/policies.json, which the Legendary team
   edits in the dashboard with the journal's blocks. Each keeps its own
   address (/shipping, /returns, /terms, /privacy), so there are always
   these four. Where a page names the WhatsApp number or the house's
   address, it is written out in its words; the Site details form says
   so beside the number. Read `policies` when rendering, so a preview's
   drafts show.
   ------------------------------------------------------------------ */

export type Policy = PolicyEntry

export const policiesDoc = data as PoliciesDoc
export const policies = policiesDoc.policies

export function getPolicy(slug: string): Policy | undefined {
  return policies.find((p) => p.slug === slug)
}
