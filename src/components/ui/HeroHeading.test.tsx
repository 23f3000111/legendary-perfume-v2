import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import HeroHeading from './HeroHeading'

describe('the hero heading', () => {
  // SplitText sets its words in inline blocks, which swallow a space at their
  // edge, so a gold word in the middle of a line would run into its neighbours.
  it('a hero heading keeps the spaces around a gold word', () => {
    const out = renderToStaticMarkup(<HeroHeading text={'A Scented *Memory* of\n*Malaysia*'} />)
    expect(out).toMatch(/aria-label="A Scented"[^]*?<\/span> <span class="italic text-gilt">/)
    expect(out).toMatch(/<\/span> <span[^>]*aria-label="of"/)
    expect(out).toContain(' <br/>')
  })
})
