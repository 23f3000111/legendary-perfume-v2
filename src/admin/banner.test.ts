import { describe, expect, it } from 'vitest'
import { focusFrom, phoneCrop, withPhoneCrop } from './banner'

describe("a banner's phone crop", () => {
  // The banner brief asks the designer for a second crop framed for phones.
  // Without one, phones are given the wide photo itself.
  const wide = '/assets/cms/aaaaaaaaaaaaaaaaaaaa.webp'
  const crop = '/assets/cms/bbbbbbbbbbbbbbbbbbbb.webp'
  it('a phone crop is what phones show, and taken away they show the wide photo', () => {
    const banner = { image: wide, phone: wide, focus: { x: 0.8, y: 0.5 } }
    const cropped = withPhoneCrop(banner, crop)
    expect(cropped).toEqual({ image: wide, phone: crop, focus: { x: 0.8, y: 0.5 } })
    expect(phoneCrop(cropped)).toBe(crop)
    expect(withPhoneCrop(cropped, undefined)).toEqual(banner)
    expect(phoneCrop(banner)).toBeUndefined()
  })
})

describe('a banner focus point', () => {
  // A click on the photo becomes the spot the title bar keeps in view, as
  // fractions across and down, rounded to two places and kept on the photo.
  it('a click on the photo sets the focus, rounded and kept on the photo', () => {
    expect(focusFrom(240, 60, 300, 100)).toEqual({ x: 0.8, y: 0.6 })
    expect(focusFrom(100, 33, 300, 100)).toEqual({ x: 0.33, y: 0.33 })
    expect(focusFrom(-5, 120, 300, 100)).toEqual({ x: 0, y: 1 })
  })
})
