import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import PageHeader from './PageHeader'

const html = (banner: { image: string; phone: string; focus?: { x: number; y: number } }) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <PageHeader eyebrow="The House" title="Our Story" banner={banner} />
    </MemoryRouter>,
  )

describe('the title bar', () => {
  // A title bar is far wider than a photograph on a laptop and near square on
  // a phone: both crop around the spot the team chose, not the middle.
  it("a title bar crops around the banner's focus", () => {
    const out = html({ image: '/assets/cms/a.webp', phone: '/assets/cms/b.webp', focus: { x: 0.3, y: 0.7 } })
    expect(out).toContain('object-position:30% 70%')
    expect(out.toLowerCase()).toContain('srcset="/assets/cms/b.webp"')
    expect(out).toContain('src="/assets/cms/a.webp"')
    expect(html({ image: '/assets/cms/a.webp', phone: '/assets/cms/b.webp' })).not.toContain('object-position')
  })
})
