// Places on the "A Scented Memory of Malaysia" interactive map.
//
// x / y are percentage positions over the supplied map artwork
// (public/map.webp). That artwork is stylised — Borneo is drawn much closer to
// the peninsula than it really is — so pins are calibrated against the drawing
// rather than projected from raw coordinates.
import { asset } from '../lib/asset'
import { getProduct, productsByCollection } from './products'
import { stores } from './stores'

export interface ScentPlace {
  id: string
  place: string
  region: string
  note: string
  /** Product this pin opens, or the collection it represents. */
  productId: string
  /** Set when the pin stands for a whole collection rather than one scent. */
  collectionId?: string
  /** Overrides the card headline (e.g. "Nyonya Collection"). */
  scentLabel?: string
  /** Overrides the family line under the headline. */
  familyLabel?: string
  /**
   * Overrides the thumbnail on the pin card. The client re-shot Melaka and
   * Kota Kinabalu for this section, so those pins carry their own photograph
   * rather than the linked product's lifestyle shot.
   */
  cardImage?: string
  /** Boutiques you can visit at this place, by store id. */
  storeIds: string[]
  x: number
  y: number
}

export const scentPlaces: ScentPlace[] = [
  {
    id: 'langkawi',
    place: 'Langkawi',
    region: 'Kedah · The Isles',
    productId: 'mahsuri',
    note: 'Sun warmed apple and island petals, after the legend of the maiden Mahsuri.',
    storeIds: ['langkawi'],
    x: 7.1,
    y: 15.9,
  },
  {
    id: 'genting',
    place: 'Genting Highlands',
    region: 'Pahang · The Peaks',
    productId: 'man',
    note: 'Cool mountain air and crisp green citrus from the cloud wrapped highlands.',
    storeIds: ['genting'],
    // Genting sits only ~35km from KL; nudged north-east of its true spot so
    // the two hit areas clear each other.
    x: 25.0,
    y: 51.5,
  },
  {
    id: 'kuala-lumpur',
    place: 'Kuala Lumpur',
    region: 'The Capital',
    productId: 'orchid',
    note: 'The wild orchid of the city’s rainforest heart, the scent that began it all.',
    storeIds: ['pavilion-kl-5', 'klcc-isetan', 'pavilion-elite', 'klia-t1', 'klia-t2'],
    x: 21.7,
    y: 61.1,
  },
  {
    id: 'melaka',
    place: 'Melaka',
    region: 'The Straits',
    productId: 'kebaya-blooms',
    collectionId: 'nyonya',
    scentLabel: 'Nyonya Collection',
    familyLabel: 'Floral | Aromatic | Gourmand',
    cardImage: asset('/assets/client/place-melaka.webp'),
    note: 'Peranakan romance built from embroidered flowers and gula melaka, drawn from the old port of Melaka.',
    storeIds: ['melaka'],
    x: 25.3,
    y: 74.4,
  },
  {
    id: 'sabah',
    place: 'Kota Kinabalu',
    region: 'Sabah · Borneo',
    productId: 'spirit',
    collectionId: 'spirit',
    // Client amendment: this card reads simply "Spirit".
    scentLabel: 'Spirit',
    familyLabel: 'Hope · Love · Confidence · Passion · Life · Dream',
    cardImage: asset('/assets/client/place-kota-kinabalu.webp'),
    note: 'Sea salt, citrus and open sky along the South China Sea coast.',
    storeIds: ['imago-kk'],
    // Pulled inland onto Sabah. The previous spot straddled the coastline and
    // read as sitting in the sea.
    x: 79.8,
    y: 27.2,
  },
]

/** Resolves what a pin should show: a single scent, or a whole collection. */
export function placeTarget(place: ScentPlace) {
  const product = getProduct(place.productId)!
  const inCollection = place.collectionId ? productsByCollection(place.collectionId) : []
  const boutiques = place.storeIds
    .map((id) => stores.find((s) => s.id === id))
    .filter((s): s is (typeof stores)[number] => !!s)

  return {
    product,
    image: place.cardImage ?? product.image,
    href: place.collectionId ? `/shop?collection=${place.collectionId}` : `/product/${product.id}`,
    title: place.scentLabel ?? product.name,
    meta: place.familyLabel ?? `${product.family} · RM ${product.price}`,
    count: inCollection.length,
    boutiques,
  }
}
