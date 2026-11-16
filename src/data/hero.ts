import data from '../content/hero.json'
import type { HeroDoc } from '../../api/_lib/content/schema'

/**
 * The campaign poster that follows the film in the Home hero: whether it shows,
 * its files, its words for anyone who cannot see it, whether the header turns
 * to ink over it, and the two regions every crop keeps in view.
 *
 * It lives in src/content/hero.json, which the Legendary team edits in the
 * dashboard's Poster tab. Read it when rendering (`hero.poster`), never from a
 * copy taken at import, so a preview's drafts show. The words over the film
 * are Home's, in src/content/pages.json.
 */
export const hero = data as HeroDoc
