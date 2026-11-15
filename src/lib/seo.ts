/**
 * One place for the facts search engines and answer engines are given about
 * the house, so a change lands in the head tags, the structured data, the
 * sitemap and llms.txt at once. The house's contact details and links are
 * the site's own (src/data/site.ts), read when each page renders.
 */
import { sameAs, site } from '../data/site'
import { pages } from '../data/pages'

export const SITE = {
  name: 'Legendary',
  legalName: 'Legendary Perfume',
  tagline: 'A Scented Memory of Malaysia',
  /**
   * The canonical origin. Overridden at build time by SITE_URL so a preview
   * deployment does not publish canonicals pointing at production.
   */
  url: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '')
    ?? 'https://legendary.com.my',
  locale: 'en_MY',
  currency: 'MYR',
  country: 'MY',
  founded: '2015',
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
    description: pages.home.seo.description,
    foundingDate: SITE.founded,
    email: site.email,
    telephone: site.whatsapp,
    areaServed: { '@type': 'Country', name: 'Malaysia' },
    sameAs: sameAs(),
    logo: {
      '@type': 'ImageObject',
      url: absolute('/assets/client/logo-legendary.png'),
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: site.email,
      telephone: site.whatsapp,
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
    description: pages.home.seo.description,
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
