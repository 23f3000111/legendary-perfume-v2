/**
 * The Pages tab's table: every page, its sections in page order, and each
 * field in plain words. One generic form draws any page from it, so a word in
 * src/content/pages.json is editable as soon as it has a line here (and a test
 * holds the two together).
 */

export type FieldKind = 'text' | 'heading' | 'area' | 'paragraphs' | 'lines' | 'number' | 'photo' | 'banner' | 'share'

export interface PageField {
  /** Where the word is in the document, dotted: `about.services.2.title`. */
  path: string
  /** The field's own label; the form shows it under its page and section. */
  label: string
  kind: FieldKind
  /** Shown under the field. */
  hint?: string
  /** Past this many characters, `warning` shows. It never stops a publish. */
  warnAt?: number
  warning?: string
  /** The document may leave it out: a sharing image, until one is chosen. */
  optional?: boolean
}

export interface PageSection {
  title: string
  fields: PageField[]
}

export interface PageSpec {
  /** The page's key in the document, such as `home`. */
  key: string
  title: string
  /** Where Preview opens while this page is open. */
  preview: string
  sections: PageSection[]
}

const HEADING_HINT = 'A new line starts a new line on the page. Put *stars* around a word to set it in gold italic.'
const DRAWN_FOR = 'Longer than the design was drawn for: check it in Preview.'

const field = (path: string, label: string, kind: FieldKind = 'text', extra: Partial<PageField> = {}): PageField => ({
  path,
  label,
  kind,
  ...extra,
})
const heading = (path: string, label = 'Heading', warnAt?: number): PageField =>
  field(path, label, 'heading', { hint: HEADING_HINT, ...(warnAt ? { warnAt, warning: DRAWN_FOR } : {}) })

// How to set a banner's spot is the banner field's own words.
const banner = (path: string, label = 'Banner'): PageField => field(path, label, 'banner')

const seo = (key: string): PageSection => ({
  title: 'Search engines',
  fields: [
    field(`${key}.seo.title`, 'Title', 'text', { warnAt: 60, warning: 'Search engines cut titles past about 60 characters.' }),
    field(`${key}.seo.description`, 'Description', 'area', { warnAt: 160, warning: 'Search engines show about 160 characters.' }),
    field(`${key}.seo.image`, 'Sharing image', 'share', {
      optional: true,
      // Every address is first served with Home's head, and a link preview runs
      // no script, so Home's picture is the one previews show for any page.
      hint:
        key === 'home'
          ? 'Link previews (WhatsApp, Facebook and the like) show this picture, with the title and description above, for a link to any page of the site. Left empty, the house’s default picture.'
          : 'Read by search engines for this page. Link previews (WhatsApp, Facebook and the like) show the Home page\'s picture instead. Left empty, the page uses its banner.',
    }),
  ],
})
const titleBar = (key: string): PageSection => ({
  title: 'Title bar',
  fields: [
    field(`${key}.header.eyebrow`, 'Small line above the title'),
    field(`${key}.header.title`, 'Title'),
    field(`${key}.header.intro`, 'Introduction', 'area'),
    banner(`${key}.banner`),
  ],
})

