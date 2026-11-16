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
    expect(out).toContain('<meta property="og:title" content="Legendary &amp; Co" />')
    expect(out).toContain('<meta property="og:image" content="https://legendary.com.my/assets/client/banner-fragrances.webp" />')
    expect(out).not.toContain('A Scented Memory of Malaysia. A heritage')
  })
})
