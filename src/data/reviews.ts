export interface Review {
  quote: string
  author: string
  product?: string
  /** Deep link to the review on the platform it was left on. */
  href?: string
}

/**
 * Customer reviews, sitting under "Partnered With" on the home page.
 *
 * Revision 5: these were placeholders written in house. The client's copy
 * sheet supplies ten real reviews left on the brand's Shopee listings, each
 * with the buyer's handle, the variation bought and a link to the listing it
 * was left on. They are quoted as written, minus the platform's own furniture.
 * Two were left in Chinese and are carried here in English translation.
 * Reviews the sheet shows only as a masked handle are credited to a verified
 * buyer rather than inventing a name for them.
 *
 * The section CTA reads "What our Customers Buy" and points at the bestsellers
 * listing, per the amendments doc.
 */
export const reviewsUrl = '/shop?filter=bestsellers'

const SHOPEE = 'https://shopee.com.my'
const ORCHID_30 = `${SHOPEE}/Legendary%C2%AE-Orchid-Eau-De-Parfum-EDP-Perfume-(30ml)-Minyak-Wangi-Malaysia-Hadiah-Cenderahati-Buah-Tangan-Souvenir-Gift-i.298980781.7549407956`
const ORCHID_VIAL = `${SHOPEE}/Legendary-Orchid-Vial-Eau-de-Parfum-EDP-Perfume-(3ml)-Travel-Spray-i.298980781.7562030513`
const SIGNATURE = `${SHOPEE}/Legendary%C2%AE-Perfume-EDP-for-Women-Men-Find-Your-Signature-Scent-Malaysia-Souvenir-Gift-Minyak-Wangi-EDP-i.298980781.49757743195`
const WISHES_SINGLE = `${SHOPEE}/Legendary%C2%AE-3-Wishes-%E2%80%93-Single-Bottle-(15ml)-Eau-De-Parfum-EDP-Perfume-Individual-Bottle-Singular-Packaging-i.298980781.27954414238`
const WISHES_KIT = `${SHOPEE}/Legendary%C2%AE-3-Wishes-Eau-de-Parfum-EDP-Discovery-Set-(3ml-x-3)-Travel-Kit-Perfume-Gift-Set-100-Alcohol-Free-EDP-i.298980781.29957061257`
const SPIRIT_II = `${SHOPEE}/Legendary%C2%AE-Spirit-II-Parfum-EDP-Perfume-Set-(15ml-x-3)-Minyak-Wangi-Hadiah-Cenderahati-Buah-Tangan-Souvenir-Gift-i.298980781.24055036697`

export const reviews: Review[] = [
  {
    quote:
      'I like the smell. Can be souvenir. Inside got post card, sticker, and a sample violet.',
    author: 'anson.gan',
    product: 'Orchid 30ml',
    href: SIGNATURE,
  },
  {
    quote:
      'Bought many times. Memang lasting smell. And it makes u confident. Not the menyakitkan hidung or perfume murah type. This is my choice for daily use. Plus many free gift. Love it.',
    author: 'dkj2yo8ss2',
    product: 'Orchid 30ml',
    href: ORCHID_30,
  },
  {
    quote:
      'This is the most underrated fragrance! I LOVE the scent and I just cannot get enough of it! Will be ordering more soon from this seller.',
    author: 'renpen85',
    product: 'Legendary',
    href: ORCHID_30,
  },
  {
    quote:
      'The opening is as fresh as morning dew, the heart as gentle as flowers, the base as steady as wood. The trail lasts, and every spray feels like standing in a sea of blossom.',
    author: 'a9a3ydfmz7',
    product: 'Orchid 30ml',
    href: ORCHID_30,
  },
  {
    quote:
      'Incredibly good. I love it. Right for the office and just as right for a date.',
    author: 'weixin519',
    product: 'Orchid 30ml',
    href: ORCHID_30,
  },
  {
    quote:
      'Sedapnya bauuu. 1st time cuba sampel ni, packaging menariknya mcm dpt hadiah. Sukela bau dia sedap gilerrr. 10/10 utk bau pasion.',
    author: 'realmefezzaaisya',
    product: 'Orchid Vial 3ml',
    href: ORCHID_VIAL,
  },
  {
    quote:
      'Many people said it is Malaysia top perfume. So bought a sample to try. Irresistible light fragrance. Super good.',
    author: 'ooichu123',
    product: 'Orchid Vial 3ml',
    href: ORCHID_VIAL,
  },
  {
    quote:
      'I have been a fan of Legendary Perfume since my first offline purchase, but this was my first time ordering online. I am incredibly impressed with the service. The packaging was secure and felt very premium, and the unexpected free gift was such a thoughtful touch. It is rare to find a brand that delivers the same great experience online as they do in person!',
    author: 'Verified buyer',
    product: '3 Wishes, Woody Floral',
    href: WISHES_SINGLE,
  },
  {
    quote:
      'After first discovering Legendary Perfume in store, I decided to try their online shop this time. I am so glad I did! The packaging is absolutely stunning and arrived in perfect condition. Plus, thank you so much for the free gift! A wonderful experience all around.',
    author: 'Verified buyer',
    product: '3 Wishes Travel Kit',
    href: WISHES_KIT,
  },
  {
    quote:
      'This perfume has a beautiful, elegant scent that feels fresh and long lasting. It starts with a light, refreshing aroma and gradually develops into a warm, sophisticated fragrance. Perfect for both everyday wear and special occasions. I received many compliments and would definitely recommend it.',
    author: 'Verified buyer',
    product: 'Spirit II',
    href: SPIRIT_II,
  },
]
