import { SUPPORT_EMAIL, WHATSAPP_DISPLAY } from '../lib/concierge'

export interface FaqItem {
  q: string
  a: string
  /** Extra lines rendered as a bulleted list under the answer. */
  list?: string[]
}

export interface FaqSection {
  title: string
  items: FaqItem[]
}

/** Answers drawn from the care / returns copy in the client's product sheets. */
export const productFaq: FaqItem[] = [
  {
    q: 'How long does the fragrance last?',
    a: 'Between four and seven hours on most skin. Spray onto pulse points at the wrists, neck and behind the ears, then let it settle without rubbing, which shortens the wear.',
  },
  {
    q: 'How strong is the scent?',
    a: 'Eau de parfum strength. One or two sprays carry through a full day in a tropical climate without ever feeling heavy.',
  },
  {
    q: 'How should I store my perfume?',
    a: 'Keep the bottle upright in a cool, dry place away from direct sunlight. Heat and light break down the delicate compounds and alter the scent. Secure the cap firmly after each use to limit exposure to air.',
  },
  {
    q: 'Can I travel with it?',
    a: 'Yes. Use a travel case or wrap the bottle in soft material to protect it in your bag or luggage. Our 15ml sets are sized for carry on.',
  },
  {
    q: 'What is your returns policy?',
    a: `We accept returns for faulty, damaged or incorrect items. Contact us on WhatsApp at ${WHATSAPP_DISPLAY} within 48 hours of arrival with your platform of purchase, item name, reason and a photo. Items must be unused, with tags and in original packaging. Approved refunds are issued to the original payment method within 14 working days. Sale items cannot be returned.`,
  },
  {
    q: 'Do you exchange items?',
    a: 'For the quickest resolution, return the original item for a refund and place a separate order for the piece you would prefer. Exchanges are also complimentary at any Legendary boutique across Malaysia.',
  },
]

/**
 * The full FAQ page.
 *
 * Revision 5: the client's copy sheet supplies roughly fifty questions their
 * counter staff are actually asked, already sorted into groups. A flat
 * accordion of fifty rows is unusable, so the page is set out by section and
 * the sheet's own grouping is kept. Their answers are often a single word at
 * the counter ("Cannot", "Wish 2"), so each is set as a full sentence without
 * changing what it says.
 *
 * House style throughout: no hyphens or dashes in the wording.
 */
export const faqIntro =
  'We have gathered the questions our customers ask most often and answered each one properly. Browse below for an instant answer, or reach out if you would rather speak to someone. Your fragrance journey matters to us.'

