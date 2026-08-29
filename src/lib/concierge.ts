import { products, moodList, moodCopy, type Mood } from '../data/products'
import { formatRM } from './format'

export const WHATSAPP_NUMBER = '60193836633'
/** Client house style: numbers are spaced, never hyphenated. */
export const WHATSAPP_DISPLAY = '+60 19 383 6633'
/**
 * The house's primary address. Everything the site sends is sent from here,
 * and contact form messages and order notifications both arrive here.
 */
export const SUPPORT_EMAIL = 'noreply@legendary.com.my'

export function waLink(text: string): string {
  return `https://api.whatsapp.com/send/?phone=%2B${WHATSAPP_NUMBER}&text=${encodeURIComponent(
    text,
  )}&type=phone_number&app_absent=0`
}

export interface ProductRef {
  id: string
  name: string
  price: string
  family: string
}

export interface BotReply {
  text: string
  chips?: string[]
  products?: ProductRef[]
  wa?: { label: string; text: string }
  link?: { label: string; to: string }
}

function ref(id: string): ProductRef | null {
  const p = products.find((x) => x.id === id)
  if (!p) return null
  return { id: p.id, name: p.name, price: formatRM(p.price), family: p.family }
}

export const GREETING: BotReply = {
  text:
    'Welcome to Legendary. I am your fragrance concierge, here to help you find the perfect scent, a gift, or a boutique near you.',
  chips: ['Find my scent', 'Gift ideas', 'Store near me', 'Track my order', 'Talk to a human'],
}

const moodChips = moodList.map((m) => `Mood: ${m}`)

export function handle(input: string): BotReply {
  const raw = input.trim()
  const t = raw.toLowerCase()

  // --- mood selection from the scent finder ---
  const moodMatch = moodList.find((m) => t === `mood: ${m.toLowerCase()}`)
  if (moodMatch) return recommendByMood(moodMatch)

  if (/find|scent|recommend|which perfume|help me choose|discover/.test(t)) {
    return {
      text: 'Lovely. Tell me the mood you’re after and I’ll match you to a scent from the house.',
      chips: moodChips,
    }
  }

  if (/gift|present|for my|anniversary|birthday|wrap/.test(t)) {
    return {
      text:
        'A beautiful choice. Our sets arrive with complimentary gift wrapping. The 3 Wishes trio is our most loved gift, alcohol free and safe for every skin. Spirit is a fresh discovery trio for those who love to explore.',
      products: ['3-wishes', 'spirit', 'kebaya-blooms'].map(ref).filter(Boolean) as ProductRef[],
      link: { label: 'See the gifting edit', to: '/shop?filter=gifts' },
    }
  }

  if (/store|boutique|shop near|location|where|visit|counter|map|direction/.test(t)) {
    return {
      text:
        'You will find Legendary counters across Malaysia at Pavilion KL, KLCC Isetan, Genting Sky Avenue, our Melaka flagship, and the KLIA and Langkawi airports. Each with live maps and directions.',
      link: { label: 'Open store locator', to: '/stores' },
      chips: ['Talk to a human'],
    }
  }

  if (/track|order|delivery|shipping|where is my|parcel|refund|return/.test(t)) {
    return {
      text:
        'I can help with that. For live order tracking, returns or exchanges, our team will assist you personally on WhatsApp. Tap below and share your order number.',
      wa: {
        label: 'Track on WhatsApp',
        text: 'Hi Legendary! I’d like to track my order. My order number is: ',
      },
    }
  }

  if (/alcohol|ingredient|skin|safe|sensitive/.test(t)) {
    return {
      text:
        'The 3 Wishes trio is fully alcohol free and gentle enough for sensitive skin, so it works as a soft everyday indulgence.',
      products: ['3-wishes'].map(ref).filter(Boolean) as ProductRef[],
    }
  }

  if (/orchid/.test(t))
    return single('orchid', 'Orchid is our signature, the scent that began the house.')
  if (/man|him|masculine|husband|boyfriend/.test(t))
    return single('man', 'For him, Man is citrus and spice grounded in dark woods: assured and magnetic.')
  if (/nyonya|peranakan|heritage|kebaya|ondeh/.test(t))
    return {
      text:
        'The Nyonya Collection reimagines Peranakan heritage as scent, from embroidered kebaya florals to the gula melaka sweetness of ondeh ondeh.',
      products: ['kebaya-blooms', 'ondeh-delights', 'nyonya-aromatic'].map(ref).filter(Boolean) as ProductRef[],
    }

  if (/price|cost|how much|rm|cheap|expensive/.test(t)) {
    return {
      text:
        'Our eaux de parfum begin at RM 149, with sets from RM 179. Many pieces are on offer right now. Shall I show you the collection?',
      link: { label: 'Browse all fragrances', to: '/shop' },
    }
  }

  if (/human|agent|person|talk|whatsapp|call|contact|speak/.test(t)) {
    return {
      text: 'Of course. Our team is a tap away on WhatsApp and would love to help you personally.',
      wa: { label: 'Chat on WhatsApp', text: 'Hi Legendary! I’d love some help choosing a fragrance.' },
    }
  }

  if (/hi|hello|hey|salam|good (morning|afternoon|evening)/.test(t)) {
    return GREETING
  }

  // fallback
  return {
    text:
      'I can help you find a scent, choose a gift, locate a boutique, or track an order. Which shall it be? For anything else, our team is on WhatsApp.',
    chips: ['Find my scent', 'Gift ideas', 'Store near me'],
    wa: { label: 'Talk to a human', text: 'Hi Legendary! I have a question.' },
  }
}

function recommendByMood(mood: Mood): BotReply {
  const matches = products.filter((p) => p.moods.includes(mood)).slice(0, 3)
  return {
    text: `${moodCopy[mood].line}. Here’s what I’d wear:`,
    products: matches.map((p) => ref(p.id)).filter(Boolean) as ProductRef[],
    chips: ['Find my scent', 'Gift ideas', 'Talk to a human'],
  }
}

function single(id: string, lead: string): BotReply {
  return {
    text: lead,
    products: [ref(id)].filter(Boolean) as ProductRef[],
    chips: ['Find my scent', 'Store near me'],
  }
}
