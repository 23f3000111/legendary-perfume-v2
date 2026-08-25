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
      'Orchid, Mahsuri, Violet and Man are the icons of the house. Four Malaysian eau de parfum signatures inspired by the country’s landscapes and worn the world over.',
    accent: 'gold',
    image: img('collection-signature.webp'),
    banner: img('banner-signature.webp'),
  },
  {
    id: 'nyonya',
    name: 'Nyonya',
    tagline: 'Peranakan heritage in bloom',
    description:
      'Rooted in Nyonya culture, this Peranakan collection turns the flavours, textiles and tiles of Melaka into wearable fragrance.',
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
      'Alcohol free, skin safe Malaysian perfume made for gentle daily wear. Take the three Wishes as a boxed set, one at a time in 15ml, or packed into a travel kit.',
    accent: 'gold',
    image: img('collection-3-wishes.webp'),
    banner: img('banner-3wishes.webp'),
  },
  {
    id: 'spirit',
    name: 'Spirit',
    tagline: 'Six fragrances, two chapters',
    // Client amendment: Spirit II now sits alongside Spirit I in this
    // collection, so the copy covers both sets. Revision 4 adds the Spirit II
    // fragrances as 50ml bottles of their own.
    description:
      'Spirit I carries Hope, Love and Confidence. Spirit II answers with Passion, Life and Dream. Six fragrances made for movement, boxed as a set or poured on their own.',
    accent: 'teal',
    image: img('collection-spirit.webp'),
    banner: img('banner-spirit.webp'),
  },
]

export function getCollection(id: string) {
  return collections.find((c) => c.id === id)
}
