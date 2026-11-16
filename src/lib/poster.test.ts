import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { frameFor, headerHeight, heroSlides, posterSources } from './poster'

const balloon = {
  image: {
    prints: [
      { path: '/assets/client/hero-balloon-1280.webp', width: 1280 },
      { path: '/assets/client/hero-balloon-2400.webp', width: 2400 },
      { path: '/assets/client/hero-balloon-3200.webp', width: 3200 },
    ],
    fill: '/assets/client/hero-balloon-fill.webp',
    width: 3200,
    height: 1802,
  },
  words: [0.515, 0.288, 0.928, 0.767] as [number, number, number, number],
  picture: [0.12, 0.41, 0.475, 0.955] as [number, number, number, number],
}

describe('the hero poster', () => {
  // Pinned from the function as it stood in Hero.tsx, with an 80 px header:
  // moving it out must not move the poster on any screen.
  it('the poster frames as it always has', () => {
    expect(frameFor(1440, 900, balloon, 80)).toEqual({ fit: 'cover', x: 74, y: 50 })
    expect(frameFor(1366, 1024, balloon, 80)).toEqual({ fit: 'band', x: 50, y: 50 })
    expect(frameFor(1024, 1366, balloon, 80)).toEqual({ fit: 'card', x: 50, y: 50 })
    expect(frameFor(390, 844, balloon, 80)).toEqual({ fit: 'card', x: 50, y: 50 })
    expect(frameFor(2560, 1080, balloon, 80)).toEqual({ fit: 'cover', x: 50, y: 86 })
    expect(frameFor(1920, 950, balloon, 80)).toEqual({ fit: 'cover', x: 50, y: 81 })
  })

  // A poster narrower than 3200 px has fewer, narrower prints, and a srcset
  // that claimed 3200w for a 2000 px file would have the browser choose wrong.
  it("the poster's sources name each print at its own width", () => {
    expect(posterSources(balloon.image)).toEqual({
      src: '/assets/client/hero-balloon-2400.webp',
      srcSet:
        '/assets/client/hero-balloon-1280.webp 1280w, /assets/client/hero-balloon-2400.webp 2400w, /assets/client/hero-balloon-3200.webp 3200w',
    })
    const small = {
      prints: [
        { path: '/assets/cms/aaaaaaaaaaaaaaaaaaaa.webp', width: 1280 },
        { path: '/assets/cms/bbbbbbbbbbbbbbbbbbbb.webp', width: 2000 },
      ],
      fill: '/assets/cms/cccccccccccccccccccc.webp',
      width: 2000,
      height: 1125,
    }
    expect(posterSources(small).src).toBe('/assets/cms/bbbbbbbbbbbbbbbbbbbb.webp')
    expect(posterSources(small, (p) => `/base${p}`).srcSet).toBe(
      '/base/assets/cms/aaaaaaaaaaaaaaaaaaaa.webp 1280w, /base/assets/cms/bbbbbbbbbbbbbbbbbbbb.webp 2000w',
    )
  })

  // The Poster tab's previews frame the poster under the header the site draws
  // at that width: two rows, 130 px, on a laptop or a wide screen.
  it('the header is as tall as the site draws it at each width', () => {
    expect(headerHeight(390)).toBe(62)
    expect(headerHeight(800)).toBe(78)
    expect(headerHeight(1440)).toBe(130)
    expect(frameFor(2560, 1080, balloon, headerHeight(2560))).toEqual({ fit: 'cover', x: 50, y: 76 })
  })

  it("the header's heights are the stylesheet's", () => {
    const css = readFileSync('src/index.css', 'utf8')
    const steps = [...css.matchAll(/(?:@media \(min-width: (\d+)px\)\s*\{\s*:root\s*\{\s*)?--header-h:\s*(\d+)px/g)]
    expect(steps.length).toBe(3)
    for (const [, from, height] of steps) expect(headerHeight(Number(from ?? 0))).toBe(Number(height))
  })

  it('the poster is a slide only while it is shown', () => {
    expect(heroSlides({ show: true })).toEqual(['film', 'poster'])
    expect(heroSlides({ show: false })).toEqual(['film'])
  })
})
