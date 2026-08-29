import { asset } from '../lib/asset'
import type { AccentKey } from './products'

export interface Collection {
  id: string
  name: string
  tagline: string
  description: string
  accent: AccentKey
  /** Family shot of the whole collection, supplied by the client. */
  image: string
  /** Wide banner used behind the page title bar. */
  banner?: string
}

const img = (name: string) => asset(`/assets/client/${name}`)

export const collections: Collection[] = [
  {
    id: 'signature',
    name: 'Signature',
    tagline: 'The scents that made us',
    description:
      'Orchid, Mahsuri, Violet and Man, the defining icons of Legendary. A timeless collection bridging the natural wonders of Malaysia with fine perfumery.',
    accent: 'gold',
    image: img('collection-signature.webp'),
    banner: img('banner-signature.webp'),
  },
  {
    id: 'nyonya',
    name: 'Nyonya',
    tagline: 'Peranakan cultural artistry',
    description:
      'Rooted in vibrant Peranakan heritage, this collection reimagines romantic flora, nostalgic delicacies and intricate cultural textiles into fine fragrance.',
    accent: 'rose',
    image: img('collection-nyonya.webp'),
    banner: img('banner-nyonya.webp'),
  },
  {
    id: 'three-wishes',
    name: '3 Wishes',
    tagline: 'Alcohol free, everyday luxury',
    // Revision 4: the three Wishes are now sold singly and as a travel kit as
    // well as in the boxed set, so the copy no longer says trio alone.
    description:
      'A delicate, alcohol free fragrance trio crafted for a gentle, comforting ritual. A soothing daily moment for unwinding in subtle, lasting luxury. Take the three Wishes as a boxed set, one at a time in 15ml, or packed into a travel kit.',
    accent: 'gold',
    image: img('collection-3-wishes.webp'),
    banner: img('banner-3wishes.webp'),
  },
  {
    id: 'spirit',
    name: 'Spirit',
    tagline: 'Shimmering fragrance collection',
    // Client amendment: Spirit II now sits alongside Spirit I in this
    // collection, so the copy covers both sets. Revision 4 adds the Spirit II
    // fragrances as 50ml bottles of their own.
    description:
      'A vibrant collection infused with luminous shimmer, leaving an enchanting glow and fresh fragrance on your skin. Crafted for those who dare to shine, wherever they go. Spirit I carries Hope, Love and Confidence; Spirit II answers with Passion, Life and Dream.',
    accent: 'teal',
    image: img('collection-spirit.webp'),
    banner: img('banner-spirit.webp'),
  },
]

export function getCollection(id: string) {
  return collections.find((c) => c.id === id)
}
