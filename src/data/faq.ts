import { SUPPORT_EMAIL, WHATSAPP_DISPLAY } from '../lib/concierge'

export interface FaqItem {
  q: string
  a: string
  /** Extra lines rendered as a bulleted list under the answer. */
  list?: string[]
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
    a: 'We accept returns for faulty, damaged or incorrect items. Contact us on WhatsApp at +60 19 383 6633 within 48 hours of arrival with your platform of purchase, item name, reason and a photo. Items must be unused, with tags and in original packaging. Approved refunds are issued to the original payment method within 14 working days. Sale items cannot be returned.',
  },
  {
    q: 'Do you exchange items?',
    a: 'For the quickest resolution, return the original item for a refund and place a separate order for the piece you would prefer. Exchanges are also complimentary at any Legendary boutique across Malaysia.',
  },
]

/**
 * The full FAQ page.
 *
 * Copy supplied by the client in revision 2, set in the house voice. House
 * style throughout: no hyphens or dashes in the wording.
 */
export const faqIntro =
  'We have gathered the questions our customers ask most often and answered each one properly. Browse below for an instant answer, or reach out if you would rather speak to someone. Your fragrance journey matters to us.'

export const houseFaq: FaqItem[] = [
  {
    q: 'What should I do if I have any complaints?',
    a: `If you have a concern, or you simply want to share some feedback, head over to our Contact page. You can also write to our team at ${SUPPORT_EMAIL}, or message us on WhatsApp at ${WHATSAPP_DISPLAY}. We are here to help.`,
  },
  {
    q: 'Do you offer international shipping?',
    a: 'We love our international friends, but for now we are focused on delivering happiness to addresses within Malaysia. We are not able to process orders for overseas addresses at the moment.',
  },
  {
    q: 'Is it safe to use my credit card?',
    a: 'Your security matters enormously to us. When you buy through legendary.com.my we use Secure Socket Layer encryption, the most advanced security available to consumers today, so your order is processed with government approved encryption software. For that encryption to apply, your browser needs to support the SSL protocol. These browsers all do:',
    list: [
      'Internet Explorer 6.0 or newer',
      'Firefox 1.0.4 or newer',
      'Safari, for Mac users',
    ],
  },
  {
    q: 'How should I store my perfume?',
    a: 'Keep your perfume somewhere cool and dry, away from direct sunlight and any source of heat. Seal the bottle when it is not in use, and the fragrance will stay exactly as it should.',
  },
  {
    q: 'Where can I buy Legendary product?',
    a: 'Our complete range is right here on the website. You will also find us at selected boutiques and department stores across Malaysia. Our Store Locator will point you to the counter nearest you.',
  },
  // The product sheet answers a few more, minus the storage question the
  // client's own copy already covers above.
  ...productFaq.filter((f) => f.q !== 'How should I store my perfume?'),
]
