// Places on the "A Scented Memory of Malaysia" interactive map.
// x / y are percentage positions over the stylised map artwork.
export interface ScentPlace {
  id: string
  place: string
  region: string
  productId: string
  scent: string
  note: string
  x: number
  y: number
}

export const scentPlaces: ScentPlace[] = [
  {
    id: 'langkawi',
    place: 'Langkawi',
    region: 'Kedah · The Isles',
    productId: 'mahsuri',
    scent: 'Mahsuri',
    note: 'Sun-warmed peach and island petals, after the legend of the maiden Mahsuri.',
    x: 15.5,
    y: 26,
  },
  {
    id: 'genting',
    place: 'Genting Highlands',
    region: 'Pahang · The Peaks',
    productId: 'violet',
    scent: 'Violet',
    note: 'Cool mountain air and powdery blooms from the cloud-wrapped highlands.',
    x: 41,
    y: 55,
  },
  {
    id: 'kuala-lumpur',
    place: 'Kuala Lumpur',
    region: 'The Capital',
    productId: 'orchid',
    scent: 'Orchid',
    note: 'The wild orchid of the city’s rainforest heart — the scent that began it all.',
    x: 39,
    y: 62,
  },
  {
    id: 'melaka',
    place: 'Melaka',
    region: 'The Straits',
    productId: 'kebaya-blooms',
    scent: 'Kebaya Blooms',
    note: 'Peranakan romance — embroidered flowers and gula melaka from the old port.',
    x: 34,
    y: 73,
  },
  {
    id: 'sabah',
    place: 'Kota Kinabalu',
    region: 'Sabah · Borneo',
    productId: 'spirit',
    scent: 'Spirit',
    note: 'Sea salt, citrus and open sky along the South China Sea coast.',
    x: 82,
    y: 50,
  },
]
