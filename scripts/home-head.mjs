/**
 * The head every route is first served with, before the site's script runs.
 *
 * Search engines run the script and read each page's own title and
 * description. A link preview (WhatsApp, Facebook and the like) does not: it
 * reads only this static head. So at build time the Home page's search words
 * and sharing image, which the team edits in the dashboard's Pages tab, are
 * written into index.html by vite.config.ts.
 */

const DEFAULT_IMAGE = '/assets/client/banner-fragrances.webp'

/** Text made safe inside an attribute or an element. */
function escape(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * `html` with the Home page's title and description in place of the ones it
 * was written with, and Open Graph tags carrying them and its sharing image.
 */
export function homeHead(html, home, siteUrl) {
  const title = escape(home.title)
  const description = escape(home.description)
  const image = escape(`${siteUrl.replace(/\/$/, '')}${home.image ?? DEFAULT_IMAGE}`)
  const tags = [
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ]
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${description}$2`)
    .replace('</head>', `    ${tags.join('\n    ')}\n  </head>`)
}