export const faqSections: FaqSection[] = [
  {
    title: 'About Orchid',
    items: [
      {
        q: 'Are all the perfumes orchid based?',
        a: 'No. Orchid is the scent the house began with, but the collections run far wider than one flower. You will find citrus, woods, gourmand and musk built around plenty of other notes.',
      },
      {
        q: 'What flower is orchid, and is it from Malaysia?',
        a: 'The orchid grows beautifully in Malaysia. Our tropical rainforest climate supports a great many species, which makes the flower both special here and closely tied to local nature and culture.',
      },
      {
        q: 'Is Orchid Perfume a brand?',
        a: 'No. The brand is Legendary. Orchid is the name of our signature fragrance.',
      },
      {
        q: 'What is the difference between Orchid and Violet?',
        a: 'Orchid feels elegant and classic. Violet is the more mysterious and dreamy of the two.',
      },
      {
        q: 'Is there only one store selling Orchid?',
        a: 'No. Beyond our counters in malls across the country, we have a standalone boutique in Melaka. The Store Locator lists every one of them.',
      },
      {
        q: 'Which is your best selling fragrance?',
        a: 'Orchid, comfortably. It is the scent the house was built on and it still leads the collections.',
      },
    ],
  },
  {
    title: 'The range',
    items: [
      {
        q: 'Apart from perfumes, do you make anything else?',
        a: 'Not at the moment. The house specialises in fragrance, and that is where all of our attention goes.',
      },
      {
        q: 'Do you sell hand cream?',
        a: 'Not yet, but it is something to look forward to.',
      },
      {
        q: 'Do you have a lavender fragrance?',
        a: 'Not yet, but it is something to look forward to.',
      },
      {
        q: 'Are there other woody fragrances?',
        a: 'Yes. Wish II is the woody one to try.',
      },
      {
        q: 'Can you recommend more fragrances for men?',
        a: 'Man is the obvious place to start, and both 3 Wishes and Nyonya Aromatic wear beautifully on men too.',
      },
      {
        q: 'What does Ondeh smell like?',
        a: 'Pandan and rice, the way the kuih it is named after does. A green gourmand, sweet without being sugary.',
      },
      {
        q: 'Could the Spirit collection come without glitter? The shimmer clogs the nozzle.',
        a: 'Not yet, but it is something to look forward to. In the meantime, store the bottle flat and shake it well before use, which keeps the shimmer moving.',
      },
    ],
  },
  {
    title: 'Sizes and sets',
    items: [
      {
        q: 'Does Orchid come in a gift box or more exquisite packaging?',
        a: 'Every order already arrives hand finished in the house gift box with a signature carrier, a card and discovery samples. A dedicated gift edition is not available yet, but it is something to look forward to.',
      },
      {
        q: 'Does Orchid come in 50ml, 15ml or 10ml?',
        a: 'Not yet, but it is something to look forward to. Orchid is poured at 30ml today.',
      },
      {
        q: 'Is there an Orchid travel set?',
        a: 'Not yet, but it is something to look forward to.',
      },
      {
        q: 'Will Orchid be part of a gift set or box set?',
        a: 'Not yet, but it is something to look forward to.',
      },
      {
        q: 'Does Man come in 100ml?',
        a: 'Not yet, but it is something to look forward to. Man is poured at 50ml.',
      },
      {
        q: 'Does the Wishes collection come in one large bottle?',
        a: 'Not yet, but it is something to look forward to. Each Wish is available on its own at 15ml, or all three together as a set or a travel kit.',
      },
      {
        q: 'Why is there no single large bottle of Spirit I?',
        a: 'Not yet, but it is something to look forward to. Spirit I ships as a trio and as a travel kit.',
      },
      {
        q: 'Do Spirit I and Spirit II come in small single bottles?',
        a: 'The three Spirit II fragrances, Passion, Life and Dream, are each available on their own at 50ml. Single bottles of Spirit I are not available yet, but it is something to look forward to.',
      },
      {
        q: 'Can I choose any three scents myself as a set?',
        a: 'Not at the moment. Our sets are composed as a trio and ship in the order they were designed to be worn.',
      },
    ],
  },
  {
    title: 'Price and samples',
    items: [
      {
        q: 'Are prices the same at every outlet?',
        a: 'Yes. Our prices are consistent at every outlet.',
      },
      {
        q: 'Is a tax refund available?',
        a: 'No, we are not able to offer a tax refund.',
      },
      {
        q: 'Can I get samples to try before buying?',
        a: 'We do not send samples ahead of a purchase. Every order does arrive with complimentary discovery vials, so you always have something new to try alongside the fragrance you chose.',
      },
    ],
  },
  {
    title: 'Wear and performance',
    items: [
      {
        q: 'How long does the perfume last?',
        a: 'About five to seven hours on most skin.',
      },
      {
        q: 'How can I make it last longer?',
        a: 'Apply an unscented lotion to the skin first, then spray the fragrance over it. Hydrated skin holds a scent far longer than dry skin.',
      },
      {
        q: 'Does the 3 Wishes collection fade faster because it is alcohol free?',
        a: 'No. Alcohol free perfumes tend to last even longer, because the composition is not carried off with the alcohol as it evaporates.',
      },
      {
        q: 'What is the difference between alcohol based and alcohol free?',
        a: 'Alcohol free is gentler and more skin friendly. Alcohol based projects more strongly and carries further in a room.',
      },
      {
        q: 'Will an alcohol free perfume leave white marks on black clothes?',
        a: 'No. It will not mark your clothes.',
      },
      {
        q: 'Can it be worn during pregnancy or on sensitive skin?',
        a: 'We recommend 3 Wishes. It is alcohol free and formulated to be gentle, which makes it the kindest of our collections on sensitive skin. If you have any medical concerns, please check with your own doctor first.',
      },
      {
        q: 'How strong is the scent?',
        a: 'Eau de parfum strength. One or two sprays carry through a full day in a tropical climate without ever feeling heavy.',
      },
      {
        q: 'How should I store my perfume?',
        a: 'Keep your perfume somewhere cool and dry, away from direct sunlight and any source of heat. Seal the bottle when it is not in use, and the fragrance will stay exactly as it should. The Spirit collection is best stored flat, so the shimmer does not settle in the spray tube.',
      },
    ],
  },
  {
    title: 'The house and where to buy',
    items: [
      {
        q: 'Is Legendary a local brand?',
        a: 'Yes. We are a Malaysian perfume house, founded in 2015.',
      },
      {
        q: 'Where can I buy Legendary?',
        a: 'Our complete range is right here on the website. You will also find us at selected boutiques and department stores across Malaysia. Our Store Locator will point you to the counter nearest you.',
      },
      {
        q: 'Why do you not have a standalone store?',
        a: 'We do. Our flagship boutique is in Melaka, on Jalan Hang Lekir.',
      },
      {
        q: 'Can I buy Legendary outside Malaysia?',
        a: 'Not at present. We are available in Malaysia only for now.',
      },
      {
        q: 'Are the listings on Taobao yours?',
        a: 'No. We have no official store on Taobao.',
      },
      {
        q: 'Can you ship to China by sea freight?',
        a: 'No, we are not able to arrange sea freight.',
      },
      {
        q: 'Can I bring it on a flight?',
        a: 'Yes. Our 15ml and 3ml sets in particular are sized for carry on.',
      },
      {
        q: 'What should I do if I have a complaint?',
        a: `If you have a concern, or you simply want to share some feedback, head over to our Contact page. You can also write to our team at ${SUPPORT_EMAIL}, or message us on WhatsApp at ${WHATSAPP_DISPLAY}. We are here to help.`,
      },
    ],
  },
  {
    title: 'Orders, delivery and returns',
    items: [
      {
        q: 'How long does it take to process my order?',
        a: 'Orders are processed on business days, Monday to Friday. Orders placed at the weekend or on a public holiday are processed and shipped on the next business day. Processing usually takes one to two business days.',
      },
      {
        q: 'How much is shipping?',
        a: 'Shipping is free on all orders within Malaysia, with no minimum purchase.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Delivery times vary with your location, but most orders arrive within one to five business days after dispatch.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes. Once your order has shipped you will receive a confirmation email or message with a tracking number, so you can follow your delivery. Your order reference also lets you check the order at any time on our Track Order page.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'We love our international friends, but for now we deliver within Malaysia only. We are not able to process orders for overseas addresses at the moment.',
      },
      {
        q: 'What if my order arrives damaged, or the item is wrong?',
        a: 'Please inspect your order on arrival. If anything is damaged, defective or incorrect, contact us as soon as you can with your order reference and photographs of the item, and we will put it right.',
      },
      {
        q: 'How are the perfumes packaged?',
        a: 'Every order is packed carefully so your perfume arrives safely and in excellent condition, hand finished in the house box with a signature carrier.',
      },
      {
        q: 'Is it safe to use my card?',
        a: 'Yes. Payments are handled by Stripe over an encrypted connection, and your card details are entered directly with them. They never pass through, and are never stored on, our own servers.',
      },
      {
        q: 'What is your returns policy?',
        a: `We accept returns for faulty, damaged or incorrect items. Contact us on WhatsApp at ${WHATSAPP_DISPLAY} within 48 hours of arrival with your order reference, item name, reason and a photo. Items must be unused, with tags and in original packaging. Approved refunds are issued to the original payment method within 14 working days. Sale items cannot be returned.`,
      },
      {
        q: 'Do you exchange items?',
        a: 'For the quickest resolution, return the original item for a refund and place a separate order for the piece you would prefer. Exchanges are also complimentary at any Legendary boutique across Malaysia.',
      },
    ],
  },
]

/** Every question in one list, for search and for structured data. */
export const houseFaq: FaqItem[] = faqSections.flatMap((s) => s.items)
