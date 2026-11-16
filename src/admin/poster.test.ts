import { describe, expect, it } from 'vitest'
import { moveBox, nudgeBox, posterImageFrom, resizeBox } from './poster'

describe('the poster boxes', () => {
  // A box is part of the poster: dragged off its edge, it stops at the edge,
  // whole, rather than leaving part of itself where no screen can show it.
  it('a box dragged past the edge stays on the poster', () => {
    expect(moveBox([0.5, 0.3, 0.9, 0.7], 0.3, -0.5)).toEqual([0.6, 0, 1, 0.4])
  })

  it('a corner dragged across the box keeps it at least 4% across', () => {
    expect(resizeBox([0.5, 0.3, 0.9, 0.7], 'br', -0.6, -0.6)).toEqual([0.5, 0.3, 0.54, 0.34])
    expect(resizeBox([0.5, 0.3, 0.9, 0.7], 'tl', -0.7, 0.1)).toEqual([0, 0.4, 0.9, 0.7])
  })

  // For anyone not using a mouse, and for the last few pixels.
  it('the arrow keys move a box, and with Shift resize it', () => {
    expect(nudgeBox([0.5, 0.3, 0.9, 0.7], 'ArrowRight', false)).toEqual([0.505, 0.3, 0.905, 0.7])
    expect(nudgeBox([0.5, 0.3, 0.9, 0.7], 'ArrowDown', true)).toEqual([0.5, 0.3, 0.9, 0.705])
    expect(nudgeBox([0.5, 0.3, 0.9, 0.7], 'a', false)).toBeNull()
  })

  it("a derived poster becomes the poster's image", () => {
    const prints = [
      { path: '/assets/cms/aaaaaaaaaaaaaaaaaaaa.webp', width: 1280 },
      { path: '/assets/cms/bbbbbbbbbbbbbbbbbbbb.webp', width: 2400 },
    ]
    const fill = '/assets/cms/cccccccccccccccccccc.webp'
    expect(posterImageFrom({ path: prints[1].path, prints, fill, width: 2400, height: 1350 })).toEqual({
      prints,
      fill,
      width: 2400,
      height: 1350,
    })
    expect(posterImageFrom({ path: prints[1].path, width: 2400, height: 1350 })).toBeNull()
  })
})
