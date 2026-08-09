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
    tagline: 'Alcohol-free, everyday luxury',
    description:
      'An alcohol free, skin safe trio of Malaysian perfumes made for gentle daily wear. A soft ritual for unwinding and treating yourself.',
    accent: 'gold',
    image: img('collection-3-wishes.webp'),
    banner: img('banner-3wishes.webp'),
  },
  {
    id: 'spirit',
    name: 'Spirit',
    tagline: 'Live · Passion · Dream',
    description:
      'A fresh discovery trio made for movement, built on sea air, citrus groves and open skies.',
    accent: 'teal',
    image: img('collection-spirit.webp'),
  },
]

export function getCollection(id: string) {
  return collections.find((c) => c.id === id)
}
