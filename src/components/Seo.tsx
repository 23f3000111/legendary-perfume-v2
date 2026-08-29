import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { SITE, absolute, breadcrumbLd, graph, organisationLd, websiteLd } from '../lib/seo'

/**
 * Everything that goes in the head for one page.
 *
 * Three audiences, one component:
 *
 *  - search engines get a title, a description, a canonical and a breadcrumb;
 *  - social cards get Open Graph and Twitter tags;
 *  - answer engines and assistants get JSON-LD, which is the format they read
 *    most reliably, describing the page as a thing rather than as markup.
 *
 * The Organization and WebSite nodes are emitted on every page so a crawler
 * that lands anywhere still learns who the site belongs to.
 */
export default function Seo({
  title,
  description,
  image,
  type = 'website',
  noindex,
  crumbs,
  jsonLd,
  canonicalPath,
}: {
  /** Page title, without the house name; that is appended. */
  title: string
  description: string
  /** Social card image, absolute or site relative. */
  image?: string
  type?: 'website' | 'article' | 'product'
  /** Checkout, order lookup and the like: useful to a person, not to an index. */
  noindex?: boolean
  crumbs?: { name: string; path: string }[]
  /** Page specific graph nodes, e.g. a Product or an FAQPage. */
  jsonLd?: object[]
  /** Overrides the canonical when a view has several URLs, as the shop does. */
  canonicalPath?: string
}) {
  const { pathname, search } = useLocation()
  const canonical = absolute(canonicalPath ?? pathname + search)
  const fullTitle = title === SITE.name ? `${SITE.name} · ${SITE.tagline}` : `${title} · ${SITE.name}`
  const card = absolute(image ?? '/assets/client/banner-fragrances.webp')

  const nodes: object[] = [organisationLd(), websiteLd()]
  if (crumbs?.length) nodes.push(breadcrumbLd(crumbs))
  if (jsonLd?.length) nodes.push(...jsonLd)

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en-MY" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex
        ? <meta name="robots" content="noindex, nofollow" />
        : <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />}

      <meta property="og:type" content={type === 'product' ? 'product' : type} />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:locale" content={SITE.locale} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={card} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={card} />

      <script type="application/ld+json">{JSON.stringify(graph(nodes))}</script>
    </Helmet>
  )
}
