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
  /**
   * Client copy sheet: the "Good to know" and "Care" notes used to be one
   * pair of lines shared by every product page. The sheet gives several
   * fragrances their own, and the shimmer SKUs in particular have to be
   * stored flat. Anything without its own line falls back to the house
   * default in Product.tsx.
   */
  goodToKnow?: string
  care?: string
  notes: ScentNotes
  /** links a scent to a place on the Scented Memory map */
  place?: string
}

const img = (name: string) => asset(`/assets/client/${name}`)

/**
 * The presentation set every order ships with.
 *
 * Revision 5: the client's copy sheet rewrote this list and, importantly,
 * named the fragrance and its pour on the first line rather than opening with
 * a generic "Eau de Parfum". That line is per product, so it is passed in.
 */
const SHARED_INCLUDES: IncludedItem[] = [
  { label: 'Signature carrier', detail: 'Legendary gold embossed shopping bag, ready for gifting' },
  { label: 'Gift box', detail: 'Hand finished rigid box in house ivory and gold' },
  { label: 'Post card', detail: 'A personalised card to write your own note' },
  { label: 'Discovery samples', detail: 'Complimentary vials to explore other iconic scents from the house' },
]

/**
 * Two entries on the client's sheet word the card line differently.
 *
 * Nyonya Aromatic and Ondeh Delights ask for "Personalised Card, a
 * complimentary handwritten note card for your personal message" where the
 * other sixteen ask for "Post card, a personalised card to write your own
 * note". It is the same card in the same box, so this reads like drafting
 * drift rather than a real distinction, but the sheet is the brief and it is
 * followed as written. Worth confirming with the client.
 */
const PERSONALISED_CARD: IncludedItem = {
  label: 'Personalised card',
  detail: 'A complimentary handwritten note card for your personal message',
}

