import { describe, expect, it } from 'vitest'
import { focusFrom } from './banner'

describe('a banner focus point', () => {
  // A click on the photo becomes the spot the title bar keeps in view, as
  // fractions across and down, rounded to two places and kept on the photo.
  it('a click on the photo sets the focus, rounded and kept on the photo', () => {
    expect(focusFrom(240, 60, 300, 100)).toEqual({ x: 0.8, y: 0.6 })
    expect(focusFrom(100, 33, 300, 100)).toEqual({ x: 0.33, y: 0.33 })
    expect(focusFrom(-5, 120, 300, 100)).toEqual({ x: 0, y: 1 })
  })
})
