export interface Review {
  quote: string
  author: string
  product?: string
  /** Deep link to the review on the platform it was left on. */
  href?: string
}

/**
 * Customer reviews replace the journal preview on the home page.
 *
 * PENDING CLIENT CONTENT: these are placeholders. Replace `quote` / `author`
 * with real reviews and set `reviewsUrl` (plus each `href`) to the storefront
 * the client wants them to link out to — the brief says the section "will be
 * hyperlink" but no destination was supplied.
 */
export const reviewsUrl = '/shop'

export const reviews: Review[] = [
  {
    quote:
      'Orchid is everything I hoped for — soft, clean and it lasts the whole workday without ever feeling heavy.',
    author: 'Darshini B.',
    product: 'Orchid',
  },
  {
    quote:
      'Bought Kebaya Blooms for my mother and ended up ordering a second for myself. The packaging alone is worth it.',
    author: 'Fatin N.',
    product: 'Kebaya Blooms',
  },
  {
    quote:
      'The 3 Wishes set is perfect for sensitive skin. No alcohol sting, and I can layer all three depending on my mood.',
    author: 'Issac C.',
    product: '3 Wishes',
  },
  {
    quote:
      'Man is my new signature. Fresh citrus opening, warm woody finish — I get asked what I am wearing every week.',
    author: 'Jeremiah Y.',
    product: 'Man',
  },
]
