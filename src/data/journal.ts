import { asset } from '../lib/asset'
export interface JournalPost {
  id: string
  title: string
  category: string
  excerpt: string
  date: string
  readTime: string
  image: string
}

export const journalPosts: JournalPost[] = [
  {
    id: 'art-of-layering',
    title: 'The Art of Layering Scent',
    category: 'Rituals',
    excerpt:
      'How to build a fragrance wardrobe that shifts with your mood — from a clean morning musk to an evening of amber and spice.',
    date: 'June 2026',
    readTime: '4 min',
    image: asset('/assets/lifestyle-orchid-hand.webp'),
  },
  {
    id: 'nyonya-story',
    title: 'A Peranakan Inheritance',
    category: 'Heritage',
    excerpt:
      'Inside the tiles, textiles and kitchens that inspired the Nyonya Collection — and why heritage belongs on the skin.',
    date: 'May 2026',
    readTime: '6 min',
    image: asset('/assets/nyonya-heritage-house.webp'),
  },
  {
    id: 'orchid-origins',
    title: 'Chasing the Wild Orchid',
    category: 'The House',
    excerpt:
      'The story of Orchid — the scent that started Legendary — and the rainforest bloom that gave it a soul.',
    date: 'April 2026',
    readTime: '5 min',
    image: asset('/assets/orchid-mirror.webp'),
  },
  {
    id: 'gifting-guide',
    title: 'A Guide to Gifting Fragrance',
    category: 'Gifting',
    excerpt:
      'Choosing scent for someone you love is an art. A short guide to reading personality — and never getting it wrong.',
    date: 'March 2026',
    readTime: '3 min',
    image: asset('/assets/three-wishes-ribbon.webp'),
  },
]