function includedWith(
  label: string,
  detail: string,
  opts?: { card?: IncludedItem },
): IncludedItem[] {
  const shared = opts?.card
    ? SHARED_INCLUDES.map((item) => (item.label === 'Post card' ? opts.card! : item))
    : SHARED_INCLUDES
  return [{ label, detail }, ...shared]
}

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
      'An empowering celebration of inner drive and vibrant romance, Passion is a radiant signature scent created to ignite your spirit. Opening with a joyful, tangy explosion of red berries and juicy blackcurrant, it unfolds into a luminous floral heart of blooming rose, muguet and exotic ylang ylang. Settling gracefully into a warm, inviting base of creamy vanilla and soft musk, this shimmering eau de parfum leaves a captivating presence wherever you go.',
  },
  life: {
    moods: ['Bold', 'Serene'],
    accent: 'jade',
    story:
      'Life begins. Bergamot and lychee open bright, and incense, cedar and vetiver give the fragrance somewhere to stand.',
    description:
      'A vibrant, uplifting celebration of living life to the fullest, Life is a sophisticated signature scent created to empower your daily journey. Opening with a refreshing splash of zesty bergamot, exotic lychee and warm nutmeg, it unfolds into a romantic heart of velvety rose, soft peony, vanilla and white musk. Settling gracefully into a deep, grounding base of earthy vetiver, rich cedarwood and smoky incense, this shimmering eau de parfum leaves a wise, unforgettable impression.',
  },
  dream: {
    moods: ['Serene', 'Romantic'],
    accent: 'plum',
    story:
      'Dream takes flight. Lotus and freesia float above white lily and peony, and the whole thing settles into a soft white musk.',
    description:
      'An ethereal homage to the beauty of your highest aspirations, Dream is a sophisticated signature scent created to inspire your journey. Opening with a fresh, dreamy breeze of aquatic lotus and delicate freesia, it unfolds into a romantic floral heart of luminous white lily, muguet and soft peony. Settling gracefully into a cosy base of clean white musk, rich cedarwood and warm amber, this shimmering eau de parfum leaves a poetic and unforgettable presence.',
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
    price: 188,
    compareAt: 238,
    size: '50ml Eau de Parfum',
    image: img(`p-${id}-life.webp`),
    hoverImage: img(`p-${id}-pack.webp`),
    gallery: [img(`p-${id}-life.webp`), img(`p-${id}-pack.webp`), img(`p-${id}-box.webp`)],
    included: img(`p-${id}-included.webp`),
    includedItems: includedWith(v.name, '50ml shimmering eau de parfum'),
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
      'An invitation to begin your journey of self love, Wish I is a radiant, alcohol free fragrance crafted to pamper your senses. Powered by microencapsulation, its weightless, hydrating formula glides effortlessly onto skin. Opening with a cheerful burst of vibrant tangerine, it unfolds into a graceful, soothing heart of soft blooming peony. Settling smoothly into a cosy, lingering base of warm musk, it envelops you in an aura of pure comfort and timeless elegance.',
  },
  ii: {
    moods: ['Serene', 'Bold'],
    story:
      'The second Wish turns warmer. Orange blossom and osmanthus open the bottle, then amber and vanilla settle in for the evening.',
    description:
      'A soulful celebration of self awareness and inner connection, Wish II is a romantic, alcohol free fragrance designed for a captivating sensory experience. Powered by microencapsulation, its weightless, hydrating formula glides effortlessly onto skin. Opening with a radiant blend of orange blossom, exotic osmanthus and sparkling bergamot, it unfolds into an alluring heart of warm musk and rich amber. Settling gracefully into a mature base of grounding patchouli, velvety vanilla and earthy vetiver, it leaves a sensual and unforgettable impression.',
  },
  iii: {
    moods: ['Playful', 'Romantic'],
    story:
      'The third Wish is the fullest. Orchard fruit and blackcurrant give way to a whole garden of peach, rose and jasmine.',
    description:
      'Embodying the vibrant fulfilment of your self love journey, Wish III is a luxurious, alcohol free fragrance designed to celebrate inner confidence. Powered by microencapsulation, its weightless, hydrating formula glides effortlessly onto skin. Opening with a lively, orchard fresh breeze of crisp apple, blackcurrant and subtle purple perilla, it unfolds into a romantic heart of juicy peach, blooming rose and delicate jasmine. Settling into a warm, lingering base of rich woods, benzoin and grounding patchouli, it leaves an opulent and enchanting impression.',
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
    price: 188,
    compareAt: 238,
    size: '30ml Eau de Parfum',
    image: img('p-orchid-life.webp'),
    hoverImage: img('p-orchid-pack.webp'),
    gallery: [img('p-orchid-life.webp'), img('p-orchid-pack.webp'), img('p-orchid-box.webp')],
    included: img('p-orchid-included.webp'),
    includedItems: includedWith('Orchid', '30ml eau de parfum'),
    radar: img('p-orchid-radar.webp'),
    bloom: img('p-orchid-bloom.webp'),
    accent: 'gold',
    badges: ['Signature Scent'],
    bestseller: true,
    place: 'Kuala Lumpur',
    story:
      'Orchid is the definitive signature of Legendary, deeply rooted in the tropical rainforests of Malaysia. Embodying our ethos, ‘Exotic Orchid for an Extraordinary Soul’, this fragrance is an exquisite creation crafted for those who possess a truly remarkable spirit.',
    description:
      'Orchid is the definitive signature of Legendary, deeply rooted in the tropical rainforests of Malaysia. Opening with a crisp burst of zesty citrus, aqueous breezes and a hint of warm clove, it unfolds into a serene floral haven of rare orchids, jasmine and tuberose. Settling gently on a luxurious base of ambergris, vetiver and warm cedar, it is a timeless creation crafted for an extraordinary spirit.',
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
    price: 188,
    compareAt: 238,
    size: '30ml Eau de Parfum',
    image: img('p-violet-life.webp'),
    hoverImage: img('p-violet-pack.webp'),
    gallery: [img('p-violet-life.webp'), img('p-violet-pack.webp'), img('p-violet-box.webp')],
    included: img('p-violet-included.webp'),
    includedItems: includedWith('Violet', '30ml eau de parfum'),
    radar: img('p-violet-radar.webp'),
    bloom: img('p-violet-bloom.webp'),
    accent: 'plum',
    badges: ['Signature Scent'],
    place: 'Genting Highlands',
    story:
      'A classic symbol of love and devotion that evokes mystique and timeless elegance. With a touch of sophistication and depth, Violet captures the delicate essence of a blooming violet as it unfolds into its true beauty.',
    description:
      'A timeless symbol of love, devotion and mystery, Violet envelopes you in sheer sophistication. Opening with a captivating blend of sparkling bergamot, juicy lychee, red fruits and a touch of warm nutmeg, it unfolds into a rich heart of velvety rose, peony and smoky incense. Settling elegantly into a cosy base of cashmere, vanilla, musk and vetiver, it is an alluring scent crafted for romantic date nights and unforgettable evenings.',
    goodToKnow:
      'Mysterious, captivating and long lasting, four to seven hours. An elegant eau de parfum crafted for evening wear and romantic occasions.',
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
    price: 188,
    compareAt: 238,
    size: '30ml Eau de Parfum',
    image: img('p-mahsuri-life.webp'),
    hoverImage: img('p-mahsuri-pack.webp'),
    gallery: [img('p-mahsuri-life.webp'), img('p-mahsuri-pack.webp'), img('p-mahsuri-box.webp')],
    included: img('p-mahsuri-included.webp'),
    includedItems: includedWith('Mahsuri', '30ml eau de parfum'),
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
      'Inspired by the enduring legend of Mahsuri, this fragrance embodies grace, purity and unwavering courage. Opening with a crisp, vibrant melody of fresh apple, romantic rose and delicate muguet, it evolves into a noble heart of grounding cedarwood. Settling seamlessly on a rich base of dry amber, ambergris and soft woods, it is an elegant yet powerful scent that leaves a timeless, unforgettable impression.',
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
    price: 188,
    compareAt: 238,
    size: '50ml Eau de Parfum',
    image: img('p-man-life.webp'),
    hoverImage: img('p-man-pack.webp'),
    gallery: [img('p-man-life.webp'), img('p-man-pack.webp'), img('p-man-box.webp')],
    included: img('p-man-included.webp'),
    includedItems: includedWith('Man', '50ml eau de parfum'),
    radar: img('p-man-radar.webp'),
    bloom: img('p-man-bloom.webp'),
    accent: 'graphite',
    badges: ['Signature Scent'],
    bestseller: true,
    place: 'Genting Highlands',
    story:
      'A versatile eau de parfum crafted for the modern man: elegant, charismatic and effortlessly sophisticated. It captures the essence of timeless elegance, making it a signature scent for any occasion.',
    description:
      'Crafted for the modern gentleman, Man is an effortlessly sophisticated fragrance embodying the perfect balance of strength and warmth. Opening with an invigorating burst of sparkling grapefruit and crisp lemon, it transitions into a bold, fruity floral heart of apple, sweet raspberry, orange blossom and jasmine. Grounded gracefully by a rich masculine base of cedarwood, creamy sandalwood, musk and a hint of vanilla, it is an indispensable signature scent for every occasion.',
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
    price: 188,
    compareAt: 238,
    size: '30ml Eau de Parfum',
    image: img('p-kebaya-blooms-life.webp'),
    hoverImage: img('p-kebaya-blooms-pack.webp'),
    gallery: [img('p-kebaya-blooms-life.webp'), img('p-kebaya-blooms-pack.webp'), img('p-kebaya-blooms-box.webp')],
    included: img('p-kebaya-blooms-included.webp'),
    includedItems: includedWith('Kebaya Blooms', '30ml eau de parfum'),
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
      'Inspired by the intricate botanical motifs of the traditional Baju Kebaya, Kebaya Blooms is a poetic homage to Peranakan elegance. Opening with a fresh, dew kissed breeze of green leaves, zesty lemon and subtle ambrette, it unfolds into a captivating floral heart of luminous orange blossom, romantic violet and exotic ylang ylang. Settling into a velvety, soothing base of soft musk, powdery accords and earthy vetiver, it translates timeless cultural artistry into an unforgettable fine fragrance.',
    goodToKnow:
      'Graceful, romantic and long lasting, four to seven hours. A delicate, powdery floral eau de parfum crafted for elegant daily wear and cultural celebrations.',
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
    price: 188,
    compareAt: 238,
    size: '30ml Eau de Parfum',
    image: img('p-ondeh-delights-life.webp'),
    hoverImage: img('p-ondeh-delights-pack.webp'),
    gallery: [img('p-ondeh-delights-life.webp'), img('p-ondeh-delights-pack.webp'), img('p-ondeh-delights-box.webp')],
    included: img('p-ondeh-delights-included.webp'),
    includedItems: includedWith('Ondeh Delights', '30ml eau de parfum', { card: PERSONALISED_CARD }),
    radar: img('p-ondeh-delights-radar.webp'),
    bloom: img('p-ondeh-delights-bloom.webp'),
    accent: 'jade',
    badges: ['Nyonya Heritage'],
    place: 'Melaka',
    story:
      'The beloved ondeh ondeh, reimagined as fragrance. Steamed rice and orris give way to vanilla, with pandan settling in the base for a nostalgic, edible sweetness.',
    // Revision 4: the client corrected this composition.
    description:
      'Inspired by the nostalgic sweetness of traditional Peranakan kuih, Ondeh Delights is an irresistible green gourmand fragrance. Opening with a comforting blend of velvety rice accords, powdery orris and a touch of sparkling bergamot, it reveals a rich, inviting heart of warm vanilla, romantic rose and geranium. Settling smoothly into a soothing base of aromatic pandan, creamy sandalwood and ambergris, it translates joyous culinary celebration into a delightfully nostalgic scent.',
    goodToKnow:
      'Playful, comforting and long lasting, four to seven hours. A rice and pandan gourmand eau de parfum crafted for sweet daily indulgence and nostalgic moments.',
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
    price: 188,
    compareAt: 238,
    size: '30ml Eau de Parfum',
    image: img('p-nyonya-aromatic-life.webp'),
    hoverImage: img('p-nyonya-aromatic-pack.webp'),
    gallery: [img('p-nyonya-aromatic-life.webp'), img('p-nyonya-aromatic-pack.webp'), img('p-nyonya-aromatic-box.webp')],
    included: img('p-nyonya-aromatic-included.webp'),
    includedItems: includedWith('Nyonya Aromatic', '30ml eau de parfum', { card: PERSONALISED_CARD }),
    radar: img('p-nyonya-aromatic-radar.webp'),
    bloom: img('p-nyonya-aromatic-bloom.webp'),
    accent: 'amber',
    badges: ['Nyonya Heritage'],
    place: 'Melaka',
    story:
      'The warmth of a Peranakan kitchen, with black pepper and lemongrass folded into osmanthus and rose. Spice as heirloom, worn on the skin.',
    // Revision 4: the client corrected this composition.
    description:
      'Inspired by the vibrant herbs and spices central to traditional Peranakan culinary heritage, Nyonya Aromatic is a captivating fusion of culture and fragrance. Opening with an invigorating spark of fresh lemongrass, zesty bergamot and warm black pepper, it reveals a refined heart of sweet osmanthus, romantic rose and delicate violet. Settling into a rich, resonant base of amber, labdanum and soft musk, it translates generations of cultural legacy into a sophisticated signature scent.',
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
    price: 188,
    compareAt: 278,
    size: '3 × 15ml Eau de Parfum',
    image: img('p-3-wishes-life.webp'),
    hoverImage: img('p-3-wishes-pack.webp'),
    gallery: [img('p-3-wishes-life.webp'), img('p-3-wishes-pack.webp'), img('p-3-wishes-box.webp')],
    included: img('p-3-wishes-included.webp'),
    includedItems: includedWith('3 Wishes', 'Three 15ml eau de parfums, Wish I, Wish II and Wish III'),
    radar: img('p-3-wishes-radar.webp'),
    variants: wishTrio('3-wishes'),
    accent: 'gold',
    badges: ['Alcohol Free', 'Skin Safe'],
    bestseller: true,
    gift: true,
    story:
      'A luxurious, alcohol free collection designed for gentle, everyday indulgence. Safe for all skin types, each of the three Wishes is a soft, silken ritual.',
    description:
      'Crafted as an intimate ritual of self love, 3 Wishes is an alcohol free fragrance trio designed for a nourishing sensory experience. Powered by microencapsulation, its milky, weightless formula glides seamlessly onto skin and unfolds in three chapters. Wish I, self love: a cheerful, graceful blend of radiant tangerine and soft peony, anchored by a lingering musk. Wish II, self awareness: a romantic fusion of orange blossom, osmanthus and rich amber, grounded in warm patchouli. Wish III, fulfilment: a lively, luxurious bouquet of crisp apple, blackcurrant and blooming rose, settling into warm woods. An indulgent, skin safe collection made to pamper and cherish every moment.',
    goodToKnow:
      'Zero alcohol, skin safe and long lasting, four to seven hours. A weightless, alcohol free fragrance crafted for sensitive skin and daily self love rituals.',
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
      price: 88,
      compareAt: 128,
      size: '15ml Eau de Parfum',
      image: img(`p-${id}-life.webp`),
      hoverImage: img(`p-${id}-pack.webp`),
      gallery: [img(`p-${id}-life.webp`), img(`p-${id}-pack.webp`), img(`p-${id}-box.webp`)],
      included: img(`p-${id}-included.webp`),
      includedItems: includedWith(`Wish ${n.toUpperCase()}`, '15ml alcohol free eau de parfum'),
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
    includedItems: includedWith('3 Wishes Travel Kit', 'Three 3ml eau de parfums, Wish I, Wish II and Wish III'),
    radar: img('p-3-wishes-travel-kit-wish-i-radar.webp'),
    variants: wishTrio('3-wishes-travel-kit'),
    accent: 'gold',
    badges: ['Alcohol Free', 'Travel Size'],
    gift: true,
    story:
      'All three Wishes, packed for the road. Cabin friendly sprays that slip into a handbag or a carry on, alcohol free and gentle enough for daily wear.',
    description:
      'The whole self love ritual, packed for the road. Three alcohol free travel sprays, their milky, weightless formula powered by microencapsulation, unfolding in three chapters. Wish I, self love: a cheerful, graceful blend of radiant tangerine and soft peony, anchored by a lingering musk. Wish II, self awareness: a romantic fusion of orange blossom, osmanthus and rich amber, grounded in warm patchouli. Wish III, fulfilment: a lively, luxurious bouquet of crisp apple, blackcurrant and blooming rose, settling into warm woods. An indulgent, skin safe collection made to pamper and cherish every moment.',
    goodToKnow:
      'Zero alcohol, skin safe and long lasting, four to seven hours. A weightless, alcohol free fragrance crafted for sensitive skin and daily self love rituals.',
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
    price: 188,
    compareAt: 238,
    size: '3 × 15ml Eau de Parfum',
    image: img('p-spirit-life.webp'),
    hoverImage: img('p-spirit-pack.webp'),
    gallery: [img('p-spirit-life.webp'), img('p-spirit-pack.webp'), img('p-spirit-box.webp')],
    included: img('p-spirit-included.webp'),
    includedItems: includedWith('Spirit I Eau de Parfum Trio', 'Three 15ml eau de parfums, Hope, Love and Confidence'),
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
      'Embodying the core spirit of a vibrant life, Spirit I is a curated set of three fragrances designed to inspire and empower. Hope: a luminous, airy harmony of crisp aqueous pear, blooming jasmine and magnolia, grounded in warm woods. Love: a soft, romantic embrace of fresh rose and lemon, turning into cosy linen, powdery ambrette and cedarwood. Confidence: an empowering burst of sparkling bergamot, juicy pear and vibrant leafy florals, anchored by rich sandalwood.',
    goodToKnow:
      'Shimmering, radiant and long lasting, four to seven hours. A glowing eau de parfum crafted for an effortless, lingering shine.',
    care:
      'Store flat so the delicate shimmer particles do not settle at the spray tube, and away from direct sunlight and heat. Shake well before use. Spray onto pulse points at the wrists, neck and behind the ears, then let it settle without rubbing.',
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
    includedItems: includedWith('Spirit II', 'Three 15ml eau de parfums, Passion, Dream and Life'),
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
      'An empowering extension of the Spirit collection, Spirit II celebrates the vibrant rhythm and attitude of life. Guided by three chapters, Passion Ignites, Dreams Take Flight and Life Begins, each scent unfolds its own experience. Passion: a joyful explosion of tangy red berries and juicy blackcurrant, blooming into a luminous floral heart of rose, muguet and ylang ylang, wrapped in warm vanilla and musk. Dream: an ethereal composition of aquatic lotus and delicate freesia, leading to a romantic heart of white lily and peony, grounded by cedarwood and amber. Life: a lively, sophisticated blend of zesty bergamot, exotic lychee and warm nutmeg, turning into velvety rose and peony over a deep base of incense and vetiver.',
    goodToKnow:
      'Shimmering, radiant and long lasting, four to seven hours. A glowing eau de parfum crafted for an effortless, lingering shine.',
    care:
      'Store flat so the delicate shimmer particles do not settle at the spray tube, and away from direct sunlight and heat. Shake well before use. Spray onto pulse points at the wrists, neck and behind the ears, then let it settle without rubbing.',
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
    includedItems: includedWith('Spirit I Travel Kit', 'Three 3ml eau de parfums, Love, Confidence and Hope'),
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
      'The whole of Spirit I, sized for the bag. Love: a soft, romantic embrace of fresh rose and lemon, turning into cosy linen, powdery ambrette and cedarwood. Confidence: an empowering burst of sparkling bergamot, juicy pear and vibrant leafy florals, anchored by rich sandalwood. Hope: a luminous, airy harmony of crisp aqueous pear, blooming jasmine and magnolia, grounded in warm woods.',
    goodToKnow:
      'Shimmering, radiant and long lasting, four to seven hours. A glowing eau de parfum crafted for an effortless, lingering shine.',
    care:
      'Store flat so the delicate shimmer particles do not settle at the spray tube, and away from direct sunlight and heat. Shake well before use. Spray onto pulse points at the wrists, neck and behind the ears, then let it settle without rubbing.',
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
