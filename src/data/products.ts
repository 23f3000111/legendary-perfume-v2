import { asset } from '../lib/asset'
export type Mood = 'Serene' | 'Bold' | 'Romantic' | 'Playful'
export type Audience = 'For Her' | 'For Him' | 'Unisex'
export type AccentKey =
  | 'gold' | 'rose' | 'jade' | 'amber' | 'plum' | 'teal' | 'graphite'

export interface ScentNotes {
  top: string[]
  heart: string[]
  base: string[]
}

export interface Product {
  id: string
  name: string
  subtitle: string
  collection: string
  collectionId: string
  family: string
  audience: Audience
  moods: Mood[]
  price: number
  compareAt?: number
  size: string
  image: string
  gallery: string[]
  accent: AccentKey
  badges: string[]
  bestseller?: boolean
  story: string
  description: string
  notes: ScentNotes
  /** links a scent to a place on the Scented Memory map */
  place?: string
}

// Prices in Malaysian Ringgit (RM / MYR)
export const products: Product[] = [
  {
    id: 'orchid',
    name: 'Orchid',
    subtitle: 'Exotic Orchid for an Extraordinary Soul',
    collection: 'Signature',
    collectionId: 'signature',
    family: 'Floral Fruity',
    audience: 'For Her',
    moods: ['Serene', 'Romantic'],
    price: 159,
    compareAt: 199,
    size: '30ml Eau de Parfum',
    image: asset('/assets/orchid-mirror.webp'),
    gallery: [asset('/assets/orchid-mirror.webp'), asset('/assets/lifestyle-orchid-hand.webp')],
    accent: 'gold',
    badges: ['Halal Certified', 'Signature Scent'],
    bestseller: true,
    place: 'Kuala Lumpur',
    story:
      'The scent that began it all. Inspired by the wild orchids of Malaysia’s rainforests, Orchid is a timeless dance of grace and serenity — the soul of the house captured in a single drop.',
    description:
      'A luminous eau de parfum that opens bright and fresh before settling into a serene garden of white blooms. Refined, radiant and unmistakably Legendary.',
    notes: {
      top: ['Orange', 'Apple', 'Green Lemon'],
      heart: ['Magnolia', 'Cattleya Orchid', 'Muguet', 'Pansy'],
      base: ['Peach', 'Amber', 'Musk', 'Cedar'],
    },
  },
  {
    id: 'mahsuri',
    name: 'Mahsuri',
    subtitle: 'A Legend Reborn in Bloom',
    collection: 'Signature',
    collectionId: 'signature',
    family: 'Fruity Floral',
    audience: 'For Her',
    moods: ['Romantic', 'Playful'],
    price: 159,
    compareAt: 199,
    size: '30ml Eau de Parfum',
    image: asset('/assets/mahsuri.webp'),
    gallery: [asset('/assets/mahsuri.webp')],
    accent: 'rose',
    badges: ['Halal Certified'],
    bestseller: true,
    place: 'Langkawi',
    story:
      'Named for the legendary maiden of Langkawi, Mahsuri is a tribute to purity and enduring beauty — sun-warmed fruits and dewy petals gathered from the island air.',
    description:
      'Juicy peach and grapefruit spark against a tender heart of lily of the valley and peony, closing on a soft, luminous musk.',
    notes: {
      top: ['Peach', 'Pink Grapefruit', 'Bergamot'],
      heart: ['Lily of the Valley', 'Jasmine', 'Peony'],
      base: ['White Musk', 'Cedar', 'Vanilla'],
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    subtitle: 'Wear Your Confidence',
    collection: 'Signature',
    collectionId: 'signature',
    family: 'Powdery Floral',
    audience: 'For Her',
    moods: ['Romantic', 'Serene'],
    price: 149,
    compareAt: 189,
    size: '30ml Eau de Parfum',
    image: asset('/assets/violet.webp'),
    gallery: [asset('/assets/violet.webp')],
    accent: 'plum',
    badges: ['Halal Certified'],
    place: 'Genting Highlands',
    story:
      'Born of the cool mountain air of the highlands, Violet is quiet confidence bottled — a powdery, romantic veil that lingers close to the skin.',
    description:
      'A modern violet built on iris and rose, wrapped in warm vanilla and sandalwood for a finish that feels like cashmere.',
    notes: {
      top: ['Bergamot', 'Blackcurrant'],
      heart: ['Violet', 'Rose', 'Iris'],
      base: ['Vanilla', 'Musk', 'Sandalwood'],
    },
  },
  {
    id: 'man',
    name: 'Man',
    subtitle: 'Wear Your Confidence',
    collection: 'Signature',
    collectionId: 'signature',
    family: 'Woody Aromatic',
    audience: 'For Him',
    moods: ['Bold'],
    price: 189,
    compareAt: 229,
    size: '50ml Eau de Parfum',
    image: asset('/assets/man.webp'),
    gallery: [asset('/assets/man.webp')],
    accent: 'graphite',
    badges: ['Halal Certified'],
    bestseller: true,
    place: 'Kuala Lumpur',
    story:
      'For the modern gentleman of the tropics. Man is a tailored blend of citrus, spice and dark woods — assured, magnetic and effortlessly refined.',
    description:
      'Crisp bergamot and pepper give way to an aromatic heart, grounded by vetiver, leather and amberwood for lasting presence.',
    notes: {
      top: ['Bergamot', 'Grapefruit', 'Black Pepper'],
      heart: ['Lavender', 'Geranium', 'Sage'],
      base: ['Vetiver', 'Leather', 'Amberwood'],
    },
  },
  {
    id: 'kebaya-blooms',
    name: 'Kebaya Blooms',
    subtitle: 'Nyonya Collection',
    collection: 'Nyonya',
    collectionId: 'nyonya',
    family: 'Floral',
    audience: 'For Her',
    moods: ['Romantic', 'Playful'],
    price: 159,
    compareAt: 199,
    size: '30ml Eau de Parfum',
    image: asset('/assets/kebaya-blooms.webp'),
    gallery: [asset('/assets/kebaya-blooms.webp')],
    accent: 'rose',
    badges: ['Halal Certified', 'Nyonya Heritage'],
    bestseller: true,
    place: 'Melaka',
    story:
      'A love letter to the Nyonya kebaya — its embroidered flowers rendered in scent. Delicate, feminine and rich with Peranakan romance.',
    description:
      'Litchi and rose petals bloom into a couture bouquet of peony and freesia, sweetened by praline and cashmere wood.',
    notes: {
      top: ['Litchi', 'Raspberry', 'Rose Petals'],
      heart: ['Peony', 'Freesia', 'Magnolia'],
      base: ['Musk', 'Cashmere Wood', 'Praline'],
    },
  },
  {
    id: 'ondeh-delights',
    name: 'Ondeh Delights',
    subtitle: 'Nyonya Collection',
    collection: 'Nyonya',
    collectionId: 'nyonya',
    family: 'Green Gourmand',
    audience: 'Unisex',
    moods: ['Playful', 'Serene'],
    price: 159,
    compareAt: 199,
    size: '30ml Eau de Parfum',
    image: asset('/assets/ondeh-delights.webp'),
    gallery: [asset('/assets/ondeh-delights.webp')],
    accent: 'jade',
    badges: ['Halal Certified', 'Nyonya Heritage'],
    place: 'Melaka',
    story:
      'The beloved ondeh-ondeh, reimagined as fragrance. Pandan and coconut cradle a molten heart of gula melaka — a nostalgic, edible sweetness.',
    description:
      'A playful green gourmand: fresh pandan and lime over coconut water, melting into palm sugar, vanilla and tonka.',
    notes: {
      top: ['Pandan', 'Coconut Water', 'Lime'],
      heart: ['Gula Melaka', 'Jasmine'],
      base: ['Vanilla', 'Musk', 'Tonka Bean'],
    },
  },
  {
    id: 'nyonya-aromatic',
    name: 'Nyonya Aromatic',
    subtitle: 'Nyonya Collection',
    collection: 'Nyonya',
    collectionId: 'nyonya',
    family: 'Spicy Aromatic',
    audience: 'Unisex',
    moods: ['Bold', 'Serene'],
    price: 159,
    compareAt: 199,
    size: '30ml Eau de Parfum',
    image: asset('/assets/nyonya-aromatic.webp'),
    gallery: [asset('/assets/nyonya-aromatic.webp')],
    accent: 'amber',
    badges: ['Halal Certified', 'Nyonya Heritage'],
    story:
      'The warmth of a Peranakan kitchen — cardamom, clove and cinnamon folded into rose and amber. Spice as heirloom, worn on the skin.',
    description:
      'An amber-spice signature: glowing cardamom and clove over ginger flower and rose, resting on sandalwood and patchouli.',
    notes: {
      top: ['Cardamom', 'Orange', 'Clove'],
      heart: ['Cinnamon', 'Rose', 'Ginger Flower'],
      base: ['Sandalwood', 'Amber', 'Patchouli'],
    },
  },
  {
    id: '3-wishes',
    name: '3 Wishes',
    subtitle: 'Alcohol-Free Trio',
    collection: '3 Wishes',
    collectionId: 'three-wishes',
    family: 'Clean Musk',
    audience: 'Unisex',
    moods: ['Serene'],
    price: 199,
    compareAt: 249,
    size: '3 × 15ml Eau de Parfum',
    image: asset('/assets/three-wishes-ribbon.webp'),
    gallery: [asset('/assets/three-wishes-ribbon.webp'), asset('/assets/three-wishes.webp')],
    accent: 'gold',
    badges: ['Halal Certified', 'Alcohol-Free', 'Skin-Safe'],
    bestseller: true,
    story:
      'A luxurious, alcohol-free collection designed for gentle, everyday indulgence. Safe for all skin types, each of the three Wishes is a soft, silken ritual.',
    description:
      'Three clean, second-skin musks — light, hydrating and endlessly wearable. A bestseller for a reason: comfort as a daily luxury.',
    notes: {
      top: ['Aldehydes', 'Pear', 'Bergamot'],
      heart: ['Cotton Flower', 'Peony', 'Neroli'],
      base: ['White Musk', 'Cashmere', 'Blond Wood'],
    },
  },
  {
    id: 'spirit',
    name: 'Spirit',
    subtitle: 'Live · Passion · Dream',
    collection: 'Spirit',
    collectionId: 'spirit',
    family: 'Fresh Discovery',
    audience: 'Unisex',
    moods: ['Bold', 'Playful'],
    price: 179,
    compareAt: 219,
    size: '3 × 15ml Eau de Parfum',
    image: asset('/assets/spirit.webp'),
    gallery: [asset('/assets/spirit.webp')],
    accent: 'teal',
    badges: ['Halal Certified', 'Discovery Set'],
    story:
      'A trio of fresh, spirited scents made for movement — sea air, citrus groves and open skies. Discover which one is yours.',
    description:
      'Three vibrant fragrances that capture living, passion and dreaming: bright, clean and effortlessly modern.',
    notes: {
      top: ['Sea Salt', 'Yuzu', 'Mandarin'],
      heart: ['Neroli', 'Mint', 'Freesia'],
      base: ['Driftwood', 'Musk', 'Amber'],
    },
  },
]

export const moodList: Mood[] = ['Serene', 'Bold', 'Romantic', 'Playful']

export const moodCopy: Record<Mood, { line: string; hint: string }> = {
  Serene: { line: 'Calm, clean and quietly luminous', hint: 'soft musks & white florals' },
  Bold: { line: 'Warm, spirited and unforgettable', hint: 'spice, wood & amber' },
  Romantic: { line: 'Tender, powdery and full of bloom', hint: 'rose, peony & violet' },
  Playful: { line: 'Bright, fruity and full of joy', hint: 'citrus, peach & gourmand' },
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function relatedProducts(product: Product, count = 4): Product[] {
  const same = products.filter(
    (p) => p.id !== product.id && p.collectionId === product.collectionId,
  )
  const others = products.filter(
    (p) => p.id !== product.id && p.collectionId !== product.collectionId,
  )
  return [...same, ...others].slice(0, count)
}

export function productsByMood(mood: Mood): Product[] {
  return products.filter((p) => p.moods.includes(mood))
}
