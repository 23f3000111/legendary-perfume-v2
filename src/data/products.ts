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

/** One line of the "What's included" list shown on the product page. */
export interface IncludedItem {
  label: string
  detail: string
}

/**
 * One fragrance inside a set.
 *
 * Client amendment: Spirit I, Spirit II, 3 Wishes and the travel kits each
 * hold three scents, so their composition band repeats once per fragrance
 * rather than showing a single blended chart.
 */
export interface Variant {
  name: string
  /** Olfactory family, e.g. "Floral Green". Absent where the client's product
   *  sheet does not break one out for that fragrance. */
  family?: string
  notes: ScentNotes
  /** Client-supplied occasion chart for this fragrance. */
  radar: string
  /** Cut-out botanical for this fragrance. */
  bloom?: string
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
  /** Lifestyle shot — the resting state of every product tile. */
  image: string
  /**
   * Transparent box + bottle cut-out, revealed on hover over the lifestyle
   * shot. Client amendment: every tile now shows this over the SKU's own
   * gradient rather than over the pack shot's baked-in white.
   */
  hoverImage: string
  gallery: string[]
  /** Flat-lay of everything in the box, for the "What's included" block. */
  included: string
  includedItems: IncludedItem[]
  /** Client-supplied occasion chart (Sport · Work · Social · Vacation · Casual). */
  radar: string
  /** Cut-out botanical that dresses the composition band. */
  bloom?: string
  /** Set products break their composition band out per fragrance. */
  variants?: Variant[]
  accent: AccentKey
  /** Overrides the composition band wash — Mahsuri runs orange per the client. */
  compositionTint?: string
  badges: string[]
  bestseller?: boolean
  /** Counts towards the Gifts & Sets filter. */
  gift?: boolean
  story: string
  description: string
  notes: ScentNotes
  /** links a scent to a place on the Scented Memory map */
  place?: string
}

const img = (name: string) => asset(`/assets/client/${name}`)

/** Every product ships with the same presentation set. */
const STANDARD_INCLUDES: IncludedItem[] = [
  { label: 'Eau de Parfum', detail: 'Your fragrance in its signature faceted bottle' },
  { label: 'Signature carrier', detail: 'Legendary Malaysia paper bag, ready to gift' },
  { label: 'Gift box', detail: 'Hand finished box in house ivory & gold' },
  { label: 'Post card', detail: 'A personalised card to write your own note' },
  { label: 'Discovery samples', detail: 'Vials to try the rest of the house' },
]

/* ------------------------------------------------------------------
   Set fragrances.

   Client amendment: Spirit I, Spirit II, 3 Wishes and the travel kits
   each show three composition bands, one per fragrance, in the order
   the client listed. Notes are lifted from the Spirit I and Spirit II
   product sheets in the delivery.
   ------------------------------------------------------------------ */

/** Spirit I ships in two sizes, so its trio is built per product id. */
function spiritOneTrio(id: string): Variant[] {
  const art = (slug: string) => ({
    radar: img(`p-${id}-${slug}-radar.webp`),
    bloom: img(`p-${id}-${slug}-bloom.webp`),
  })
  return [
    {
      name: 'Hope',
      family: 'Floral Green',
      notes: {
        top: ['Aqueous', 'Green', 'Pear'],
        heart: ['Jasmine', 'Muguet', 'Magnolia'],
        base: ['Amber', 'Musky', 'Woody'],
      },
      ...art('hope'),
    },
    {
      name: 'Love',
      family: 'Floral',
      notes: {
        top: ['Muguet', 'Lemon', 'Rose'],
        heart: ['Powdery', 'Ambrette', 'Linen'],
        base: ['Patchouli', 'Cedarwood', 'Musky'],
      },
      ...art('love'),
    },
    {
      name: 'Confidence',
      family: 'Fruity Floral',
      notes: {
        top: ['Bergamot', 'Pear', 'Rose'],
        heart: ['Jasmine', 'Leafy', 'Muguet'],
        base: ['Cedarwood', 'Grapefruit', 'Sandalwood'],
      },
      ...art('confidence'),
    },
  ]
}

