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

/** Shop copy for the Spirit II fragrances sold on their own. */
const SPIRIT_TWO_COPY: Record<
  'passion' | 'life' | 'dream',
  { moods: Mood[]; accent: AccentKey; story: string; description: string }
> = {
  passion: {
    moods: ['Bold', 'Romantic'],
    accent: 'rose',
    story:
      'Passion ignites. Red berries and blackcurrant strike first, then a rose and ylang ylang heart holds the flame through the evening.',
    description:
      'A green floral with an appetite: red berries and blackcurrant over rose, muguet and ylang ylang, closing on vanilla and musk.',
  },
  life: {
    moods: ['Bold', 'Serene'],
    accent: 'jade',
    story:
      'Life begins. Bergamot and lychee open bright, and incense, cedar and vetiver give the fragrance somewhere to stand.',
    description:
      'A floral amber: bergamot, lychee and nutmeg lifting a heart of rose, peony and vanilla, resting on vetiver, cedar and incense.',
  },
  dream: {
    moods: ['Serene', 'Romantic'],
    accent: 'plum',
    story:
      'Dream takes flight. Lotus and freesia float above white lily and peony, and the whole thing settles into a soft white musk.',
    description:
      'A floral fruity built on air: lotus and freesia over muguet, white lily and peony, closing on white musk, amber and cedar.',
  },
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
 * Revision 4 amendment: Passion, Life and Dream are also sold on their own in
 * 50ml, so each Spirit II fragrance becomes a product of its own. Everything
 * but the shop copy is lifted straight from the set's own bands, and the
 * artwork comes from that fragrance's folder in the delivery.
 */
const SPIRIT_TWO_SINGLES: Product[] = SPIRIT_TWO_TRIO.map((v) => {
  const id = v.name.toLowerCase()
  const copy = SPIRIT_TWO_COPY[id as keyof typeof SPIRIT_TWO_COPY]
  return {
    id,
    name: v.name,
    subtitle: 'Spirit II, on its own',
    collection: 'Spirit',
    collectionId: 'spirit',
    family: v.family!,
    audience: 'Unisex',
    moods: copy.moods,
    price: 189,
    compareAt: 229,
    size: '50ml Eau de Parfum',
    image: img(`p-${id}-life.webp`),
    hoverImage: img(`p-${id}-pack.webp`),
    gallery: [img(`p-${id}-life.webp`), img(`p-${id}-pack.webp`), img(`p-${id}-box.webp`)],
    included: img(`p-${id}-included.webp`),
    includedItems: STANDARD_INCLUDES,
    radar: img(`p-${id}-radar.webp`),
    bloom: img(`p-${id}-bloom.webp`),
    accent: copy.accent,
    badges: ['Spirit II'],
    place: 'Kota Kinabalu',
    story: copy.story,
    description: copy.description,
    notes: v.notes,
  }
})

/**
 * Revision 4 amendment: the three bands used to quote one shared note list,
 * because the original delivery carried no breakdown per Wish. The client has
 * now sent that breakdown, so every Wish quotes its own composition.
 */
type WishKey = 'i' | 'ii' | 'iii'

const WISH_KEYS: WishKey[] = ['i', 'ii', 'iii']

const WISH_NOTES: Record<WishKey, ScentNotes> = {
  i: {
    top: ['Tangerine'],
    heart: ['Peony'],
    base: ['Musk'],
  },
  ii: {
    top: ['Orange Blossom', 'Osmanthus', 'Bergamot'],
    heart: ['Musk', 'Amber'],
    base: ['Vetiver', 'Vanilla', 'Patchouli'],
  },
  iii: {
    top: ['Apple', 'Blackcurrant', 'Clover', 'Myosotis', 'Purple Perilla'],
    heart: ['Peach', 'Flower Scent', 'Rose Hip', 'Rose', 'Jasmine'],
    base: ['Musk', 'Woods', 'Benzoin', 'Patchouli'],
  },
}

/** The family each Wish falls into, read off its own note list. */
const WISH_FAMILY: Record<WishKey, string> = {
  i: 'Citrus Floral',
  ii: 'Floral Amber',
  iii: 'Fruity Floral',
}

/** One composition band per Wish, for whichever box the three ship in. */
function wishTrio(id: string): Variant[] {
  return WISH_KEYS.map((n) => ({
    name: `Wish ${n.toUpperCase()}`,
    family: WISH_FAMILY[n],
    notes: WISH_NOTES[n],
    radar: img(`p-${id}-wish-${n}-radar.webp`),
    bloom: img(`p-${id}-wish-${n}-bloom.webp`),
  }))
}

/** What a boxed set quotes in its own summary: the three Wishes, in one line. */
const WISH_SET_NOTES: ScentNotes = {
  top: ['Tangerine', 'Orange Blossom', 'Bergamot'],
  heart: ['Peony', 'Rose', 'Amber'],
  base: ['Musk', 'Vanilla', 'Patchouli'],
}

/** Shop copy for the 15ml singles, written from each Wish's own composition. */
const WISH_COPY: Record<WishKey, { moods: Mood[]; story: string; description: string }> = {
  i: {
    moods: ['Serene', 'Romantic'],
    story:
      'The first Wish, and the simplest. One bright stroke of tangerine over a soft peony heart, worn close to the skin.',
    description:
      'Tangerine lifts, peony softens and a clean musk carries it through the day. Alcohol free, skin safe and easy to wear with anything.',
  },
  ii: {
    moods: ['Serene', 'Bold'],
    story:
      'The second Wish turns warmer. Orange blossom and osmanthus open the bottle, then amber and vanilla settle in for the evening.',
    description:
      'Orange blossom and osmanthus lifted by bergamot, warming through musk and amber into vetiver, vanilla and patchouli.',
  },
  iii: {
    moods: ['Playful', 'Romantic'],
    story:
      'The third Wish is the fullest. Orchard fruit and blackcurrant give way to a whole garden of peach, rose and jasmine.',
    description:
      'Apple, blackcurrant and purple perilla over a flowered heart of peach, rose hip, rose and jasmine, resting on benzoin, woods and musk.',
  },
}

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
    // Revision 4: the client corrected this composition.
    description:
      'Lemon and ambrette open clean and green, unfolding into a couture bouquet of orange blossom, violet and ylang ylang over a powdery musk.',
    notes: {
      top: ['Ambrette', 'Leafy', 'Lemon'],
      heart: ['Orange Blossom', 'Violet', 'Ylang Ylang'],
      base: ['Musk', 'Powdery', 'Vetiver'],
    },
  },
  {
    id: 'ondeh-delights',
    name: 'Ondeh Delights',
    subtitle: 'Nyonya Collection',
    collection: 'Nyonya',
    collectionId: 'nyonya',
    // Revision 4 moved the pandan into the base and set orris and rice on top,
    // so the family is no longer a green one.
    family: 'Woody Gourmand',
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
      'The beloved ondeh ondeh, reimagined as fragrance. Steamed rice and orris give way to vanilla, with pandan settling in the base for a nostalgic, edible sweetness.',
    // Revision 4: the client corrected this composition.
    description:
      'A soft gourmand: orris and rice lifted by bergamot, warmed through geranium, vanilla and rose, and closed on pandan, ambergris and sandalwood.',
    notes: {
      top: ['Orris', 'Rice', 'Bergamot'],
      heart: ['Geranium', 'Vanilla', 'Rose'],
      base: ['Ambergris', 'Pandan', 'Sandalwood'],
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
      'The warmth of a Peranakan kitchen, with black pepper and lemongrass folded into osmanthus and rose. Spice as heirloom, worn on the skin.',
    // Revision 4: the client corrected this composition.
    description:
      'An amber spice signature: bright bergamot, black pepper and lemongrass over osmanthus, rose and violet, resting on labdanum and amber.',
    notes: {
      top: ['Bergamot', 'Black Pepper', 'Lemongrass'],
      heart: ['Osmanthus', 'Rose', 'Violet'],
      base: ['Musk', 'Labdanum', 'Amber'],
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
    variants: wishTrio('3-wishes'),
    accent: 'gold',
    badges: ['Alcohol Free', 'Skin Safe'],
    bestseller: true,
    gift: true,
    story:
      'A luxurious, alcohol free collection designed for gentle, everyday indulgence. Safe for all skin types, each of the three Wishes is a soft, silken ritual.',
    description:
      'Three clean, second skin scents that are light, hydrating and endlessly wearable. A bestseller for a reason: comfort as a daily luxury.',
    notes: WISH_SET_NOTES,
  },
  /* ------------------------------------------------------------------
     Revision 4: the client listed seven SKUs missing from the shop. The
     first four are the 3 Wishes 15ml singles and the 3 Wishes travel kit.
     ------------------------------------------------------------------ */
  ...WISH_KEYS.map((n): Product => {
    const id = `wish-${n}`
    const copy = WISH_COPY[n]
    return {
      id,
      name: `Wish ${n.toUpperCase()}`,
      subtitle: 'Alcohol Free Eau de Parfum',
      collection: '3 Wishes',
      collectionId: 'three-wishes',
      family: WISH_FAMILY[n],
      audience: 'Unisex',
      moods: copy.moods,
      price: 79,
      compareAt: 99,
      size: '15ml Eau de Parfum',
      image: img(`p-${id}-life.webp`),
      hoverImage: img(`p-${id}-pack.webp`),
      gallery: [img(`p-${id}-life.webp`), img(`p-${id}-pack.webp`), img(`p-${id}-box.webp`)],
      included: img(`p-${id}-included.webp`),
      includedItems: STANDARD_INCLUDES,
      radar: img(`p-${id}-radar.webp`),
      bloom: img(`p-${id}-bloom.webp`),
      accent: 'gold',
      badges: ['Alcohol Free', 'Skin Safe'],
      story: copy.story,
      description: copy.description,
      notes: WISH_NOTES[n],
    }
  }),
  {
    id: '3-wishes-travel-kit',
    name: '3 Wishes Travel Kit',
    subtitle: 'Wish I · Wish II · Wish III, sized for the bag',
    collection: '3 Wishes',
    collectionId: 'three-wishes',
    family: 'Clean Musk',
    audience: 'Unisex',
    moods: ['Serene', 'Playful'],
    price: 68,
    compareAt: 98,
    size: 'Travel set of three eau de parfum',
    image: img('p-3-wishes-travel-kit-life.webp'),
    hoverImage: img('p-3-wishes-travel-kit-pack.webp'),
    gallery: [
      img('p-3-wishes-travel-kit-life.webp'),
      img('p-3-wishes-travel-kit-pack.webp'),
      img('p-3-wishes-travel-kit-box.webp'),
    ],
    included: img('p-3-wishes-travel-kit-included.webp'),
    includedItems: STANDARD_INCLUDES,
    radar: img('p-3-wishes-travel-kit-wish-i-radar.webp'),
    variants: wishTrio('3-wishes-travel-kit'),
    accent: 'gold',
    badges: ['Alcohol Free', 'Travel Size'],
    gift: true,
    story:
      'All three Wishes, packed for the road. Cabin friendly sprays that slip into a handbag or a carry on, alcohol free and gentle enough for daily wear.',
    description:
      'The 3 Wishes trio in travel sprays: the same three compositions, in a smaller pour, ready for the weekend away or the desk drawer.',
    notes: WISH_SET_NOTES,
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
  /* ------------------------------------------------------------------
     Revision 4: the last three of the seven missing SKUs. Passion, Life
     and Dream are the Spirit II fragrances sold on their own in 50ml.
     Their ids carry no "spirit-ii-" prefix, because the set already
     names its per fragrance artwork that way.
     ------------------------------------------------------------------ */
  ...SPIRIT_TWO_SINGLES,
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
