import { asset } from '../lib/asset'
export interface Store {
  id: string
  name: string
  region: string
  address: string
  phone: string
  hours: string[]
  /** Google Maps place query (no API key required for embed) */
  mapQuery: string
  image?: string
}

export const stores: Store[] = [
  {
    id: 'pavilion-kl-5',
    name: 'Pavilion Kuala Lumpur',
    region: 'Kuala Lumpur',
    address:
      '5th Floor, P5.38, 168 Jln Bukit Bintang, Bukit Bintang, 55100 Kuala Lumpur',
    phone: '+60 11 6767 1888',
    hours: ['Daily · 10:00 to 22:00'],
    mapQuery: 'Pavilion Kuala Lumpur, Jalan Bukit Bintang, Kuala Lumpur',
    image: asset('/assets/store-kiosk.webp'),
  },
  {
    id: 'klcc-isetan',
    name: 'KLCC · Isetan',
    region: 'Kuala Lumpur',
    address:
      'Ground Floor, Jln Ampang, Kuala Lumpur City Centre, 50088 Kuala Lumpur',
    phone: '+60 11 6767 1888',
    hours: ['Daily · 10:00 to 22:00'],
    mapQuery: 'Isetan KLCC, Suria KLCC, Kuala Lumpur City Centre',
    image: asset('/assets/store-klcc.webp'),
  },
  {
    id: 'pavilion-elite',
    name: 'Pavilion KL · Parkson Elite',
    region: 'Kuala Lumpur',
    address:
      'Level 4, 168, Pavilion Kuala Lumpur, Jalan Bukit Bintang, Bukit Bintang, 55100 Kuala Lumpur',
    phone: '+60 11 6767 1888',
    hours: ['Daily · 10:00 to 22:00', 'Now open'],
    mapQuery: 'Parkson Elite Pavilion Kuala Lumpur, Jalan Bukit Bintang',
  },
  {
    id: 'genting',
    name: 'Genting · Sky Avenue',
    region: 'Highlands',
    address:
      'Level 4, Sky Avenue, Resorts World Genting, 69000 Genting Highlands, Pahang',
    phone: '+60 11 6767 1888',
    hours: ['Daily · 10:00 to 22:00'],
    mapQuery: 'SkyAvenue Resorts World Genting, Genting Highlands, Pahang',
    image: asset('/assets/store-genting.webp'),
  },
  {
    id: 'melaka',
    name: 'Melaka Flagship',
    region: 'Melaka',
    address: '3, Jalan Hang Lekir, 75200 Melaka',
    phone: '+60 11 6767 1888',
    hours: ['Mon to Thu · 10:00 to 21:00', 'Fri to Sun · 09:00 to 22:00'],
    mapQuery: 'Jalan Hang Lekir, Melaka',
    image: asset('/assets/store-melaka.webp'),
  },
  {
    id: 'klia-t1',
    name: 'KLIA Terminal 1 · Eraman',
    region: 'Airports',
    address:
      'Eraman Contact Pier (International Level), Kuala Lumpur International Airport, 64000 Sepang, Selangor',
    phone: '+60 19 281 2828',
    hours: ['Daily · 00:00 to 23:59', 'Now open'],
    mapQuery: 'Kuala Lumpur International Airport Terminal 1, Sepang, Selangor',
  },
  {
    id: 'klia-t2',
    name: 'KLIA Terminal 2 · Gate P & Q',
    region: 'Airports',
    address:
      'Gate P & Q, International Departure Hall, Kuala Lumpur International Airport, 64000 Sepang, Selangor',
    phone: '+60 11 2121 4848',
    hours: ['Daily · 07:00 to 23:00'],
    mapQuery: 'KLIA Terminal 2 (klia2), Sepang, Selangor',
    image: asset('/assets/store-klia2.webp'),
  },
  {
    id: 'langkawi',
    name: 'Langkawi Airport',
    region: 'Airports',
    address:
      'Lot PS GL 02, Public Concourse, Ground Level, Langkawi International Airport',
    phone: '+60 19 281 2828',
    hours: ['Daily · 07:00 to 21:30'],
    mapQuery: 'Langkawi International Airport, Kedah',
    image: asset('/assets/store-langkawi.webp'),
  },
  {
    id: 'imago-kk',
    name: 'Parkson · Imago KK',
    region: 'Sabah',
    address:
      'Lot G-01, Imago Shopping Mall, KK Times Square, Phase 2, Off Coastal Highway, 88100 Kota Kinabalu, Sabah',
    phone: '+60 11 5867 7694',
    hours: ['Daily · 10:00 to 22:00', 'Now open'],
    mapQuery: 'Imago Shopping Mall, KK Times Square, Kota Kinabalu, Sabah',
  },
]

export const regions = ['All', 'Kuala Lumpur', 'Highlands', 'Melaka', 'Airports', 'Sabah']

/**
 * Client amendment: the contact page pointed at the Melaka flagship. It now
 * carries the registered office the client supplied in revision 2.
 */
export const HEAD_OFFICE = {
  name: 'Legendary Distribution Sdn Bhd',
  address:
    '12E, Pusat Teknologi Sunsuria, Jalan Teknologi, Taman Sains Selangor, PJU 5, Kota Damansara, 47810 Petaling Jaya, Selangor',
  mapQuery:
    'Pusat Teknologi Sunsuria, Jalan Teknologi, Taman Sains Selangor, Kota Damansara, 47810 Petaling Jaya, Selangor',
}

export function mapEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`
}

export function directionsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
