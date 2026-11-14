import data from '../content/journey.json'
import type { JourneyDoc, MilestoneEntry } from '../../api/_lib/content/schema'

export type Milestone = MilestoneEntry

/**
 * The house's years, as the Our Story page's journey rail shows them.
 *
 * They live in src/content/journey.json, which the Legendary team edits in the
 * dashboard. Each year's card shows its photo, or the house motif in gold when
 * it has none. Revision 8 brought 2019 back, and 2026 carries the counter at
 * Bangunan Sultan Abdul Samad, the photo the store locator uses for it.
 *
 * Read `journeyDoc.milestones` when rendering, so a preview's drafts show.
 */
export const journeyDoc: JourneyDoc = data
