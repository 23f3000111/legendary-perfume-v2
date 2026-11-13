import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Prose, { RichText } from './Prose'

const html = (text: string) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <RichText text={text} />
    </MemoryRouter>,
  )

describe('RichText', () => {
  // Whatever reaches the page, a javascript: address must never become a link.
  it('a link the site cannot follow is shown as plain words', () => {
    const out = html('Read [this](javascript:alert%281%29) now')
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('<a')
    expect(out).toContain('this')
  })

  it('links on the site and out to the web still work', () => {
    expect(html('See [Orchid](/product/orchid).')).toContain('href="/product/orchid"')
    const away = html('See [the study](https://example.com).')
    expect(away).toContain('href="https://example.com"')
    expect(away).toContain('target="_blank"')
  })

  // A button's address is checked at the dashboard, at publish and at build,
  // but a preview draws drafts the checks have not passed yet.
  it('a button whose address leaves the site is not drawn', () => {
    const page = (to: string) =>
      renderToStaticMarkup(
        <MemoryRouter>
          <Prose blocks={[{ t: 'cta', label: 'Go there', to }]} />
        </MemoryRouter>,
      )
    expect(page('javascript:alert(1)')).not.toContain('javascript:')
    expect(page('javascript:alert(1)')).not.toContain('<a')
    expect(page('//example.com')).not.toContain('<a')
    expect(page('/stores')).toContain('href="/stores"')
  })
})
