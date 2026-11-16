import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { hero } from '../data/hero'
import Hero from './Hero'

const render = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>,
  )

describe('the home hero', () => {
  afterEach(() => {
    hero.poster.show = true
  })

  // Off, the poster is not a slide: no poster, no arrows to reach it, and the
  // film, with nothing to hand over to, plays over and over.
  it('with the poster off, the hero shows the film alone', () => {
    const on = render()
    expect(on).toContain(`alt="${hero.poster.alt}"`)
    expect(on).toContain('aria-label="Next slide"')
    hero.poster.show = false
    const off = render()
    expect(off).not.toContain(`alt="${hero.poster.alt}"`)
    expect(off).not.toContain('aria-label="Next slide"')
    expect(off).toMatch(/<video[^>]*\sloop=""/)
  })
})