const SPIRIT_TWO_TRIO: Variant[] = [
  {
    name: 'Passion',
    family: 'Green Floral',
    notes: {
      top: ['Red Berries', 'Blackcurrant'],
      heart: ['Rose', 'Muguet', 'Ylang Ylang'],
      base: ['Vanilla', 'Musk'],
    },
    radar: img('p-spirit-ii-passion-radar.webp'),
    bloom: img('p-spirit-ii-passion-bloom.webp'),
  },
  {
    name: 'Life',
    family: 'Floral Amber',
    notes: {
      top: ['Bergamot', 'Lychee', 'Nutmeg'],
      heart: ['Rose', 'Peony', 'Vanilla', 'Musk'],
      base: ['Vetiver', 'Cedar', 'Incense'],
    },
    radar: img('p-spirit-ii-life-radar.webp'),
    bloom: img('p-spirit-ii-life-bloom.webp'),
  },
  {
    name: 'Dream',
    family: 'Floral Fruity',
    notes: {
      top: ['Lotus', 'Freesia'],
      heart: ['Muguet', 'White Lily', 'Peony'],
      base: ['White Musk', 'Amber', 'Cedar'],
    },
    radar: img('p-spirit-ii-dream-radar.webp'),
    bloom: img('p-spirit-ii-dream-bloom.webp'),
  },
]

/**
 * The client's delivery carries one shared note list for the 3 Wishes box
 * rather than a breakdown per Wish, so all three bands quote the set. Swap
 * in per Wish notes here the moment that sheet arrives.
 */
const WISH_NOTES: ScentNotes = {
  top: ['Aldehydes', 'Pear', 'Bergamot'],
  heart: ['Cotton Flower', 'Peony', 'Neroli'],
  base: ['White Musk', 'Cashmere', 'Blond Wood'],
}

const WISH_TRIO: Variant[] = ['i', 'ii', 'iii'].map((n) => ({
  name: `Wish ${n.toUpperCase()}`,
  notes: WISH_NOTES,
  radar: img(`p-3-wishes-wish-${n}-radar.webp`),
  bloom: img(`p-3-wishes-wish-${n}-bloom.webp`),
}))