export const PAGE_SPECS: PageSpec[] = [
  {
    key: 'layout',
    title: 'Every page (header and footer)',
    preview: '/contact',
    sections: [
      {
        title: 'Menu card',
        fields: [
          field('layout.menu.eyebrow', 'Small line', 'text', { hint: 'The card in the Fragrances menu, which opens Orchid.' }),
          field('layout.menu.title', 'Name'),
          field('layout.menu.photo', 'Photo', 'photo'),
          field('layout.menu.alt', 'What the photo shows', 'text', { hint: 'For anyone who cannot see it.' }),
        ],
      },
      {
        title: 'Footer',
        fields: [
          field('layout.footer.blurb', 'Line under the wordmark', 'area'),
          field('layout.footer.copyright', 'Last line'),
          field('layout.footer.payments', 'Ways to pay', 'lines', { hint: 'One per line, as the footer lists them.' }),
        ],
      },
      {
        title: 'Sign up (on the Contact page)',
        fields: [
          field('layout.footer.newsletter.eyebrow', 'Small line'),
          heading('layout.footer.newsletter.heading'),
          field('layout.footer.newsletter.text', 'Words', 'area'),
          field('layout.footer.newsletter.thanks', 'Thanks, after signing up'),
        ],
      },
    ],
  },
  {
    key: 'home',
    title: 'Home',
    preview: '/',
    sections: [
      {
        title: 'Hero',
        fields: [
          field('home.hero.eyebrow', 'Small line above the heading', 'text', {
            hint: 'The words over the film. The poster that follows it is on the Poster tab.',
          }),
          heading('home.hero.heading', 'Heading', 34),
          field('home.hero.intro', 'Introduction', 'area', { warnAt: 160, warning: DRAWN_FOR }),
          field('home.hero.shop', 'First button', 'text', { hint: 'Opens the shop.' }),
          field('home.hero.orchid', 'Second button', 'text', { hint: 'Opens Orchid.' }),
          field('home.hero.label', 'Side label', 'text', { hint: 'Runs up the left edge beside the film, on a wide screen.' }),
        ],
      },
      {
        title: 'Signature',
        fields: [
          field('home.signature.kicker', 'Small line'),
          heading('home.signature.heading', 'Heading', 40),
          heading('home.signature.since', 'Year line'),
          field('home.signature.figure', 'Figure', 'number', { hint: 'Counts up when the section comes into view.' }),
          field('home.signature.suffix', 'After the figure', 'text', { hint: 'Such as +. Can be left empty.' }),
          field('home.signature.figureLabel', 'Under the figure'),
          field('home.signature.button', 'Button'),
          field('home.signature.note', 'Beside the button'),
          field('home.signature.photo', 'Photo', 'photo'),
          field('home.signature.alt', 'What the photo shows', 'text', { hint: 'For anyone who cannot see it.' }),
        ],
      },
      {
        title: 'Collections',
        fields: [
          field('home.collections.kicker', 'Small line'),
          heading('home.collections.heading'),
          field('home.collections.intro', 'Words', 'area'),
          field('home.collections.cue', 'Scroll cue'),
        ],
      },
      {
        title: 'Scented Memory map',
        fields: [field('home.map.kicker', 'Small line'), heading('home.map.heading', 'Heading', 40), field('home.map.intro', 'Words', 'area')],
      },
      {
        title: 'Bestsellers',
        fields: [field('home.bestsellers.kicker', 'Small line'), heading('home.bestsellers.heading'), field('home.bestsellers.link', 'Link')],
      },
      {
        title: 'Olfactory Finder',
        fields: [
          field('home.finder.kicker', 'Small line'),
          heading('home.finder.heading'),
          field('home.finder.intro', 'Words', 'area'),
          field('home.finder.link', 'Link'),
          field('home.finder.moods.Serene', 'Serene tile'),
          field('home.finder.moods.Bold', 'Bold tile'),
          field('home.finder.moods.Romantic', 'Romantic tile'),
          field('home.finder.moods.Playful', 'Playful tile'),
        ],
      },
      { title: 'Partnered With', fields: [heading('home.partners.heading')] },
      {
        title: 'Reviews',
        fields: [field('home.reviews.kicker', 'Small line'), heading('home.reviews.heading'), field('home.reviews.link', 'Link')],
      },
      seo('home'),
    ],
  },
  {
    key: 'shop',
    title: 'Shop',
    preview: '/shop',
    sections: [
      {
        title: 'Title bar',
        fields: [
          field('shop.eyebrow', 'Small line above the title'),
          field('shop.intros.all', 'All Fragrances', 'area'),
          field('shop.intros.bestsellers', 'Bestsellers', 'area'),
          field('shop.intros.gifts', 'Gifts & Sets', 'area'),
          field('shop.intros.her', 'For Her', 'area'),
          field('shop.intros.him', 'For Him', 'area'),
        ],
      },
      {
        title: 'Banners',
        fields: [
          banner('shop.banners.all', 'All Fragrances'),
          banner('shop.banners.bestsellers', 'Bestsellers'),
          banner('shop.banners.gifts', 'Gifts & Sets'),
          banner('shop.banners.her', 'For Her'),
          banner('shop.banners.him', 'For Him'),
        ],
      },
    ],
  },
  {
    key: 'about',
    title: 'Our Story',
    preview: '/about',
    sections: [
      titleBar('about'),
      {
        title: 'Our Beginning',
        fields: [
          field('about.beginning.photo', 'Photo', 'photo'),
          field('about.beginning.alt', 'What the photo shows', 'text', { hint: 'For anyone who cannot see it.' }),
          field('about.beginning.kicker', 'Small line'),
          heading('about.beginning.heading', 'Heading', 40),
          field('about.beginning.body', 'Words', 'paragraphs', { hint: 'A blank line starts a new paragraph.' }),
          field('about.beginning.button', 'Button'),
        ],
      },
      {
        title: 'Promises',
        fields: [0, 1, 2, 3].flatMap((i) => [
          field(`about.services.${i}.title`, `Promise ${i + 1}`),
          field(`about.services.${i}.copy`, `Promise ${i + 1}, words`, 'area'),
        ]),
      },
      { title: 'The Journey', fields: [field('about.journey.kicker', 'Small line'), heading('about.journey.heading', 'Heading', 40)] },
      {
        title: 'Vision and mission',
        fields: [
          field('about.purpose.kicker', 'Small line'),
          heading('about.purpose.heading', 'Heading', 40),
          ...[0, 1].flatMap((i) => [
            field(`about.purpose.items.${i}.label`, i === 0 ? 'Vision, small line' : 'Mission, small line'),
            field(`about.purpose.items.${i}.title`, i === 0 ? 'Vision' : 'Mission'),
            field(`about.purpose.items.${i}.body`, i === 0 ? 'Vision, words' : 'Mission, words', 'area'),
          ]),
        ],
      },
      {
        title: 'Values',
        fields: [
          field('about.values.kicker', 'Small line'),
          heading('about.values.heading', 'Heading', 40),
          ...[0, 1, 2, 3].flatMap((i) => [
            field(`about.values.items.${i}.title`, `Value ${i + 1}`),
            field(`about.values.items.${i}.body`, `Value ${i + 1}, words`, 'area'),
          ]),
        ],
      },
      {
        title: 'Closing',
        fields: [heading('about.cta.heading', 'Heading', 40), field('about.cta.shop', 'First button'), field('about.cta.stores', 'Second button')],
      },
      seo('about'),
    ],
  },
  {
    key: 'stores',
    title: 'Stores',
    preview: '/stores',
    sections: [
      titleBar('stores'),
      { title: 'Trusted Sellers', fields: [heading('stores.sellers.heading'), field('stores.sellers.intro', 'Words', 'area')] },
      seo('stores'),
    ],
  },
  {
    key: 'contact',
    title: 'Contact',
    preview: '/contact',
    sections: [
      titleBar('contact'),
      {
        title: 'Send a message',
        fields: [
          field('contact.form.kicker', 'Small line'),
          heading('contact.form.heading'),
          field('contact.form.intro', 'Words before the WhatsApp link'),
          field('contact.form.link', 'The WhatsApp link', 'text', { hint: 'It opens a chat with the number in Site details.' }),
        ],
      },
      {
        title: 'Find us',
        fields: [field('contact.office.kicker', 'Small line'), field('contact.office.directions', 'First button'), field('contact.office.stores', 'Second button')],
      },
      {
        title: 'Questions',
        fields: [field('contact.faq.kicker', 'Small line'), heading('contact.faq.heading'), field('contact.faq.button', 'Button')],
      },
      seo('contact'),
    ],
  },
  {
    key: 'faq',
    title: 'FAQ',
    preview: '/faq',
    sections: [
      {
        title: 'Title bar',
        fields: [
          field('faq.header.eyebrow', 'Small line above the title'),
          field('faq.header.title', 'Title', 'text', { hint: 'The introduction under it is the FAQ tab’s.' }),
          banner('faq.banner'),
        ],
      },
      {
        title: 'Ask us anything',
        fields: [
          field('faq.help.kicker', 'Small line'),
          heading('faq.help.heading'),
          field('faq.help.before', 'Words before the number', 'area', { hint: 'The WhatsApp number from Site details comes next.' }),
          field('faq.help.after', 'Words after the number', 'area'),
          field('faq.help.whatsapp', 'WhatsApp button'),
          field('faq.help.message', 'Second button'),
        ],
      },
      seo('faq'),
    ],
  },
  {
    key: 'journal',
    title: 'Journal',
    preview: '/journal',
    sections: [titleBar('journal'), seo('journal')],
  },
  {
    key: 'policies',
    title: 'Policies',
    preview: '/shipping',
    sections: [
      { title: 'Banner', fields: [banner('policies.banner', 'Banner for all four')] },
      { title: 'Under each policy', fields: [field('policies.more', 'Small line above the other policies')] },
    ],
  },
]

/** The value at a dotted path. */
export function getAt(doc: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((at, key) => (at == null ? undefined : (at as Record<string, unknown>)[key]), doc)
}

/** A copy of `doc` with one value changed; only the objects along the path are copied. */
export function setAt<T>(doc: T, path: string, value: unknown): T {
  const [key, ...rest] = path.split('.')
  const here = doc as unknown as Record<string, unknown> | unknown[]
  const next: unknown = rest.length === 0 ? value : setAt((here as Record<string, unknown>)[key], rest.join('.'), value)
  if (Array.isArray(here)) {
    const copy = [...here]
    copy[Number(key)] = next
    return copy as unknown as T
  }
  return { ...(here as Record<string, unknown>), [key]: next } as T
}
