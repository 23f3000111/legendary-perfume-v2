/**
 * One place for the facts search engines and answer engines are given about
 * the house, so a change lands in the head tags, the structured data, the
 * sitemap and llms.txt at once.
 */

export const SITE = {
  name: 'Legendary',
  legalName: 'Legendary Perfume',
  tagline: 'A Scented Memory of Malaysia',
  description:
    'Legendary is a Malaysian perfume house founded in 2015, bottling the botanical heritage and soul of Malaysia. Shop eau de parfum for her, for him and gift sets, with free delivery across Malaysia.',
  /**
   * The canonical origin. Overridden at build time by SITE_URL so a preview
   * deployment does not publish canonicals pointing at production.
   */
  url: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '')
    ?? 'https://legendary.com.my',
  email: 'noreply@legendary.com.my',
  phone: '+60 19 383 6633',
  locale: 'en_MY',
  currency: 'MYR',
  country: 'MY',
  founded: '2015',
  sameAs: [
    'https://www.instagram.com/legendaryperfume.my/',
    'https://www.facebook.com/legendaryperfumemy/',
    'https://shopee.com.my/legendaryperfume',
  ],
}

export function absolute(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return SITE.url + (path.startsWith('/') ? path : `/${path}`)
}

/** The house itself, referenced by @id from every other graph node. */
export function organisationLd() {
  return {
    '@type': 'Organization',
    '@id': `${SITE.url}/#organisation`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    description: SITE.description,
    foundingDate: SITE.founded,
    email: SITE.email,
    telephone: SITE.phone,
    areaServed: { '@type': 'Country', name: 'Malaysia' },
    sameAs: SITE.sameAs,
    logo: {
      '@type': 'ImageObject',
      url: absolute('/assets/client/logo-legendary.png'),
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: SITE.email,
      telephone: SITE.phone,
      availableLanguage: ['en', 'ms'],
    },
  }
}

export function websiteLd() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: 'en-MY',
    publisher: { '@id': `${SITE.url}/#organisation` },
  }
}

export function breadcrumbLd(crumbs: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absolute(c.path),
    })),
  }
}

/** Wrap graph nodes in the envelope a crawler expects. */
export function graph(nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes }
}
