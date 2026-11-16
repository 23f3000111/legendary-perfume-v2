import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
// @ts-expect-error: a plain .mjs build helper, without types
import { homeHead } from '../../scripts/home-head.mjs'

describe('the static head', () => {
  // A link preview reads only the page as served, before any script runs, so
  // the Home page's search words are written into it at build time.
  it("the static head carries the Home page's search words", () => {
    const html = readFileSync('index.html', 'utf8')
    const out: string = homeHead(html, { title: 'Legendary & Co', description: 'A "new" line' }, 'https://legendary.com.my')
    expect(out).toContain('<title>Legendary &amp; Co</title>')
    expect(out).toMatch(/name="description"\s+content="A &quot;new&quot; line"/)
    expect(out).toContain('<meta property="og:title" content="Legendary &amp; Co" data-rh="true" />')
    expect(out).toContain('<meta property="og:image" content="https://legendary.com.my/assets/client/banner-fragrances.webp" data-rh="true" />')
    expect(out).not.toContain('A Scented Memory of Malaysia. A heritage')
  })

  // `$&`, `$'` and the like mean something to a string replace; typed into a
  // title they must stay words, not copy pieces of the page into the head.
  it('words with dollar signs are written as they are', () => {
    const html = readFileSync('index.html', 'utf8')
    const out: string = homeHead(html, { title: "Gifts from $& and $' up", description: 'From $` RM 95' }, 'https://legendary.com.my')
    expect(out).toContain("<title>Gifts from $&amp; and $' up</title>")
    expect(out).toMatch(/name="description"\s+content="From \$` RM 95"/)
    expect(out.match(/<title>/g)).toHaveLength(1)
  })

  // Once the site runs, react-helmet-async writes each page's own tags and
  // replaces only the head tags marked data-rh. Unmarked, Home's would stay
  // beside every page's own, and come first.
  it("the page's own tags take over from these once the site runs", () => {
    const html = readFileSync('index.html', 'utf8')
    const out: string = homeHead(html, { title: 'Title', description: 'Words' }, 'https://legendary.com.my')
    for (const tag of ['property="og:title"', 'property="og:description"', 'property="og:image"', 'name="twitter:card"', 'name="description"']) {
      expect(out).toMatch(new RegExp(`<meta\\s+${tag}[^>]*data-rh="true"`))
    }
  })
})
