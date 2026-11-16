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
  // Marked data-rh: once the site runs, react-helmet-async takes these over and
  // writes each page's own in their place, rather than adding its own beside
  // them. A preview that does not run the script still reads these.
  const tags = [
    `<meta property="og:title" content="${title}" data-rh="true" />`,
    `<meta property="og:description" content="${description}" data-rh="true" />`,
    `<meta property="og:image" content="${image}" data-rh="true" />`,
    `<meta name="twitter:card" content="summary_large_image" data-rh="true" />`,
  ]
  // Replacer functions, so `$&`, `$'` and the like in the team's words are
  // written as they are rather than read as replacement patterns.
  return html
    .replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, (_, open, close) => `${open}${description}${close} data-rh="true"`)
    .replace('</head>', () => `    ${tags.join('\n    ')}\n  </head>`)
}