// Prices in Malaysian Ringgit (RM / MYR)
// Order below is the merchandising sequence the client specified:
// Orchid · Violet · Mahsuri · Man · Nyonya · 3 Wishes · Spirit
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
    image: img('p-orchid-life.webp'),
    hoverImage: img('p-orchid-pack.webp'),
    gallery: [img('p-orchid-life.webp'), img('p-orchid-pack.webp'), img('p-orchid-box.webp')],
    included: img('p-orchid-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-orchid-radar.webp'),
    bloom: img('p-orchid-bloom.webp'),
    accent: 'gold',
    badges: ['Signature Scent'],
    bestseller: true,
    place: 'Kuala Lumpur',
    story:
      'Orchid is the signature of Legendary, inspired by the tropical rainforests of Malaysia. Bathed in the purity of white orchids, it is a timeless dance of grace and serenity captured in a luscious eau de parfum.',
    description:
      'A light, fresh eau de parfum that opens on orange, lemon and mandarin, blooms into a serene garden of jasmine, magnolia and tuberose, and settles on ambergris, vetiver and cedar.',
    notes: {
      top: ['Orange', 'Aqueous', 'Clove', 'Lemon', 'Mandarin'],
      heart: ['Jasmine', 'Magnolia', 'Muguet', 'Tuberose', 'Orchid'],
      base: ['Ambergris', 'Vetiver', 'Violet', 'Musky', 'Cedar'],
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
    image: img('p-violet-life.webp'),
    hoverImage: img('p-violet-pack.webp'),
    gallery: [img('p-violet-life.webp'), img('p-violet-pack.webp'), img('p-violet-box.webp')],
    included: img('p-violet-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-violet-radar.webp'),
    bloom: img('p-violet-bloom.webp'),
    accent: 'plum',
    badges: ['Signature Scent'],
    place: 'Genting Highlands',
    story:
      'A classic symbol of love and devotion that evokes mystique and timeless elegance. With a touch of sophistication and depth, Violet captures the delicate essence of a blooming violet as it unfolds into its true beauty.',
    description:
      'One spray wraps you in lusciousness and mystery. Bergamot, lychee and red fruits sit over cedarwood, incense and rose, resting on musk, cashmere and vanilla.',
    notes: {
      top: ['Bergamot', 'Lychee', 'Red Fruits', 'Rhubarb', 'Nutmeg'],
      heart: ['Cedarwood', 'Incense', 'Peony', 'Rose'],
      base: ['Musk', 'Ambergris', 'Cashmere', 'Vetiver', 'Vanilla'],
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
    image: img('p-mahsuri-life.webp'),
    hoverImage: img('p-mahsuri-pack.webp'),
    gallery: [img('p-mahsuri-life.webp'), img('p-mahsuri-pack.webp'), img('p-mahsuri-box.webp')],
    included: img('p-mahsuri-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-mahsuri-radar.webp'),
    bloom: img('p-mahsuri-bloom.webp'),
    accent: 'rose',
    // Client note: the Mahsuri composition band runs orange, not rose.
    compositionTint: '#ffdbbb',
    badges: ['Signature Scent'],
    bestseller: true,
    place: 'Langkawi',
    story:
      'Inspired by the story of Mahsuri, the fragrance embodies the grace, purity and unwavering courage that immortalised her legend. It carries a noble aura and a strong spirit, a charming scent that whispers like a tale.',
    description:
      'An elegant yet powerful scent that leaves a timeless and unforgettable impression: apple, muguet and rose over a cedarwood heart, closing on amber.',
    notes: {
      top: ['Apple', 'Muguet', 'Rose'],
      heart: ['Cedarwood'],
      base: ['Cedarwood', 'Muguet', 'Rose', 'Amber Gray', 'Amber Dry'],
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
    image: img('p-man-life.webp'),
    hoverImage: img('p-man-pack.webp'),
    gallery: [img('p-man-life.webp'), img('p-man-pack.webp'), img('p-man-box.webp')],
    included: img('p-man-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-man-radar.webp'),
    bloom: img('p-man-bloom.webp'),
    accent: 'graphite',
    badges: ['Signature Scent'],
    bestseller: true,
    place: 'Genting Highlands',
    story:
      'A versatile eau de parfum crafted for the modern man: elegant, charismatic and effortlessly sophisticated. It captures the essence of timeless elegance, making it a signature scent for any occasion.',
    description:
      'Grapefruit and lemon open crisp and clean before an orchard heart of apple, raspberry and orange flower, grounded in cedarwood, sandalwood and vanilla.',
    notes: {
      top: ['Grapefruit', 'Lemon'],
      heart: ['Apple', 'Raspberry', 'Orange Flower', 'Muguet', 'Jasmine'],
      base: ['Cedarwood', 'Musk', 'Sandalwood', 'Vanilla'],
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
    image: img('p-kebaya-blooms-life.webp'),
    hoverImage: img('p-kebaya-blooms-pack.webp'),
    gallery: [img('p-kebaya-blooms-life.webp'), img('p-kebaya-blooms-pack.webp'), img('p-kebaya-blooms-box.webp')],
    included: img('p-kebaya-blooms-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-kebaya-blooms-radar.webp'),
    bloom: img('p-kebaya-blooms-bloom.webp'),
    accent: 'rose',
    badges: ['Nyonya Heritage'],
    bestseller: true,
    place: 'Melaka',
    story:
      'A love letter to the Nyonya kebaya, with its embroidered flowers rendered in scent. Delicate, feminine and rich with Peranakan romance.',
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
    image: img('p-ondeh-delights-life.webp'),
    hoverImage: img('p-ondeh-delights-pack.webp'),
    gallery: [img('p-ondeh-delights-life.webp'), img('p-ondeh-delights-pack.webp'), img('p-ondeh-delights-box.webp')],
    included: img('p-ondeh-delights-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-ondeh-delights-radar.webp'),
    bloom: img('p-ondeh-delights-bloom.webp'),
    accent: 'jade',
    badges: ['Nyonya Heritage'],
    place: 'Melaka',
    story:
      'The beloved ondeh ondeh, reimagined as fragrance. Pandan and coconut cradle a molten heart of gula melaka for a nostalgic, edible sweetness.',
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
    image: img('p-nyonya-aromatic-life.webp'),
    hoverImage: img('p-nyonya-aromatic-pack.webp'),
    gallery: [img('p-nyonya-aromatic-life.webp'), img('p-nyonya-aromatic-pack.webp'), img('p-nyonya-aromatic-box.webp')],
    included: img('p-nyonya-aromatic-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-nyonya-aromatic-radar.webp'),
    bloom: img('p-nyonya-aromatic-bloom.webp'),
    accent: 'amber',
    badges: ['Nyonya Heritage'],
    place: 'Melaka',
    story:
      'The warmth of a Peranakan kitchen, with cardamom, clove and cinnamon folded into rose and amber. Spice as heirloom, worn on the skin.',
    description:
      'An amber spice signature: glowing cardamom and clove over ginger flower and rose, resting on sandalwood and patchouli.',
    notes: {
      top: ['Cardamom', 'Orange', 'Clove'],
      heart: ['Cinnamon', 'Rose', 'Ginger Flower'],
      base: ['Sandalwood', 'Amber', 'Patchouli'],
    },
  },
  {
    id: '3-wishes',
    name: '3 Wishes',
    subtitle: 'Alcohol Free Trio',
    collection: '3 Wishes',
    collectionId: 'three-wishes',
    family: 'Clean Musk',
    audience: 'Unisex',
    moods: ['Serene'],
    price: 199,
    compareAt: 249,
    size: '3 × 15ml Eau de Parfum',
    image: img('p-3-wishes-life.webp'),
    hoverImage: img('p-3-wishes-pack.webp'),
    gallery: [img('p-3-wishes-life.webp'), img('p-3-wishes-pack.webp'), img('p-3-wishes-box.webp')],
    included: img('p-3-wishes-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-3-wishes-radar.webp'),
    variants: WISH_TRIO,
    accent: 'gold',
    badges: ['Alcohol Free', 'Skin Safe'],
    bestseller: true,
    gift: true,
    story:
      'A luxurious, alcohol free collection designed for gentle, everyday indulgence. Safe for all skin types, each of the three Wishes is a soft, silken ritual.',
    description:
      'Three clean, second skin musks that are light, hydrating and endlessly wearable. A bestseller for a reason: comfort as a daily luxury.',
    notes: WISH_NOTES,
  },
  {
    id: 'spirit',
    name: 'Spirit I',
    subtitle: 'Hope · Love · Confidence',
    collection: 'Spirit',
    collectionId: 'spirit',
    family: 'Fresh Discovery',
    audience: 'Unisex',
    moods: ['Bold', 'Playful'],
    price: 179,
    compareAt: 219,
    size: '3 × 15ml Eau de Parfum',
    image: img('p-spirit-life.webp'),
    hoverImage: img('p-spirit-pack.webp'),
    gallery: [img('p-spirit-life.webp'), img('p-spirit-pack.webp'), img('p-spirit-box.webp')],
    included: img('p-spirit-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-spirit-radar.webp'),
    variants: spiritOneTrio('spirit'),
    accent: 'teal',
    // Client-specified wash for the Spirit I composition band.
    compositionTint: '#d1e5ed',
    badges: ['Discovery Set'],
    gift: true,
    place: 'Kota Kinabalu',
    story:
      'Shine with Hope, do with Love, strive with Confidence. Enhance your journey by creating unforgettable moments with the three fragrances of Spirit I.',
    description:
      'Hope opens floral green on aqueous pear. Love turns powdery on muguet and rose. Confidence lifts bright with bergamot, pear and jasmine.',
    notes: {
      top: ['Aqueous', 'Green', 'Pear', 'Bergamot'],
      heart: ['Jasmine', 'Muguet', 'Magnolia', 'Rose'],
      base: ['Amber', 'Musky', 'Woody', 'Cedarwood'],
    },
  },
  {
    // Client amendment: Spirit II was missing from the Spirit collection.
    // Prices and notes come from the client's Spirit II product sheet.
    id: 'spirit-ii',
    name: 'Spirit II',
    subtitle: 'Passion · Life · Dream',
    collection: 'Spirit',
    collectionId: 'spirit',
    family: 'Fresh Discovery',
    audience: 'Unisex',
    moods: ['Bold', 'Romantic'],
    price: 188,
    compareAt: 238,
    size: '3 × 15ml Eau de Parfum',
    image: img('p-spirit-ii-life.webp'),
    hoverImage: img('p-spirit-ii-pack.webp'),
    gallery: [img('p-spirit-ii-life.webp'), img('p-spirit-ii-pack.webp'), img('p-spirit-ii-box.webp')],
    included: img('p-spirit-ii-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-spirit-ii-radar.webp'),
    variants: SPIRIT_TWO_TRIO,
    accent: 'jade',
    // Client-specified wash for the Spirit II composition band.
    compositionTint: '#d9dfd2',
    badges: ['Discovery Set'],
    gift: true,
    place: 'Kota Kinabalu',
    story:
      'Passion ignites, Dream takes flight, Life begins. A bold and uplifting set of three fragrances that carries ambition, tenderness and a fresh start.',
    description:
      'Passion opens on red berries and blackcurrant. Dream floats through lotus, freesia and white lily. Life warms into rose, peony and incense.',
    notes: {
      top: ['Red Berries', 'Blackcurrant'],
      heart: ['Rose', 'Muguet', 'Ylang Ylang'],
      base: ['Vanilla', 'Musk'],
    },
  },
  {
    // Client amendment: the Spirit travel kit was missing from the shop.
    id: 'spirit-travel-kit',
    name: 'Spirit I Travel Kit',
    subtitle: 'Hope · Love · Confidence, sized for the bag',
    collection: 'Spirit',
    collectionId: 'spirit',
    family: 'Fresh Discovery',
    audience: 'Unisex',
    moods: ['Playful', 'Serene'],
    price: 68,
    compareAt: 98,
    size: 'Travel set of three eau de parfum',
    image: img('p-spirit-travel-kit-life.webp'),
    hoverImage: img('p-spirit-travel-kit-pack.webp'),
    gallery: [
      img('p-spirit-travel-kit-life.webp'),
      img('p-spirit-travel-kit-pack.webp'),
      img('p-spirit-travel-kit-box.webp'),
    ],
    included: img('p-spirit-travel-kit-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-spirit-travel-kit-hope-radar.webp'),
    variants: spiritOneTrio('spirit-travel-kit'),
    accent: 'teal',
    compositionTint: '#d1e5ed',
    badges: ['Travel Size'],
    gift: true,
    place: 'Kota Kinabalu',
    story:
      'The whole of Spirit I, packed for the road. Hope, Love and Confidence in cabin friendly sprays that slip into a handbag or a carry on.',
    description:
      'Three travel sprays of the Spirit I trio, ready for the weekend away or the desk drawer. The same composition, in a smaller pour.',
    notes: {
      top: ['Aqueous', 'Green', 'Pear', 'Bergamot'],
      heart: ['Jasmine', 'Muguet', 'Magnolia', 'Rose'],
      base: ['Amber', 'Musky', 'Woody', 'Cedarwood'],
    },
  },
]

export const moodList: Mood[] = ['Serene', 'Bold', 'Romantic', 'Playful']

/**
 * Client change: the mood tile now carries the headline itself rather than a
 * separate ingredient hint.
 */
export const moodCopy: Record<Mood, { line: string }> = {
  Serene: { line: 'Calm, clean and quietly luminous' },
  Bold: { line: 'Warm, spirited and unforgettable' },
  Romantic: { line: 'Tender, powdery and full of bloom' },
  Playful: { line: 'Bright, fruity and full of joy' },
}

/** Client-supplied line art, re-tinted to the house gold at build time. */
export const moodIcon: Record<Mood, string> = {
  Serene: img('mood-serene.png'),
  Bold: img('mood-bold.png'),
  Romantic: img('mood-romantic.png'),
  Playful: img('mood-playful.png'),
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

export function productsByCollection(collectionId: string): Product[] {
  return products.filter((p) => p.collectionId === collectionId)
}
