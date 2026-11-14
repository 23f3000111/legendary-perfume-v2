import data from '../content/reviews.json'
import type { ReviewEntry, ReviewsDoc } from '../../api/_lib/content/schema'

/**
 * A customer review. `rating` is the stars as left on the platform: every
 * review the client supplied was a five, so five is the default rather than
 * something invented per entry. `href` is the review where it was left.
 */
export type Review = ReviewEntry

/**
 * Customer reviews, sitting under "Partnered With" on the home page.
 *
 * Revision 5: these were placeholders written in house. The client's copy
 * sheet supplies ten real reviews left on the brand's Shopee listings, each
 * with the buyer's handle, the variation bought and a link to the listing it
 * was left on. They are quoted as written, minus the platform's own furniture.
 * Two were left in Chinese and are carried in English translation. Reviews
 * the sheet shows only as a masked handle are credited to a verified buyer
 * rather than inventing a name for them.
 *
 * They live in src/content/reviews.json, which the Legendary team edits in the
 * dashboard. Read `reviews` when rendering, so a preview's drafts show.
 */
export const reviewsDoc: ReviewsDoc = data
export const reviews = reviewsDoc.reviews

/**
 * The section CTA reads "What our Customers Buy" and points at the bestsellers
 * listing, per the amendments doc.
 */
export const reviewsUrl = '/shop?filter=bestsellers'
