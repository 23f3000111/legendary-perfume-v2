import { asset } from '../lib/asset'
import type { AccentKey } from './products'

export interface Collection {
  id: string
  name: string
  tagline: string
  description: string
  accent: AccentKey
  image: string
}

export const collections: Collection[] = [
  {
    id: 'signature',
    name: 'Signature',
    tagline: 'The scents that made us',
    description:
      'Orchid, Mahsuri, Violet and Man — the icons of the house, inspired by Malaysia’s landscapes and worn the world over.',
    accent: 'gold',
    image: asset('/assets/orchid-mirror.webp'),
  },
  {
    id: 'nyonya',
    name: 'Nyonya',
    tagline: 'Peranakan heritage in bloom',
    description:
      'Rooted in Nyonya culture, this collection reimagines the flavours, textiles and tiles of the Peranakan world as fragrance.',
    accent: 'rose',
    image: asset('/assets/nyonya-heritage-house.webp'),
  },
  {
    id: 'three-wishes',
    name: '3 Wishes',
    tagline: 'Alcohol-free, everyday luxury',
    description:
      'A silken, skin-safe trio designed for gentle daily indulgence — a soft ritual for unwinding and treating yourself.',
    accent: 'gold',
    image: asset('/assets/three-wishes-ribbon.webp'),
  },
  {
    id: 'spirit',
    name: 'Spirit',
    tagline: 'Live · Passion · Dream',
    description:
      'A fresh, spirited discovery trio made for movement — sea air, citrus groves and open skies.',
    accent: 'teal',
    image: asset('/assets/spirit.webp'),
  },
]

export function getCollection(id: string) {
  return collections.find((c) => c.id === id)
}
